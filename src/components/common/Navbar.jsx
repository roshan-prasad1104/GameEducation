import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LANGUAGES } from '../../data/mockData';
import { 
  GraduationCap, 
  Search, 
  Bell, 
  Globe, 
  Wifi, 
  WifiOff, 
  Sun, 
  Moon, 
  Menu, 
  X, 
  User, 
  Check, 
  ChevronDown,
  CheckCircle2
} from 'lucide-react';

export const Navbar = ({ onToggleSidebar }) => {
  const { 
    activeTab, 
    setActiveTab, 
    setAuthModalMode, 
    user, 
    language, 
    setLanguage, 
    darkMode, 
    setDarkMode, 
    isOffline, 
    toggleOffline,
    t 
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const notifications = [
    { id: 1, title: "Assignment Due Tomorrow", text: "Linear Equations Practice Quiz is due at 5:00 PM.", time: "10m ago", unread: true },
    { id: 2, title: "Badge Earned! 🏆", text: "You unlocked the Math Wizard badge for scoring 100%.", time: "2h ago", unread: true },
    { id: 3, title: "Teacher Feedback", text: "Sunita Teacher assigned revision for Chemical Reactions.", time: "1d ago", unread: false }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Left: Mobile Sidebar Toggle + Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div 
              onClick={() => setActiveTab('dashboard')} 
              className="flex items-center gap-2.5 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                  {t('platformName') || 'ShikshaSetu'}
                </span>
                <span className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 -mt-1">
                  {t('ruralStemTagline') || 'Rural Learning Portal'}
                </span>
              </div>
            </div>
          </div>

          {/* Center: Search Input Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search courses, lessons, topics..."
                className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-slate-800 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Right: Actions (Notifications, Offline, Lang, Dark Mode, Profile) */}
          <div className="flex items-center gap-2.5">
            
            {/* Offline Mode Simulator Button */}
            <button
              onClick={toggleOffline}
              title={isOffline ? "Switch to Online Mode" : "Switch to Offline Mode"}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                isOffline
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-800 dark:text-amber-300'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-300'
              }`}
            >
              {isOffline ? <WifiOff className="w-3.5 h-3.5 text-amber-600" /> : <Wifi className="w-3.5 h-3.5 text-emerald-600" />}
              <span className="hidden sm:inline">{isOffline ? t('offlineMode') : t('onlineMode')}</span>
            </button>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowLangMenu(false);
                }}
                className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg shadow-lg py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">Notifications</span>
                    <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded">2 New</span>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-slate-800 max-h-64 overflow-y-auto">
                    {notifications.map((item) => (
                      <div key={item.id} className={`p-3 text-xs hover:bg-gray-50 dark:hover:bg-slate-800 ${item.unread ? 'bg-blue-50/40 dark:bg-slate-800/40' : ''}`}>
                        <div className="flex items-center justify-between font-semibold text-gray-900 dark:text-white mb-0.5">
                          <span>{item.title}</span>
                          <span className="text-[10px] text-gray-400">{item.time}</span>
                        </div>
                        <p className="text-[11px] text-gray-600 dark:text-gray-400">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowLangMenu(!showLangMenu);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg"
              >
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">{LANGUAGES.find(l => l.id === language)?.native || 'English'}</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>

              {showLangMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg shadow-lg py-1 z-50">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => {
                        setLanguage(lang.id);
                        setShowLangMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800 ${
                        language === lang.id ? 'font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-slate-800' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span>{lang.native}</span>
                      {language === lang.id && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Toggle Light/Dark Theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* User Profile Badge */}
            <div 
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-2 pl-2 cursor-pointer border-l border-gray-200 dark:border-slate-800"
            >
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="w-8 h-8 rounded-lg object-cover ring-1 ring-gray-300 dark:ring-slate-700"
              />
              <div className="hidden lg:block text-left">
                <span className="block text-xs font-bold text-gray-900 dark:text-white leading-tight">
                  {user.name}
                </span>
                <span className="block text-[10px] text-gray-500 dark:text-gray-400">
                  {user.grade}
                </span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
