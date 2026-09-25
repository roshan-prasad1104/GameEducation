import { BrainCircuit, Info, TriangleAlert } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useApi } from '../../hooks/useApi';
import { studentApi } from '../../services/api';
import { Badge, Card, EmptyState, ErrorState, LoadingState, PageHeader, Progress, StaleBanner } from '../../components/ui';
import { RecommendationList, SectionTitle } from './widgets';

const pct = (m) => Math.round(m * 100);

/** AI recommendations with the evidence behind them (mastery per subject and weak topics). */
export const ForYouPage = () => {
  const { t } = useApp();
  const { data, error, loading, reload } = useApi(() => studentApi.recommendations(6), []);

  if (loading && !data) return <LoadingState rows={2} />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="space-y-5">
      <PageHeader title={t('recs.pageTitle')} subtitle={t('recs.pageSubtitle')}
        actions={<Badge tone={data.source === 'ai-service' ? 'violet' : 'neutral'} icon={BrainCircuit}>
          {data.source === 'ai-service' ? t('recs.sourceAi', { model: data.model }) : t('recs.sourceFallback')}
        </Badge>} />
      <StaleBanner savedAt={data.__stale} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="p-5 lg:col-span-2">
          <SectionTitle icon={BrainCircuit}>{t('recs.title')}</SectionTitle>
          {data.recommendations.length === 0
            ? <EmptyState title={t('recs.empty')} />
            : <RecommendationList items={data.recommendations} />}
        </Card>

        <div className="space-y-5">
          <Card className="p-5">
            <SectionTitle icon={TriangleAlert}>{t('recs.weakTopics')}</SectionTitle>
            {data.weakTopics.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('recs.noWeakTopics')}</p>
            ) : (
              <ul className="space-y-3">
                {data.weakTopics.map((w) => (
                  <li key={w.topic}>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium capitalize">{w.topic.replace(/-/g, ' ')}</span>
                      <span className="text-slate-500 dark:text-slate-400 tabular-nums">{w.correct}/{w.answered}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{w.subjectName}</p>
                    <Progress className="mt-1.5" value={pct(w.mastery)} tone="danger" size="sm" />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5">
            <SectionTitle icon={BrainCircuit}>{t('recs.mastery')}</SectionTitle>
            {data.subjectMastery.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('recs.noAnswers')}</p>
            ) : (
              <ul className="space-y-3">
                {data.subjectMastery.map((s) => (
                  <li key={s.subjectId}>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{s.subjectName}</span>
                      <span className="tabular-nums text-slate-600 dark:text-slate-300">{pct(s.mastery)}%</span>
                    </div>
                    <Progress className="mt-1.5" value={pct(s.mastery)} tone={s.mastery >= 0.7 ? 'success' : s.mastery >= 0.5 ? 'brand' : 'danger'} size="sm" />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <div className="flex gap-2 text-xs text-slate-500 dark:text-slate-400 px-1">
            <Info className="h-4 w-4 shrink-0" /><p>{t('recs.howItWorks')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
