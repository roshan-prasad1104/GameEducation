import { Lock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useApi } from '../../hooks/useApi';
import { studentApi } from '../../services/api';
import { ErrorState, LoadingState, PageHeader, StaleBanner, NamedIcon } from '../../components/ui';
import { cn } from '../../lib/cn';
import { LevelCard } from './widgets';

export const BadgesPage = () => {
  const { t } = useApp();
  const badges = useApi(() => studentApi.badges(), []);
  const xp = useApi(() => studentApi.xp(), []);

  if (badges.loading && !badges.data) return <LoadingState rows={2} />;
  if (badges.error && !badges.data) return <ErrorState error={badges.error} onRetry={badges.reload} />;

  const earned = badges.data.filter((b) => b.earned).length;

  return (
    <div className="space-y-5">
      <PageHeader title={t('badges.title')} subtitle={t('badges.subtitle', { earned, total: badges.data.length })} />
      <StaleBanner savedAt={badges.data.__stale} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3 h-fit">
          {badges.data.map((b) => {
            return (
              <div key={b.code} className={cn('card p-4 text-center', !b.earned && 'opacity-70')}>
                <div className={cn('mx-auto h-14 w-14 rounded-2xl flex items-center justify-center',
                  b.earned ? 'bg-gradient-to-br from-brand-500 to-violet-500 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-400')}>
                  {b.earned ? <NamedIcon name={b.icon} className="h-7 w-7" /> : <Lock className="h-6 w-6" />}
                </div>
                <p className="mt-3 text-sm font-semibold">{b.name}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{b.description}</p>
                {b.earned && <p className="mt-2 text-[11px] text-emerald-700 dark:text-emerald-300">{t('badges.earnedOn', { date: new Date(b.earnedAt).toLocaleDateString() })}</p>}
              </div>
            );
          })}
        </div>

        {xp.data && (
          <div className="space-y-4">
            <LevelCard level={xp.data.level} />
            <div className="card p-5">
              <p className="text-sm font-semibold">{t('badges.xpHistory')}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('dashboard.xpThisWeek', { xp: xp.data.xpThisWeek })}</p>
              <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
                {xp.data.recent.map((x, i) => (
                  <li key={i} className="py-2 flex items-center justify-between gap-3 text-sm">
                    <span className="truncate">{x.description}</span>
                    <span className="shrink-0 font-medium tabular-nums text-amber-700 dark:text-amber-300">+{x.amount}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{t('badges.xpRules')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
