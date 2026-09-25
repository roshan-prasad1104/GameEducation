import { cn } from '../../lib/cn';

const tones = {
  brand:   'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200 dark:bg-brand-950/40 dark:text-brand-300 dark:ring-brand-800',
  violet:  'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:ring-violet-800',
  xp:      'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800',
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800',
  warn:    'bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:ring-orange-800',
  danger:  'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-800',
  neutral: 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700',
};

export const Badge = ({ tone = 'neutral', icon: Icon, className, children }) => (
  <span className={cn(
    'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium',
    tones[tone],
    className
  )}>
    {Icon ? <Icon className="h-3 w-3" /> : null}
    {children}
  </span>
);
