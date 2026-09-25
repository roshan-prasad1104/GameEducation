import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { useApi } from '../../hooks/useApi';
import { learningApi, studentApi } from '../../services/api';
import { ErrorState, LoadingState } from '../ui';
import {
  ArrowRight,
  RotateCcw,
  AlertCircle,
  BookOpen,
  Sparkles,
  Target,
  ChevronRight,
  CloudOff,
  Loader2,
  Trophy
} from 'lucide-react';
import { badgeName, recommendationReason } from '../../i18n/serverText';

/** Original result design, now showing the server-graded attempt and real recommendations. */
const ResultView = ({ result }) => {
  const navigate = useNavigate();
  const { applyReward, t, language } = useApp();
  const { data: recs } = useApi(() => studentApi.recommendations(3), [result.attemptId]);
  const celebrated = useRef(false);

  const accuracy = result.percentage;
  const reward = result.reward;

  useEffect(() => {
    if (celebrated.current || !reward) return;
    celebrated.current = true;
    applyReward(reward);
    if (accuracy >= 70) confetti({ particleCount: 140, spread: 72, origin: { y: 0.6 } });
    else confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 }, colors: ['#6366f1', '#8b5cf6'] });
  }, [reward, accuracy, applyReward]);

  const topicMap = {};
  result.questions.forEach((q) => {
    const tag = q.topic ?? 'general';
    if (!topicMap[tag]) topicMap[tag] = { correct: 0, total: 0 };
    topicMap[tag].total += 1;
    if (q.correct) topicMap[tag].correct += 1;
  });
  const topics = Object.entries(topicMap).map(([tag, d]) => ({
    tag, ...d, pct: Math.round((d.correct / d.total) * 100)
  }));
  const weakTopics = topics.filter((tp) => tp.pct < 60);

  const grade =
    accuracy >= 90 ? { label: t('result.excellent'), color: 'text-emerald-500', emoji: '🏆' }
    : accuracy >= 70 ? { label: t('result.goodJob'), color: 'text-indigo-500', emoji: '🎉' }
    : accuracy >= 50 ? { label: t('result.keepGoingTitle'), color: 'text-amber-500', emoji: '💪' }
    : { label: t('result.needsPractice'), color: 'text-rose-500', emoji: '📚' };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      {/* Hero card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-5">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center mx-auto shadow-lg text-3xl">
          {grade.emoji}
        </div>
        <div>
          <h2 className={`text-3xl font-black ${grade.color}`}>{grade.label}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">{result.quizTitle}</p>
          {result.syncedFromOffline && <p className="text-xs text-slate-400 mt-1">{t('result.fromOffline')}</p>}
        </div>

        <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{result.correctCount}/{result.totalQuestions}</div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{t('result.score')}</div>
          </div>
          <div>
            <div className={`text-2xl font-black ${accuracy >= 70 ? 'text-emerald-500' : accuracy >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>{accuracy}%</div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{t('result.accuracy')}</div>
          </div>
          <div>
            <div className="text-2xl font-black text-amber-500">+{result.xpEarned}</div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{t('result.xpEarnedLabel')}</div>
          </div>
        </div>

        {/* Level / badges / missions from this attempt */}
        {reward && (reward.leveledUp || reward.newBadges.length > 0 || reward.completedMissions.length > 0) && (
          <div className="text-left space-y-1.5 bg-amber-50 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200 dark:border-amber-800/50 text-xs font-semibold">
            {reward.leveledUp && <p className="text-violet-700 dark:text-violet-300">{t('result.levelUpLine', { level: reward.level.level })}</p>}
            {reward.newBadges.map((b) => <p key={b.code} className="text-slate-700 dark:text-slate-200 flex items-center gap-1.5"><Trophy className="w-3.5 h-3.5 text-amber-500" /> {t('result.newBadge', { name: badgeName(t, b) })}</p>)}
            {reward.completedMissions.map((m) => <p key={m.code} className="text-emerald-700 dark:text-emerald-300">{t('result.missionComplete', { title: t(`missions.${m.code}.title`), xp: m.xpReward })}</p>)}
          </div>
        )}
        {result.xpEarned === 0 && <p className="text-xs text-slate-500">{t('result.beatBest')}</p>}

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <button
            onClick={() => navigate(`/student/quiz/${result.quizId}`)}
            className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> {t('result.retryQuiz')}
          </button>
          <button
            onClick={() => navigate('/student/dashboard')}
            className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            {t('nav.dashboard')} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Topic breakdown */}
      {topics.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-500" /> {t('result.topicBreakdown')}
          </h3>
          <div className="space-y-3">
            {topics.map((tp) => (
              <div key={tp.tag} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">
                    {tp.tag.replace(/-/g, ' ')}
                  </span>
                  <span className={`font-bold ${tp.pct >= 70 ? 'text-emerald-600' : tp.pct >= 50 ? 'text-amber-600' : 'text-rose-500'}`}>
                    {tp.correct}/{tp.total} ({tp.pct}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${tp.pct >= 70 ? 'bg-emerald-500' : tp.pct >= 50 ? 'bg-amber-400' : 'bg-rose-500'}`}
                    style={{ width: `${tp.pct}%` }}
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
            <AlertCircle className="w-4 h-4" /> {t('result.topicsToStrengthen')}
          </h3>
          <div className="space-y-2">
            {weakTopics.map((tp) => (
              <div key={tp.tag} className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <span className="text-amber-800 dark:text-amber-300 font-medium capitalize">
                  {t('result.topicAccuracy', { topic: tp.tag.replace(/-/g, ' '), pct: tp.pct })}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-400">
            {t('result.reviseHint')}
          </p>
        </div>
      )}

      {/* Recommendations (AI service) */}
      {recs?.recommendations?.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" /> {t('result.recommendedNext')}
          </h3>
          <div className="space-y-2">
            {recs.recommendations.map((rec) => (
              <Link
                key={rec.lessonId}
                to={`/student/lessons/${rec.lessonId}`}
                className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors bg-slate-50/50 dark:bg-slate-800/40"
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${rec.kind === 'REVISE' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
                  {rec.kind === 'REVISE' ? <RotateCcw className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {rec.kind === 'REVISE' ? t('result.kindRevise') : rec.kind === 'START' ? t('result.kindNew') : t('result.kindContinue')} · {rec.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{recommendationReason(t, language, rec)}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-2" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/** /student/results/:attemptId — uses the submit response when available, else loads the attempt. */
export const ResultScreen = () => {
  const { attemptId } = useParams();
  const location = useLocation();
  const fresh = location.state?.result && String(location.state.result.attemptId) === attemptId ? location.state.result : null;
  const { data, error, loading, reload } = useApi(
    () => (fresh ? Promise.resolve(fresh) : learningApi.attempt(attemptId)), [attemptId]);
  if (loading && !data) return <LoadingState rows={2} />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;
  return <ResultView result={data} />;
};

/** /student/results/pending/:clientAttemptId — offline submission; shows the graded result once synced. */
export const PendingResultScreen = () => {
  const { clientAttemptId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { pending, online, syncing, syncNow, t } = useApp();
  const [result, setResult] = useState(null);

  useEffect(() => {
    let active = true;
    learningApi.syncedResult(clientAttemptId).then((r) => { if (active && r) setResult(r); });
    return () => { active = false; };
  }, [clientAttemptId, pending]);

  if (result) return <ResultView result={result} />;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-5">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center mx-auto shadow-lg">
          {syncing ? <Loader2 className="w-9 h-9 animate-spin" /> : <CloudOff className="w-9 h-9" />}
        </div>
        <div>
          <h2 className="text-3xl font-black text-amber-500">{t('result.savedOfflineTitle')}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {t('offline.quizSavedBody', { title: location.state?.quizTitle ?? t('result.thisQuiz') })}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <button
            onClick={() => syncNow()}
            disabled={!online || syncing}
            className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-60"
          >
            <RotateCcw className="w-4 h-4" /> {online ? t('result.syncNow') : t('result.waitingInternet')}
          </button>
          <button
            onClick={() => navigate('/student/dashboard')}
            className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            {t('nav.dashboard')} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
