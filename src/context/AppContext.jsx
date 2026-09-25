import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_USER, TRANSLATIONS, SUBJECT_COURSES, SAMPLE_QUIZ } from '../data/mockData';
import { useSession } from '../hooks/useSession';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const session = useSession();
  const [activeTab, setActiveTab] = useState('landing'); // 'landing', 'dashboard', 'courses', 'lesson', 'quiz', 'achievements', 'leaderboard', 'profile', 'teacher'
  const [authModalMode, setAuthModalMode] = useState(null); // 'login', 'signup', or null
  // While session is loading, keep the demo user so existing screens render. Once authed,
  // session.user becomes the canonical source. Logged-out users see the landing page.
  // NOTE: `user` is the legacy UI user (may be INITIAL_USER during load).
  // Use `session.user` / `session.status` for real RBAC checks.
  const [user, setUser] = useState(INITIAL_USER);
  const [language, setLanguage] = useState('en');
  const [darkMode, setDarkMode] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [audioNarrator, setAudioNarrator] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState('Grade 8');

  const [courses, setCourses] = useState(SUBJECT_COURSES);
  const [selectedCourse, setSelectedCourse] = useState(SUBJECT_COURSES[0]);
  const [selectedLesson, setSelectedLesson] = useState(SUBJECT_COURSES[0].lessons[0]);
  const [activeQuiz, setActiveQuiz] = useState(SAMPLE_QUIZ);

  const [toastNotification, setToastNotification] = useState(null);

  // Mirror session.user into the legacy `user` slot once session resolves.
  useEffect(() => {
    if (session.status === 'authed' && session.user) setUser(session.user);
    if (session.status === 'anon') setUser(null);
  }, [session.status, session.user]);

  // Sync Dark Mode with HTML class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const showToast = (message, type = 'success') => {
    setToastNotification({ message, type, id: Date.now() });
    setTimeout(() => setToastNotification(null), 4000);
  };

  const t = (key) => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS.en?.[key] || key;
  };

  const addXP = (points) => {
    setUser(prev => {
      if (!prev) return prev;
      const newXP = (prev.xp ?? 0) + points;
      const newLevel = Math.floor(newXP / 300) + 1;
      const levelUp = newLevel > (prev.level ?? 1);
      if (levelUp) {
        showToast(`🎉 Level Up! You reached Level ${newLevel}!`, 'level');
      } else {
        showToast(`⚡ +${points} XP Earned! Keep going!`, 'xp');
      }
      return {
        ...prev,
        xp: newXP,
        level: newLevel,
        coins: (prev.coins ?? 0) + Math.floor(points / 2)
      };
    });
  };

  const toggleOffline = () => {
    setIsOffline(prev => {
      const nextState = !prev;
      showToast(
        nextState
          ? "📲 Offline Mode Activated. Showing downloaded lessons!"
          : "🌐 Back Online! Synced latest progress.",
        nextState ? 'offline' : 'online'
      );
      return nextState;
    });
  };

  const toggleLessonDownload = (courseId, lessonId) => {
    setCourses(prevCourses =>
      prevCourses.map(c => {
        if (c.id === courseId) {
          return {
            ...c,
            lessons: c.lessons.map(l => {
              if (l.id === lessonId) {
                const nextDl = !l.isDownloaded;
                showToast(nextDl ? "📥 Lesson downloaded for offline access!" : "🗑️ Removed from offline cache.", 'info');
                return { ...l, isDownloaded: nextDl };
              }
              return l;
            })
          };
        }
        return c;
      })
    );
  };

  const openCourse = (course) => {
    if (!course) return;
    setSelectedCourse(course);
    if (course.lessons && course.lessons.length > 0) {
      setSelectedLesson(course.lessons[0]);
    }
    setActiveTab('lesson');
  };

  const openLesson = (course, lesson) => {
    const targetCourse = course || selectedCourse || courses[0];
    const targetLesson = lesson || (targetCourse?.lessons && targetCourse.lessons[0]);
    if (targetCourse) setSelectedCourse(targetCourse);
    if (targetLesson) setSelectedLesson(targetLesson);
    setActiveTab('lesson');
  };

  const startQuiz = (quiz = SAMPLE_QUIZ) => {
    setActiveQuiz(quiz);
    setActiveTab('quiz');
  };

  return (
    <AppContext.Provider value={{
      // Session (canonical, DB-backed) — use for RBAC
      sessionUser: session.user,
      sessionStatus: session.status,
      login: session.login,
      logout: session.logout,
      register: session.register,
      // Legacy UI user (may be INITIAL_USER until session resolves)
      activeTab,
      setActiveTab,
      authModalMode,
      setAuthModalMode,
      user,
      setUser,
      language,
      setLanguage,
      darkMode,
      setDarkMode,
      isOffline,
      toggleOffline,
      audioNarrator,
      setAudioNarrator,
      selectedGrade,
      setSelectedGrade,
      courses,
      selectedCourse,
      setSelectedCourse,
      selectedLesson,
      setSelectedLesson,
      activeQuiz,
      setActiveQuiz,
      toastNotification,
      showToast,
      t,
      addXP,
      toggleLessonDownload,
      openCourse,
      openLesson,
      startQuiz
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
