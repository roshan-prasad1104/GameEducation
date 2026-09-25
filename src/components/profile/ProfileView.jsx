import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LANGUAGES, GRADES } from '../../data/mockData';
import {
  User,
  School,
  MapPin,
  Phone,
  Mail,
  Globe,
  Moon,
  Sun,
  WifiOff,
  Volume2,
  Award,
  Flame,
  Coins,
  BookOpen,
  CheckCircle2,
  Edit2,
  Save,
  Shield
} from 'lucide-react';

export const ProfileView = () => {
  const {
    user,
    setUser,
    language,
    setLanguage,
    darkMode,
    setDarkMode,
    isOffline,
    toggleOffline,
    audioNarrator,
    setAudioNarrator,
    selectedGrade,
    setSelectedGrade,
    showToast,
    t
  } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [school, setSchool] = useState(user.school);
  const [district, setDistrict] = useState(user.district);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setUser(prev => ({
      ...prev,
      name,
      school,
      district
    }));
    setIsEditing(false);
    showToast('✨ Profile details updated successfully!', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
          {t('profileHeader') || t('profile') || 'Student Profile & Settings'}
        </h1>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
        >
          {isEditing ? <Save className="w-4 h-4 text-emerald-500" /> : <Edit2 className="w-4 h-4 text-blue-600" />}
          <span>{isEditing ? (t('cancelEdit') || 'Cancel Edit') : (t('editProfile') || 'Edit Profile')}</span>
        </button>
      </div>

      {/* Main Profile Info Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-200 dark:border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover ring-4 ring-blue-500/30 shadow-lg"
          />

          <div className="space-y-2 text-center sm:text-left flex-1">
            {!isEditing ? (
              <>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {user.name}
                </h2>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  <span className="flex items-center gap-1">
                    <School className="w-4 h-4 text-blue-500" />
                    {user.school}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-amber-500" />
                    {user.district}
                  </span>
                </div>
                <div className="pt-2 flex flex-wrap justify-center sm:justify-start gap-2">
                  <span className="bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 text-xs font-extrabold px-3 py-1 rounded-xl">
                    {user.grade}
                  </span>
                  <span className="bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 text-xs font-extrabold px-3 py-1 rounded-xl flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 fill-amber-400" />
                    {user.streak} {t('dailyStreak') || 'Days Streak'}
                  </span>
                </div>
              </>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Student Full Name:</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">School Name:</label>
                  <input
                    type="text"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm font-semibold"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow"
                >
                  Save Changes
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Overall Statistics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl text-center">
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{user.xp}</div>
            <div className="text-xs font-semibold text-slate-500">{t('xpPoints') || 'Total XP Points'}</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl text-center">
            <div className="text-2xl font-black text-amber-500">{user.coins}</div>
            <div className="text-xs font-semibold text-slate-500">{t('rewardCoins') || 'Reward Coins'}</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl text-center">
            <div className="text-2xl font-black text-emerald-500">{user.completedLessonsCount}</div>
            <div className="text-xs font-semibold text-slate-500">{t('lessonsCompleted') || 'Lessons Completed'}</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl text-center">
            <div className="text-2xl font-black text-purple-500">{user.accuracyRate}%</div>
            <div className="text-xs font-semibold text-slate-500">{t('quizAccuracy') || 'Quiz Accuracy'}</div>
          </div>
        </div>
      </div>

      {/* Settings & Preferences */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-200 dark:border-slate-800 shadow-xl">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
          {t('appSettings') || 'App Settings & Accessibility'}
        </h3>

        <div className="space-y-4">

          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl">
            <div className="flex items-center gap-3">
              {darkMode ? <Moon className="w-5 h-5 text-amber-400" /> : <Sun className="w-5 h-5 text-slate-600" />}
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{t('darkTheme') || t('darkMode') || 'Dark Theme'}</h4>
                <p className="text-xs text-slate-500">{t('darkThemeSub') || 'Reduces screen glare for night study'}</p>
              </div>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${darkMode ? 'bg-blue-600' : 'bg-slate-300'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${darkMode ? 'translate-x-6' : ''}`} />
            </button>
          </div>

          {/* Language Preference */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-blue-600" />
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{t('primaryLang') || t('language') || 'Primary Interface Language'}</h4>
                <p className="text-xs text-slate-500">{t('primaryLangSub') || 'Switch UI labels between regional languages'}</p>
              </div>
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
            >
              {LANGUAGES.map((l) => (
                <option key={l.id} value={l.id}>{l.native} ({l.name})</option>
              ))}
            </select>
          </div>

          {/* Audio Narration Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-emerald-500" />
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{t('audioNarration') || 'Regional Audio Narration'}</h4>
                <p className="text-xs text-slate-500">{t('audioNarrationSub') || 'Read lesson notes out loud in regional voice'}</p>
              </div>
            </div>
            <button
              onClick={() => setAudioNarrator(!audioNarrator)}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${audioNarrator ? 'bg-emerald-500' : 'bg-slate-300'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${audioNarrator ? 'translate-x-6' : ''}`} />
            </button>
          </div>

        </div>
      </div>

    </div>
  );
};
