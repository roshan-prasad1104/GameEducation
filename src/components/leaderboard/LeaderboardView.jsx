import { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { studentApi } from '../../services/api';
import { EmptyState, ErrorState, LoadingState, StaleBanner } from '../ui';
import {
  Trophy,
  Crown,
  Flame
} from 'lucide-react';

/** Initials avatar in the same rounded shape the original photo avatars used. */
const Avatar = ({ name, className }) => (
  <div className={`bg-gradient-to-br from-indigo-500 to-violet-500 text-white font-black flex items-center justify-center ${className}`}>
    {name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
  </div>
);

const SCOPES = [
  { id: 'week', label: 'Weekly Rankings' },
  { id: 'all', label: 'All Time' },
  { id: 'class', label: 'Classmates' },
];

export const LeaderboardView = () => {
  const [scope, setScope] = useState('week');
  const { data, error, loading, reload } = useApi(() => studentApi.leaderboard(scope), [scope]);

  if (loading && !data) return <LoadingState rows={3} />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;

  const entries = data.entries;
  const top3 = entries.slice(0, 3);
  const remainingList = entries.slice(3);
  const meOutside = data.me && !entries.some((e) => e.currentUser) ? data.me : null;
  const place = (e) => e ? (e.school ?? `Grade ${e.gradeLevel ?? '—'}`) : '';

  return (
    <div className="space-y-8 pb-16">
      <StaleBanner savedAt={data.__stale} />

      {/* Top Banner */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-3.5 py-1 rounded-full text-xs font-bold text-amber-700 dark:text-amber-300">
          <Trophy className="w-4 h-4 text-amber-500 fill-amber-400" />
          <span>School & Regional Rankings</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">
          Village Learning Champions
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Climb the leaderboard by maintaining your daily study streak and solving quizzes!
        </p>
      </div>

      {/* Leaderboard Filter Tabs */}
      <div className="flex justify-center">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-x-auto max-w-full">
          {SCOPES.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setScope(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                scope === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {entries.length === 0 ? (
        <EmptyState icon={Trophy} title="No rankings yet" description="Complete lessons and quizzes to appear here." />
      ) : (
        <>
          {/* Top 3 Podium Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 max-w-4xl mx-auto">

            {/* Rank 2 (Left) */}
            {top3[1] && (
              <div className="order-2 md:order-1 glass-card p-6 rounded-3xl text-center space-y-4 border-2 border-slate-300 dark:border-slate-700 relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-300 text-slate-800 text-xs font-black px-3 py-0.5 rounded-full shadow">
                  🥈 2nd Place
                </div>
                <Avatar name={top3[1].name} className="w-20 h-20 rounded-2xl mx-auto ring-4 ring-slate-300 shadow-lg text-xl" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {top3[1].name} {top3[1].currentUser && "(You)"}
                  </h3>
                  <p className="text-xs text-slate-500">{place(top3[1])}</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/60 p-2.5 rounded-xl border border-blue-200 dark:border-blue-800 flex justify-around text-xs font-bold">
                  <span className="text-blue-600">{top3[1].xp} XP</span>
                  <span className="text-amber-500">🔥 {top3[1].streak}d</span>
                </div>
              </div>
            )}

            {/* Rank 1 (Center Podium - Champion) */}
            <div className="order-1 md:order-2 glass-card p-8 rounded-3xl text-center space-y-4 border-2 border-amber-400 shadow-2xl relative scale-105 bg-gradient-to-b from-amber-50/50 via-white to-white dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900">
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-900 text-xs font-black px-4 py-1 rounded-full shadow-lg flex items-center gap-1">
                <Crown className="w-4 h-4 fill-amber-400" />
                <span>🥇 1st Champion</span>
              </div>
              <Avatar name={top3[0].name} className="w-24 h-24 rounded-2xl mx-auto ring-4 ring-amber-400 shadow-xl text-2xl" />
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {top3[0].name} {top3[0].currentUser && "(You)"}
                </h3>
                <p className="text-xs text-slate-500 font-semibold">{place(top3[0])}</p>
              </div>
              <div className="bg-amber-100 dark:bg-amber-950/60 p-3 rounded-2xl border border-amber-300 flex justify-around text-xs font-black">
                <span className="text-amber-700 dark:text-amber-300">{top3[0].xp} XP</span>
                <span className="text-amber-600">🔥 {top3[0].streak}d</span>
              </div>
            </div>

            {/* Rank 3 (Right) */}
            {top3[2] && (
              <div className="order-3 glass-card p-6 rounded-3xl text-center space-y-4 border-2 border-amber-700/40 dark:border-amber-900/60 relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-700 text-white text-xs font-black px-3 py-0.5 rounded-full shadow">
                  🥉 3rd Place
                </div>
                <Avatar name={top3[2].name} className="w-20 h-20 rounded-2xl mx-auto ring-4 ring-amber-700/60 shadow-lg text-xl" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {top3[2].name} {top3[2].currentUser && "(You)"}
                  </h3>
                  <p className="text-xs text-slate-500">{place(top3[2])}</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/60 p-2.5 rounded-xl border border-blue-200 dark:border-blue-800 flex justify-around text-xs font-bold">
                  <span className="text-blue-600">{top3[2].xp} XP</span>
                  <span className="text-amber-500">🔥 {top3[2].streak}d</span>
                </div>
              </div>
            )}

          </div>

          {/* Full Leaderboard Table */}
          {(remainingList.length > 0 || meOutside) && (
            <div className="max-w-4xl mx-auto glass-card rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg">
              <div className="p-4 bg-slate-100 dark:bg-slate-800/80 font-bold text-xs text-slate-500 dark:text-slate-400 grid grid-cols-12 gap-2 uppercase tracking-wider">
                <span className="col-span-2 text-center">Rank</span>
                <span className="col-span-6">Student & School</span>
                <span className="col-span-2 text-center">Streak</span>
                <span className="col-span-2 text-right pr-4">XP Points</span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {[...remainingList, ...(meOutside ? [meOutside] : [])].map((item) => (
                  <div
                    key={item.studentId}
                    className={`grid grid-cols-12 gap-2 items-center p-4 text-xs font-semibold transition-colors ${
                      item.currentUser
                        ? 'bg-blue-50/80 dark:bg-blue-950/40 border-l-4 border-l-blue-600'
                        : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <span className="col-span-2 text-center font-black text-slate-600 dark:text-slate-300 text-sm">
                      #{item.rank}
                    </span>
                    <div className="col-span-6 flex items-center gap-3 min-w-0">
                      <Avatar name={item.name} className="w-9 h-9 rounded-xl text-xs shrink-0" />
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                          {item.name} {item.currentUser && "(You)"}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-normal truncate">{place(item)}</p>
                      </div>
                    </div>
                    <div className="col-span-2 text-center flex items-center justify-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                      <Flame className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{item.streak}d</span>
                    </div>
                    <div className="col-span-2 text-right pr-4 font-black text-blue-600 dark:text-blue-400 text-sm">
                      {item.xp} XP
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
};
