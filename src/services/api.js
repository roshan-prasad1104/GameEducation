/**
 * Domain API used by the pages. All HTTP goes through lib/api.js.
 *
 * Offline behaviour (students only):
 *  - Lessons/quizzes/chapters fall back to IndexedDB when the network is unavailable.
 *  - Lesson completions and quiz submissions are queued in the outbox and synced later.
 *  - Read-only screens keep a "last seen" snapshot so they still render offline.
 */
import { http, tokenStore, ApiError } from '../lib/api';
import { offlineStore } from '../lib/offlineStore';

let owner = null;
/** Called by the session provider so offline data is scoped to the signed-in user. */
export const setOfflineOwner = (userId) => { owner = userId ?? null; };

const newId = () =>
  (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`);

/** Network first; on a network failure serve the last snapshot (flagged `stale`). */
async function withSnapshot(key, fetcher) {
  try {
    const data = await fetcher();
    if (owner) offlineStore.saveSnapshot(owner, key, data);
    return data;
  } catch (e) {
    if (e instanceof ApiError && e.isNetwork && owner) {
      const snap = await offlineStore.getSnapshot(owner, key);
      if (snap) return { ...snap.data, __stale: snap.savedAt };
    }
    throw e;
  }
}

/** Same as withSnapshot but for array responses. */
async function listWithSnapshot(key, fetcher) {
  const wrapped = await withSnapshot(key, async () => ({ items: await fetcher() }));
  return Object.assign([...wrapped.items], { __stale: wrapped.__stale });
}

// ---------------------------------------------------------------------------

export const authApi = {
  async login(email, password) {
    const res = await http.post('/auth/login', { email, password });
    tokenStore.set(res.token);
    return res.user;
  },
  async register(data) {
    const res = await http.post('/auth/register', data);
    tokenStore.set(res.token);
    return res.user;
  },
  me: () => http.get('/auth/me'),
  updateMe: (data) => http.put('/users/me', data),
  onboard: (data) => http.put('/students/me/onboarding', data),
  logout: () => tokenStore.clear(),
};

export const catalogApi = {
  subjects: () => listWithSnapshot('subjects', () => http.get('/subjects')),
  subject: (id) => withSnapshot(`subject:${id}`, () => http.get(`/subjects/${id}`)),

  async chapter(id) {
    try {
      return await withSnapshot(`chapter:${id}`, () => http.get(`/chapters/${id}`));
    } catch (e) {
      if (e instanceof ApiError && e.isNetwork && owner) {
        const bundles = await offlineStore.listBundles(owner);
        const b = bundles.find((x) => String(x.chapterId) === String(id));
        if (b) return { ...b.chapter, __stale: b.savedAt };
      }
      throw e;
    }
  },

  async lesson(id) {
    try {
      const lesson = await http.get(`/lessons/${id}`);
      if (owner) offlineStore.patchLesson(owner, id, lesson);
      return lesson;
    } catch (e) {
      if (e instanceof ApiError && e.isNetwork && owner) {
        const cached = await offlineStore.getLesson(owner, id);
        if (cached) return { ...cached, __offline: true };
        throw new ApiError(0, 'NOT_DOWNLOADED', 'This lesson is not downloaded. Download its chapter while online to read it offline.');
      }
      throw e;
    }
  },

  async quiz(id) {
    try {
      return await http.get(`/quizzes/${id}`);
    } catch (e) {
      if (e instanceof ApiError && e.isNetwork && owner) {
        const cached = await offlineStore.getQuiz(owner, id);
        if (cached) return { ...cached, __offline: true };
        throw new ApiError(0, 'NOT_DOWNLOADED', 'This quiz is not downloaded. Download its chapter while online to take it offline.');
      }
      throw e;
    }
  },

  async download(chapterId) {
    const bundle = await http.get(`/chapters/${chapterId}/offline-bundle`);
    const ok = await offlineStore.saveBundle(owner, bundle);
    if (!ok) throw new ApiError(0, 'STORAGE', 'Your browser did not allow offline storage.');
    return bundle;
  },
  removeDownload: (chapterId) => offlineStore.removeBundle(owner, chapterId),
  downloads: () => offlineStore.listBundles(owner),
  isDownloaded: (chapterId) => offlineStore.hasBundle(owner, chapterId),
};

export const learningApi = {
  /** Returns the server result, or `{ queued: true }` when saved for later sync. */
  async completeLesson(lessonId) {
    try {
      return await http.post(`/lessons/${lessonId}/complete`, {});
    } catch (e) {
      if (e instanceof ApiError && e.isNetwork && owner) {
        await offlineStore.enqueue(owner, { type: 'LESSON_COMPLETE', lessonId, completedAt: new Date().toISOString() });
        await offlineStore.patchLesson(owner, lessonId, { completed: true });
        return { queued: true, lessonId };
      }
      throw e;
    }
  },

  /** Returns the graded result, or `{ queued: true, clientAttemptId }` when offline. */
  async submitQuiz(quizId, answers, timeTakenSeconds) {
    const payload = { answers, timeTakenSeconds, clientAttemptId: newId() };
    try {
      return await http.post(`/quizzes/${quizId}/submit`, payload);
    } catch (e) {
      if (e instanceof ApiError && e.isNetwork && owner) {
        await offlineStore.enqueue(owner, {
          type: 'QUIZ_SUBMIT', quizId, payload: { ...payload, submittedAt: new Date().toISOString() },
        });
        return { queued: true, clientAttemptId: payload.clientAttemptId, quizId };
      }
      throw e;
    }
  },

  /** Instant per-question feedback (online only; nothing is stored until the quiz is submitted). */
  checkAnswer: (quizId, questionId, selectedIndex) => http.post(`/quizzes/${quizId}/check`, { questionId, selectedIndex }),
  attempt: (id) => http.get(`/students/me/attempts/${id}`),
  attempts: () => listWithSnapshot('attempts', () => http.get('/students/me/attempts')),
  syncedResult: (clientAttemptId) => offlineStore.getResult(clientAttemptId),
};

export const studentApi = {
  dashboard: () => withSnapshot('dashboard', () => http.get('/students/me/dashboard')),
  progress: () => withSnapshot('progress', () => http.get('/students/me/progress')),
  badges: () => listWithSnapshot('badges', () => http.get('/students/me/badges')),
  xp: () => withSnapshot('xp', () => http.get('/students/me/xp')),
  recommendations: (limit = 4) => withSnapshot(`recs:${limit}`, () => http.get(`/students/me/recommendations?limit=${limit}`)),
  leaderboard: (scope = 'all') => withSnapshot(`leaderboard:${scope}`, () => http.get(`/students/me/leaderboard?scope=${scope}&limit=20`)),
  assignments: () => listWithSnapshot('assignments', () => http.get('/students/me/assignments')),
};

export const teacherApi = {
  overview: () => http.get('/teacher/overview'),
  students: () => http.get('/teacher/students'),
  student: (id) => http.get(`/teacher/students/${id}`),
  weakTopics: () => http.get('/teacher/weak-topics'),
  assignments: () => http.get('/teacher/assignments'),
  createAssignment: (data) => http.post('/teacher/assignments', data),
  deleteAssignment: (id) => http.del(`/teacher/assignments/${id}`),
  /** report: 'students' | 'topics' — CSV for Excel / Power BI. */
  exportCsv: (report) => http.download(`/teacher/reports/${report}.csv`, `class-${report}.csv`),
  subjects: () => http.get('/subjects'),
  subject: (id) => http.get(`/subjects/${id}`),
  chapter: (id) => http.get(`/chapters/${id}`),
  outline: () => http.get('/catalog/outline'),
};

export const adminApi = {
  stats: () => http.get('/admin/stats'),
  users: () => http.get('/admin/users'),
  createUser: (data) => http.post('/admin/users', data),
  updateUser: (id, data) => http.put(`/admin/users/${id}`, data),
  deleteUser: (id) => http.del(`/admin/users/${id}`),
  content: () => http.get('/admin/content'),
  createSubject: (data) => http.post('/admin/subjects', data),
  updateSubject: (id, data) => http.put(`/admin/subjects/${id}`, data),
  deleteSubject: (id) => http.del(`/admin/subjects/${id}`),
  createChapter: (data) => http.post('/admin/chapters', data),
  updateChapter: (id, data) => http.put(`/admin/chapters/${id}`, data),
  deleteChapter: (id) => http.del(`/admin/chapters/${id}`),
  lesson: (id) => http.get(`/admin/lessons/${id}`),
  createLesson: (data) => http.post('/admin/lessons', data),
  updateLesson: (id, data) => http.put(`/admin/lessons/${id}`, data),
  deleteLesson: (id) => http.del(`/admin/lessons/${id}`),
  quiz: (id) => http.get(`/admin/quizzes/${id}`),
  createQuiz: (data) => http.post('/admin/quizzes', data),
  updateQuiz: (id, data) => http.put(`/admin/quizzes/${id}`, data),
  deleteQuiz: (id) => http.del(`/admin/quizzes/${id}`),
  createQuestion: (data) => http.post('/admin/questions', data),
  updateQuestion: (id, data) => http.put(`/admin/questions/${id}`, data),
  deleteQuestion: (id) => http.del(`/admin/questions/${id}`),
};
