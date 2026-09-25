import { NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard, BookOpen, Trophy, Award, Users, BarChart3,
  ClipboardList, FileText, Settings, ShieldCheck, X, Target, Flame,
  Sparkles, GraduationCap, School
} from 'lucide-react';
import { cn } from '../../lib/cn';

/**
 * Role-based navigation config. Single source of truth for sidebar items.
 * Kept here (not in mockData) because nav copy may be translated per-locale later.
 */
const NAV = {
  student: [
    { to: '/student/dashboard',       icon: LayoutDashboard, label: 'Dashboard', key: 'dashboard' },
    { to: '/student/subjects',        icon: BookOpen,        label: 'Subjects', key: 'subjects' },
    { to: '/student/missions',        icon: Target,          label: 'Missions', key: 'missions' },
    { to: '/student/badges',          icon: Award,           label: 'Badges', key: 'badges' },
    { to: '/student/leaderboard',     icon: Trophy,          label: 'Leaderboard', key: 'leaderboard' },
    { to: '/student/recommendations', icon: Sparkles,        label: 'For You', key: 'forYou' },
    { to: '/student/profile',         icon: Settings,        label: 'Profile', key: 'profile' },
  ],
  teacher: [
    { to: '/teacher/dashboard',     icon: LayoutDashboard, label: 'Dashboard', key: 'dashboard' },
    { to: '/teacher/classes',       icon: Users,           label: 'My Classes', key: 'myClasses' },
    { to: '/teacher/lessons',       icon: BookOpen,        label: 'Lessons', key: 'courses' },
    { to: '/teacher/quizzes',       icon: ClipboardList,   label: 'Quizzes', key: 'quizzesPractice' },
    { to: '/teacher/reports',       icon: BarChart3,       label: 'Reports', key: 'reports' },
  ],
  admin: [
    { to: '/admin/dashboard',       icon: LayoutDashboard, label: 'Dashboard', key: 'dashboard' },
    { to: '/admin/users',           icon: Users,           label: 'Users', key: 'users' },
    { to: '/admin/content',         icon: FileText,        label: 'Content', key: 'content' },
    { to: '/admin/gamification',    icon: ShieldCheck,     label: 'Gamification', key: 'achievements' },
    { to: '/admin/analytics',       icon: BarChart3,       label: 'Analytics', key: 'reports' },
  ],
};

export const AppSidebar = ({ isOpen, onClose }) => {
  const { user, t } = useApp();
  const role = user?.role ?? 'student';
  const rawItems = NAV[role] ?? NAV.student;
  const items = rawItems.map(item => ({
    ...item,
    label: t(item.key) || item.label
  }));

  // Streak card only meaningful for students
  const showStreakCard = role === 'student' && typeof user?.streak === 'number';

  return (
    <aside
      className={cn(
        'fixed lg:sticky lg:top-16 inset-y-0 lg:inset-y-auto left-0 z-50 lg:z-auto',
        'w-72 lg:w-64 shrink-0 lg:h-[calc(100vh-4rem)]',
        'bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800',
        'transform transition-transform duration-200 ease-out lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        'overflow-y-auto scroll-soft'
      )}
    >
      <div className="flex items-center justify-between p-4 lg:hidden">
        <span className="text-sm font-semibold">Menu</span>
        <button onClick={onClose} aria-label="Close menu" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="px-4 pt-4 lg:pt-6 pb-3">
        <RoleHeader role={role} user={user} />
      </div>

      <nav className="px-2 pb-6 space-y-0.5" aria-label={`${role} navigation`}>
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {showStreakCard && (
        <div className="mx-3 mb-6 p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-100 dark:border-amber-900/40">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="h-4 w-4 text-amber-600" />
            <span className="text-xs font-semibold text-amber-900 dark:text-amber-200">Daily Streak</span>
          </div>
          <p className="text-2xl font-bold text-amber-900 dark:text-amber-100 tabular-nums">{user.streak} days</p>
          <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-1">Keep learning every day to grow it!</p>
        </div>
      )}
    </aside>
  );
};

const RoleHeader = ({ role, user }) => {
  const { t } = useApp();
  const roleLabel = t(role) || (role === 'student' ? 'Student' : role === 'teacher' ? 'Teacher' : 'Admin');
  const meta = {
    student: { Icon: GraduationCap, label: roleLabel, tone: 'from-brand-500 to-violet-500' },
    teacher: { Icon: School,        label: roleLabel, tone: 'from-emerald-500 to-teal-500' },
    admin:   { Icon: ShieldCheck,   label: roleLabel, tone: 'from-slate-700 to-slate-900' },
  }[role] ?? { Icon: GraduationCap, label: roleLabel, tone: 'from-slate-500 to-slate-700' };

  return (
    <div className="flex items-center gap-3 px-2">
      <div className={cn('h-9 w-9 rounded-xl bg-gradient-to-br text-white flex items-center justify-center shadow-sm', meta.tone)}>
        <meta.Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold truncate">{user?.name ?? 'Guest'}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{meta.label} · {user?.grade ?? '—'}</p>
      </div>
    </div>
  );
};
