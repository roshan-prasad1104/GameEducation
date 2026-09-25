import { Flame, Medal } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useApi } from '../../hooks/useApi';
import { studentApi } from '../../services/api';
import { Card, ErrorState, LoadingState, PageHeader, StaleBanner } from '../../components/ui';
import { cn } from '../../lib/cn';

const MEDAL = ['text-amber-500', 'text-slate-400', 'text-orange-600'];

const Row = ({ e, t }) => (
  <li className={cn('flex items-center gap-3 px-4 sm:px-5 py-3', e.currentUser && 'bg-brand-50/70 dark:bg-brand-950/30')}>
    <span className="w-7 text-center font-semibold tabular-nums">
      {e.rank <= 3 ? <Medal className={cn('h-5 w-5 mx-auto', MEDAL[e.rank - 1])} aria-label={`#${e.rank}`} /> : e.rank}
    </span>
    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-500 to-violet-500 text-white text-sm font-semibold flex items-center justify-center shrink-0">
      {e.name[0]}
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-medium truncate">{e.name}{e.currentUser && <span className="ml-1.5 text-xs text-brand-600 dark:text-brand-300">({t('leaderboard.you')})</span>}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{t('dashboard.level')} {e.level}{e.school ? ` · ${e.school}` : ''}</p>
    </div>
    {e.streak > 0 && <span className="hidden sm:inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300"><Flame className="h-3.5 w-3.5" />{e.streak}</span>}
    <span className="font-semibold tabular-nums text-right w-20">{e.xp.toLocaleString()} <span className="text-xs text-slate-500">XP</span></span>
  </li>
);

export const LeaderboardPage = () => {
  const { t } = useApp();
  const { data, error, loading, reload } = useApi(() => studentApi.leaderboard(), []);

  if (loading && !data) return <LoadingState rows={3} />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;

  const meVisible = data.entries.some((e) => e.currentUser);

  return (
    <div className="max-w-3xl space-y-5">
      <PageHeader title={t('leaderboard.title')} subtitle={t('leaderboard.subtitle')} />
      <StaleBanner savedAt={data.__stale} />
      <Card className="overflow-hidden">
        <ol className="divide-y divide-slate-100 dark:divide-slate-800">
          {data.entries.map((e) => <Row key={e.studentId} e={e} t={t} />)}
        </ol>
        {!meVisible && data.me && (
          <div className="border-t-2 border-dashed border-slate-200 dark:border-slate-700"><ol><Row e={data.me} t={t} /></ol></div>
        )}
      </Card>
    </div>
  );
};
