import { Link } from 'react-router-dom';
import { Award, BookOpen, BrainCircuit, CheckCircle2, ClipboardList, History, Play, Target, TrendingUp } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useApi } from '../../hooks/useApi';
import { studentApi } from '../../services/api';
import { Button, Card, EmptyState, ErrorState, LoadingState, Stat, StaleBanner, NamedIcon } from '../../components/ui';
import { AssignmentList, LevelCard, MissionList, RecommendationList, SectionTitle, SubjectTile } from './widgets';

export const DashboardPage = () => {
  const { t } = useApp();
  const { data, error, loading, reload } = useApi(() => studentApi.dashboard(), []);
  const recs = useApi(() => studentApi.recommendations(3), []);

  if (loading && !data) return <LoadingState />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;

  const pending = data.assignments.filter((a) => !a.completed);
  const next = data.continueLesson;

  return (
    <div className="space-y-6">
      <StaleBanner savedAt={data.__stale} />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('dashboard.welcome', { name: data.name.split(' ')[0] })}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {[data.gradeLevel && t('common.grade', { grade: data.gradeLevel }), data.school].filter(Boolean).join(' · ')}
          </p>
        </div>
        {next && (
          <Link to={`/student/lessons/${next.lessonId}`}>
            <Button leftIcon={Play}>{t('dashboard.continue')}</Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <LevelCard level={data.level} streak={data.streak} />
        <Stat label={t('dashboard.lessonsDone')} value={`${data.lessonsCompleted}/${data.totalLessons}`} icon={BookOpen}
          hint={t('dashboard.xpThisWeek', { xp: data.xpThisWeek })} />
        <Stat label={t('dashboard.quizScore')} value={data.quizzesTaken ? `${data.averageScore}%` : '—'} icon={TrendingUp} tone="success"
          hint={t('dashboard.quizzesTaken', { count: data.quizzesTaken })} />
        <Stat label={t('dashboard.badges')} value={`${data.badgesEarned}/${data.badgesTotal}`} icon={Award} tone="violet"
          hint={t('dashboard.longestStreak', { count: data.longestStreak })} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          {next ? (
            <Card className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-white shrink-0" style={{ background: next.subjectColor }}>
                <Play className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-300">{t('dashboard.upNext')}</p>
                <p className="mt-1 font-semibold truncate">{next.lessonTitle}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{next.subjectName} · {next.chapterTitle}</p>
              </div>
              <Link to={`/student/lessons/${next.lessonId}`}><Button variant="outline">{t('dashboard.startLesson')}</Button></Link>
            </Card>
          ) : (
            <Card className="p-6 flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              <p className="font-medium">{t('dashboard.allDone')}</p>
            </Card>
          )}

          <section>
            <SectionTitle icon={BookOpen} action={<Link to="/student/subjects" className="text-xs font-medium text-brand-600 dark:text-brand-300 hover:underline">{t('common.viewAll')}</Link>}>
              {t('dashboard.subjectProgress')}
            </SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.subjects.map((s) => <SubjectTile key={s.id} subject={s} />)}
            </div>
          </section>

          <Card className="p-5">
            <SectionTitle icon={History}>{t('dashboard.recentActivity')}</SectionTitle>
            {data.recentActivity.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('dashboard.noActivity')}</p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.recentActivity.map((a, i) => {
                  const Icon = a.type === 'BADGE' ? Award : a.type === 'QUIZ' ? ClipboardList : BookOpen;
                  return (
                    <li key={i} className="py-2.5 flex items-start gap-3">
                      <Icon className="h-4 w-4 mt-0.5 text-slate-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{a.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{a.detail}</p>
                      </div>
                      <time className="text-xs text-slate-400 shrink-0">{new Date(a.at).toLocaleDateString()}</time>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <SectionTitle icon={Target}>{t('dashboard.missions')}</SectionTitle>
            <MissionList missions={data.missions} />
          </Card>

          <Card className="p-5">
            <SectionTitle icon={BrainCircuit} action={<Link to="/student/for-you" className="text-xs font-medium text-brand-600 dark:text-brand-300 hover:underline">{t('common.viewAll')}</Link>}>
              {t('recs.title')}
            </SectionTitle>
            {recs.loading && !recs.data ? <p className="text-sm text-slate-500">{t('common.loading')}</p>
              : recs.error && !recs.data ? <p className="text-sm text-slate-500">{recs.error.message}</p>
                : recs.data.recommendations.length === 0 ? <p className="text-sm text-slate-500">{t('recs.empty')}</p>
                  : <RecommendationList items={recs.data.recommendations} compact />}
          </Card>

          <Card className="p-5">
            <SectionTitle icon={ClipboardList}>{t('dashboard.assignments', { count: pending.length })}</SectionTitle>
            {data.assignments.length === 0
              ? <p className="text-sm text-slate-500 dark:text-slate-400">{t('assignments.none')}</p>
              : <AssignmentList items={data.assignments} />}
          </Card>

          <Card className="p-5">
            <SectionTitle icon={Award} action={<Link to="/student/badges" className="text-xs font-medium text-brand-600 dark:text-brand-300 hover:underline">{t('common.viewAll')}</Link>}>
              {t('dashboard.recentBadges')}
            </SectionTitle>
            {data.recentBadges.length === 0 ? (
              <EmptyState className="py-6" title={t('badges.noneYet')} description={t('badges.noneYetHint')} />
            ) : (
              <ul className="grid grid-cols-3 gap-2">
                {data.recentBadges.map((b) => {
                  return (
                    <li key={b.code} className="rounded-xl bg-violet-50 dark:bg-violet-950/30 p-3 text-center">
                      <NamedIcon name={b.icon} className="h-5 w-5 mx-auto text-violet-600 dark:text-violet-300" />
                      <p className="mt-1.5 text-xs font-medium leading-tight">{b.name}</p>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
