import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Moon, Sun, Wifi, WifiOff, LogOut, RefreshCw, UserRound, Languages } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LANGUAGES } from '../../i18n';
import { cn } from '../../lib/cn';
import { homeFor } from '../routing/roles';

export const AppTopBar = ({ onMenuClick }) => {
  const { user, darkMode, setDarkMode, language, setLanguage, online, pending, syncing, syncNow, logout, t } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const isStudent = user?.role === 'STUDENT';
  const profilePath = `/${(user?.role ?? 'STUDENT').toLowerCase()}/profile`;

  return (
    <header className="sticky top-0 z-30 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={onMenuClick} aria-label={t('nav.openMenu')} className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <Menu className="h-5 w-5" />
          </button>
          <Link to={homeFor(user?.role)} className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg brand-gradient flex items-center justify-center text-white font-bold text-sm shadow-sm">S</div>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold tracking-tight">ShikshaSetu</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('brand.tagline')}</div>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Connectivity + sync state (students can work offline) */}
          <div
            className={cn('h-9 px-2.5 rounded-lg inline-flex items-center gap-1.5 text-xs font-medium',
              online ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300')}
            title={online ? t('offline.online') : t('offline.offline')}
          >
            {online ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            <span className="hidden md:inline">{online ? t('offline.online') : t('offline.offline')}</span>
          </div>
          {isStudent && pending > 0 && (
            <button
              onClick={() => syncNow()}
              disabled={!online || syncing}
              className="h-9 px-2.5 rounded-lg inline-flex items-center gap-1.5 text-xs font-medium bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 disabled:opacity-70"
              title={t('sync.pendingHint')}
            >
              <RefreshCw className={cn('h-3.5 w-3.5', syncing && 'animate-spin')} />
              <span>{t('sync.pending', { count: pending })}</span>
            </button>
          )}

          <button
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            className="h-9 px-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 text-sm"
            aria-label={t('common.language')}
            title={t('common.language')}
          >
            <Languages className="h-4 w-4 text-brand-500" />
            <span>{LANGUAGES.find((l) => l.id === language)?.short}</span>
          </button>

          <button
            onClick={() => setDarkMode(!darkMode)}
            aria-label={t('common.toggleTheme')}
            className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <div className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label={t('nav.account')}
              className="ml-1 h-9 w-9 rounded-full bg-gradient-to-br from-brand-500 to-violet-500 text-white text-sm font-semibold flex items-center justify-center"
            >
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </button>
            {menuOpen && (
              <>
                <button aria-hidden tabIndex={-1} className="fixed inset-0 z-40 cursor-default" onClick={() => setMenuOpen(false)} />
                <div role="menu" className="absolute right-0 mt-2 w-60 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg py-2 z-50">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-sm font-medium truncate">{user?.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                  </div>
                  <Link role="menuitem" to={profilePath} onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                    <UserRound className="h-3.5 w-3.5" /> {t('nav.profile')}
                  </Link>
                  <button role="menuitem" onClick={() => { setMenuOpen(false); logout(); navigate('/login'); }}
                    className="w-full px-3 py-2 text-sm text-left hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-2">
                    <LogOut className="h-3.5 w-3.5" /> {t('auth.signOut')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
