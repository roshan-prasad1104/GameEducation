import { Link } from 'react-router-dom';
import { BarChart3, ClipboardList, LineChart } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useApi } from '../../hooks/useApi';
import { studentApi } from '../../services/api';
import { BarChart, Badge, Card, EmptyState, ErrorState, LoadingState, PageHeader, Progress, StaleBanner } from '../../components/ui';
import { SectionTitle } from './widgets';

export const ProgressPage = () => {
  const { t, language } = useApp();
  const { data, error, loading, reload } = useApi(() => studentApi.progress(), []);

  if (loading && !data) return <LoadingState rows={3} />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;

  const dayLabels = data.last7Days.map((d) => new Date(d.date).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'short' }));

  return (
    <div className="space-y-5">
      <PageHeader title={t('progress.title')} subtitle={t('progress.subtitle')} />
      <StaleBanner savedAt={data.__stale} />

      <Card className="p-5">
        <SectionTitle icon={BarChart3}>{t('progress.weekActivity')}</SectionTitle>
        <BarChart
          labels={dayLabels}
          series={[
            { label: t('progress.lessons'), data: data.last7Days.map((d) => d.lessons) },
            { label: t('progress.quizzes'), data: data.last7Days.map((d) => d.quizzes) },
          ]}
          ariaLabel={t('progress.weekActivity')}
          height={220}
        />
      </Card>

      <section>
        <SectionTitle icon={LineChart}>{t('progress.bySubject')}</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {data.subjects.map(({ subject, chapters, averageQuizScore }) => (
            <Card key={subject.id} className="p-5">
              <div className="flex items-center justify-between gap-2">
                <Link to={`/student/subjects/${subject.id}`} className="font-semibold hover:text-brand-600">{subject.name}</Link>
                <Badge tone={averageQuizScore == null ? 'neutral' : averageQuizScore >= 80 ? 'success' : averageQuizScore >= 50 ? 'brand' : 'danger'}>
                  {averageQuizScore == null ? t('progress.noQuiz') : t('progress.avgQuiz', { pct: averageQuizScore })}
                </Badge>
              </div>
              <Progress className="mt-3" value={subject.progressPercent} tone={subject.progressPercent === 100 ? 'success' : 'brand'} />
              <ul className="mt-4 space-y-2">
                {chapters.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 text-sm">
                    <Link to={`/student/chapters/${c.id}`} className="truncate hover:text-brand-600">{c.title}</Link>
                    <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      {c.completedLessons}/{c.lessonCount}{c.quiz?.bestPercentage != null ? ` · ${c.quiz.bestPercentage}%` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      <Card className="p-5">
        <SectionTitle icon={ClipboardList}>{t('progress.attempts')}</SectionTitle>
        {data.attempts.length === 0 ? (
          <EmptyState title={t('progress.noAttempts')} />
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm min-w-[520px]">
              <thead className="text-left text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <tr><th className="px-5 py-2 font-medium">{t('progress.quiz')}</th><th className="px-3 py-2 font-medium">{t('result.score')}</th>
                  <th className="px-3 py-2 font-medium">XP</th><th className="px-5 py-2 font-medium text-right">{t('progress.date')}</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.attempts.map((a) => (
                  <tr key={a.attemptId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-2.5"><Link to={`/student/results/${a.attemptId}`} className="font-medium hover:text-brand-600">{a.quizTitle}</Link>
                      <p className="text-xs text-slate-500">{a.subjectName}</p></td>
                    <td className="px-3 py-2.5 tabular-nums">{a.correctCount}/{a.totalQuestions} · {a.percentage}%</td>
                    <td className="px-3 py-2.5 tabular-nums text-amber-700 dark:text-amber-300">+{a.xpEarned}</td>
                    <td className="px-5 py-2.5 text-right text-slate-500 dark:text-slate-400">{new Date(a.submittedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
