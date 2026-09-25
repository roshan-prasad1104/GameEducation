import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useApi } from '../../hooks/useApi';
import { teacherApi } from '../../services/api';
import { Card, EmptyState, ErrorState, LoadingState, PageHeader } from '../../components/ui';
import { cn } from '../../lib/cn';
import { SegmentBadge } from './segments';

const FILTERS = ['ALL', 'NEEDS_SUPPORT', 'ON_TRACK', 'ADVANCED'];

export const StudentsPage = () => {
  const { t } = useApp();
  const { data, error, loading, reload } = useApi(() => teacherApi.students(), []);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('ALL');

  const rows = useMemo(() => (data ?? [])
    .filter((s) => filter === 'ALL' || s.segment === filter)
    .filter((s) => s.name.toLowerCase().includes(query.trim().toLowerCase())), [data, filter, query]);

  if (loading && !data) return <LoadingState rows={3} />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="space-y-5">
      <PageHeader title={t('teacher.studentsTitle')} subtitle={t('teacher.studentsSubtitle', { count: data.length })} />

      <div className="flex flex-col sm:flex-row gap-3">
        <label className="relative flex-1">
          <span className="sr-only">{t('common.search')}</span>
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('teacher.searchStudents')}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/30" />
        </label>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('teacher.filterSegment')}>
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f}
              className={cn('h-10 px-3 rounded-xl text-xs font-medium border transition',
                filter === f ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-200'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300')}>
              {f === 'ALL' ? t('common.all') : t(`segments.${f}`)}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? <EmptyState icon={Users} title={t('teacher.noMatches')} /> : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="text-left text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3 font-medium">{t('teacher.student')}</th>
                <th className="px-3 py-3 font-medium">{t('teacher.segment')}</th>
                <th className="px-3 py-3 font-medium">{t('teacher.avgScore')}</th>
                <th className="px-3 py-3 font-medium">{t('teacher.lessonsCol')}</th>
                <th className="px-3 py-3 font-medium">XP</th>
                <th className="px-3 py-3 font-medium">{t('teacher.weakest')}</th>
                <th className="px-5 py-3 font-medium">{t('teacher.lastActive')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3">
                    <Link to={`/teacher/students/${s.id}`} className="font-medium hover:text-brand-600">{s.name}</Link>
                    <p className="text-xs text-slate-500">{s.email}</p>
                  </td>
                  <td className="px-3 py-3"><SegmentBadge segment={s.segment} /></td>
                  <td className="px-3 py-3 tabular-nums">{s.averageScore == null ? '—' : `${s.averageScore}%`}
                    <span className="block text-xs text-slate-500">{t('teacher.attempts', { count: s.quizAttempts })}</span></td>
                  <td className="px-3 py-3 tabular-nums">{s.lessonsCompleted}</td>
                  <td className="px-3 py-3 tabular-nums">{s.xp.toLocaleString()} <span className="text-xs text-slate-500">L{s.level}</span></td>
                  <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{s.weakestTopic ?? '—'}</td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{s.lastActive ? new Date(s.lastActive).toLocaleDateString() : t('teacher.never')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};
