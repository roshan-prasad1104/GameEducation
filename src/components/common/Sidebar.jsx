import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  BookOpen, 
  HelpCircle, 
  Trophy, 
  Award, 
  DownloadCloud, 
  Settings, 
  BarChart3,
  LogOut,
  Sparkles
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { activeTab, setActiveTab, setAuthModalMode, t } = useApp();

  const menuItems = [
    { id: 'dashboard', label: t('dashboard') || 'Dashboard', icon: LayoutDashboard },
    { id: 'courses', label: t('myCourses') || 'My Courses', icon: BookOpen },
    { id: 'quiz', label: t('quizzesPractice') || 'Quizzes & Practice', icon: HelpCircle },
    { id: 'leaderboard', label: t('leaderboard') || 'Leaderboard', icon: Trophy },
    { id: 'achievements', label: t('achievements') || 'Achievements', icon: Award },
    { id: 'downloads', label: t('offlineDownloads') || 'Offline Downloads', icon: DownloadCloud },
    { id: 'profile', label: t('profile') || 'Settings', icon: Settings },
    { id: 'teacher', label: t('teacherPortal') || 'Teacher Portal', icon: BarChart3 }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`fixed lg:sticky top-16 z-40 w-64 h-[calc(100vh-4rem)] bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col transition-transform duration-200 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        
        {/* Navigation List */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Main Navigation
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id || (item.id === 'downloads' && activeTab === 'courses');

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'downloads') {
                    setActiveTab('courses');
                  } else {
                    setActiveTab(item.id);
                  }
                  if (onClose) onClose();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-400 font-bold border-l-4 border-blue-600'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Bottom Hackathon Project Tag / Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>B.Tech Project 2026</span>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            Built for Rural Education Hackathon
          </p>
        </div>

      </aside>
    </>
  );
};
