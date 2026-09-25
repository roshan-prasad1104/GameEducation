import { Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { WifiOff } from 'lucide-react';
import { AppSidebar } from './AppSidebar';
import { AppTopBar } from './AppTopBar';
import { useApp } from '../../context/AppContext';

/** Sidebar + top bar shell shared by the student, teacher and admin areas. */
export const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { online, user, t } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <AppTopBar onMenuClick={() => setSidebarOpen(true)} />
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
        <main key={location.pathname} className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 animate-[fadeIn_200ms_ease-out]">
          <Outlet />
        </main>
      </div>

      {sidebarOpen && (
        <button aria-label={t('nav.closeMenu')} onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden" />
      )}
    </div>
  );
};
