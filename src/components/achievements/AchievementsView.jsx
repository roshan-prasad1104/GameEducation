import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BADGES, REWARDS } from '../../data/mockData';
import { 
  Award, 
  Flame, 
  Calculator, 
  DownloadCloud, 
  Atom, 
  Trophy, 
  Users, 
  Coins, 
  Sun, 
  HardDrive, 
  CheckCircle2, 
  Lock, 
  Sparkles,
  Calendar,
  Gift
} from 'lucide-react';

export const AchievementsView = () => {
  const { user, showToast } = useApp();

  const [activeTab, setActiveTabTab] = useState('badges'); // 'badges' or 'rewards' or 'history'

  const handleRedeemReward = (reward) => {
    if (user.coins >= reward.costCoins) {
      showToast(`🎉 Reward Claimed: ${reward.title}! Check your Panchayat Hub.`, 'level');
    } else {
      showToast(`🔒 You need ${reward.costCoins - user.coins} more Coins to redeem!`, 'info');
    }
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left">
          <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full">
            Gamified Milestones
          </span>
          <h1 className="text-3xl font-black">Achievements & Rewards</h1>
          <p className="text-xs sm:text-sm text-amber-100 max-w-xl">
            Collect badges by completing daily streaks, quizzes, and offline chapter downloads!
          </p>
        </div>

        {/* Total Coins / XP Summary */}
        <div className="flex items-center gap-4 bg-white/20 backdrop-blur-md border border-white/30 p-4 rounded-2xl">
          <div className="text-center">
            <div className="text-2xl font-black text-amber-200">{user.coins}</div>
            <div className="text-[11px] font-semibold text-white">Coins Available</div>
          </div>
          <div className="h-8 w-[1px] bg-white/30" />
          <div className="text-center">
            <div className="text-2xl font-black text-white">{user.level}</div>
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
          <span>Badges & Medals ({BADGES.filter(b => b.unlocked).length}/{BADGES.length})</span>
        </button>

        <button
          onClick={() => setActiveTabTab('rewards')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'rewards'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <Gift className="w-4 h-4 text-amber-400" />
          <span>Redeem Rewards</span>
        </button>
      </div>

      {activeTab === 'badges' ? (
        /* Badges Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {BADGES.map((badge) => {
            return (
              <div
                key={badge.id}
                className={`glass-card p-6 rounded-3xl space-y-4 border transition-all ${
                  badge.unlocked
                    ? 'border-blue-200 dark:border-blue-800/80 shadow-md'
                    : 'opacity-60 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl ${badge.color}`}>
                    {badge.unlocked ? <Trophy className="w-6 h-6" /> : <Lock className="w-6 h-6 text-slate-400" />}
                  </div>
                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                    badge.unlocked ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {badge.unlocked ? 'Unlocked' : 'Locked'}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                    {badge.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {badge.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>Category: {badge.category}</span>
                  <span>{badge.unlocked ? `Unlocked: ${badge.unlockedDate}` : `Progress: ${badge.progress}`}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Rewards Store Grid */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {REWARDS.map((reward) => (
            <div key={reward.id} className="glass-card p-6 rounded-3xl space-y-4 border border-amber-200/60 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                  <Gift className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-black text-sm">
                  <Coins className="w-4 h-4 fill-amber-400" />
                  <span>{reward.costCoins} Coins</span>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                  {reward.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {reward.description}
                </p>
              </div>

              <button
                onClick={() => handleRedeemReward(reward)}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition-all hover:scale-[1.02]"
              >
                Claim Reward
              </button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
