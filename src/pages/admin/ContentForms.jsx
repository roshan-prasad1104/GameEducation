import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useApi } from '../../hooks/useApi';
import { adminApi } from '../../services/api';
import { Button, Field, FormError, LoadingState } from '../../components/ui';

/** Shared submit handling for the small admin forms. */
const useSubmit = (onDone) => {
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const run = async (fn, localErrors = {}) => {
    setErrors(localErrors);
    if (Object.keys(localErrors).length) return;
    setSaving(true);
    setFormError(null);
    try {
      await fn();
      onDone();
    } catch (e) {
      setFormError(e.message);
      setErrors(e.fieldErrors ?? {});
    } finally {
      setSaving(false);
    }
  };
  return { errors, formError, saving, run };
};

const Actions = ({ saving, onCancel }) => {
  const { t } = useApp();
  return (
    <div className="flex justify-end gap-2 pt-2">
      <Button type="button" variant="ghost" onClick={onCancel}>{t('common.cancel')}</Button>
      <Button type="submit" loading={saving}>{t('common.save')}</Button>
    </div>
  );
};

export const SubjectForm = ({ subject, onDone, onCancel }) => {
  const { t } = useApp();
  const [f, setF] = useState({
    code: subject?.code ?? '', name: subject?.name ?? '', description: subject?.description ?? '',
    color: subject?.color ?? '#6366f1', icon: subject?.icon ?? 'book', gradeLevel: subject?.gradeLevel ?? 8,
  });
  const { errors, formError, saving, run } = useSubmit(onDone);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = (e) => {
    e.preventDefault();
    const local = {};
    if (!/^[a-z0-9-]+$/.test(f.code)) local.code = t('admin.codeHint');
    if (!f.name.trim()) local.name = t('validation.nameRequired');
    const body = { ...f, gradeLevel: Number(f.gradeLevel) };
    run(() => (subject ? adminApi.updateSubject(subject.id, body) : adminApi.createSubject(body)), local);
  };
  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <FormError message={formError} />
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label={t('admin.code')} value={f.code} onChange={set('code')} error={errors.code} hint={t('admin.codeHint')} />
        <Field label={t('auth.name')} value={f.name} onChange={set('name')} error={errors.name} />
      </div>
      <Field as="textarea" label={t('admin.description')} value={f.description} onChange={set('description')} maxLength={500} />
      <div className="grid grid-cols-3 gap-4">
        <Field label={t('admin.color')} type="color" value={f.color} onChange={set('color')} error={errors.color} className="[&_input]:h-11 [&_input]:p-1" />
        <Field as="select" label={t('admin.icon')} value={f.icon} onChange={set('icon')}>
          {['calculator', 'atom', 'flask', 'leaf', 'cpu', 'book'].map((i) => <option key={i} value={i}>{i}</option>)}
        </Field>
        <Field as="select" label={t('onboarding.grade')} value={f.gradeLevel} onChange={set('gradeLevel')}>
          {[6, 7, 8, 9, 10, 11, 12].map((g) => <option key={g} value={g}>{g}</option>)}
        </Field>
      </div>
      <Actions saving={saving} onCancel={onCancel} />
    </form>
  );
};

export const ChapterForm = ({ chapter, subjectId, onDone, onCancel }) => {
  const { t } = useApp();
  const [f, setF] = useState({ title: chapter?.title ?? '', description: chapter?.description ?? '', position: chapter?.position ?? '' });
  const { errors, formError, saving, run } = useSubmit(onDone);
  const submit = (e) => {
    e.preventDefault();
    const body = { subjectId: chapter?.subjectId ?? subjectId, title: f.title, description: f.description, position: f.position ? Number(f.position) : null };
    run(() => (chapter ? adminApi.updateChapter(chapter.id, body) : adminApi.createChapter(body)),
      f.title.trim() ? {} : { title: t('validation.titleRequired') });
  };
  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <FormError message={formError} />
      <Field label={t('admin.titleField')} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} error={errors.title} />
      <Field as="textarea" label={t('admin.description')} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} maxLength={500} />
      <Field type="number" min={1} label={t('admin.position')} value={f.position} onChange={(e) => setF({ ...f, position: e.target.value })} />
      <Actions saving={saving} onCancel={onCancel} />
    </form>
  );
};

const LessonFields = ({ lesson, chapterId, onDone, onCancel }) => {
  const { t } = useApp();
  const [f, setF] = useState({
    title: lesson?.title ?? '', topic: lesson?.topic ?? '', summary: lesson?.summary ?? '', content: lesson?.content ?? '',
    videoUrl: lesson?.videoUrl ?? '', durationMinutes: lesson?.durationMinutes ?? 10, position: lesson?.position ?? '',
  });
  const { errors, formError, saving, run } = useSubmit(onDone);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = (e) => {
    e.preventDefault();
    const local = {};
    if (!f.title.trim()) local.title = t('validation.titleRequired');
    if (!/^[a-z0-9-]+$/.test(f.topic)) local.topic = t('admin.topicHint');
    if (!f.content.trim()) local.content = t('admin.contentRequired');
    const body = { ...f, chapterId: lesson?.chapterId ?? chapterId, durationMinutes: Number(f.durationMinutes), position: f.position ? Number(f.position) : null };
    run(() => (lesson ? adminApi.updateLesson(lesson.id, body) : adminApi.createLesson(body)), local);
  };
  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <FormError message={formError} />
      <Field label={t('admin.titleField')} value={f.title} onChange={set('title')} error={errors.title} />
      <div className="grid sm:grid-cols-3 gap-4">
        <Field label={t('admin.topic')} value={f.topic} onChange={set('topic')} error={errors.topic} hint={t('admin.topicHint')} className="sm:col-span-2" />
        <Field type="number" min={1} max={180} label={t('admin.minutes')} value={f.durationMinutes} onChange={set('durationMinutes')} />
      </div>
      <Field label={t('admin.summary')} value={f.summary} onChange={set('summary')} maxLength={500} />
      <Field as="textarea" label={t('admin.contentField')} value={f.content} onChange={set('content')} error={errors.content}
        hint={t('admin.markdownHint')} rows={12} maxLength={20000} />
      <Field label={t('admin.videoUrl')} value={f.videoUrl} onChange={set('videoUrl')} placeholder="https://www.youtube.com/embed/…" />
      <Actions saving={saving} onCancel={onCancel} />
    </form>
  );
};

