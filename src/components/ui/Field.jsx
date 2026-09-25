import { useId } from 'react';
import { cn } from '../../lib/cn';

const control = 'w-full rounded-xl border bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 ' +
  'placeholder:text-slate-400 outline-none transition focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 disabled:opacity-60';

/** Labelled form control with inline validation message. `as` = input | select | textarea. */
export const Field = ({ label, error, hint, as = 'input', className, children, ...props }) => {
  const id = useId();
  const Tag = as;
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && <label htmlFor={id} className="block text-xs font-medium text-slate-700 dark:text-slate-300">{label}</label>}
      <Tag
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-err` : undefined}
        className={cn(control, error ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-700',
          as === 'textarea' && 'min-h-[96px] font-mono text-xs leading-relaxed')}
        {...props}
      >
        {children}
      </Tag>
      {error ? <p id={`${id}-err`} className="text-xs text-red-600 dark:text-red-400">{error}</p>
        : hint ? <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p> : null}
    </div>
  );
};

/** Top-of-form error message (e.g. server rejected the request). */
export const FormError = ({ message }) => (message ? (
  <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
    {message}
  </div>
) : null);
