import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useApi } from '../../hooks/useApi';
import { teacherApi } from '../../services/api';
import { Button, Field, FormError, Modal } from '../../components/ui';

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Create an assignment: pick subject → chapter → lesson or chapter quiz, a target
 * (whole class or one student), due date and note. `initial` can pre-select a lesson/student.
 */
const AssignmentForm = ({ initial, onClose, onCreated }) => {
  const { t, showToast } = useApp();
  const [form, setForm] = useState({
    title: initial?.title ?? '', note: '', dueDate: '', studentId: initial?.studentId ?? '',
    kind: 'lesson', subjectId: '', chapterId: '', lessonId: '', presetLessonId: initial?.lessonId ?? null,
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  const subjects = useApi(() => teacherApi.subjects(), []);
  const subject = useApi(() => (form.subjectId ? teacherApi.subject(form.subjectId) : Promise.resolve(null)), [form.subjectId]);
  const chapter = useApi(() => (form.chapterId ? teacherApi.chapter(form.chapterId) : Promise.resolve(null)), [form.chapterId]);
  const students = useApi(() => teacherApi.students(), []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const lessonId = form.presetLessonId ?? (form.kind === 'lesson' ? form.lessonId : null);
  const quizId = !form.presetLessonId && form.kind === 'quiz' ? chapter.data?.quiz?.id : null;

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.title.trim()) next.title = t('validation.titleRequired');
    if (!lessonId && !quizId) next.target = t('assignments.pickContent');
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    setFormError(null);
    try {
      const created = await teacherApi.createAssignment({
        title: form.title.trim(), note: form.note.trim() || null, dueDate: form.dueDate || null,
        lessonId: lessonId ? Number(lessonId) : null, quizId: quizId ?? null,
        studentId: form.studentId ? Number(form.studentId) : null,
      });
      showToast(t('assignments.created'), 'success');
      onCreated?.(created);
    } catch (err) {
      setFormError(err.message);
      setErrors(err.fieldErrors ?? {});
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate id="assignment-form">
      <FormError message={formError} />
      <Field label={t('assignments.titleLabel')} value={form.title} onChange={set('title')} error={errors.title} maxLength={160} />

      {form.presetLessonId ? (
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 px-3 py-2.5 text-sm flex items-center justify-between gap-2">
          <span>{t('assignments.presetLesson')}</span>
          <button type="button" className="text-xs font-medium text-brand-600 hover:underline" onClick={() => setForm((f) => ({ ...f, presetLessonId: null }))}>
            {t('common.change')}
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t('assignments.type')}>
            {['lesson', 'quiz'].map((k) => (
              <button type="button" key={k} role="radio" aria-checked={form.kind === k} onClick={() => setForm((f) => ({ ...f, kind: k }))}
                className={`h-10 rounded-xl border text-sm font-medium ${form.kind === k ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-200' : 'border-slate-200 dark:border-slate-700'}`}>
                {t(`assignments.kind.${k}`)}
              </button>
            ))}
          </div>
          <Field as="select" label={t('nav.subjects')} value={form.subjectId}
            onChange={(e) => setForm((f) => ({ ...f, subjectId: e.target.value, chapterId: '', lessonId: '' }))}>
            <option value="">{t('common.select')}</option>
            {(subjects.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Field>
          {form.subjectId && (
            <Field as="select" label={t('assignments.chapter')} value={form.chapterId}
              onChange={(e) => setForm((f) => ({ ...f, chapterId: e.target.value, lessonId: '' }))}>
              <option value="">{t('common.select')}</option>
              {(subject.data?.chapters ?? []).map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </Field>
          )}
          {form.chapterId && form.kind === 'lesson' && (
            <Field as="select" label={t('assignments.lesson')} value={form.lessonId} onChange={set('lessonId')}>
              <option value="">{t('common.select')}</option>
              {(chapter.data?.lessons ?? []).map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
            </Field>
          )}
          {form.chapterId && form.kind === 'quiz' && chapter.data && (
            <p className="text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 px-3 py-2.5">{chapter.data.quiz?.title ?? t('assignments.noQuiz')}</p>
          )}
          {errors.target && <p className="text-xs text-red-600">{errors.target}</p>}
        </>
      )}

      <Field as="select" label={t('assignments.assignTo')} value={form.studentId} onChange={set('studentId')}>
        <option value="">{t('assignments.wholeClass')}</option>
        {(students.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </Field>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field type="date" label={t('assignments.dueDate')} min={today()} value={form.dueDate} onChange={set('dueDate')} error={errors.dueDate} />
      </div>
      <Field as="textarea" label={t('assignments.note')} value={form.note} onChange={set('note')} maxLength={500} />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
        <Button type="submit" loading={saving}>{t('assignments.assign')}</Button>
      </div>
    </form>
  );
};

export const AssignmentModal = ({ open, initial, onClose, onCreated }) => {
  const { t } = useApp();
  return (
    <Modal open={open} title={t('assignments.new')} onClose={onClose}>
      {open && <AssignmentForm initial={initial} onClose={onClose} onCreated={onCreated} />}
    </Modal>
  );
};
