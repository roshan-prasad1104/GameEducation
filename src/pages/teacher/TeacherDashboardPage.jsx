import { Link } from 'react-router-dom';
import { Activity, BarChart3, BookOpen, BrainCircuit, ClipboardCheck, LifeBuoy, TrendingUp, TriangleAlert, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useApi } from '../../hooks/useApi';
import { teacherApi } from '../../services/api';
import { BarChart, Badge, Card, EmptyState, ErrorState, LoadingState, PageHeader, Stat } from '../../components/ui';
import { SectionTitle } from '../student/widgets';
import { SegmentBadge } from './segments';

export const TeacherDashboardPage = () => {
  const { t, language } = useApp();
  const overview = useApi(() => teacherApi.overview(), []);
  const students = useApi(() => teacherApi.students(), []);

  if (overview.loading && !overview.data) return <LoadingState rows={3} />;
  if (overview.error && !overview.data) return <ErrorState error={overview.error} onRetry={overview.reload} />;
  const d = overview.data;

  if (d.totalStudents === 0) {
    return (
      <div className="space-y-5">
        <PageHeader title={t('teacher.dashboardTitle')} />
        <EmptyState icon={Users} title={t('teacher.noStudents')} description={t('teacher.noStudentsHint')} />
      </div>
    );
  }

  const needSupport = (students.data ?? []).filter((s) => s.segment === 'NEEDS_SUPPORT');
  const dayFmt = (iso) => new Date(iso).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short' });

  return (
    <div className="space-y-6">
      <PageHeader title={t('teacher.dashboardTitle')} subtitle={t('teacher.dashboardSubtitle')}
        actions={<Badge tone="violet" icon={BrainCircuit}>{t('teacher.segmentedBy', { model: d.segmentModel })}</Badge>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label={t('teacher.students')} value={d.totalStudents} icon={Users} hint={t('teacher.activeWeek', { count: d.activeStudents })} />
        <Stat label={t('teacher.avgScore')} value={d.averageScore == null ? '—' : `${d.averageScore}%`} icon={TrendingUp} tone="success"
          hint={t('teacher.attempts', { count: d.quizAttempts })} />
        <Stat label={t('teacher.lessonsCompleted')} value={d.lessonsCompleted.toLocaleString()} icon={BookOpen} tone="violet" />
        <Stat label={t('teacher.needSupport')} value={d.needsSupport} icon={LifeBuoy} tone="xp" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card className="p-5">
          <SectionTitle icon={BarChart3}>{t('teacher.subjectPerformance')}</SectionTitle>
          <BarChart
            horizontal
            labels={d.subjectPerformance.map((s) => s.subjectName)}
            series={[{ label: t('teacher.avgScore'), data: d.subjectPerformance.map((s) => s.averageScore) }]}
            valueSuffix="%"
            max={100}
            ariaLabel={t('teacher.subjectPerformance')}
          />
        </Card>
        <Card className="p-5">
          <SectionTitle icon={ClipboardCheck}>{t('teacher.scoreDistribution')}</SectionTitle>
          <BarChart
            labels={d.scoreDistribution.map((b) => b.label)}
            series={[{ label: t('teacher.attemptsLabel'), data: d.scoreDistribution.map((b) => b.count) }]}
            ariaLabel={t('teacher.scoreDistribution')}
          />
        </Card>
        <Card className="p-5">
          <SectionTitle icon={Activity}>{t('teacher.activity')}</SectionTitle>
          <BarChart
            labels={d.activity.map((p) => dayFmt(p.date))}
            series={[
              { label: t('progress.lessons'), data: d.activity.map((p) => p.lessons) },
              { label: t('progress.quizzes'), data: d.activity.map((p) => p.quizzes) },
            ]}
            ariaLabel={t('teacher.activity')}
          />
        </Card>
        <Card className="p-5">
          <SectionTitle icon={BookOpen}>{t('teacher.completion')}</SectionTitle>
          <BarChart
            horizontal
            labels={d.subjectPerformance.map((s) => s.subjectName)}
            series={[{ label: t('teacher.completionLabel'), data: d.subjectPerformance.map((s) => s.completionPercent) }]}
            valueSuffix="%"
            max={100}
            ariaLabel={t('teacher.completion')}
          />
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Card className="p-5">
          <SectionTitle icon={LifeBuoy} action={<Link to="/teacher/students" className="text-xs font-medium text-brand-600 dark:text-brand-300 hover:underline">{t('common.viewAll')}</Link>}>
            {t('teacher.needSupport')}
          </SectionTitle>
          {needSupport.length === 0 ? <p className="text-sm text-slate-500">{t('teacher.nobodyNeedsSupport')}</p> : (
            <ul className="space-y-2">
              {needSupport.map((s) => (
                <li key={s.id}>
                  <Link to={`/teacher/students/${s.id}`} className="block rounded-xl border border-slate-200 dark:border-slate-800 p-3 hover:border-brand-300">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm">{s.name}</span>
                      <SegmentBadge segment={s.segment} />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{s.segmentReason}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <SectionTitle icon={TriangleAlert} action={<Link to="/teacher/weak-topics" className="text-xs font-medium text-brand-600 dark:text-brand-300 hover:underline">{t('common.viewAll')}</Link>}>
            {t('teacher.weakTopics')}
          </SectionTitle>
          {d.weakTopics.length === 0 ? <p className="text-sm text-slate-500">{t('teacher.noWeakTopics')}</p> : (
            <ul className="space-y-2.5">
              {d.weakTopics.map((w) => (
                <li key={w.topic} className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{w.topicName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{w.subjectName} · {t('teacher.struggling', { count: w.studentsStruggling })}</p>
                  </div>
                  <Badge tone={w.accuracy < 50 ? 'danger' : 'warn'}>{w.accuracy}%</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <SectionTitle icon={Activity}>{t('dashboard.recentActivity')}</SectionTitle>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {d.recentActivity.map((a, i) => (
              <li key={i} className="py-2.5 text-sm">
                <p><span className="font-medium">{a.studentName}</span> · <span className="text-slate-600 dark:text-slate-300">{a.item.title}</span></p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{a.item.detail} · {new Date(a.item.at).toLocaleDateString()}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
};
