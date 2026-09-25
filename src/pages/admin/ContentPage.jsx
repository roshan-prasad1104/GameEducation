import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ClipboardCheck, FileText, Pencil, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useApi } from '../../hooks/useApi';
import { adminApi } from '../../services/api';
import { Badge, Button, Card, ErrorState, LoadingState, Modal, PageHeader, NamedIcon } from '../../components/ui';
import { cn } from '../../lib/cn';
import { ChapterForm, LessonForm, QuizForm, SubjectForm } from './ContentForms';

/** Curriculum tree: subjects → chapters → lessons + quiz, with add / edit / delete. */
export const ContentPage = () => {
  const { t, showToast } = useApp();
  const { data, error, loading, reload } = useApi(() => adminApi.content(), []);
  const [openSubject, setOpenSubject] = useState(null);
  const [editor, setEditor] = useState(null);

  const done = () => { setEditor(null); showToast(t('admin.saved'), 'success'); reload(); };
  const del = async (label, fn) => {
    if (!window.confirm(t('admin.confirmDelete', { name: label }))) return;
    try {
      await fn();
      showToast(t('admin.deleted'), 'info');
      reload();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  if (loading && !data) return <LoadingState rows={3} />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;

  const titles = {
    subject: t('admin.subject'), chapter: t('admin.chapter'), lesson: t('admin.lesson'), quiz: t('admin.quiz'),
  };

  return (
    <div className="space-y-5">
      <PageHeader title={t('admin.contentTitle')} subtitle={t('admin.contentSubtitle')}
        actions={<Button leftIcon={Plus} onClick={() => setEditor({ type: 'subject' })}>{t('admin.addSubject')}</Button>} />

      <ul className="space-y-3">
        {data.map((s) => {
          const open = openSubject === s.id;
          const lessonCount = s.chapters.reduce((n, c) => n + c.lessons.length, 0);
          return (
            <li key={s.id}>
              <Card className="overflow-hidden">
                <div className="p-4 flex items-center gap-3">
                  <button onClick={() => setOpenSubject(open ? null : s.id)} aria-expanded={open} className="flex-1 min-w-0 flex items-center gap-3 text-left">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: s.color }}><NamedIcon name={s.icon} className="h-5 w-5" /></div>
                    <div className="min-w-0">
                      <p className="font-semibold">{s.name} <span className="text-xs font-normal text-slate-500">({s.code})</span></p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{t('subjects.counts', { chapters: s.chapters.length, lessons: lessonCount })}</p>
                    </div>
                    <ChevronDown className={cn('ml-auto h-4 w-4 text-slate-400 transition', open && 'rotate-180')} />
                  </button>
                  <Button variant="ghost" size="sm" aria-label={t('common.edit')} onClick={() => setEditor({ type: 'subject', item: s })}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" aria-label={t('common.delete')} onClick={() => del(s.name, () => adminApi.deleteSubject(s.id))}><Trash2 className="h-4 w-4" /></Button>
                </div>

                {open && (
                  <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-4 space-y-3">
                    {s.chapters.map((c) => (
                      <div key={c.id} className="card p-4 space-y-3">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{c.position}. {c.title}</p>
                            {c.description && <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{c.description}</p>}
                          </div>
                          <Button variant="ghost" size="xs" aria-label={t('common.edit')} onClick={() => setEditor({ type: 'chapter', item: { ...c, subjectId: s.id } })}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="xs" aria-label={t('common.delete')} onClick={() => del(c.title, () => adminApi.deleteChapter(c.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                        <ul className="space-y-1.5">
                          {c.lessons.map((l) => (
                            <li key={l.id} className="flex items-center gap-2 text-sm rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                              <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                              <span className="flex-1 min-w-0 truncate">{l.title}</span>
                              <Badge className="hidden sm:inline-flex">{l.topic}</Badge>
                              <Button variant="ghost" size="xs" aria-label={t('common.edit')} onClick={() => setEditor({ type: 'lesson', item: l })}><Pencil className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="xs" aria-label={t('common.delete')} onClick={() => del(l.title, () => adminApi.deleteLesson(l.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
                            </li>
                          ))}
                          {c.quizzes.map((q) => (
                            <li key={q.id} className="flex items-center gap-2 text-sm rounded-lg px-2 py-1.5 bg-amber-50/60 dark:bg-amber-950/20">
                              <ClipboardCheck className="h-4 w-4 text-amber-600 shrink-0" />
                              <Link to={`/admin/quizzes/${q.id}`} className="flex-1 min-w-0 truncate font-medium hover:text-brand-600">{q.title}</Link>
                              <Badge tone="xp">{t('quiz.questions', { count: q.questionCount })}</Badge>
                              <Button variant="ghost" size="xs" aria-label={t('common.delete')} onClick={() => del(q.title, () => adminApi.deleteQuiz(q.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
                            </li>
                          ))}
                        </ul>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="xs" leftIcon={Plus} onClick={() => setEditor({ type: 'lesson', parentId: c.id })}>{t('admin.addLesson')}</Button>
                          {c.quizzes.length === 0 && (
                            <Button variant="outline" size="xs" leftIcon={Plus} onClick={() => setEditor({ type: 'quiz', parentId: c.id })}>{t('admin.addQuiz')}</Button>
                          )}
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" leftIcon={Plus} onClick={() => setEditor({ type: 'chapter', parentId: s.id })}>{t('admin.addChapter')}</Button>
                  </div>
                )}
              </Card>
            </li>
          );
        })}
      </ul>

      <Modal open={Boolean(editor)} size={editor?.type === 'lesson' ? 'lg' : 'md'}
        title={editor ? `${editor.item ? t('common.edit') : t('admin.add')} · ${titles[editor.type]}` : ''} onClose={() => setEditor(null)}>
        {editor?.type === 'subject' && <SubjectForm subject={editor.item} onDone={done} onCancel={() => setEditor(null)} />}
        {editor?.type === 'chapter' && <ChapterForm chapter={editor.item} subjectId={editor.parentId} onDone={done} onCancel={() => setEditor(null)} />}
        {editor?.type === 'lesson' && <LessonForm lessonId={editor.item?.id} chapterId={editor.parentId} onDone={done} onCancel={() => setEditor(null)} />}
        {editor?.type === 'quiz' && <QuizForm chapterId={editor.parentId} onDone={done} onCancel={() => setEditor(null)} />}
      </Modal>
    </div>
  );
};
