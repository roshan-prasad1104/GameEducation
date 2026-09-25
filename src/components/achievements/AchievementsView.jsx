import { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { studentApi } from '../../services/api';
import { ErrorState, LoadingState, NamedIcon, StaleBanner } from '../ui';
import {
  Award,
  Lock,
  Zap,
  History
} from 'lucide-react';

const BADGE_COLORS = [
  'bg-blue-100 text-blue-600', 'bg-emerald-100 text-emerald-600', 'bg-amber-100 text-amber-600',
  'bg-violet-100 text-violet-600', 'bg-rose-100 text-rose-600', 'bg-indigo-100 text-indigo-600',
];

const SOURCE_LABEL = { LESSON: 'Lesson', QUIZ: 'Quiz', MISSION: 'Mission' };

export const AchievementsView = () => {
  const badges = useApi(() => studentApi.badges(), []);
  const xp = useApi(() => studentApi.xp(), []);
  const [activeTab, setActiveTabTab] = useState('badges'); // 'badges' or 'history'

  if (badges.loading && !badges.data) return <LoadingState rows={2} />;
  if (badges.error && !badges.data) return <ErrorState error={badges.error} onRetry={badges.reload} />;

  const unlocked = badges.data.filter((b) => b.earned).length;
  const level = xp.data?.level;

  return (
    <div className="space-y-8 pb-16">
      <StaleBanner savedAt={badges.data.__stale} />

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left">
          <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full">
            Gamified Milestones
          </span>
          <h1 className="text-3xl font-black">Achievements & Rewards</h1>
          <p className="text-xs sm:text-sm text-amber-100 max-w-xl">
            Collect badges by completing lessons, quizzes and daily streaks!
          </p>
        </div>

        {/* Total XP / Level Summary */}
        <div className="flex items-center gap-4 bg-white/20 backdrop-blur-md border border-white/30 p-4 rounded-2xl">
          <div className="text-center">
            <div className="text-2xl font-black text-amber-200">{level?.xp ?? '—'}</div>
            <div className="text-[11px] font-semibold text-white">Total XP</div>
          </div>
          <div className="h-8 w-[1px] bg-white/30" />
          <div className="text-center">
            <div className="text-2xl font-black text-white">{level?.level ?? '—'}</div>
            <div className="text-[11px] font-semibold text-white">Current Level</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTabTab('badges')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'badges'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Badges & Medals ({unlocked}/{badges.data.length})</span>
        </button>

        <button
          onClick={() => setActiveTabTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'history'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <History className="w-4 h-4 text-amber-400" />
          <span>XP History</span>
        </button>
      </div>

      {activeTab === 'badges' ? (
        /* Badges Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {badges.data.map((badge, i) => (
            <div
              key={badge.code}
              className={`glass-card p-6 rounded-3xl space-y-4 border transition-all ${
                badge.earned
                  ? 'border-blue-200 dark:border-blue-800/80 shadow-md'
                  : 'opacity-60 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl ${badge.earned ? BADGE_COLORS[i % BADGE_COLORS.length] : 'bg-slate-100 dark:bg-slate-800'}`}>
                  {badge.earned ? <NamedIcon name={badge.icon} className="w-6 h-6" /> : <Lock className="w-6 h-6 text-slate-400" />}
                </div>
                <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                  badge.earned ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}>
                  {badge.earned ? 'Unlocked' : 'Locked'}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                  {badge.name}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {badge.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Badge</span>
                <span>{badge.earned ? `Unlocked: ${new Date(badge.earnedAt).toLocaleDateString()}` : 'Keep learning to unlock'}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* XP History */
        <div className="space-y-4">
          <div className="glass-card p-6 rounded-3xl border border-amber-200/60 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">This week</h3>
              <span className="text-amber-600 dark:text-amber-400 font-black text-sm flex items-center gap-1">
                <Zap className="w-4 h-4 fill-amber-400" /> +{xp.data?.xpThisWeek ?? 0} XP
              </span>
            </div>
            {level && (
              <>
                <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                    style={{ width: `${Math.round((100 * level.xpIntoLevel) / level.xpForLevel)}%` }} />
                </div>
                <p className="text-xs text-slate-500">{level.nextLevelXp - level.xp} XP to Level {level.level + 1}</p>
              </>
            )}
            <p className="text-xs text-slate-500 leading-relaxed">
              How to earn XP: 20 per lesson · 10 per correct answer + 20 for finishing a quiz (first attempt) · extra XP for beating your best score · daily missions.
            </p>
          </div>

          <div className="glass-card rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg">
            <div className="p-4 bg-slate-100 dark:bg-slate-800/80 font-bold text-xs text-slate-500 dark:text-slate-400 grid grid-cols-12 gap-2 uppercase tracking-wider">
              <span className="col-span-7">Activity</span>
              <span className="col-span-2 text-center">Type</span>
              <span className="col-span-3 text-right pr-2">XP</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {(xp.data?.recent ?? []).map((x, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center p-4 text-xs font-semibold">
                  <div className="col-span-7">
                    <p className="font-bold text-slate-900 dark:text-white">{x.description}</p>
                    <p className="text-[11px] text-slate-500 font-normal">{new Date(x.createdAt).toLocaleString()}</p>
                  </div>
                  <span className="col-span-2 text-center text-slate-500">{SOURCE_LABEL[x.source] ?? x.source}</span>
                  <span className="col-span-3 text-right pr-2 font-black text-amber-600 dark:text-amber-400">+{x.amount} XP</span>
                </div>
              ))}
              {xp.data && xp.data.recent.length === 0 && (
                <p className="p-4 text-xs text-slate-500">No XP yet — complete a lesson to start earning.</p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
