import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Menu, Moon, Sun, Globe, Wifi, WifiOff, LogOut, Bell, RefreshCw, ClipboardList } from 'lucide-react';
import { useEffect, useState } from 'react';
import { LANGUAGES } from '../../data/constants';
import { homeFor } from '../routing/roles';
import { studentApi } from '../../services/api';
import { cn } from '../../lib/cn';

export const AppTopBar = ({ onMenuClick }) => {
  const { user, darkMode, setDarkMode, language, setLanguage, online, pending, syncing, syncNow, logout, t } = useApp();
  const [langOpen, setLangOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const navigate = useNavigate();
  const isOffline = !online;
  const isStudent = user?.role === 'STUDENT';
  const profilePath = `/${(user?.role ?? 'STUDENT').toLowerCase()}/profile`;

  // Notifications: pending teacher assignments (students) + offline actions waiting to sync.
  useEffect(() => {
    if (!isStudent) return;
    let active = true;
    studentApi.assignments()
      .then((list) => { if (active) setAssignments(list.filter((a) => !a.completed)); })
      .catch(() => {});
    return () => { active = false; };
  }, [isStudent, pending]);
  const notificationCount = (isStudent ? assignments.length : 0) + (pending > 0 ? 1 : 0);

  const currentLang = LANGUAGES.find(l => l.id === language) ?? LANGUAGES[0];

  return (
    <header className="sticky top-0 z-30 bg-white/85 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Left: menu + logo */}
        <div className="flex items-center gap-2">
          <button
            onClick={onMenuClick}
            aria-label="Open navigation"
            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link to={homeFor(user?.role)} className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg brand-gradient flex items-center justify-center text-white font-bold text-sm shadow-sm">
              S
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold tracking-tight">{t('platformName') || 'ShikshaSetu'}</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('ruralStemTagline') || 'Rural STEM'}</div>
            </div>
          </Link>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1.5">
          {/* Offline toggle */}
          <button
            onClick={() => { if (online && pending > 0) syncNow(); }}
            title={isOffline ? t('offlineMode') : pending > 0 ? t('sync.pendingHint') : t('onlineMode')}
            aria-label={isOffline ? t('offlineMode') : t('onlineMode')}
            className={cn(
              'h-9 w-9 rounded-lg flex items-center justify-center transition-colors',
              isOffline
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
            )}
          >
            {isOffline ? <WifiOff className="h-4 w-4" />
              : syncing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />}
          </button>

          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => { setLangOpen(o => !o); setMenuOpen(false); }}
              className="h-9 px-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 text-sm"
              aria-haspopup="menu"
            >
              <Globe className="h-4 w-4 text-blue-500" />
              <span>{currentLang.native}</span>
            </button>
            {langOpen && (
              <div role="menu" className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg py-1 z-50">
                {LANGUAGES.slice(0, 4).map(l => (
                  <button
                    key={l.id}
                    onClick={() => { setLanguage(l.id); setLangOpen(false); }}
                    className={cn(
                      'w-full px-3 py-2 text-sm text-left flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800',
                      l.id === language && 'text-brand-600 dark:text-brand-400 font-medium bg-slate-50 dark:bg-slate-800'
                    )}
                  >
                    <span className="text-base">{l.flag}</span>
                    <span>{l.native}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle theme"
            className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              aria-label="Notifications"
              onClick={() => { setBellOpen(o => !o); setMenuOpen(false); setLangOpen(false); }}
              className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 relative"
            >
              <Bell className="h-4 w-4" />
              {notificationCount > 0 && <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500" />}
            </button>
            {bellOpen && (
              <div role="menu" className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg py-2 z-50">
                {notificationCount === 0 && (
                  <p className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">{t('notifications.none')}</p>
                )}
                {pending > 0 && (
                  <button onClick={() => { setBellOpen(false); if (online) syncNow(); }}
                    className="w-full px-3 py-2 text-sm text-left hover:bg-slate-50 dark:hover:bg-slate-800 flex items-start gap-2">
                    <RefreshCw className="h-4 w-4 mt-0.5 text-brand-500 shrink-0" />
                    <span>{t('sync.pending', { count: pending })} · {online ? t('sync.now') : t('offline.willSync')}</span>
                  </button>
                )}
                {assignments.map(a => (
                  <Link key={a.id} to={a.lessonId ? `/student/lessons/${a.lessonId}` : `/student/quiz/${a.quizId}`}
                    onClick={() => setBellOpen(false)}
                    className="px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 flex items-start gap-2">
                    <ClipboardList className="h-4 w-4 mt-0.5 text-brand-500 shrink-0" />
                    <span>
                      <span className="block font-medium">{a.title}</span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400">
                        {a.teacherName}{a.dueDate ? ` · ${t('assignments.due', { date: new Date(a.dueDate).toLocaleDateString() })}` : ''}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => { setMenuOpen(o => !o); setLangOpen(false); }}
              className="ml-1 h-9 w-9 rounded-full bg-gradient-to-br from-brand-500 to-violet-500 text-white text-sm font-semibold flex items-center justify-center overflow-hidden"
            >
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </button>
            {menuOpen && (
              <div role="menu" className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg py-2 z-50">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
                </div>
                <Link to={profilePath} onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">{t('profile')}</Link>
                <button
                  onClick={() => { logout(); setMenuOpen(false); navigate('/'); }}
                  className="w-full px-3 py-2 text-sm text-left hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-2"
                >
                  <LogOut className="h-3.5 w-3.5" /> {t('auth.signOut')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
