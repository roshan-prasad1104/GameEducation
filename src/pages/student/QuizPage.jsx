import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock, CloudOff, Send } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useApi } from '../../hooks/useApi';
import { catalogApi, learningApi } from '../../services/api';
import { Badge, Button, Card, ErrorState, LoadingState, Modal, PageHeader } from '../../components/ui';
import { cn } from '../../lib/cn';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

/** Timer that calls onExpire once when it reaches zero. */
const useCountdown = (seconds, onExpire) => {
  const [left, setLeft] = useState(seconds);
  const expired = useRef(false);
  useEffect(() => {
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (left === 0 && !expired.current) {
      expired.current = true;
      onExpire();
    }
  }, [left, onExpire]);
  return left;
};

const QuizRunner = ({ quiz }) => {
  const { t, showToast, refreshPending } = useApp();
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const startedAt = useRef(0);
  const submitted = useRef(false);

  useEffect(() => { startedAt.current = Date.now(); }, []);

  const submit = useCallback(async () => {
    if (submitted.current) return;
    submitted.current = true;
    setSubmitting(true);
    setConfirmOpen(false);
    const payload = quiz.questions.map((q) => ({ questionId: q.id, selectedIndex: answers[q.id] ?? null }));
    const seconds = Math.round((Date.now() - startedAt.current) / 1000);
    try {
      const res = await learningApi.submitQuiz(quiz.id, payload, seconds);
      if (res.queued) {
        refreshPending();
        navigate(`/student/results/pending/${res.clientAttemptId}`, { replace: true, state: { quizTitle: quiz.title, chapterId: quiz.chapter.id } });
      } else {
        navigate(`/student/results/${res.attemptId}`, { replace: true, state: { result: res } });
      }
    } catch (e) {
      submitted.current = false;
      setSubmitting(false);
      showToast(e.message, 'error');
    }
  }, [answers, quiz, navigate, refreshPending, showToast]);

  const onExpire = useCallback(() => {
    showToast(t('quiz.timeUp'), 'warn');
    submit();
  }, [submit, showToast, t]);
  const left = useCountdown(quiz.timeLimitSeconds, onExpire);

  const q = quiz.questions[index];
  const answeredCount = Object.keys(answers).length;
  const unanswered = quiz.questions.length - answeredCount;
  const isLast = index === quiz.questions.length - 1;
  const mm = String(Math.floor(left / 60)).padStart(1, '0');
  const ss = String(left % 60).padStart(2, '0');

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <PageHeader
        crumbs={[{ label: quiz.subject.name, to: `/student/subjects/${quiz.subject.id}` }, { label: quiz.chapter.title, to: `/student/chapters/${quiz.chapter.id}` }]}
        title={quiz.title}
        actions={
          <div className={cn('inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold tabular-nums border',
            left < 30 ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300'
              : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200')}
            role="timer" aria-label={t('quiz.timeLeft')}>
            <Clock className="h-4 w-4" />{mm}:{ss}
          </div>
        }
      />
      {quiz.__offline && (
        <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl px-3 py-2">
          <CloudOff className="h-4 w-4" /> {t('offline.quizOffline')}
        </div>
      )}

      {/* Question navigator */}
      <nav aria-label={t('quiz.navigator')} className="flex flex-wrap gap-2">
        {quiz.questions.map((qq, i) => (
          <button key={qq.id} onClick={() => setIndex(i)} aria-current={i === index ? 'step' : undefined}
            aria-label={t('quiz.questionOf', { n: i + 1, total: quiz.questions.length })}
            className={cn('h-9 w-9 rounded-lg text-sm font-semibold border transition',
              i === index ? 'border-brand-500 bg-brand-600 text-white'
                : answers[qq.id] != null ? 'border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-300'
                  : 'border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400')}>
            {i + 1}
          </button>
        ))}
      </nav>

      <Card className="p-5 sm:p-7 space-y-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-300">
            {t('quiz.questionOf', { n: index + 1, total: quiz.questions.length })}
          </p>
          <Badge>{t('quiz.answered', { n: answeredCount, total: quiz.questions.length })}</Badge>
        </div>
        <h2 className="text-lg sm:text-xl font-semibold leading-snug">{q.prompt}</h2>
        <div role="radiogroup" aria-label={q.prompt} className="grid gap-2.5">
          {q.options.map((opt, i) => {
            const selected = answers[q.id] === i;
            return (
              <button key={i} role="radio" aria-checked={selected}
                onClick={() => setAnswers((a) => ({ ...a, [q.id]: i }))}
                className={cn('w-full text-left flex items-center gap-3 rounded-xl border px-4 py-3.5 transition',
                  selected ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20 dark:bg-brand-950/40'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/60')}>
                <span className={cn('h-8 w-8 rounded-lg flex items-center justify-center text-sm font-semibold shrink-0',
                  selected ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300')}>
                  {LETTERS[i]}
                </span>
                <span className="text-sm sm:text-base">{opt}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button variant="ghost" leftIcon={ArrowLeft} disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>{t('quiz.previous')}</Button>
          {isLast ? (
            <Button leftIcon={Send} loading={submitting} onClick={() => (unanswered > 0 ? setConfirmOpen(true) : submit())}>{t('quiz.submit')}</Button>
          ) : (
            <Button rightIcon={ArrowRight} onClick={() => setIndex((i) => i + 1)}>{t('quiz.next')}</Button>
          )}
        </div>
      </Card>

      <Modal open={confirmOpen} title={t('quiz.confirmTitle')} onClose={() => setConfirmOpen(false)}
        footer={<>
          <Button variant="ghost" onClick={() => setConfirmOpen(false)}>{t('quiz.keepGoing')}</Button>
          <Button onClick={submit} loading={submitting}>{t('quiz.submitAnyway')}</Button>
        </>}>
        <p className="text-sm text-slate-600 dark:text-slate-300">{t('quiz.confirmBody', { count: unanswered })}</p>
      </Modal>
    </div>
  );
};

export const QuizPage = () => {
  const { quizId } = useParams();
  const { t } = useApp();
  const { data, error, loading, reload } = useApi(() => catalogApi.quiz(quizId), [quizId]);
  if (loading && !data) return <LoadingState rows={2} />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;
  if (!data.questions?.length) return <ErrorState error={{ message: t('quiz.noQuestions') }} />;
  return <QuizRunner key={data.id} quiz={data} />;
};
