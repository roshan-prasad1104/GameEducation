import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useApi } from '../../hooks/useApi';
import { studentApi } from '../../services/api';
import { ErrorState, LoadingState, StaleBanner } from '../ui';
import {
  CheckCircle2,
  ClipboardList,
  Target,
  Zap,
  ArrowRight
} from 'lucide-react';
import { missionDescription } from '../../i18n/serverText';

const MISSION_LINK = {
  DAILY_LESSON: '/student/dashboard',
  DAILY_QUIZ: '/student/subjects',
  DAILY_QUESTIONS: '/student/subjects',
  DAILY_ACCURACY: '/student/subjects',
};

/** Daily missions and teacher assignments — the "Missions" item from the original navigation. */
export const MissionsView = () => {
  const { t } = useApp();
  const { data, error, loading, reload } = useApi(() => studentApi.dashboard(), []);

  if (loading && !data) return <LoadingState rows={2} />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;

  const done = data.missions.filter((m) => m.completed).length;
  const earned = data.missions.filter((m) => m.completed).reduce((s, m) => s + m.xpReward, 0);
  const possible = data.missions.reduce((s, m) => s + m.xpReward, 0);
  const lessonLink = data.continueLesson ? `/student/lessons/${data.continueLesson.lessonId}` : '/student/subjects';

  return (
    <div className="space-y-8 pb-16">
      <StaleBanner savedAt={data.__stale} />

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left">
          <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full">
            {t('missionsView.eyebrow')}
          </span>
          <h1 className="text-3xl font-black">{t('missionsView.title')}</h1>
          <p className="text-xs sm:text-sm text-indigo-100 max-w-xl">
            {t('missionsView.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-4 bg-white/20 backdrop-blur-md border border-white/30 p-4 rounded-2xl">
          <div className="text-center">
            <div className="text-2xl font-black text-amber-200">{done}/{data.missions.length}</div>
            <div className="text-[11px] font-semibold text-white">{t('lesson.completed')}</div>
          </div>
          <div className="h-8 w-[1px] bg-white/30" />
          <div className="text-center">
            <div className="text-2xl font-black text-white">+{earned}/{possible}</div>
            <div className="text-[11px] font-semibold text-white">{t('missionsView.bonusXp')}</div>
          </div>
        </div>
      </div>

      {/* Missions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {data.missions.map((m) => {
          const pct = Math.round((100 * m.progress) / m.target);
          return (
            <div key={m.code} className={`glass-card p-6 rounded-3xl space-y-4 border transition-all ${
              m.completed ? 'border-emerald-200 dark:border-emerald-800/80 shadow-md' : 'border-slate-200 dark:border-slate-800'}`}>
              <div className="flex items-center justify-between">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${m.completed ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                  {m.completed ? <CheckCircle2 className="w-6 h-6" /> : <Target className="w-6 h-6" />}
                </div>
                <span className="text-xs text-amber-600 dark:text-amber-400 font-black flex items-center gap-1">
                  <Zap className="w-4 h-4 fill-amber-400" /> {t('dashboard.plusXp', { xp: m.xpReward })}
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">{t(`missions.${m.code}.title`)}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">{missionDescription(t, m)}</p>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <span>{t('nav.progress')}</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">{m.progress}/{m.target}</span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${m.completed ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-600 to-emerald-500'}`}
                    style={{ width: `${pct}%` }} />
                </div>
              </div>
              {!m.completed && (
                <Link to={m.code === 'DAILY_LESSON' ? lessonLink : MISSION_LINK[m.code]}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:translate-x-1 transition-transform">
                  {t('missionsView.startNow')} <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* Teacher assignments */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-blue-600" /> {t('dashboard.teacherAssignments')}
        </h2>
        {data.assignments.length === 0 ? (
          <p className="text-sm text-slate-500">{t('missionsView.noAssignments')}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.assignments.map((a) => (
              <Link key={a.id} to={a.lessonId ? `/student/lessons/${a.lessonId}` : `/student/quiz/${a.quizId}`}
                className="glass-card p-5 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-start gap-3 hover:border-blue-300 transition-colors">
                {a.completed ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <ClipboardList className="w-5 h-5 text-blue-600 shrink-0" />}
                <div className="min-w-0">
                  <p className={`text-sm font-bold ${a.completed ? 'line-through text-slate-500' : 'text-slate-900 dark:text-white'}`}>{a.title}</p>
                  <p className="text-xs text-slate-500">{a.teacherName}{a.dueDate ? ` • ${t('assignments.due', { date: new Date(a.dueDate).toLocaleDateString() })}` : ''}</p>
                  {a.note && <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{a.note}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
