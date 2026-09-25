import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useApi } from '../../hooks/useApi';
import { authApi, studentApi } from '../../services/api';
import { LANGUAGES, GRADES } from '../../data/constants';
import {
  School,
  MapPin,
  Globe,
  Moon,
  Sun,
  Volume2,
  Flame,
  Edit2,
  Save,
  Mail
} from 'lucide-react';

export const ProfileView = () => {
  const {
    user,
    setUser,
    language,
    setLanguage,
    darkMode,
    setDarkMode,
    audioNarrator,
    setAudioNarrator,
    online,
    showToast,
    t
  } = useApp();
  const isStudent = user.role === 'STUDENT';
  const { data: dash } = useApi(() => (isStudent ? studentApi.dashboard() : Promise.resolve(null)), [isStudent]);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [school, setSchool] = useState(user.school ?? '');
  const [district, setDistrict] = useState(user.district ?? '');
  const [grade, setGrade] = useState(user.gradeLevel ?? 8);
  const [saving, setSaving] = useState(false);

  const save = async (patch) => {
    const updated = await authApi.updateMe({
      name: patch.name ?? user.name,
      preferredLanguage: patch.preferredLanguage ?? user.preferredLanguage ?? language,
      gradeLevel: isStudent ? Number(patch.gradeLevel ?? user.gradeLevel ?? 8) : null,
      school: patch.school ?? user.school ?? '',
      district: patch.district ?? user.district ?? '',
    });
    setUser({ ...user, ...updated });
    return updated;
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) { showToast('Please enter your name.', 'warn'); return; }
    setSaving(true);
    try {
      await save({ name: name.trim(), school, district, gradeLevel: grade });
      setIsEditing(false);
      showToast('✨ Profile details updated successfully!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const changeLanguage = async (lang) => {
    setLanguage(lang);
    if (!online) return;
    try { await save({ preferredLanguage: lang }); } catch { /* keep the local preference */ }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
          {isStudent ? t('profileHeader') : t('profile')}
        </h1>
        <button
          onClick={() => setIsEditing(!isEditing)}
          disabled={!online}
          className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-60"
        >
          {isEditing ? <Save className="w-4 h-4 text-emerald-500" /> : <Edit2 className="w-4 h-4 text-blue-600" />}
          <span>{isEditing ? t('cancelEdit') : t('editProfile')}</span>
        </button>
      </div>

      {/* Main Profile Info Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-200 dark:border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl ring-4 ring-blue-500/30 shadow-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white text-4xl font-black flex items-center justify-center shrink-0">
            {user.name?.[0]?.toUpperCase()}
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1 w-full">
            {!isEditing ? (
              <>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {user.name}
                </h2>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4 text-blue-500" />
                    {user.email}
                  </span>
                  {user.school && (
                    <span className="flex items-center gap-1">
                      <School className="w-4 h-4 text-blue-500" />
                      {user.school}
                    </span>
                  )}
                  {user.district && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-amber-500" />
                      {user.district}
                    </span>
                  )}
                </div>
                <div className="pt-2 flex flex-wrap justify-center sm:justify-start gap-2">
                  <span className="bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 text-xs font-extrabold px-3 py-1 rounded-xl">
                    {isStudent ? `Grade ${user.gradeLevel ?? '—'}` : t(`roles.${user.role}`)}
                  </span>
                  {isStudent && (
                    <span className="bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 text-xs font-extrabold px-3 py-1 rounded-xl flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 fill-amber-400" />
                      {dash?.streak ?? user.streak ?? 0} {t('dailyStreak')}
                    </span>
                  )}
                </div>
              </>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-3 text-left">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Full Name:</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={120}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm font-semibold"
                  />
                </div>
                {isStudent && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">School Name:</label>
                      <input
                        type="text"
                        value={school}
                        onChange={(e) => setSchool(e.target.value)}
                        maxLength={160}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm font-semibold"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">District:</label>
                        <input
                          type="text"
                          value={district}
                          onChange={(e) => setDistrict(e.target.value)}
                          maxLength={120}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Grade:</label>
                        <select
                          value={grade}
                          onChange={(e) => setGrade(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm font-semibold"
                        >
                          {GRADES.map((g) => <option key={g.id} value={g.id.slice(1)}>{g.label}</option>)}
                        </select>
                      </div>
                    </div>
                  </>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Overall Statistics Bar */}
        {isStudent && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl text-center">
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{dash?.level.xp ?? user.xp ?? 0}</div>
              <div className="text-xs font-semibold text-slate-500">{t('xpPoints')}</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl text-center">
              <div className="text-2xl font-black text-amber-500">{dash?.level.level ?? user.level ?? 1}</div>
              <div className="text-xs font-semibold text-slate-500">{t('currentLevel')}</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl text-center">
              <div className="text-2xl font-black text-emerald-500">{dash?.lessonsCompleted ?? '—'}</div>
              <div className="text-xs font-semibold text-slate-500">{t('lessonsCompleted')}</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl text-center">
              <div className="text-2xl font-black text-purple-500">{dash ? (dash.quizzesTaken ? `${dash.averageScore}%` : '—') : '—'}</div>
              <div className="text-xs font-semibold text-slate-500">{t('quizAccuracy')}</div>
            </div>
          </div>
        )}
      </div>

      {/* Settings & Preferences */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-200 dark:border-slate-800 shadow-xl">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
          {t('appSettings')}
        </h3>

        <div className="space-y-4">

          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl">
            <div className="flex items-center gap-3">
              {darkMode ? <Moon className="w-5 h-5 text-amber-400" /> : <Sun className="w-5 h-5 text-slate-600" />}
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{t('darkTheme')}</h4>
                <p className="text-xs text-slate-500">{t('darkThemeSub')}</p>
              </div>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              role="switch"
              aria-checked={darkMode}
              aria-label={t('darkTheme')}
              className={`w-12 h-6 rounded-full p-1 transition-colors shrink-0 ${darkMode ? 'bg-blue-600' : 'bg-slate-300'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${darkMode ? 'translate-x-6' : ''}`} />
            </button>
          </div>

          {/* Language Preference */}
          <div className="flex items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{t('primaryLang')}</h4>
                <p className="text-xs text-slate-500">{t('primaryLangSub')}</p>
              </div>
            </div>
            <select
              value={language}
              onChange={(e) => changeLanguage(e.target.value)}
              aria-label={t('language')}
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
            >
              {LANGUAGES.map((l) => (
                <option key={l.id} value={l.id}>{l.native} ({l.name})</option>
              ))}
            </select>
          </div>

          {/* Audio Narration Toggle (enables "Regional Voice" read-aloud on lessons) */}
          {isStudent && (
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl">
              <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-emerald-500" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{t('audioNarration')}</h4>
                  <p className="text-xs text-slate-500">{t('audioNarrationSub')}</p>
                </div>
              </div>
              <button
                onClick={() => setAudioNarrator(!audioNarrator)}
                role="switch"
                aria-checked={audioNarrator}
                aria-label={t('audioNarration')}
                className={`w-12 h-6 rounded-full p-1 transition-colors shrink-0 ${audioNarrator ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${audioNarrator ? 'translate-x-6' : ''}`} />
              </button>
            </div>
          )}

        </div>
      </div>

    </div>
  );
};
