import { AlertTriangle, CloudOff, RefreshCw, History } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from './Button';
import { Skeleton } from './EmptyState';
import { cn } from '../../lib/cn';

/** Generic skeleton layout while a page loads. */
export const LoadingState = ({ rows = 3, className }) => (
  <div className={cn('space-y-4', className)} aria-busy="true" aria-live="polite">
    <Skeleton className="h-8 w-1/3" />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
    </div>
    {Array.from({ length: rows }).map((_, i) => <Skeleton key={i} className="h-28" />)}
  </div>
);

/** Friendly error with retry. Never shows raw stack traces. */
export const ErrorState = ({ error, onRetry, className }) => {
  const { t } = useApp();
  const offline = error?.isNetwork || error?.code === 'NOT_DOWNLOADED';
  const Icon = offline ? CloudOff : AlertTriangle;
  return (
    <div role="alert" className={cn('card p-8 flex flex-col items-center text-center gap-3', className)}>
      <div className={cn('h-12 w-12 rounded-2xl flex items-center justify-center',
        offline ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40' : 'bg-red-50 text-red-600 dark:bg-red-950/40')}>
        <Icon className="h-6 w-6" />
      </div>
      <h2 className="text-base font-semibold">{offline ? t('errors.offlineTitle') : t('errors.title')}</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">{error?.message ?? t('errors.generic')}</p>
      {onRetry && (
        <Button variant="outline" size="sm" leftIcon={RefreshCw} onClick={onRetry}>{t('common.retry')}</Button>
      )}
    </div>
  );
};

/** Shown when a page is rendering the last saved copy because the network is unavailable. */
export const StaleBanner = ({ savedAt }) => {
  const { t } = useApp();
  if (!savedAt) return null;
  return (
    <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
      <History className="h-3.5 w-3.5 shrink-0" />
      <span>{t('offline.staleData', { time: new Date(savedAt).toLocaleString() })}</span>
    </div>
  );
};
