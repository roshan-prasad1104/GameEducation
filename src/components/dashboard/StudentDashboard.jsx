import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useApi } from '../../hooks/useApi';
import { quizzes as quizzesApi } from '../../services/api';
import { QUIZ_BANK } from '../../data/quizBank';
import { BADGES } from '../../data/mockData';
import {
  Award,
  Flame,
  BookOpen,
  CheckCircle2,
  Play,
  Clock,
  TrendingUp,
  ArrowRight,
  Target,
  CheckSquare,
  Square,
  Sparkles,
  Zap,
  Calendar
} from 'lucide-react';

export const StudentDashboard = () => {
  const { user, courses, openCourse, openLesson, startQuiz, t } = useApp();

  // Load quizzes from IndexedDB — use first quiz from QUIZ_BANK as primary
  const { data: firstQuizDb } = useApi(() => quizzesApi.get(QUIZ_BANK[0].id), []);

  const handleStartQuiz = () => {
    if (firstQuizDb) {
      // Merge DB quiz metadata with QUIZ_BANK questions (which have all 5 types)
      const fullQuiz = { ...firstQuizDb, questions: QUIZ_BANK[0].questions };
      startQuiz(fullQuiz);
    } else {
      // Fallback to QUIZ_BANK directly
      startQuiz(QUIZ_BANK[0]);
    }
  };

  const activeCourse = courses[0];
  const activeLesson = activeCourse?.lessons.find(l => !l.isCompleted) || activeCourse?.lessons[0];

  // Daily Tasks State
  const [tasks, setTasks] = useState([
    { id: 1, title: "Complete Linear Equations Lesson 3", completed: true },
    { id: 2, title: "Attempt Algebra Chapter Quiz", completed: false },
    { id: 3, title: "Download Science Chapter 2 for offline study", completed: true },
    { id: 4, title: "Review Friction key notes", completed: false }
  ]);

  const toggleTask = (id) => {
    setTasks(prev => prev.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  // Weekly study hours data (Mon - Sun)
  const weeklyData = [
    { day: 'Mon', hours: 1.5 },
    { day: 'Tue', hours: 2.0 },
    { day: 'Wed', hours: 1.0 },
    { day: 'Thu', hours: 2.5 },
    { day: 'Fri', hours: 1.8 },
    { day: 'Sat', hours: 3.0 },
    { day: 'Sun', hours: 2.2 }
  ];

  const maxHours = 3.5;

  return (
    <div className="space-y-6 pb-12">

      {/* 1. Welcome Section with Learning Goal */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user.name}! 👋
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {user.grade} • {user.school}
          </p>
        </div>

        {/* Today's Goal Pill */}
        <div className="flex items-center gap-2.5 bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 px-3.5 py-2 rounded-lg text-xs font-semibold text-blue-800 dark:text-blue-300">
          <Target className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>Today's Goal: Complete 2 lessons in Math & 1 Quiz</span>
        </div>
      </div>

      {/* 2. Four Small Statistic Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Stat 1: XP Points */}
        <div className="card-flat card-flat-hover p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              XP Points
            </span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {user.xp} XP
            </span>
          </div>
        </div>

        {/* Stat 2: Current Level */}
        <div className="card-flat card-flat-hover p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Current Level
            </span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              Level {user.level}
            </span>
          </div>
        </div>

        {/* Stat 3: Lessons Completed */}
        <div className="card-flat card-flat-hover p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Completed
            </span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {user.completedLessonsCount} Lessons
            </span>
          </div>
        </div>

        {/* Stat 4: Daily Streak */}
        <div className="card-flat card-flat-hover p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-slate-800 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Flame className="w-5 h-5 fill-amber-500" />
          </div>
          <div>
            <span className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Daily Streak
            </span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {user.streak} Days 🔥
            </span>
          </div>
        </div>

      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-6">

          {/* 3. Continue Learning Section */}
          <div className="card-flat p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Continue Learning
              </span>
              <span className="text-xs font-bold text-gray-500">
                {activeCourse.progress}% Completed
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {activeCourse.title}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Current: {activeLesson?.title} ({activeLesson?.duration})
              </p>
            </div>

            {/* Flat Progress Bar */}
            <div className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all"
                style={{ width: `${activeCourse.progress}%` }}
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => openLesson(activeCourse, activeLesson)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg flex items-center gap-2 shadow-xs transition-colors"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Resume Lesson</span>
              </button>

              <button
                onClick={() => openCourse(activeCourse)}
                className="px-4 py-2.5 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 font-semibold text-xs rounded-lg transition-colors"
              >
                View Syllabus
              </button>
            </div>
          </div>

          {/* 4. Recent Courses Displayed as Rectangular Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Recent Courses
              </h3>
              <button
                onClick={() => setActiveTab('courses')}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>Browse All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {courses.slice(0, 4).map((course) => (
                <div
                  key={course.id}
                  onClick={() => openCourse(course)}
                  className="card-flat card-flat-hover p-4 cursor-pointer space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded">
                      {course.subject}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                      {course.totalLessons} Lessons
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">
                    {course.title}
                  </h4>

                  <div className="w-full h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                    <span>{course.progress}% Completed</span>
                    <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-0.5">
                      Open <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Weekly Progress Bar Chart */}
          <div className="card-flat p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Weekly Learning Activity</span>
              </h3>
              <span className="text-xs text-gray-500 font-medium">This Week: 14 Hours Total</span>
            </div>

            {/* Basic Flat SVG/CSS Bar Chart */}
            <div className="pt-4 flex items-end justify-between h-40 gap-2 border-b border-gray-200 dark:border-slate-800 pb-2">
              {weeklyData.map((item, idx) => {
                const heightPercent = Math.round((item.hours / maxHours) * 100);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                    <span className="text-[10px] font-bold text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.hours}h
                    </span>
                    <div className="w-full max-w-[32px] bg-gray-100 dark:bg-slate-800 rounded-t h-full flex items-end">
                      <div
                        className="w-full bg-blue-600 rounded-t transition-all group-hover:bg-emerald-500"
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                      {item.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right 1 Column Sidebar */}
        <div className="space-y-6">

          {/* 6. Upcoming Quiz Card */}
          <div className="card-flat p-5 space-y-3 border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                Upcoming Quiz
              </span>
              <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                4 Mins
              </span>
            </div>

            <h4 className="text-sm font-bold text-gray-900 dark:text-white">
              {QUIZ_BANK[0].title}
            </h4>
            <p className="text-xs text-gray-500">
              {QUIZ_BANK[0].questions.length} Questions • Earn {QUIZ_BANK[0].xpReward} XP
            </p>

            <button
              onClick={handleStartQuiz}
              className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Zap className="w-3.5 h-3.5 fill-white" />
              <span>Start Quiz (+{QUIZ_BANK[0].xpReward} XP)</span>
            </button>
          </div>

          {/* 7. Daily Task Checklist */}
          <div className="card-flat p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-emerald-600" />
                <span>Daily Task Checklist</span>
              </h4>
              <span className="text-[11px] font-bold text-gray-500">
                {tasks.filter(t => t.completed).length}/{tasks.length} Done
              </span>
            </div>

            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${task.completed
                      ? 'bg-emerald-50/50 dark:bg-slate-800/60 border-emerald-200 dark:border-slate-700 text-gray-500 line-through'
                      : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-800 dark:text-gray-200 hover:border-gray-300'
                    }`}
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-snug">{task.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 8. Recent Activity List */}
          <div className="card-flat p-5 space-y-4">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">
              Recent Activity
            </h4>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Completed Quiz: Light Reflection</p>
                  <p className="text-[11px] text-gray-500">Score: 80% • Earned +100 XP • 2h ago</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Unlocked "Streak Master 7" Badge</p>
                  <p className="text-[11px] text-gray-500">7 days continuous study • Yesterday</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Downloaded Class 8 Science Pack</p>
                  <p className="text-[11px] text-gray-500">Available offline • 3 days ago</p>
                </div>
              </div>
            </div>
          </div>

          {/* 9. Simple Achievement Badges */}
          <div className="card-flat p-5 space-y-3">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">
              Achievement Badges
            </h4>

            <div className="grid grid-cols-3 gap-2 text-center">
              {BADGES.slice(0, 3).map((badge) => (
                <div key={badge.id} className="p-2 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                  <div className="w-7 h-7 rounded bg-blue-100 text-blue-600 mx-auto flex items-center justify-center font-bold text-xs mb-1">
                    🏆
                  </div>
                  <span className="block text-[10px] font-bold text-gray-800 dark:text-gray-200 truncate">
                    {badge.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
