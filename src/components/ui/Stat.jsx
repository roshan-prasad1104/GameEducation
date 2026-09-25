import { cn } from '../../lib/cn';
import { Card } from './Card';

/**
 * Stat — premium metric tile for dashboards.
 *   <Stat label="XP" value={1450} icon={Zap} tone="xp" trend="+120 this week" />
 */
export const Stat = ({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'brand',
  trend,
  className,
}) => {
  const iconBg = {
    brand:   'bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400',
    violet:  'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400',
    xp:      'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    success: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  };
  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-50 tabular-nums">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
          {trend && (
            <p className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
              <span aria-hidden>↑</span>{trend}
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', iconBg[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </Card>
  );
};
