import { useState } from 'react';
import { ClipboardList, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useApi } from '../../hooks/useApi';
import { teacherApi } from '../../services/api';
import { Badge, Button, Card, EmptyState, ErrorState, LoadingState, PageHeader, Progress } from '../../components/ui';
import { AssignmentModal } from './AssignmentModal';

export const AssignmentsPage = () => {
  const { t, showToast } = useApp();
  const { data, error, loading, reload } = useApi(() => teacherApi.assignments(), []);
  const [open, setOpen] = useState(false);

  const remove = async (id) => {
    if (!window.confirm(t('assignments.confirmDelete'))) return;
    try {
      await teacherApi.deleteAssignment(id);
      showToast(t('assignments.deleted'), 'info');
      reload();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  if (loading && !data) return <LoadingState rows={2} />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="space-y-5">
      <PageHeader title={t('assignments.title')} subtitle={t('assignments.subtitle')}
        actions={<Button leftIcon={Plus} onClick={() => setOpen(true)}>{t('assignments.new')}</Button>} />

      {data.length === 0 ? (
        <EmptyState icon={ClipboardList} title={t('assignments.none')} description={t('assignments.noneHint')} />
      ) : (
        <ul className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {data.map((a) => (
            <li key={a.id}>
              <Card className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{a.title}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{a.lessonTitle ?? a.quizTitle}</p>
                  </div>
                  <Button variant="ghost" size="sm" aria-label={t('common.delete')} onClick={() => remove(a.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone={a.lessonId ? 'brand' : 'xp'}>{t(`assignments.kind.${a.lessonId ? 'lesson' : 'quiz'}`)}</Badge>
                  <Badge>{a.studentName ?? t('assignments.wholeClass')}</Badge>
                  {a.dueDate && <Badge tone="warn">{t('assignments.due', { date: new Date(a.dueDate).toLocaleDateString() })}</Badge>}
                </div>
                {a.note && <p className="text-sm text-slate-600 dark:text-slate-300">{a.note}</p>}
                <div>
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                    <span>{t('assignments.completion')}</span><span className="tabular-nums">{a.completedCount}/{a.targetCount}</span>
                  </div>
                  <Progress value={a.completedCount} max={Math.max(1, a.targetCount)} tone="success" size="sm" />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
      <AssignmentModal open={open} onClose={() => setOpen(false)} onCreated={() => { setOpen(false); reload(); }} />
    </div>
  );
};
