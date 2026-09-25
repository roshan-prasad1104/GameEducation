import { useState } from 'react';
import { CheckCircle2, TriangleAlert } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useApi } from '../../hooks/useApi';
import { teacherApi } from '../../services/api';
import { BarChart, Badge, Button, Card, EmptyState, ErrorState, LoadingState, PageHeader } from '../../components/ui';
import { AssignmentModal } from './AssignmentModal';

export const WeakTopicsPage = () => {
  const { t } = useApp();
  const { data, error, loading, reload } = useApi(() => teacherApi.weakTopics(), []);
  const [assign, setAssign] = useState(null);

  if (loading && !data) return <LoadingState rows={2} />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="space-y-5">
      <PageHeader title={t('teacher.weakTopicsTitle')} subtitle={t('teacher.weakTopicsSubtitle')} />
      {data.length === 0 ? (
        <EmptyState icon={CheckCircle2} title={t('teacher.noWeakTopics')} />
      ) : (
        <>
          <Card className="p-5">
            <BarChart horizontal labels={data.map((w) => w.topicName)}
              series={[{ label: t('teacher.accuracy'), data: data.map((w) => w.accuracy) }]}
              valueSuffix="%" max={100} height={Math.max(200, data.length * 36)} ariaLabel={t('teacher.weakTopicsTitle')} />
          </Card>
          <ul className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {data.map((w) => (
              <li key={w.topic}>
                <Card className="p-5 flex items-start gap-4">
                  <TriangleAlert className={`h-5 w-5 shrink-0 mt-0.5 ${w.accuracy < 50 ? 'text-red-500' : 'text-amber-500'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold">{w.topicName}</p>
                      <Badge tone={w.accuracy < 50 ? 'danger' : 'warn'}>{w.accuracy}%</Badge>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{w.subjectName}</p>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      {t('teacher.topicStats', { correct: w.correct, answered: w.answered, count: w.studentsStruggling })}
                    </p>
                    {w.lessonId && (
                      <Button size="sm" variant="outline" className="mt-3"
                        onClick={() => setAssign({ lessonId: w.lessonId, title: `${t('assignments.revise')}: ${w.lessonTitle}` })}>
                        {t('teacher.assignRevision')}
                      </Button>
                    )}
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
      <AssignmentModal open={Boolean(assign)} initial={assign} onClose={() => setAssign(null)} onCreated={() => setAssign(null)} />
    </div>
  );
};
