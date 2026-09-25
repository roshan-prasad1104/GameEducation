import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { BrainCircuit, CheckCircle2, CloudOff, Loader2, RotateCcw, XCircle, ArrowRight, Zap } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useApi } from '../../hooks/useApi';
import { learningApi, studentApi } from '../../services/api';
import { Button, Card, ErrorState, LoadingState, PageHeader, Progress, Stat } from '../../components/ui';
import { cn } from '../../lib/cn';
import { RecommendationList, RewardPanel, SectionTitle } from './widgets';

/** Score summary, rewards, per-question review and the AI's next-step suggestions. */
export const ResultView = ({ result }) => {
  const { t } = useApp();
  const recs = useApi(() => studentApi.recommendations(3), [result.attemptId]);
  const celebrated = useRef(false);

  useEffect(() => {
    if (!result.reward || celebrated.current) return;
    celebrated.current = true;
    if (result.percentage >= 80 || result.reward.leveledUp) {
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 }, colors: ['#4f46e5', '#8b5cf6', '#f59e0b'] });
    }
  }, [result]);

  const tone = result.percentage >= 80 ? 'success' : result.percentage >= 50 ? 'brand' : 'danger';

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <PageHeader
        crumbs={[{ label: result.subjectName }, { label: result.chapterTitle, to: `/student/chapters/${result.chapterId}` }]}
        eyebrow={t('result.eyebrow')}
        title={result.quizTitle}
        subtitle={result.syncedFromOffline ? t('result.fromOffline') : new Date(result.submittedAt).toLocaleString()}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label={t('result.score')} value={`${result.correctCount}/${result.totalQuestions}`} icon={CheckCircle2} tone="success" />
        <Stat label={t('result.accuracy')} value={`${result.percentage}%`} icon={BrainCircuit} />
        <Stat label={t('result.xpEarned')} value={`+${result.xpEarned} XP`} icon={Zap} tone="xp"
          hint={result.xpEarned === 0 ? t('result.noXpHint') : undefined} />
      </div>
      <Progress value={result.percentage} tone={tone} size="lg" />
      <p className="text-sm text-slate-600 dark:text-slate-300">
        {result.percentage >= 80 ? t('result.great') : result.percentage >= 50 ? t('result.good') : t('result.keepTrying')}
      </p>

      {result.reward && <RewardPanel reward={result.reward} />}

      <Card className="p-5">
        <SectionTitle icon={BrainCircuit}>{t('result.nextSteps')}</SectionTitle>
        {recs.loading && !recs.data ? <p className="text-sm text-slate-500">{t('common.loading')}</p>
          : recs.error && !recs.data ? <p className="text-sm text-slate-500">{recs.error.message}</p>
            : <RecommendationList items={recs.data.recommendations} />}
      </Card>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">{t('result.review')}</h2>
        {result.questions.map((q, i) => (
          <Card key={q.questionId} className="p-4 sm:p-5">
            <div className="flex items-start gap-3">
              {q.correct ? <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" /> : <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />}
              <div className="flex-1 min-w-0 space-y-2">
                <p className="font-medium">{i + 1}. {q.prompt}</p>
                <ul className="grid gap-1.5">
                  {q.options.map((opt, oi) => (
                    <li key={oi} className={cn('rounded-lg px-3 py-2 text-sm border',
                      oi === q.correctIndex ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200'
                        : oi === q.selectedIndex ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300'
                          : 'border-transparent text-slate-600 dark:text-slate-400')}>
                      {opt}
                      {oi === q.correctIndex && <span className="ml-2 text-xs font-medium">✓ {t('result.correctAnswer')}</span>}
                      {oi === q.selectedIndex && oi !== q.correctIndex && <span className="ml-2 text-xs font-medium">{t('result.yourAnswer')}</span>}
                    </li>
                  ))}
                </ul>
                {q.selectedIndex == null && <p className="text-xs text-slate-500">{t('result.skipped')}</p>}
                {q.explanation && <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2">{q.explanation}</p>}
              </div>
            </div>
          </Card>
        ))}
      </section>

      <div className="flex flex-col sm:flex-row gap-2">
        <Link to={`/student/quiz/${result.quizId}`}><Button variant="outline" leftIcon={RotateCcw} className="w-full">{t('result.retake')}</Button></Link>
        <Link to={`/student/chapters/${result.chapterId}`}><Button variant="ghost" className="w-full">{t('result.backToChapter')}</Button></Link>
        <Link to="/student/dashboard" className="sm:ml-auto"><Button rightIcon={ArrowRight} className="w-full">{t('result.toDashboard')}</Button></Link>
      </div>
    </div>
  );
};

export const ResultPage = () => {
  const { attemptId } = useParams();
  const location = useLocation();
  const fromSubmit = location.state?.result;
  const fresh = fromSubmit && String(fromSubmit.attemptId) === attemptId ? fromSubmit : null;
  const { data, error, loading, reload } = useApi(
    () => (fresh ? Promise.resolve(fresh) : learningApi.attempt(attemptId)), [attemptId]);

  if (loading && !data) return <LoadingState rows={2} />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;
  return <ResultView result={data} />;
};

/** Shown after an offline submission; swaps to the graded result once sync completes. */
export const PendingResultPage = () => {
  const { clientAttemptId } = useParams();
  const location = useLocation();
  const { t, pending, online, syncing, syncNow } = useApp();
  const [result, setResult] = useState(null);

  useEffect(() => {
    let active = true;
    learningApi.syncedResult(clientAttemptId).then((r) => { if (active && r) setResult(r); });
    return () => { active = false; };
  }, [clientAttemptId, pending]);

  if (result) return <ResultView result={result} />;

  return (
    <div className="max-w-xl mx-auto">
      <Card className="p-8 text-center space-y-4">
        <div className="h-14 w-14 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
          {syncing ? <Loader2 className="h-7 w-7 animate-spin" /> : <CloudOff className="h-7 w-7" />}
        </div>
        <h1 className="text-xl font-semibold">{t('offline.quizSavedTitle')}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">{t('offline.quizSavedBody', { title: location.state?.quizTitle ?? '' })}</p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button onClick={() => syncNow()} disabled={!online || syncing} loading={syncing}>{t('sync.now')}</Button>
          <Link to="/student/dashboard"><Button variant="outline" className="w-full">{t('result.toDashboard')}</Button></Link>
        </div>
        {!online && <p className="text-xs text-slate-500">{t('offline.willSync')}</p>}
      </Card>
    </div>
  );
};
