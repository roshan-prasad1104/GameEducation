import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useApi } from '../../hooks/useApi';
import { catalogApi, studentApi } from '../../services/api';
import { ErrorState, LoadingState, NamedIcon, StaleBanner } from '../ui';
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
  Calendar,
  ClipboardList
} from 'lucide-react';
import { activityText, badgeName, weekdayShort } from '../../i18n/serverText';

const ACTIVITY_DOT = { LESSON: 'bg-blue-600', QUIZ: 'bg-amber-500', BADGE: 'bg-emerald-500' };

const timeAgo = (iso, t) => {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return t('dashboard.minutesAgo', { n: Math.max(1, mins) });
  const hours = Math.round(mins / 60);
  if (hours < 24) return t('dashboard.hoursAgo', { n: hours });
  const days = Math.round(hours / 24);
  return days === 1 ? t('dashboard.yesterday') : t('dashboard.daysAgo', { n: days });
};

export const StudentDashboard = () => {
  const { t } = useApp();
  const navigate = useNavigate();
  const { data: dash, error, loading, reload } = useApi(() => studentApi.dashboard(), []);
  const { data: progress } = useApi(() => studentApi.progress(), []);
  const { data: recs } = useApi(() => studentApi.recommendations(3), []);

  // Next quiz: a pending teacher-assigned quiz, else the quiz of the chapter being studied.
  const assignedQuiz = dash?.assignments.find((a) => a.quizId && !a.completed);
  const quizChapterId = assignedQuiz?.chapterId ?? dash?.continueLesson?.chapterId ?? null;
  const { data: quizChapter } = useApi(
    () => (quizChapterId ? catalogApi.chapter(quizChapterId) : Promise.resolve(null)), [quizChapterId]);

  if (loading && !dash) return <LoadingState />;
  if (error && !dash) return <ErrorState error={error} onRetry={reload} />;

  const next = dash.continueLesson;
  const activeCourse = next ? dash.subjects.find((s) => s.id === next.subjectId) : dash.subjects[0];
  const missionsDone = dash.missions.filter((m) => m.completed).length;

  const quizCard = quizChapter?.quiz;
  const upcomingQuiz = quizCard ? {
    title: quizCard.title,
    to: `/student/quiz/${quizCard.id}`,
    label: assignedQuiz ? t('dashboard.assignedQuiz') : t('dashboard.upcomingQuiz'),
    minutes: Math.round(quizCard.timeLimitSeconds / 60),
    questions: quizCard.questionCount,
    maxXp: quizCard.questionCount * 10 + 20,
    best: quizCard.bestPercentage,
  } : null;

  // Weekly activity (lessons + quizzes per day) from real progress data.
  const weeklyData = (progress?.last7Days ?? []).map((d) => ({
    day: weekdayShort(t, d.date),
    count: d.lessons + d.quizzes,
    lessons: d.lessons,
    quizzes: d.quizzes,
  }));
  const maxCount = Math.max(1, ...weeklyData.map((d) => d.count));
  const weekTotal = weeklyData.reduce((s, d) => s + d.count, 0);

  return (
    <div className="space-y-6 pb-12">
      <StaleBanner savedAt={dash.__stale} />

      {/* 1. Welcome Section with Learning Goal */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {t('dashboard.welcome', { name: dash.name.split(' ')[0] })} 👋
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {[dash.gradeLevel && t('common.grade', { grade: dash.gradeLevel }), dash.school].filter(Boolean).join(' • ')}
          </p>
        </div>

        {/* Today's Goal Pill */}
        <div className="flex items-center gap-2.5 bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 px-3.5 py-2 rounded-lg text-xs font-semibold text-blue-800 dark:text-blue-300">
          <Target className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>{t('dashboard.todaysGoal', { done: missionsDone, total: dash.missions.length })}</span>
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
              {t('xpPoints')}
            </span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {t('dashboard.xpValue', { xp: dash.level.xp })}
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
              {t('dashboard.currentLevel')}
            </span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {t('dashboard.levelN', { level: dash.level.level })}
            </span>
            <span className="block text-[10px] text-gray-500">{t('dashboard.xpToNext', { xp: dash.level.nextLevelXp - dash.level.xp })}</span>
          </div>
        </div>

        {/* Stat 3: Lessons Completed */}
        <div className="card-flat card-flat-hover p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t('lesson.completed')}
            </span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {t('dashboard.lessonsCount', { count: dash.lessonsCompleted })}
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
              {t('sidebar.dailyStreak')}
            </span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {t('dashboard.streakDaysFire', { count: dash.streak })}
            </span>
          </div>
        </div>

      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-6">

          {/* 3. Continue Learning Section */}
          {next && activeCourse ? (
            <div className="card-flat p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  {t('continueLearning')}
                </span>
                <span className="text-xs font-bold text-gray-500">
                  {t('dashboard.pctCompleted', { pct: activeCourse.progressPercent })}
                </span>
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {activeCourse.name}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {t('dashboard.current', { lesson: next.lessonTitle, chapter: next.chapterTitle })}
                </p>
              </div>

              {/* Flat Progress Bar */}
              <div className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all"
                  style={{ width: `${activeCourse.progressPercent}%` }}
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => navigate(`/student/lessons/${next.lessonId}`)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg flex items-center gap-2 shadow-xs transition-colors"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>{t('dashboard.resumeLesson')}</span>
                </button>

                <button
                  onClick={() => navigate(`/student/subjects/${activeCourse.id}`)}
                  className="px-4 py-2.5 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 font-semibold text-xs rounded-lg transition-colors"
                >
                  {t('dashboard.viewSyllabus')}
                </button>
              </div>
            </div>
          ) : (
            <div className="card-flat p-5 sm:p-6 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{t('dashboard.allDoneShort')}</span>
            </div>
          )}

          {/* 4. Recent Courses Displayed as Rectangular Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {t('dashboard.recentCourses')}
              </h3>
              <button
                onClick={() => navigate('/student/subjects')}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>{t('dashboard.browseAll')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...dash.subjects].sort((a, b) => b.progressPercent - a.progressPercent).slice(0, 4).map((course) => (
                <div
                  key={course.id}
                  onClick={() => navigate(`/student/subjects/${course.id}`)}
                  className="card-flat card-flat-hover p-4 cursor-pointer space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded">
                      {course.name}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                      {t('dashboard.lessonsCount', { count: course.lessonCount })}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">
                    {t('dashboard.courseTitle', { name: course.name, grade: course.gradeLevel, chapters: course.chapterCount })}
                  </h4>

                  <div className="w-full h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${course.progressPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                    <span>{t('dashboard.pctCompleted', { pct: course.progressPercent })}</span>
                    <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-0.5">
                      {t('dashboard.open')} <ArrowRight className="w-3 h-3" />
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
                <span>{t('dashboard.weeklyActivity')}</span>
              </h3>
              <span className="text-xs text-gray-500 font-medium">{t('dashboard.thisWeek', { count: weekTotal, xp: dash.xpThisWeek })}</span>
            </div>

            {/* Basic Flat SVG/CSS Bar Chart */}
            <div className="pt-4 flex items-end justify-between h-40 gap-2 border-b border-gray-200 dark:border-slate-800 pb-2" role="img"
              aria-label={t('dashboard.chartAria', { days: weeklyData.map((d) => `${d.day} ${d.count}`).join(', ') })}>
              {weeklyData.map((item, idx) => {
                const heightPercent = Math.round((item.count / maxCount) * 100);
                return (
                  <div key={idx} className="flex-1 h-full flex flex-col items-center gap-2 group" title={t('dashboard.barTitle', { lessons: item.lessons, quizzes: item.quizzes })}>
                    <span className="text-[10px] font-bold text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.count}
                    </span>
                    <div className="w-full max-w-[32px] bg-gray-100 dark:bg-slate-800 rounded-t flex-1 min-h-0 flex items-end">
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
          {upcomingQuiz && (
            <div className="card-flat p-5 space-y-3 border-l-4 border-l-amber-500">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                  {upcomingQuiz.label}
                </span>
                <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {t('dashboard.mins', { count: upcomingQuiz.minutes })}
                </span>
              </div>

              <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                {upcomingQuiz.title}
              </h4>
              <p className="text-xs text-gray-500">
                {t('dashboard.questionsCount', { count: upcomingQuiz.questions })} • {upcomingQuiz.best != null ? t('dashboard.bestScore', { pct: upcomingQuiz.best }) : t('dashboard.earnUpTo', { xp: upcomingQuiz.maxXp })}
              </p>

              <button
                onClick={() => navigate(upcomingQuiz.to)}
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Zap className="w-3.5 h-3.5 fill-white" />
                <span>{t('dashboard.startQuiz')}</span>
              </button>
            </div>
          )}

          {/* 7. Daily Task Checklist (real daily missions) */}
          <div className="card-flat p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-emerald-600" />
                <span>{t('dashboard.dailyChecklist')}</span>
              </h4>
              <span className="text-[11px] font-bold text-gray-500">
                {t('dashboard.doneCount', { done: missionsDone, total: dash.missions.length })}
              </span>
            </div>

            <div className="space-y-2">
              {dash.missions.map((task) => (
                <div
                  key={task.code}
                  onClick={() => navigate('/student/missions')}
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
                  <span className="leading-snug flex-1">{t(`missions.${task.code}.title`)} ({task.progress}/{task.target})</span>
                  <span className="text-[10px] font-bold text-amber-600 no-underline">{t('dashboard.plusXp', { xp: task.xpReward })}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended For You (AI) */}
          <div className="card-flat p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>{t('recommendedLessons')}</span>
              </h4>
              <Link to="/student/recommendations" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">{t('dashboard.viewAll')}</Link>
            </div>
            {!recs ? (
              <p className="text-xs text-gray-500">{t('dashboard.loadingSuggestions')}</p>
            ) : recs.recommendations.length === 0 ? (
              <p className="text-xs text-gray-500">{t('dashboard.caughtUp')}</p>
            ) : (
              <div className="space-y-2">
                {recs.recommendations.map((r) => (
                  <Link key={r.lessonId} to={`/student/lessons/${r.lessonId}`}
                    className="block p-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-gray-300 text-xs">
                    <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${r.kind === 'REVISE' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                      {r.kind === 'REVISE' ? t('recs.kind.REVISE') : r.kind === 'START' ? t('recs.kind.START') : t('recs.kind.CONTINUE')}
                    </span>
                    <span className="block mt-1.5 font-semibold text-gray-900 dark:text-white">{r.title}</span>
                    <span className="block text-[11px] text-gray-500 mt-0.5">{r.subjectName}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Teacher assignments */}
          {dash.assignments.length > 0 && (
            <div className="card-flat p-5 space-y-3">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4 text-blue-600" />
                <span>{t('dashboard.teacherAssignments')}</span>
              </h4>
              <div className="space-y-2">
                {dash.assignments.map((a) => (
                  <Link key={a.id} to={a.lessonId ? `/student/lessons/${a.lessonId}` : `/student/quiz/${a.quizId}`}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs transition-colors ${a.completed
                      ? 'bg-emerald-50/50 dark:bg-slate-800/60 border-emerald-200 dark:border-slate-700 text-gray-500'
                      : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-800 dark:text-gray-200 hover:border-gray-300'}`}>
                    {a.completed ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> : <Square className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />}
                    <span className="leading-snug">
                      <span className={a.completed ? 'line-through' : 'font-semibold'}>{a.title}</span>
                      <span className="block text-[11px] text-gray-500">{a.teacherName}{a.dueDate ? ` • ${t('assignments.due', { date: new Date(a.dueDate).toLocaleDateString() })}` : ''}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 8. Recent Activity List */}
          <div className="card-flat p-5 space-y-4">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">
              {t('dashboard.recentActivityTitle')}
            </h4>

            {dash.recentActivity.length === 0 ? (
              <p className="text-xs text-gray-500">{t('dashboard.noActivity')}</p>
            ) : (
              <div className="space-y-3 text-xs">
                {dash.recentActivity.slice(0, 5).map((a, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${ACTIVITY_DOT[a.type] ?? 'bg-blue-600'}`} />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{a.type === 'QUIZ' ? t('dashboard.completedQuiz', { title: activityText(t, a).title }) : activityText(t, a).title}</p>
                      <p className="text-[11px] text-gray-500">{activityText(t, a).detail} • {timeAgo(a.at, t)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 9. Simple Achievement Badges */}
          <div className="card-flat p-5 space-y-3">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">
              {t('dashboard.achievementBadges')}
            </h4>

            {dash.recentBadges.length === 0 ? (
              <p className="text-xs text-gray-500">{t('dashboard.firstBadge')}</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 text-center">
                {dash.recentBadges.map((badge) => (
                  <div key={badge.code} className="p-2 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                    <div className="w-7 h-7 rounded bg-blue-100 text-blue-600 mx-auto flex items-center justify-center font-bold text-xs mb-1">
                      <NamedIcon name={badge.icon} className="w-4 h-4" />
                    </div>
                    <span className="block text-[10px] font-bold text-gray-800 dark:text-gray-200 truncate">
                      {badgeName(t, badge)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
