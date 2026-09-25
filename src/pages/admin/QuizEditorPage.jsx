import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useApi } from '../../hooks/useApi';
import { adminApi } from '../../services/api';
import { Badge, Button, Card, ErrorState, LoadingState, Modal, PageHeader } from '../../components/ui';
import { QuestionForm, QuizForm } from './ContentForms';

export const QuizEditorPage = () => {
  const { quizId } = useParams();
  const { t, showToast } = useApp();
  const { data, error, loading, reload } = useApi(() => adminApi.quiz(quizId), [quizId]);
  const [editor, setEditor] = useState(null);

  if (loading && !data) return <LoadingState rows={3} />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;

  const done = () => { setEditor(null); showToast(t('admin.saved'), 'success'); reload(); };
  const remove = async (q) => {
    if (!window.confirm(t('admin.confirmDelete', { name: q.prompt.slice(0, 40) }))) return;
    try {
      await adminApi.deleteQuestion(q.id);
      reload();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  return (
    <div className="max-w-4xl space-y-5">
      <PageHeader crumbs={[{ label: t('nav.content'), to: '/admin/content' }, { label: data.chapterTitle }]}
        title={data.title} subtitle={data.description}
        actions={<>
          <Button variant="outline" leftIcon={Pencil} onClick={() => setEditor({ type: 'quiz' })}>{t('common.edit')}</Button>
          <Button leftIcon={Plus} onClick={() => setEditor({ type: 'question' })}>{t('admin.addQuestion')}</Button>
        </>} />
      <div className="flex gap-2"><Badge>{t('quiz.questions', { count: data.questions.length })}</Badge><Badge>{t('lesson.minutes', { n: Math.round(data.timeLimitSeconds / 60) })}</Badge></div>

      <ol className="space-y-3">
        {data.questions.map((q, i) => (
          <li key={q.id}>
            <Card className="p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <span className="h-7 w-7 rounded-lg bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 text-sm font-semibold flex items-center justify-center shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{q.prompt}</p>
                  <ul className="mt-2 grid sm:grid-cols-2 gap-1.5">
                    {q.options.map((o, oi) => (
                      <li key={oi} className={`text-sm rounded-lg px-2.5 py-1.5 ${oi === q.correctIndex ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200' : 'bg-slate-50 dark:bg-slate-800/60'}`}>
                        {oi === q.correctIndex && <CheckCircle2 className="inline h-3.5 w-3.5 mr-1" />}{o}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2"><Badge>{q.topic}</Badge></div>
                </div>
                <Button variant="ghost" size="sm" aria-label={t('common.edit')} onClick={() => setEditor({ type: 'question', item: { ...q, quizId: data.id } })}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" aria-label={t('common.delete')} onClick={() => remove(q)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </Card>
          </li>
        ))}
      </ol>

      <Modal open={Boolean(editor)} title={editor?.type === 'quiz' ? t('admin.quiz') : t('admin.question')} onClose={() => setEditor(null)} size="lg">
        {editor?.type === 'quiz' && <QuizForm quiz={data} onDone={done} onCancel={() => setEditor(null)} />}
        {editor?.type === 'question' && (
          <QuestionForm question={editor.item} quizId={data.id} topics={data.chapterTopics} onDone={done} onCancel={() => setEditor(null)} />
        )}
      </Modal>
    </div>
  );
};
