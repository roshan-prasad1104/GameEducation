import { cn } from '../../lib/cn';

/**
 * EmptyState — used when a list has no items.
 */
export const EmptyState = ({ icon: Icon, title, description, action, className }) => (
  <div className={cn(
    'flex flex-col items-center justify-center text-center px-6 py-12 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/30',
    className
  )}>
    {Icon && (
      <div className="h-12 w-12 rounded-2xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-4">
        <Icon className="h-6 w-6" />
      </div>
    )}
    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
    {description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const Skeleton = ({ className }) => (
  <div className={cn('rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse', className)} />
);
