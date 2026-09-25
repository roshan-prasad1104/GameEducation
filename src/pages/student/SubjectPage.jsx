import { Link, useParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ClipboardCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useApi } from '../../hooks/useApi';
import { catalogApi } from '../../services/api';
import { Badge, Card, ErrorState, LoadingState, PageHeader, Progress, StaleBanner, NamedIcon } from '../../components/ui';

export const SubjectPage = () => {
  const { subjectId } = useParams();
  const { t } = useApp();
  const { data, error, loading, reload } = useApi(() => catalogApi.subject(subjectId), [subjectId]);

  if (loading && !data) return <LoadingState rows={3} />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;

  const { subject, chapters } = data;

  return (
    <div className="space-y-4">
      <PageHeader
        crumbs={[{ label: t('nav.subjects'), to: '/student/subjects' }]}
        title={subject.name}
        subtitle={subject.description}
        actions={
          <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-white" style={{ background: subject.color }}>
            <NamedIcon name={subject.icon} className="h-6 w-6" />
          </div>
        }
      />
      <StaleBanner savedAt={data.__stale} />
      <Card className="p-5">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium">{t('subjects.overall')}</span>
          <span className="text-slate-500 dark:text-slate-400">{subject.completedLessons}/{subject.lessonCount} · {subject.progressPercent}%</span>
        </div>
        <Progress value={subject.progressPercent} tone={subject.progressPercent === 100 ? 'success' : 'brand'} />
      </Card>

      <ol className="space-y-3">
        {chapters.map((c) => {
          const pct = c.lessonCount ? Math.round((100 * c.completedLessons) / c.lessonCount) : 0;
          return (
            <li key={c.id}>
              <Link to={`/student/chapters/${c.id}`} className="card card-hover p-5 flex flex-col sm:flex-row sm:items-center gap-4 group">
                <div className="h-10 w-10 rounded-xl bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 font-semibold flex items-center justify-center shrink-0">
                  {pct === 100 ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : c.position}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{c.title}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{c.description}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge>{t('chapter.lessonsDone', { done: c.completedLessons, total: c.lessonCount })}</Badge>
                    {c.quiz && (
                      <Badge tone={c.quiz.bestPercentage != null ? 'success' : 'neutral'} icon={ClipboardCheck}>
                        {c.quiz.bestPercentage != null ? t('chapter.bestScore', { pct: c.quiz.bestPercentage }) : t('chapter.quizNotTaken')}
                      </Badge>
                    )}
                  </div>
                </div>
                <ArrowRight className="hidden sm:block h-4 w-4 text-slate-400 group-hover:text-brand-600" />
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
};
