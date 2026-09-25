import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Trophy, Award, Users, BarChart3, ClipboardList, FileText, Settings, ShieldCheck,
  X, Sparkles, GraduationCap, School, Download, LineChart, TriangleAlert,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { cn } from '../../lib/cn';

/** Role-based navigation — single source of truth for sidebar items. */
const NAV = {
  STUDENT: [
    { to: '/student/dashboard', icon: LayoutDashboard, key: 'nav.dashboard' },
    { to: '/student/subjects', icon: BookOpen, key: 'nav.subjects' },
    { to: '/student/for-you', icon: Sparkles, key: 'nav.forYou' },
    { to: '/student/progress', icon: LineChart, key: 'nav.progress' },
    { to: '/student/badges', icon: Award, key: 'nav.badges' },
    { to: '/student/leaderboard', icon: Trophy, key: 'nav.leaderboard' },
    { to: '/student/downloads', icon: Download, key: 'nav.downloads' },
    { to: '/student/profile', icon: Settings, key: 'nav.profile' },
  ],
  TEACHER: [
    { to: '/teacher/dashboard', icon: LayoutDashboard, key: 'nav.dashboard' },
    { to: '/teacher/students', icon: Users, key: 'nav.students' },
    { to: '/teacher/weak-topics', icon: TriangleAlert, key: 'nav.weakTopics' },
    { to: '/teacher/assignments', icon: ClipboardList, key: 'nav.assignments' },
    { to: '/teacher/profile', icon: Settings, key: 'nav.profile' },
  ],
  ADMIN: [
    { to: '/admin/dashboard', icon: BarChart3, key: 'nav.dashboard' },
    { to: '/admin/users', icon: Users, key: 'nav.users' },
    { to: '/admin/content', icon: FileText, key: 'nav.content' },
    { to: '/admin/profile', icon: Settings, key: 'nav.profile' },
  ],
};

const ROLE_META = {
  STUDENT: { Icon: GraduationCap, tone: 'from-brand-500 to-violet-500' },
  TEACHER: { Icon: School, tone: 'from-emerald-500 to-teal-500' },
  ADMIN: { Icon: ShieldCheck, tone: 'from-slate-600 to-slate-800' },
};

export const AppSidebar = ({ isOpen, onClose }) => {
  const { user, t } = useApp();
  const role = user?.role ?? 'STUDENT';
  const meta = ROLE_META[role];

  return (
    <aside
      className={cn(
        'fixed lg:sticky lg:top-16 inset-y-0 lg:inset-y-auto left-0 z-50 lg:z-auto',
        'w-72 lg:w-60 shrink-0 lg:h-[calc(100vh-4rem)]',
        'bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800',
        'transform transition-transform duration-200 ease-out lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        'overflow-y-auto scroll-soft',
      )}
    >
      <div className="flex items-center justify-between p-4 lg:hidden">
        <span className="text-sm font-semibold">{t('nav.menu')}</span>
        <button onClick={onClose} aria-label={t('nav.closeMenu')} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="px-4 pt-4 lg:pt-6 pb-4 flex items-center gap-3">
        <div className={cn('h-9 w-9 rounded-xl bg-gradient-to-br text-white flex items-center justify-center shadow-sm', meta.tone)}>
          <meta.Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{user?.name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t(`roles.${role}`)}{user?.gradeLevel ? ` · ${t('common.grade', { grade: user.gradeLevel })}` : ''}
          </p>
        </div>
      </div>

      <nav className="px-2 pb-6 space-y-0.5" aria-label={t('nav.main')}>
        {NAV[role].map(({ to, icon: Icon, key }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{t(key)}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