/** Loads the full lesson (content is not part of the tree) before editing. */
export const LessonForm = ({ lessonId, chapterId, onDone, onCancel }) => {
  const { data, loading } = useApi(() => (lessonId ? adminApi.lesson(lessonId) : Promise.resolve(null)), [lessonId]);
  if (lessonId && loading) return <LoadingState rows={1} />;
  return <LessonFields lesson={data} chapterId={chapterId} onDone={onDone} onCancel={onCancel} />;
};

export const QuizForm = ({ quiz, chapterId, onDone, onCancel }) => {
  const { t } = useApp();
  const [f, setF] = useState({ title: quiz?.title ?? '', description: quiz?.description ?? '', timeLimitSeconds: quiz?.timeLimitSeconds ?? 300 });
  const { errors, formError, saving, run } = useSubmit(onDone);
  const submit = (e) => {
    e.preventDefault();
    const body = { chapterId: quiz?.chapterId ?? chapterId, ...f, timeLimitSeconds: Number(f.timeLimitSeconds) };
    run(() => (quiz ? adminApi.updateQuiz(quiz.id, body) : adminApi.createQuiz(body)),
      f.title.trim() ? {} : { title: t('validation.titleRequired') });
  };
  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <FormError message={formError} />
      <Field label={t('admin.titleField')} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} error={errors.title} />
      <Field as="textarea" label={t('admin.description')} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} maxLength={500} />
      <Field type="number" min={30} max={7200} label={t('admin.timeLimit')} value={f.timeLimitSeconds}
        onChange={(e) => setF({ ...f, timeLimitSeconds: e.target.value })} error={errors.timeLimitSeconds} />
      <Actions saving={saving} onCancel={onCancel} />
    </form>
  );
};

export const QuestionForm = ({ question, quizId, topics, onDone, onCancel }) => {
  const { t } = useApp();
  const [f, setF] = useState({
    prompt: question?.prompt ?? '', options: question?.options ?? ['', '', '', ''],
    correctIndex: question?.correctIndex ?? 0, explanation: question?.explanation ?? '', topic: question?.topic ?? topics[0] ?? '',
  });
  const { errors, formError, saving, run } = useSubmit(onDone);
  const setOption = (i, v) => setF({ ...f, options: f.options.map((o, j) => (j === i ? v : o)) });
  const submit = (e) => {
    e.preventDefault();
    const options = f.options.map((o) => o.trim()).filter(Boolean);
    const local = {};
    if (!f.prompt.trim()) local.prompt = t('admin.promptRequired');
    if (options.length < 2) local.options = t('admin.optionsRequired');
    if (!f.options[f.correctIndex]?.trim()) local.options = t('admin.correctRequired');
    if (!f.topic) local.topic = t('admin.topicHint');
    const correctIndex = options.indexOf(f.options[f.correctIndex]?.trim());
    const body = { quizId: question?.quizId ?? quizId, prompt: f.prompt, options, correctIndex, explanation: f.explanation, topic: f.topic };
    run(() => (question ? adminApi.updateQuestion(question.id, body) : adminApi.createQuestion(body)), local);
  };
  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <FormError message={formError} />
      <Field as="textarea" label={t('admin.prompt')} value={f.prompt} onChange={(e) => setF({ ...f, prompt: e.target.value })} error={errors.prompt} rows={3} />
      <fieldset className="space-y-2">
        <legend className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">{t('admin.optionsLegend')}</legend>
        {f.options.map((o, i) => (
          <div key={i} className="flex items-center gap-2">
            <input type="radio" name="correct" checked={f.correctIndex === i} onChange={() => setF({ ...f, correctIndex: i })}
              aria-label={t('admin.markCorrect', { n: i + 1 })} className="h-4 w-4 accent-emerald-600" />
            <input value={o} onChange={(e) => setOption(i, e.target.value)} placeholder={t('admin.optionN', { n: i + 1 })}
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" />
          </div>
        ))}
        {errors.options && <p className="text-xs text-red-600">{errors.options}</p>}
        <p className="text-xs text-slate-500">{t('admin.optionsHint')}</p>
      </fieldset>
      <Field as="select" label={t('admin.topic')} value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })} error={errors.topic}>
        {topics.map((tp) => <option key={tp} value={tp}>{tp}</option>)}
      </Field>
      <Field as="textarea" label={t('admin.explanation')} value={f.explanation} onChange={(e) => setF({ ...f, explanation: e.target.value })} rows={2} />
      <Actions saving={saving} onCancel={onCancel} />
    </form>
  );
};
