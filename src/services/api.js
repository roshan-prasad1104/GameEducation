/**
 * Mock API service.
 *
 * - Backed by IndexedDB so data persists across reloads.
 * - Issues a base64 "JWT" with role claim so the client can simulate RBAC.
 * - When a real Spring Boot backend is wired in, point BASE_URL at it and
 *   the same call signatures work unchanged.
 */
import { findBy, getAll, getOne, putAll, putOne } from '../db/db';
import { ensureSeeded } from './seed';

const TOKEN_KEY = 'shikshasetu.token';
const USER_KEY  = 'shikshasetu.user';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/** Pretend network latency — keeps loading states honest. */
const latency = () => sleep(120 + Math.random() * 180);

let _ready = null;
export const ready = () => (_ready ??= ensureSeeded().then(() => true));

const decodeToken = (token) => {
  try {
    const [, payload] = token.split('.');
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
};
const encodeToken = (claims) =>
  `mock.${btoa(JSON.stringify(claims))}.sig`;

const requireAuth = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  const claims = token ? decodeToken(token) : null;
  if (!claims) throw new Error('AUTH_REQUIRED');
  return claims;
};
const requireRole = (role) => {
  const claims = requireAuth();
  if (claims.role !== role) throw new Error('FORBIDDEN');
  return claims;
};

const persistSession = (user, claims) => {
  localStorage.setItem(TOKEN_KEY, encodeToken(claims));
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};
const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

const publicUser = (u) => ({ ...u, passwordHash: undefined });

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const auth = {
  async login({ email, password }) {
    await ready(); await latency();
    const user = (await findBy('users', u => u.email === email))[0];
    if (!user || user.passwordHash !== `demo:${password}`) {
      throw new Error('Invalid email or password.');
    }
    const claims = { sub: user.id, role: user.role, exp: Date.now() + 8 * 3600 * 1000 };
    persistSession(publicUser(user), claims);
    return { user: publicUser(user), token: encodeToken(claims) };
  },

  async register({ name, email, password, grade, role = 'student' }) {
    await ready(); await latency();
    const existing = await findBy('users', u => u.email === email);
    if (existing.length) throw new Error('An account with this email already exists.');
    const id = `u-${Date.now()}`;
    const user = { id, role, name, email, passwordHash: `demo:${password}`, grade, createdAt: new Date().toISOString() };
    await putOne('users', user);
    if (role === 'student') {
      await putOne('students', { id: `s-${Date.now()}`, userId: id, xp: 0, level: 1, streak: 0, coins: 0 });
      await putOne('gamification_profiles', { id: `gp-${id}`, studentId: id, xp: 0, level: 1, streak: 0, coins: 0, streakFreezeAvailable: true });
    }
    if (role === 'teacher') {
      await putOne('teachers', { id: `t-${Date.now()}`, userId: id, classes: [], studentCount: 0 });
    }
    const claims = { sub: id, role, exp: Date.now() + 8 * 3600 * 1000 };
    persistSession(publicUser(user), claims);
    return { user: publicUser(user), token: encodeToken(claims) };
  },

  async me() {
    await ready();
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    const claims = decodeToken(token);
    if (!claims || claims.exp < Date.now()) { clearSession(); return null; }
    const user = await getOne('users', claims.sub);
    return user ? publicUser(user) : null;
  },

  logout() { clearSession(); },

  demoAccounts() {
    return [
      { role: 'student', email: 'aarav.rural.edu@shiksha.org', password: 'student123', label: 'Student demo' },
      { role: 'teacher', email: 'sunita.kullu@shiksha.org',     password: 'teacher123', label: 'Teacher demo' },
      { role: 'admin',   email: 'ravi.admin@shiksha.org',        password: 'admin123',   label: 'Admin demo' },
    ];
  },
};

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

export const catalog = {
  async subjects({ grade } = {}) {
    await ready(); await latency();
    const all = await getAll('subjects');
    return grade ? all.filter(s => s.grade === grade) : all;
  },
  async subject(id) {
    await ready(); await latency();
    const subject = await getOne('subjects', id);
    const chapters = await findBy('chapters', c => c.subjectId === id);
    return { ...subject, chapters: chapters.sort((a, b) => a.order - b.order) };
  },
  async chapter(id) {
    await ready(); await latency();
    const chapter = await getOne('chapters', id);
    const lessons = await findBy('lessons', l => l.chapterId === id);
    return { ...chapter, lessons: lessons.sort((a, b) => a.order - b.order) };
  },
  async lesson(id, locale = 'en') {
    await ready(); await latency();
    const lesson = await getOne('lessons', id);
    if (!lesson) throw new Error('Lesson not found');
    const tr = (await findBy('lesson_translations', t => t.lessonId === id && t.locale === locale))[0];
    if (tr) return { ...lesson, title: tr.title, summary: tr.summary, keyPoints: tr.keyPoints };
    return lesson;
  },
  async downloadForOffline(lessonIds) {
    await ready(); await latency();
    const lessons = [];
    for (const id of lessonIds) lessons.push(await getOne('lessons', id));
    return lessons.filter(Boolean);
  },
};

