import { Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { WifiOff } from 'lucide-react';
import { AppSidebar } from './AppSidebar';
import { AppTopBar } from './AppTopBar';
import { cn } from '../../lib/cn';
import { useApp } from '../../context/AppContext';

/**
 * AppLayout — sidebar + topbar shell used for student/teacher/admin authenticated areas.
 * Landing & auth routes bypass this layout.
 */
export const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { online, user, t } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <AppTopBar onMenuClick={() => setSidebarOpen(true)} />

      {/* Offline indicator (real connectivity) */}
      {!online && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200 text-xs sm:text-sm">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-2">
            <WifiOff className="h-4 w-4 shrink-0" />
            <span>{user?.role === 'STUDENT' ? t('offline.bannerStudent') : t('offline.bannerStaff')}</span>
          </div>
        </div>
      )}

      <div className="flex-1 w-full max-w-[1440px] mx-auto flex">
        <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main
          key={location.pathname}
          className={cn(
            'flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 lg:py-8',
            'animate-[fadeIn_200ms_ease-out]'
          )}
        >
          <Outlet />
        </main>
      </div>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span>{t('layout.footer')}</span>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-slate-700 dark:hover:text-slate-200">{t('layout.privacy')}</a>
            <a href="#" className="hover:text-slate-700 dark:hover:text-slate-200">{t('layout.terms')}</a>
            <a href="#" className="hover:text-slate-700 dark:hover:text-slate-200">{t('layout.support')}</a>
          </div>
        </div>
      </footer>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <button
          aria-label={t('nav.closeMenu')}
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
        />
      )}
    </div>
  );
};
