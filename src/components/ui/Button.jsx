import { cn } from '../../lib/cn';

const variants = {
  primary:   'bg-brand-600 hover:bg-brand-700 text-white shadow-sm hover:shadow-md',
  secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100',
  ghost:     'bg-transparent hover:bg-slate-100 text-slate-700 dark:text-slate-200 dark:hover:bg-slate-800',
  outline:   'bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 dark:bg-transparent dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-800',
  danger:    'bg-red-600 hover:bg-red-700 text-white shadow-sm',
  xp:        'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm',
};

const sizes = {
  xs: 'h-7 px-2.5 text-xs gap-1.5',
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-5 text-base gap-2',
  xl: 'h-14 px-6 text-base gap-2.5',
};

export const Button = ({
  variant = 'primary',
  size = 'md',
  className,
  leftIcon: Left,
  rightIcon: Right,
  loading = false,
  disabled,
  children,
  ...rest
}) => {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed select-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...rest}
    >
      {loading ? (
        <span className="h-4 w-4 rounded-full border-2 border-current/30 border-t-current animate-spin" />
      ) : Left ? (
        <Left className="h-4 w-4" />
      ) : null}
      {children}
      {Right && !loading ? <Right className="h-4 w-4" /> : null}
    </button>
  );
};