// ---------------------------------------------------------------------------
// Quizzes & attempts
// ---------------------------------------------------------------------------

export const quizzes = {
  async get(id) {
    await ready(); await latency();
    const quiz = await getOne('quizzes', id);
    const questions = (await findBy('questions', q => q.quizId === id)).sort((a, b) => a.order - b.order);
    return { ...quiz, questions };
  },
  async listForSubject(subjectId) {
    await ready(); await latency();
    return findBy('quizzes', q => q.subjectId === subjectId);
  },
  /** Submit an attempt. Idempotent via idempotencyKey. */
  async submitAttempt({ quizId, answers, timeTakenSeconds, idempotencyKey }) {
    requireAuth(); await latency();
    // Idempotency: if a prior attempt with the same key exists, return it.
    const prior = (await findBy('quiz_attempts', a => a.idempotencyKey === idempotencyKey))[0];
    if (prior) return prior;

    const questionList = (await findBy('questions', q => q.quizId === quizId)).sort((a, b) => a.order - b.order);
    let score = 0;
    const tagged = answers.map((ans, idx) => {
      const q = questionList[idx];
      const isCorrect = q && q.correctIndex === ans.selectedIndex;
      if (isCorrect) score += q?.points ?? 10;
      return { ...ans, questionId: q?.id, topicTag: q?.topicTag, isCorrect };
    });

    const attempt = {
      id: `qa-${Date.now()}`,
      studentId: 's-1',
      quizId,
      idempotencyKey,
      score,
      maxScore: questionList.reduce((s, q) => s + (q.points ?? 10), 0),
      answers: tagged,
      timeTakenSeconds,
      submittedAt: new Date().toISOString(),
    };
    await putOne('quiz_attempts', attempt);
    return attempt;
  },
  async myAttempts() {
    requireAuth(); await latency();
    return findBy('quiz_attempts', a => a.studentId === 's-1');
  },
};

// ---------------------------------------------------------------------------
// Gamification
// ---------------------------------------------------------------------------

export const gamification = {
  async profile() {
    requireAuth(); await latency();
    const profile = (await findBy('gamification_profiles', p => p.studentId === 's-1'))[0];
    return profile ?? null;
  },
  async awardXP({ delta, reason, idempotencyKey }) {
    requireAuth(); await latency();
    const log = (await findBy('activity_logs', l => l.idempotencyKey === idempotencyKey))[0];
    if (log) return log;
    const profile = (await findBy('gamification_profiles', p => p.studentId === 's-1'))[0];
    if (!profile) throw new Error('Profile not found');
    const newXP = profile.xp + delta;
    const newLevel = Math.floor(newXP / 300) + 1;
    const leveledUp = newLevel > profile.level;
    const updated = { ...profile, xp: newXP, level: newLevel };
    await putOne('gamification_profiles', updated);

    const entry = {
      id: `log-${Date.now()}`,
      studentId: 's-1',
      idempotencyKey,
      kind: 'xp',
      delta,
      reason,
      createdAt: new Date().toISOString(),
      leveledUp,
    };
    await putOne('activity_logs', entry);
    return entry;
  },
  async badges() {
    requireAuth(); await latency();
    const all = await getAll('badges');
    const earned = await findBy('student_badges', sb => sb.studentId === 's-1');
    const earnedIds = new Set(earned.map(e => e.badgeId));
    return all.map(b => ({ ...b, unlocked: earnedIds.has(b.id) }));
  },
  async missions() {
    requireAuth(); await latency();
    const all = await getAll('missions');
    const mine = await findBy('student_missions', sm => sm.studentId === 's-1');
    const map = new Map(mine.map(m => [m.missionId, m]));
    return all.map(m => ({ ...m, progress: map.get(m.id)?.progress ?? 0, completed: map.get(m.id)?.completed ?? false }));
  },
  async leaderboard({ scope = 'all-india', limit = 10 } = {}) {
    requireAuth(); await latency();
    const all = await getAll('leaderboards');
    return all.filter(l => l.scope === scope).sort((a, b) => b.xp - a.xp).slice(0, limit);
  },
};

