import { cn } from '../../lib/cn';

/**
 * Card — premium surface with hover variant and padding scale.
 */
export const Card = ({ as: Tag = 'div', hover = false, premium = false, className, children, ...rest }) => {
  const Comp = Tag;
  return (
    <Comp
      className={cn(
        premium ? 'card-premium' : 'card',
        hover && 'card-hover',
        className
      )}
      {...rest}
    >
      {children}
    </Comp>
  );
};

export const CardHeader = ({ className, children }) => (
  <div className={cn('px-5 pt-5 pb-3 flex items-start justify-between gap-3', className)}>
    {children}
  </div>
);

export const CardTitle = ({ className, children }) => (
  <h3 className={cn('text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight', className)}>
    {children}
  </h3>
);

export const CardSubtitle = ({ className, children }) => (
  <p className={cn('text-sm text-slate-500 dark:text-slate-400 mt-0.5', className)}>
    {children}
  </p>
);

export const CardBody = ({ className, children }) => (
  <div className={cn('px-5 pb-5', className)}>{children}</div>
);

export const CardFooter = ({ className, children }) => (
  <div className={cn('px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30 rounded-b-[16px]', className)}>
    {children}
  </div>
);
