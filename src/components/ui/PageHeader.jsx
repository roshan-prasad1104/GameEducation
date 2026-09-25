import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

/**
 * Page title block with optional breadcrumb trail and right-aligned actions.
 *   <PageHeader title="Physics" crumbs={[{ label: 'Subjects', to: '/student/subjects' }]} actions={<Button/>} />
 */
export const PageHeader = ({ title, subtitle, crumbs, actions, eyebrow }) => (
  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
    <div className="min-w-0">
      {crumbs?.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mb-2">
          {crumbs.map((c, i) => (
            <span key={`${c.label}-${i}`} className="inline-flex items-center gap-1">
              {c.to ? <Link to={c.to} className="hover:text-brand-600 dark:hover:text-brand-300">{c.label}</Link> : <span>{c.label}</span>}
              <ChevronRight className="h-3 w-3" />
            </span>
          ))}
        </nav>
      )}
      {eyebrow && <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-300 mb-1">{eyebrow}</p>}
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
  </div>
);