// ---------------------------------------------------------------------------
// AI recommendations (frontend rule-based; FastAPI service replaces this later)
// ---------------------------------------------------------------------------

export const recommendations = {
  async forMe({ limit = 4 } = {}) {
    requireAuth(); await latency();
    const attempts = await findBy('quiz_attempts', a => a.studentId === 's-1');
    const wrongTopics = new Map();
    attempts.forEach(a => (a.answers ?? []).forEach(ans => {
      if (!ans.isCorrect && ans.topicTag) {
        wrongTopics.set(ans.topicTag, (wrongTopics.get(ans.topicTag) ?? 0) + 1);
      }
    }));
    const recs = await getAll('recommendations');
    // Build "next lesson" suggestions: prefer subjects with weak topics.
    const subjects = await getAll('subjects');
    const lessons = await getAll('lessons');
    const out = [];
    for (const [topic, count] of [...wrongTopics.entries()].sort((a, b) => b[1] - a[1])) {
      const lesson = lessons.find(l => l.id === topic || (l.title || '').toLowerCase().includes(topic.split('-')[0]));
      if (lesson) out.push({ kind: 'revision', topicTag: topic, lessonId: lesson.id, reason: `You missed ${count} question${count > 1 ? 's' : ''} in this topic. Practice to strengthen it.` });
    }
    if (out.length < limit) {
      subjects.slice(0, limit - out.length).forEach(s => {
        const lesson = lessons.find(l => l.subjectId === s.id);
        if (lesson) out.push({ kind: 'new', topicTag: s.subjectKey, lessonId: lesson.id, reason: `Start with ${s.name} (${s.grade}) to build your foundation.` });
      });
    }
    return out.slice(0, limit).concat(recs.slice(0, limit - out.length));
  },
};

// ---------------------------------------------------------------------------
// Teacher module
// ---------------------------------------------------------------------------

export const teacher = {
  async myClasses() {
    requireRole('teacher'); await latency();
    return [
      { id: 'c-g8a', name: 'Grade 8 — Section A', studentCount: 45 },
      { id: 'c-g9b', name: 'Grade 9 — Section B', studentCount: 42 },
    ];
  },
  async classRoster(classId) {
    requireRole('teacher'); await latency();
    const roster = [
      { id: 's1', name: 'Aarav Sharma',  grade: 'Grade 8', xp: 2450, attendance: 96, avgScore: 88, status: 'Consistent',    weakTopic: 'Chemical Reactions' },
      { id: 's2', name: 'Priya Sahoo',   grade: 'Grade 8', xp: 2840, attendance: 98, avgScore: 94, status: 'Top Performer', weakTopic: 'None' },
      { id: 's3', name: 'Rohan Patel',   grade: 'Grade 8', xp: 2190, attendance: 90, avgScore: 82, status: 'Improving',     weakTopic: 'Linear Equations' },
      { id: 's4', name: 'Sunita Mahato', grade: 'Grade 8', xp: 1120, attendance: 78, avgScore: 62, status: 'Needs Attention', weakTopic: 'Fractions' },
      { id: 's5', name: 'Manish Bag',    grade: 'Grade 8', xp: 1400, attendance: 85, avgScore: 74, status: 'Consistent',    weakTopic: 'Algebraic Identities' },
    ];
    return roster;
  },
  async weakTopics() {
    requireRole('teacher'); await latency();
    return [
      { topic: 'Linear Equations',                subject: 'Math',     errorRate: 34 },
      { topic: 'Chemical Reactions Balancing',    subject: 'Chemistry', errorRate: 29 },
      { topic: 'Light Reflection Rules',          subject: 'Physics',   errorRate: 24 },
    ];
  },
};

// ---------------------------------------------------------------------------
// Admin module
// ---------------------------------------------------------------------------

export const admin = {
  async stats() {
    requireRole('admin'); await latency();
    return {
      totalUsers: 1420,
      totalStudents: 1280,
      totalTeachers: 112,
      activeToday: 873,
      totalLessons: 320,
      totalQuizzes: 86,
      languages: ['en', 'hi', 'or'],
    };
  },
  async users() {
    requireRole('admin'); await latency();
    return getAll('users');
  },
};
