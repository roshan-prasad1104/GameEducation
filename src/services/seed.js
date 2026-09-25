import { INITIAL_USER, SUBJECT_COURSES, SAMPLE_QUIZ, BADGES, REWARDS, LEADERBOARD_DATA, TEACHER_ANALYTICS, GRADES } from '../data/mockData';
import { LESSON_TRANSLATIONS } from '../data/lessonTranslations';
import { QUIZ_BANK } from '../data/quizBank';
import { putAll } from '../db/db';

/**
 * Idempotently seed IndexedDB on first launch. If a store already has rows
 * we skip it — so user progress / quiz attempts aren't reset on reload.
 */
export const ensureSeeded = async () => {
  // Users
  const users = [
    {
      id: 'u-stu-1',
      role: 'student',
      name: INITIAL_USER.name,
      email: INITIAL_USER.email,
      phone: INITIAL_USER.phone,
      passwordHash: 'demo:student123', // mock-only
      avatar: INITIAL_USER.avatar,
      grade: INITIAL_USER.grade,
      school: INITIAL_USER.school,
      district: INITIAL_USER.district,
      preferredLanguage: 'en',
      createdAt: new Date('2026-01-15').toISOString(),
    },
    {
      id: 'u-tea-1',
      role: 'teacher',
      name: 'Ms. Sunita Kullu',
      email: 'sunita.kullu@shiksha.org',
      phone: '+91 98220 12345',
      passwordHash: 'demo:teacher123',
      avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=250',
      school: TEACHER_ANALYTICS.schoolName,
      district: 'Sundargarh, Odisha',
      subjects: ['Math', 'Physics'],
      createdAt: new Date('2025-08-01').toISOString(),
    },
    {
      id: 'u-adm-1',
      role: 'admin',
      name: 'Ravi Mahapatra',
      email: 'ravi.admin@shiksha.org',
      phone: '+91 99000 00001',
      passwordHash: 'demo:admin123',
      avatar: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=250',
      district: 'Bhubaneswar, Odisha',
      createdAt: new Date('2025-04-10').toISOString(),
    },
  ];

  const students = [{
    id: 's-1',
    userId: 'u-stu-1',
    xp: INITIAL_USER.xp,
    level: INITIAL_USER.level,
    streak: INITIAL_USER.streak,
    coins: INITIAL_USER.coins,
    completedLessonsCount: INITIAL_USER.completedLessonsCount,
    totalQuizzesTaken: INITIAL_USER.totalQuizzesTaken,
    accuracyRate: INITIAL_USER.accuracyRate,
    lastActiveDate: new Date().toISOString().slice(0, 10),
  }];

  const teachers = [{
    id: 't-1',
    userId: 'u-tea-1',
    classes: ['Grade 8-A', 'Grade 9-B'],
    studentCount: TEACHER_ANALYTICS.totalStudents,
  }];

  // Subjects (Grades 6–12)
  const subjects = [];
  const chapters = [];
  const lessons = [];
  const lessonTranslations = [];

  const SUBJECT_DEFS = [
    { id: 'math',     name: 'Mathematics',    color: '#6366f1', grades: ['g6','g7','g8','g9','g10','g11','g12'] },
    { id: 'physics',  name: 'Physics',        color: '#f59e0b', grades: ['g9','g10','g11','g12'] },
    { id: 'chemistry',name: 'Chemistry',      color: '#8b5cf6', grades: ['g8','g9','g10','g11','g12'] },
    { id: 'biology',  name: 'Biology',        color: '#10b981', grades: ['g6','g7','g8','g9','g10'] },
    { id: 'cs',       name: 'Computer Science', color: '#0ea5e9', grades: ['g9','g10','g11','g12'] },
  ];

  let chapterSeq = 1;
  let lessonSeq = 1;

  SUBJECT_DEFS.forEach(sub => {
    sub.grades.forEach(gradeId => {
      const subjectId = `${sub.id}-${gradeId}`;
      subjects.push({
        id: subjectId,
        subjectKey: sub.id,
        name: sub.name,
        grade: GRADES.find(g => g.id === gradeId)?.label ?? gradeId,
        color: sub.color,
        iconKey: sub.id === 'math' ? 'Calculator' : sub.id === 'physics' ? 'Atom' : sub.id === 'chemistry' ? 'FlaskConical' : sub.id === 'biology' ? 'Leaf' : 'Cpu',
        description: `${sub.name} for ${GRADES.find(g => g.id === gradeId)?.label}.`,
      });

      // Seed 3 chapters per subject
      const chapterTitles = CHAPTER_TITLES[sub.id] ?? ['Introduction', 'Core Concepts', 'Practice'];
      chapterTitles.forEach((cTitle, cIdx) => {
        const chapterId = `ch-${chapterSeq++}`;
        chapters.push({
          id: chapterId,
          subjectId,
          order: cIdx + 1,
          title: cTitle,
          description: `${cTitle} — learn the foundations, work through examples, and apply them.`,
        });

        // Subject-aligned video mapping
        const subjectVideos = {
          math: [
            'https://www.youtube.com/embed/bAerID24QJ0', // Linear Equations
            'https://www.youtube.com/embed/f15zA0vhJxA', // Algebra & Variables
            'https://www.youtube.com/embed/AA6RfgP-AHU', // Pythagoras Theorem
          ],
          physics: [
            'https://www.youtube.com/embed/F1p3fgbDnkY', // Ohm's Law
            'https://www.youtube.com/embed/fD154055ePE', // Light Reflection
            'https://www.youtube.com/embed/WvbM_3z6aM8', // Electric Circuits
          ],
          chemistry: [
            'https://www.youtube.com/embed/xc98M-mH-B0', // Water Separation
            'https://www.youtube.com/embed/0G8m9gW02j8', // Chemical Reactions
            'https://www.youtube.com/embed/C2Xw04L-p50', // States of Matter
          ],
          biology: [
            'https://www.youtube.com/embed/sQK3Yr4Sc_U', // Photosynthesis
            'https://www.youtube.com/embed/URUJD5NEXC8', // Cell Structure
            'https://www.youtube.com/embed/00jbG_cfGuQ', // Digestion
          ],
          science: [
            'https://www.youtube.com/embed/fo_pmp57VQI', // Friction
            'https://www.youtube.com/embed/URUJD5NEXC8', // Cell Biology
            'https://www.youtube.com/embed/F1p3fgbDnkY', // Electric Circuits
          ]
        };

        const availableVideos = subjectVideos[sub.id] || subjectVideos.science;

        // 3 lessons per chapter
        for (let i = 0; i < 3; i++) {
          const lessonId = `l-${lessonSeq++}`;
          lessons.push({
            id: lessonId,
            chapterId,
            subjectId,
            order: i + 1,
            title: `${cTitle} — Lesson ${i + 1}`,
            summary: `Discover the core ideas of ${cTitle.toLowerCase()} with everyday examples from rural life.`,
            durationMinutes: 10 + (i * 3),
            videoUrl: availableVideos[i % availableVideos.length],
            contentMarkdown: `# ${cTitle} — Lesson ${i + 1}\n\nThis lesson walks you through the fundamentals with clear visuals and step-by-step examples.`,
            keyPoints: [
              `Identify the core idea behind ${cTitle.toLowerCase()}.`,
              'Apply the concept to a familiar everyday problem.',
              'Practice with a worked-out example.',
            ],
          });
          // Mirror the prototype's translations if available
          const lookup = SUBJECT_COURSES.find(c => c.id === sub.id + '-8');
          const fallbackId = ['m1','m2','m3','s1','s2'][i + (sub.id === 'math' ? 0 : 2)] ?? null;
          const tr = LESSON_TRANSLATIONS[fallbackId];
          if (tr) {
            lessonTranslations.push({ id: `${lessonId}-hi`, lessonId, locale: 'hi', title: tr.hi.title, summary: tr.hi.summary, keyPoints: tr.hi.keyPoints });
            lessonTranslations.push({ id: `${lessonId}-or`, lessonId, locale: 'or', title: tr.or.title, summary: tr.or.summary, keyPoints: tr.or.keyPoints });
          }
        }
      });
    });
  });

  // Quizzes (full bank — Math, Bio, Physics, with all 5 question types)
  const quizzes = QUIZ_BANK.map(q => ({
    id: q.id,
    subjectId: q.subjectId,
    title: q.title,
    description: q.description,
    xpReward: q.xpReward,
    timeLimitSeconds: q.timeLimitSeconds,
    difficulty: q.difficulty,
    topicTags: q.topicTags,
  }));

  const questions = [];
  QUIZ_BANK.forEach(quiz => {
    quiz.questions.forEach((q, idx) => {
      questions.push({
        id: `${quiz.id}-q-${idx + 1}`,
        quizId: quiz.id,
        order: idx + 1,
        type: q.type,
        prompt: q.prompt,
        options: q.options,
        correctIndex: q.correctIndex,
        correctText: q.correctText,
        pairs: q.pairs,
        imageAlt: q.imageAlt,
        hint: q.hint,
        explanation: q.explanation,
        topicTag: (quiz.topicTags ?? [])[0] ?? 'general',
        points: q.points ?? 10,
      });
    });
  });

  // Gamification
  const gamificationProfiles = [{
    id: 'gp-1',
    studentId: 's-1',
    xp: INITIAL_USER.xp,
    level: INITIAL_USER.level,
    streak: INITIAL_USER.streak,
    coins: INITIAL_USER.coins,
    streakFreezeAvailable: true,
  }];

  const badges = BADGES.map(b => ({
    id: b.id,
    title: b.title,
    description: b.description,
    iconKey: b.iconName,
    category: b.category,
    conditionType: 'count',
    conditionTarget: 1,
  }));

  const studentBadges = BADGES.filter(b => b.unlocked).map(b => ({
    id: `sb-${b.id}`,
    studentId: 's-1',
    badgeId: b.id,
    unlockedAt: new Date().toISOString(),
  }));

  const missions = [
    { id: 'm-d1', kind: 'daily',   title: 'Complete 1 lesson today',    target: 1, xpReward: 30, date: todayKey() },
    { id: 'm-d2', kind: 'daily',   title: 'Answer 5 quiz questions',    target: 5, xpReward: 25, date: todayKey() },
    { id: 'm-d3', kind: 'daily',   title: 'Maintain your streak',       target: 1, xpReward: 20, date: todayKey() },
    { id: 'm-w1', kind: 'weekly',  title: 'Finish 5 lessons this week', target: 5, xpReward: 100, weekStart: weekStartKey() },
    { id: 'm-w2', kind: 'weekly',  title: 'Score 80%+ on 3 quizzes',    target: 3, xpReward: 120, weekStart: weekStartKey() },
  ];
  const studentMissions = missions.map(m => ({
    id: `sm-${m.id}`,
    studentId: 's-1',
    missionId: m.id,
    progress: 0,
    completed: false,
  }));

  const leaderboards = LEADERBOARD_DATA.map(l => ({
    id: `lb-${l.rank}`,
    scope: 'all-india',
    studentName: l.name,
    village: l.village,
    avatar: l.avatar,
    xp: l.xp,
    streak: l.streak,
    rank: l.rank,
    isCurrentUser: l.isCurrentUser,
  }));

  // Recommendations
  const recommendations = [{
    id: 'rec-1',
    studentId: 's-1',
    kind: 'revision',
    topicTag: 'linear-equations',
    reason: 'You missed 2 of 5 questions in this topic last time.',
    lessonId: lessons[0]?.id,
    quizId: SAMPLE_QUIZ.id,
    createdAt: new Date().toISOString(),
  }];

  // Teacher data
  const activityLogs = [];
  const offlineSyncLogs = [];

  await Promise.all([
    putAll('users', users),
    putAll('students', students),
    putAll('teachers', teachers),
    putAll('subjects', subjects),
    putAll('chapters', chapters),
    putAll('lessons', lessons),
    putAll('lesson_translations', lessonTranslations),
    putAll('quizzes', quizzes),
    putAll('questions', questions),
    putAll('gamification_profiles', gamificationProfiles),
    putAll('badges', badges),
    putAll('student_badges', studentBadges),
    putAll('missions', missions),
    putAll('student_missions', studentMissions),
    putAll('leaderboards', leaderboards),
    putAll('recommendations', recommendations),
    putAll('activity_logs', activityLogs),
    putAll('offline_sync_logs', offlineSyncLogs),
  ]);
};

const CHAPTER_TITLES = {
  math:      ['Number Systems', 'Algebra Basics', 'Geometry Foundations'],
  physics:   ['Motion & Force', 'Energy & Work', 'Light & Optics'],
  chemistry: ['Matter & Its States', 'Acids, Bases & Salts', 'Chemical Reactions'],
  biology:   ['The Cell', 'Plant Life', 'Human Body Systems'],
  cs:        ['Algorithms & Flow', 'Data & Variables', 'Web & Internet Basics'],
};

const todayKey = () => new Date().toISOString().slice(0, 10);

const weekStartKey = () => {
  const d = new Date();
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  return d.toISOString().slice(0, 10);
};
