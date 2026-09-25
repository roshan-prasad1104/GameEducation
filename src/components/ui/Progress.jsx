import { cn } from '../../lib/cn';

/**
 * Progress — accessible progressbar with optional shimmer.
 *   <Progress value={75} tone="brand" />       // 0–100
 *   <Progress value={0.75} tone="xp" shimmer />  // 0..1
 */
export const Progress = ({
  value = 0,
  max = 100,
  tone = 'brand',
  size = 'md',
  shimmer = false,
  showLabel = false,
  className,
}) => {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const heights = { sm: 'h-1.5', md: 'h-2', lg: 'h-3' };
  const fills = {
    brand:   'bg-gradient-to-r from-brand-500 to-violet-500',
    xp:      'bg-gradient-to-r from-amber-400 to-orange-500',
    success: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    danger:  'bg-gradient-to-r from-red-500 to-rose-500',
    neutral: 'bg-slate-400',
  };
  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between mb-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
          <span>Progress</span>
          <span>{Math.round(pct)}%</span>
        </div>
      )}
      <div
        className={cn(
          'w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden',
          heights[size]
        )}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn('h-full rounded-full transition-all duration-700 ease-out', fills[tone], shimmer && 'progress-shimmer')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};
