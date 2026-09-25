import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useApi } from '../../hooks/useApi';
import { catalogApi, learningApi } from '../../services/api';
import { ErrorState, LoadingState } from '../ui';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Zap,
  CloudOff,
  Loader2
} from 'lucide-react';

const POINTS = 10;

/* ─────────────────────────────────────────────
   MCQ / True-False renderer
───────────────────────────────────────────── */

const OptionGrid = ({ question, answer, feedback, submitted, onSelect }) => {
  const options = question.options ?? [];
  const correctIndex = feedback?.correctIndex;
  return (
    <div className="space-y-3" role="radiogroup" aria-label={question.prompt}>
      {options.map((opt, idx) => {
        const isSelected = answer?.selectedIndex === idx;
        const correct = correctIndex !== undefined && idx === correctIndex;
        let cls = 'w-full text-left p-4 rounded-2xl border text-sm font-semibold flex items-center justify-between transition-all duration-150 ';
        if (submitted && feedback) {
          if (correct) cls += 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-sm';
          else if (isSelected) cls += 'bg-rose-50 dark:bg-rose-950/60 border-rose-400 text-rose-900 dark:text-rose-200';
          else cls += 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 opacity-60';
        } else if (isSelected) {
          cls += 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-900 dark:text-indigo-200 shadow-sm';
        } else {
          cls += 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20';
        }
        return (
          <button key={idx} role="radio" aria-checked={isSelected} onClick={() => !submitted && onSelect(idx)} className={cls} disabled={submitted}>
            <div className="flex items-center gap-3">
              <span className={`w-7 h-7 rounded-xl text-xs flex items-center justify-center font-bold shrink-0 ${
                submitted && feedback && correct ? 'bg-emerald-500 text-white'
                : submitted && feedback && isSelected ? 'bg-rose-500 text-white'
                : isSelected ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                {String.fromCharCode(65 + idx)}
              </span>
              <span>{opt}</span>
            </div>
            {submitted && feedback && correct && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
            {submitted && feedback && isSelected && !correct && <XCircle className="w-5 h-5 text-rose-500 shrink-0" />}
          </button>
        );
      })}
    </div>
  );
};

/* ─────────────────────────────────────────────
   Quiz runner
───────────────────────────────────────────── */

/** Locked answers from a resumed session, by question id. */
const lockedById = (session) => new Map((session?.answers ?? []).map((a) => [a.questionId, a]));

const QuizRunner = ({ quiz, session }) => {
  const { online, showToast, refreshPending, t } = useApp();
  const navigate = useNavigate();
  const questionList = quiz.questions;

  // A resumed session restores the answers the student already confirmed; those cannot change.
  const firstOpen = (() => {
    const locked = lockedById(session);
    const idx = questionList.findIndex((q) => !locked.has(q.id));
    return idx === -1 ? questionList.length - 1 : idx;
  })();
  const [currentIndex, setCurrentIndex] = useState(firstOpen);
  const [answers, setAnswers] = useState(() => {
    const locked = lockedById(session);
    return questionList.map((q) => (locked.has(q.id) ? { selectedIndex: locked.get(q.id).selectedIndex } : {}));
  });
  const [feedback, setFeedback] = useState(() => {
    const locked = lockedById(session);
    return questionList.map((q) => locked.get(q.id) ?? null);
  });
  const [submitted, setSubmitted] = useState(() => lockedById(session).has(questionList[firstOpen]?.id));
  const [checking, setChecking] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(quiz.timeLimitSeconds ?? 300);

  const answersRef = useRef(answers);
  const startedAt = useRef(0);
  const hasFinishedRef = useRef(false);
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { startedAt.current = Date.now(); }, []);
  useEffect(() => {
    if (session?.answers?.length) showToast(t('quiz.resuming'), 'info');
  }, [session, showToast, t]);

  const currentQ = questionList[currentIndex];

  /* ─── Finish quiz: server grades the whole attempt ─── */
  const handleFinish = useCallback(async () => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    setFinishing(true);
    const payload = questionList.map((q, i) => ({ questionId: q.id, selectedIndex: answersRef.current[i]?.selectedIndex ?? null }));
    const seconds = Math.round((Date.now() - startedAt.current) / 1000);
    try {
      const res = await learningApi.submitQuiz(quiz.id, payload, seconds);
      if (res.queued) {
        refreshPending();
        navigate(`/student/results/pending/${res.clientAttemptId}`, { replace: true, state: { quizTitle: quiz.title } });
      } else {
        navigate(`/student/results/${res.attemptId}`, { replace: true, state: { result: res } });
      }
    } catch (e) {
      hasFinishedRef.current = false;
      setFinishing(false);
      showToast(e.message, 'error');
    }
  }, [questionList, quiz, navigate, refreshPending, showToast]);

  // Tick-only timer
  useEffect(() => {
    const id = setInterval(() => setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);

  // When time runs out, submit what has been answered.
  useEffect(() => {
    if (timeLeft === 0 && !hasFinishedRef.current) {
      showToast(`⏰ ${t('quiz.timeUp')}`, 'info');
      handleFinish();
    }
  }, [timeLeft, handleFinish, showToast, t]);

  /* ─── Answer management ─── */

  const updateAnswer = (partial) => {
    setAnswers((prev) => {
      const copy = [...prev];
      copy[currentIndex] = { ...copy[currentIndex], ...partial };
      return copy;
    });
  };

  const isAnswerable = () => answers[currentIndex]?.selectedIndex !== undefined;

  const handleSubmit = async () => {
    if (!isAnswerable()) return;
    setSubmitted(true);
    if (!online) return; // offline: no instant feedback, scored after sync
    setChecking(true);
    const index = currentIndex;
    const lock = () => learningApi.lockAnswer(quiz.id, currentQ.id, answers[index].selectedIndex);
    try {
      let res;
      try {
        res = await lock();
      } catch (e) {
        // The quiz was opened offline, so no session exists yet: start one and retry once.
        if (e.code !== 'NO_ACTIVE_SESSION') throw e;
        await learningApi.startQuizSession(quiz.id);
        res = await lock();
      }
      // The server keeps the first answer given for a question; show that one.
      setAnswers((prev) => {
        const copy = [...prev];
        copy[index] = { ...copy[index], selectedIndex: res.selectedIndex };
        return copy;
      });
      setFeedback((prev) => {
        const copy = [...prev];
        copy[index] = res;
        return copy;
      });
    } catch (e) {
      // Network dropped mid-quiz: keep going; the attempt is scored on submit or after sync.
      if (!e?.isNetwork) showToast(e.message, 'error');
    } finally {
      setChecking(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < questionList.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSubmitted(false);
    } else {
      handleFinish();
    }
  };

  /* ─── Quiz in progress ─── */

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timerUrgent = timeLeft < 30;
  const progress = Math.round(((currentIndex + (submitted ? 1 : 0)) / questionList.length) * 100);
  const typeLabel = currentQ?.options?.length === 2 ? t('quiz.trueFalse') : t('quiz.multipleChoice');
  const fb = feedback[currentIndex];
  const maxXp = questionList.length * POINTS + 20;
  // Split the sentence at {xp} so the highlighted amount fits the translated word order.
  const [earnBefore, earnAfter = ''] = t('quiz.earnUpTo').split('{xp}');

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-16">

      {/* Top bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 flex items-center justify-between border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="min-w-0">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            {quiz.subject?.name ?? t('progress.quiz')} · {t('quiz.practice')}
          </span>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-0.5 max-w-xs truncate">
            {quiz.title}
          </h2>
        </div>
        <div role="timer" aria-label={t('quiz.timeLeft')} className={`flex items-center gap-2 font-extrabold text-sm px-3.5 py-1.5 rounded-xl border transition-colors ${
          timerUrgent
            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 animate-pulse'
            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300'
        }`}>
          <Clock className="w-4 h-4" />
          <span>{minutes}:{seconds < 10 ? `0${seconds}` : seconds}</span>
        </div>
      </div>

      {quiz.__offline && (
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl px-4 py-3">
          <CloudOff className="w-4 h-4 shrink-0" /> {t('offline.quizOffline')}
        </div>
      )}

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>{t('quiz.questionOf', { n: currentIndex + 1, total: questionList.length })}</span>
          <span>{t('quiz.percentComplete', { pct: progress })}</span>
        </div>
        <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-600 to-violet-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.max(progress, 4)}%` }}
          />
        </div>
        <div className="flex items-center gap-1.5 pt-0.5">
          {questionList.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 flex-1 ${
                i < currentIndex ? 'bg-indigo-500'
                : i === currentIndex ? 'bg-indigo-400 ring-1 ring-indigo-400/40'
                : 'bg-slate-200 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main question card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-200 dark:border-slate-800 shadow-xl">

        {/* Question header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 rounded-lg border border-indigo-100 dark:border-indigo-900">
              {typeLabel}
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
            {currentQ?.prompt}
          </h3>
        </div>

        <OptionGrid
          question={currentQ}
          answer={answers[currentIndex]}
          feedback={fb}
          submitted={submitted}
          onSelect={(idx) => updateAnswer({ selectedIndex: idx })}
        />

        {/* Feedback banner */}
        {submitted && !checking && (fb ? (
          <div className={`px-4 py-3.5 rounded-2xl border text-xs leading-relaxed ${
            fb.correct
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}>
            <div className="font-bold text-sm mb-1 flex items-center gap-1.5">
              {fb.correct
                ? <><CheckCircle2 className="w-4 h-4" /> {t('quiz.correctPts', { points: POINTS })}</>
                : <><XCircle className="w-4 h-4" /> {t('quiz.incorrect')}</>}
            </div>
            {fb.explanation && (
              <p><strong>{t('quiz.explanationLabel')}</strong> {fb.explanation}</p>
            )}
          </div>
        ) : (
          <div className="px-4 py-3.5 rounded-2xl border text-xs leading-relaxed bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
            {t('quiz.answerSaved')}
          </div>
        ))}

        {/* Action buttons */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-400 font-medium">{t('quiz.pts', { points: POINTS })}</span>
          {!submitted ? (
            <button
              onClick={handleSubmit}
              disabled={!isAnswerable()}
              className={`px-8 py-3.5 rounded-2xl font-bold text-sm transition-all duration-150 ${
                isAnswerable()
                  ? 'bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white shadow-lg shadow-indigo-600/25'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
            >
              {t('quiz.submitAnswer')}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={checking || finishing}
              className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-90 active:scale-95 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all disabled:opacity-60"
            >
              {(checking || finishing) && <Loader2 className="w-4 h-4 animate-spin" />}
              {currentIndex === questionList.length - 1 ? t('quiz.seeResults') : t('quiz.nextQuestion')}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* XP incentive */}
      <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Zap className="w-3.5 h-3.5 text-amber-500" />
        <span>{earnBefore}<strong className="text-amber-600 dark:text-amber-400">+{maxXp} XP</strong>{earnAfter}</span>
      </div>
    </div>
  );
};

/** Loads the quiz and, when online, starts or resumes its server-side session. */
const loadQuiz = async (quizId) => {
  const quiz = await catalogApi.quiz(quizId);
  let session = null;
  try {
    session = await learningApi.startQuizSession(quizId);
  } catch (e) {
    if (!e?.isNetwork) throw e; // offline: answers are saved locally and scored after sync
  }
  return { quiz, session };
};

export const QuizScreen = () => {
  const { quizId } = useParams();
  const { t } = useApp();
  const { data, error, loading, reload } = useApi(() => loadQuiz(quizId), [quizId]);
  if (loading && !data) return <LoadingState rows={2} />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;
  if (!data.quiz.questions?.length) return <ErrorState error={{ message: t('quiz.noQuestions') }} />;
  return <QuizRunner key={data.quiz.id} quiz={data.quiz} session={data.session} />;
};
