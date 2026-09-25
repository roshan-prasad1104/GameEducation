import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { quizzes as quizzesApi, gamification, recommendations } from '../../services/api';
import { localizeQuiz } from '../../data/quizTranslations';
import { QUIZ_BANK } from '../../data/quizBank';
import { SAMPLE_QUIZ } from '../../data/mockData';
import {
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  Trophy,
  ArrowRight,
  RotateCcw,
  Zap,
  AlertCircle,
  BookOpen,
  Sparkles,
  Target,
  ChevronRight,
  Image as ImageIcon,
} from 'lucide-react';

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */

const normalise = (v) => String(v ?? '').trim().toLowerCase();

const isCorrect = (q, answer) => {
  if (!q || !answer) return false;
  if (q.type === 'fill_blank') {
    return normalise(answer.text) === normalise(q.correctText);
  }
  if (q.type === 'match') {
    if (!answer.pairs || !q.pairs) return false;
    return answer.pairs.every((p, i) => p.rightIdx === i);
  }
  return answer.selectedIndex === q.correctIndex;
};

/* ─────────────────────────────────────────────
   MCQ / True-False / Image renderer
───────────────────────────────────────────── */

const OptionGrid = ({ question, answer, submitted, onSelect }) => {
  const options = question.options ?? [];
  return (
    <div className="space-y-3">
      {question.type === 'image' && (
        <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center min-h-[140px] mb-2">
          {question.imageUrl ? (
            <img
              src={question.imageUrl}
              alt={question.imageAlt ?? 'Question diagram'}
              className="max-h-48 object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 py-8 text-slate-400">
              <ImageIcon className="w-8 h-8" />
              <span className="text-xs">{question.imageAlt ?? 'Diagram'}</span>
            </div>
          )}
        </div>
      )}
      {options.map((opt, idx) => {
        const isSelected = answer?.selectedIndex === idx;
        const correct = idx === question.correctIndex;
        let cls = 'w-full text-left p-4 rounded-2xl border text-sm font-semibold flex items-center justify-between transition-all duration-150 ';
        if (submitted) {
          if (correct) cls += 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-sm';
          else if (isSelected) cls += 'bg-rose-50 dark:bg-rose-950/60 border-rose-400 text-rose-900 dark:text-rose-200';
          else cls += 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 opacity-60';
        } else if (isSelected) {
          cls += 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-900 dark:text-indigo-200 shadow-sm';
        } else {
          cls += 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20';
        }
        return (
          <button key={idx} onClick={() => !submitted && onSelect(idx)} className={cls} disabled={submitted}>
            <div className="flex items-center gap-3">
              <span className={`w-7 h-7 rounded-xl text-xs flex items-center justify-center font-bold shrink-0 ${
                submitted && correct ? 'bg-emerald-500 text-white'
                : submitted && isSelected ? 'bg-rose-500 text-white'
                : isSelected ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                {String.fromCharCode(65 + idx)}
              </span>
              <span>{opt}</span>
            </div>
            {submitted && correct && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
            {submitted && isSelected && !correct && <XCircle className="w-5 h-5 text-rose-500 shrink-0" />}
          </button>
        );
      })}
    </div>
  );
};

/* ─────────────────────────────────────────────
   Fill in the blank renderer
───────────────────────────────────────────── */

const FillBlank = ({ question, answer, submitted, onChange }) => {
  const correct = submitted ? normalise(answer?.text) === normalise(question.correctText) : null;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={answer?.text ?? ''}
          onChange={(e) => !submitted && onChange(e.target.value)}
          disabled={submitted}
          placeholder="Type your answer here…"
          className={`w-full px-4 py-3 rounded-2xl border text-sm font-semibold outline-none transition-all ${
            submitted
              ? correct
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                : 'border-rose-400 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
          }`}
        />
        {submitted && (correct
          ? <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
          : <XCircle className="w-6 h-6 text-rose-500 shrink-0" />)}
      </div>
      {submitted && !correct && (
        <p className="text-sm text-emerald-700 dark:text-emerald-300 font-semibold">
          ✓ Correct answer: <span className="font-bold">{question.correctText}</span>
        </p>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   Match the column renderer
───────────────────────────────────────────── */

const MatchPairs = ({ question, answer, submitted, onPair }) => {
  const pairs = question.pairs ?? [];
  const [activeLIdx, setActiveLIdx] = useState(null);
  const matched = answer?.pairs ?? pairs.map((_, i) => ({ leftIdx: i, rightIdx: null }));
  const usedRight = new Set(matched.map((p) => p.rightIdx).filter((r) => r !== null));

  const handleLeftClick = (lIdx) => {
    if (submitted) return;
    setActiveLIdx(lIdx === activeLIdx ? null : lIdx);
  };

  const handleRightClick = (rIdx) => {
    if (submitted || activeLIdx === null) return;
    const updated = matched.map((p) =>
      p.leftIdx === activeLIdx
        ? { ...p, rightIdx: rIdx }
        : p.rightIdx === rIdx
        ? { ...p, rightIdx: null }
        : p
    );
    onPair(updated);
    setActiveLIdx(null);
  };

  const rightLabels = pairs.map((p) => p.right);

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
        Click a left item, then click its matching right item.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          {pairs.map((p, lIdx) => {
            const pairEntry = matched[lIdx];
            const rIdx = pairEntry?.rightIdx;
            const isActive = activeLIdx === lIdx;
            const isPaired = rIdx !== null;
            const correct = submitted && rIdx === lIdx;
            const wrong = submitted && isPaired && rIdx !== lIdx;
            return (
              <button
                key={lIdx}
                onClick={() => handleLeftClick(lIdx)}
                disabled={submitted}
                className={`w-full text-left px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  wrong ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/40 text-rose-800'
                  : correct ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800'
                  : isActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-200 ring-2 ring-indigo-400/30'
                  : isPaired ? 'border-indigo-300 bg-indigo-50/60 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-300'
                }`}
              >
                {p.left}
              </button>
            );
          })}
        </div>
        <div className="space-y-2">
          {rightLabels.map((label, rIdx) => {
            const takenByLIdx = matched.findIndex((p) => p.rightIdx === rIdx);
            const correct = submitted && takenByLIdx === rIdx;
            const wrong = submitted && takenByLIdx !== -1 && takenByLIdx !== rIdx;
            return (
              <button
                key={rIdx}
                onClick={() => handleRightClick(rIdx)}
                disabled={submitted}
                className={`w-full text-left px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  wrong ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/40 text-rose-800'
                  : correct ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800'
                  : takenByLIdx !== -1 ? 'border-indigo-300 bg-indigo-50/60 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300'
                  : activeLIdx !== null && !usedRight.has(rIdx) ? 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 cursor-pointer'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
      {submitted && (
        <div className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
          <p className="font-semibold text-slate-700 dark:text-slate-300">Correct matches:</p>
          {pairs.map((p, i) => (
            <p key={i}><span className="font-medium">{p.left}</span> → {p.right}</p>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   Result screen
───────────────────────────────────────────── */

const ResultScreen = ({ quiz, answers, questionList, totalPoints, maxPoints, onRestart, onDashboard }) => {
  const [recs, setRecs] = useState([]);
  const accuracy = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;

  const topicMap = {};
  answers.forEach((ans, i) => {
    const q = questionList[i];
    if (!q) return;
    const tag = q.topicTag ?? 'general';
    if (!topicMap[tag]) topicMap[tag] = { correct: 0, total: 0 };
    topicMap[tag].total += 1;
    if (ans.isCorrect) topicMap[tag].correct += 1;
  });
  const topics = Object.entries(topicMap).map(([tag, d]) => ({
    tag, ...d, pct: Math.round((d.correct / d.total) * 100)
  }));
  const weakTopics = topics.filter((t) => t.pct < 60);

  const grade =
    accuracy >= 90 ? { label: 'Excellent!', color: 'text-emerald-500', emoji: '🏆' }
    : accuracy >= 70 ? { label: 'Good Job!', color: 'text-indigo-500', emoji: '🎉' }
    : accuracy >= 50 ? { label: 'Keep Going!', color: 'text-amber-500', emoji: '💪' }
    : { label: 'Needs Practice', color: 'text-rose-500', emoji: '📚' };

  useEffect(() => {
    recommendations.forMe({ limit: 3 }).then(setRecs).catch(() => {});
  }, []);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      {/* Hero card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-5">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center mx-auto shadow-lg text-3xl">
          {grade.emoji}
        </div>
        <div>
          <h2 className={`text-3xl font-black ${grade.color}`}>{grade.label}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">{quiz.title}</p>
        </div>

        <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{totalPoints}/{maxPoints}</div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Points</div>
          </div>
          <div>
            <div className={`text-2xl font-black ${accuracy >= 70 ? 'text-emerald-500' : accuracy >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>{accuracy}%</div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Accuracy</div>
          </div>
          <div>
            <div className="text-2xl font-black text-amber-500">+{quiz.xpReward ?? 100}</div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">XP Earned</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <button
            onClick={onRestart}
            className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Retry Quiz
          </button>
          <button
            onClick={onDashboard}
            className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            Dashboard <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Topic breakdown */}
      {topics.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-500" /> Topic Breakdown
          </h3>
          <div className="space-y-3">
            {topics.map((t) => (
              <div key={t.tag} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">
                    {t.tag.replace(/-/g, ' ')}
                  </span>
                  <span className={`font-bold ${t.pct >= 70 ? 'text-emerald-600' : t.pct >= 50 ? 'text-amber-600' : 'text-rose-500'}`}>
                    {t.correct}/{t.total} ({t.pct}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${t.pct >= 70 ? 'bg-emerald-500' : t.pct >= 50 ? 'bg-amber-400' : 'bg-rose-500'}`}
                    style={{ width: `${t.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weak topics alert */}
      {weakTopics.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 rounded-3xl p-6 border border-amber-200 dark:border-amber-800/50 shadow-sm space-y-3">
          <h3 className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Topics to Strengthen
          </h3>
          <div className="space-y-2">
            {weakTopics.map((t) => (
              <div key={t.tag} className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <span className="text-amber-800 dark:text-amber-300 font-medium capitalize">
                  {t.tag.replace(/-/g, ' ')} — {t.pct}% accuracy
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Revise these topics to improve your score next time.
          </p>
        </div>
      )}

      {/* Recommendations teaser */}
      {recs.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" /> Recommended Next Steps
          </h3>
          <div className="space-y-2">
            {recs.map((rec, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors bg-slate-50/50 dark:bg-slate-800/40"
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${rec.kind === 'revision' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
                  {rec.kind === 'revision' ? <RotateCcw className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 capitalize">
                    {rec.kind === 'revision' ? '📝 Revision' : '🆕 New Topic'}
                    {rec.topicTag ? ` · ${rec.topicTag.replace(/-/g, ' ')}` : ''}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{rec.reason}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-2" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   Main QuizScreen
───────────────────────────────────────────── */

export const QuizScreen = () => {
  const { activeQuiz: rawActiveQuiz, addXP, setActiveTab, language, t } = useApp();

  const activeQuiz = rawActiveQuiz || QUIZ_BANK[0] || SAMPLE_QUIZ;
  const localizedQuiz = localizeQuiz(activeQuiz, language) || activeQuiz;

  // Normalise field names: quizBank uses 'prompt', legacy SAMPLE_QUIZ uses 'question'
  const questionList = (localizedQuiz.questions ?? []).map((q) => ({
    ...q,
    prompt: q.prompt ?? q.question ?? '',
  }));

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState(() => questionList.map(() => ({})));
  const [submitted, setSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [timeLeft, setTimeLeft] = useState(activeQuiz.timeLimitSeconds ?? 180);
  const [quizFinished, setQuizFinished] = useState(false);
  const [resultData, setResultData] = useState(null);

  // Refs — prevent stale closures inside timer / async callbacks
  const timerRef = useRef(null);
  const answersRef = useRef(answers);
  const timeLeftRef = useRef(timeLeft);
  const hasFinishedRef = useRef(false);

  // Reset/sync quiz state whenever activeQuiz or language changes
  useEffect(() => {
    const qList = (localizeQuiz(activeQuiz, language) || activeQuiz).questions ?? [];
    const normalized = qList.map((q) => ({
      ...q,
      prompt: q.prompt ?? q.question ?? '',
    }));
    setCurrentIndex(0);
    setAnswers(normalized.map(() => ({})));
    setSubmitted(false);
    setShowHint(false);
    setTimeLeft(activeQuiz.timeLimitSeconds ?? 180);
    setQuizFinished(false);
    setResultData(null);
    hasFinishedRef.current = false;
  }, [activeQuiz?.id, language]);

  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);

  const currentQ = questionList[currentIndex];

  // Tick-only timer — no async logic inside setInterval callback
  useEffect(() => {
    if (quizFinished) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [quizFinished]);

  // Watch timeLeft — when it reaches 0, trigger finish (outside setState callback)
  useEffect(() => {
    if (timeLeft === 0 && !quizFinished) {
      clearInterval(timerRef.current);
      handleFinish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  /* ─── Answer management ─── */

  const updateAnswer = (partial) => {
    setAnswers((prev) => {
      const copy = [...prev];
      copy[currentIndex] = { ...copy[currentIndex], ...partial };
      return copy;
    });
  };

  const isAnswerable = () => {
    const ans = answers[currentIndex];
    if (!currentQ) return false;
    if (currentQ.type === 'fill_blank') return (ans.text ?? '').trim().length > 0;
    if (currentQ.type === 'match') {
      const p = ans.pairs ?? [];
      return p.length > 0 && p.every((x) => x.rightIdx !== null);
    }
    return ans.selectedIndex !== undefined && ans.selectedIndex !== null;
  };

  const handleSubmit = () => {
    if (!isAnswerable()) return;
    const ans = answers[currentIndex];
    const correct = isCorrect(currentQ, ans);
    updateAnswer({ isCorrect: correct });
    setSubmitted(true);
  };

  const handleNext = () => {
    if (currentIndex < questionList.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSubmitted(false);
      setShowHint(false);
    } else {
      handleFinish();
    }
  };

  /* ─── Finish quiz ─── */

  const handleFinish = async () => {
    // Guard: only run once even if called from timer + handleNext simultaneously
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;

    clearInterval(timerRef.current);
    setQuizFinished(true);

    // Use latest answers from ref to avoid stale closure
    const latestAnswers = answersRef.current;
    const finalAnswers = latestAnswers.map((ans, i) => {
      const q = questionList[i];
      return { ...ans, isCorrect: isCorrect(q, ans), topicTag: q?.topicTag };
    });

    let totalPoints = 0;
    const maxPoints = questionList.reduce((s, q) => s + (q.points ?? 10), 0);
    finalAnswers.forEach((ans, i) => {
      if (ans.isCorrect) totalPoints += questionList[i]?.points ?? 10;
    });

    // Persist to IndexedDB
    const idempotencyKey = `attempt-${activeQuiz.id}-${Date.now()}`;
    try {
      await quizzesApi.submitAttempt({
        quizId: activeQuiz.id,
        answers: finalAnswers.map((ans, i) => ({
          questionId: questionList[i]?.id,
          selectedIndex: ans.selectedIndex ?? null,
          text: ans.text ?? null,
          pairs: ans.pairs ?? null,
          isCorrect: ans.isCorrect,
          topicTag: ans.topicTag,
        })),
        timeTakenSeconds: (activeQuiz.timeLimitSeconds ?? 180) - timeLeftRef.current,
        idempotencyKey,
      });
    } catch { /* non-fatal */ }

    // Award XP
    try {
      await gamification.awardXP({
        delta: activeQuiz.xpReward ?? 100,
        reason: `Completed quiz: ${activeQuiz.title}`,
        idempotencyKey: `xp-${idempotencyKey}`,
      });
    } catch { /* non-fatal */ }
    addXP(activeQuiz.xpReward ?? 100);

    setResultData({ finalAnswers, totalPoints, maxPoints });

    if (maxPoints > 0 && totalPoints / maxPoints >= 0.7) {
      confetti({ particleCount: 140, spread: 72, origin: { y: 0.6 } });
    } else {
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 }, colors: ['#6366f1', '#8b5cf6'] });
    }
  };

  /* ─── Restart ─── */

  const handleRestart = () => {
    hasFinishedRef.current = false;
    setCurrentIndex(0);
    setAnswers(questionList.map(() => ({})));
    setSubmitted(false);
    setShowHint(false);
    setTimeLeft(activeQuiz.timeLimitSeconds ?? 180);
    setQuizFinished(false);
    setResultData(null);
  };

  /* ─── Result view ─── */

  if (quizFinished && resultData) {
    return (
      <ResultScreen
        quiz={activeQuiz}
        answers={resultData.finalAnswers}
        questionList={questionList}
        totalPoints={resultData.totalPoints}
        maxPoints={resultData.maxPoints}
        onRestart={handleRestart}
        onDashboard={() => setActiveTab('dashboard')}
      />
    );
  }

  /* ─── Quiz in progress ─── */

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timerUrgent = timeLeft < 30;
  const progress = Math.round(((currentIndex + (submitted ? 1 : 0)) / questionList.length) * 100);

  const typeLabel = {
    mcq: 'Multiple Choice',
    true_false: 'True or False',
    fill_blank: 'Fill in the Blank',
    match: 'Match the Column',
    image: 'Image-Based Question',
  }[currentQ?.type] ?? 'Question';

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-16">

      {/* Top bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 flex items-center justify-between border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            {activeQuiz.subject ?? 'Quiz'} · Practice
          </span>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-0.5 max-w-xs truncate">
            {activeQuiz.title}
          </h2>
        </div>
        <div className={`flex items-center gap-2 font-extrabold text-sm px-3.5 py-1.5 rounded-xl border transition-colors ${
          timerUrgent
            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 animate-pulse'
            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300'
        }`}>
          <Clock className="w-4 h-4" />
          <span>{minutes}:{seconds < 10 ? `0${seconds}` : seconds}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>Question {currentIndex + 1} of {questionList.length}</span>
          <span>{progress}% Complete</span>
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
            {currentQ?.hint && (
              <button
                onClick={() => setShowHint((v) => !v)}
                className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                {showHint ? 'Hide Hint' : 'Hint'}
              </button>
            )}
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
            {currentQ?.prompt}
          </h3>

          {showHint && currentQ?.hint && (
            <div className="bg-amber-50 dark:bg-amber-950/40 px-4 py-3 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
              💡 <strong>Hint:</strong> {currentQ.hint}
            </div>
          )}
        </div>

        {/* Per-type renderers */}
        {(currentQ?.type === 'mcq' || currentQ?.type === 'true_false' || currentQ?.type === 'image') && (
          <OptionGrid
            question={currentQ}
            answer={answers[currentIndex]}
            submitted={submitted}
            onSelect={(idx) => updateAnswer({ selectedIndex: idx })}
          />
        )}

        {currentQ?.type === 'fill_blank' && (
          <FillBlank
            question={currentQ}
            answer={answers[currentIndex]}
            submitted={submitted}
            onChange={(text) => updateAnswer({ text })}
          />
        )}

        {currentQ?.type === 'match' && (
          <MatchPairs
            question={currentQ}
            answer={answers[currentIndex]}
            submitted={submitted}
            onPair={(pairs) => updateAnswer({ pairs })}
          />
        )}

        {/* Feedback banner */}
        {submitted && (
          <div className={`px-4 py-3.5 rounded-2xl border text-xs leading-relaxed ${
            isCorrect(currentQ, answers[currentIndex])
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}>
            <div className="font-bold text-sm mb-1 flex items-center gap-1.5">
              {isCorrect(currentQ, answers[currentIndex])
                ? <><CheckCircle2 className="w-4 h-4" /> Correct! +{currentQ?.points ?? 10} pts</>
                : <><XCircle className="w-4 h-4" /> Incorrect</>}
            </div>
            {currentQ?.explanation && (
              <p><strong>Explanation:</strong> {currentQ.explanation}</p>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-400 font-medium">{currentQ?.points ?? 10} pts</span>
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
              Submit Answer
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-90 active:scale-95 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all"
            >
              {currentIndex === questionList.length - 1 ? 'See Results' : 'Next Question'}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* XP incentive */}
      <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Zap className="w-3.5 h-3.5 text-amber-500" />
        <span>Complete this quiz to earn <strong className="text-amber-600 dark:text-amber-400">+{activeQuiz.xpReward ?? 100} XP</strong></span>
      </div>
    </div>
  );
};
