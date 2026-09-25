import { Link } from 'react-router-dom';
import {
  ArrowRight, BookOpen, CheckCircle2, Circle, ClipboardList, Flame, RotateCcw, Rocket, Sparkles, Trophy, Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Badge, Card, Progress, NamedIcon } from '../../components/ui';
import { cn } from '../../lib/cn';
import { badgeName, recommendationReason } from '../../i18n/serverText';

/** XP, level progress and streak — the core gamification readout. */
export const LevelCard = ({ level, streak }) => {
  const { t } = useApp();
  return (
    <Card premium className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('dashboard.level')}</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{level.level}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">XP</p>
          <p className="mt-1 text-xl font-semibold text-amber-600 dark:text-amber-400 tabular-nums">{level.xp.toLocaleString()}</p>
        </div>
      </div>
      <Progress className="mt-4" value={level.xpIntoLevel} max={level.xpForLevel} tone="brand" />
      <div className="mt-2 flex justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>{t('dashboard.toNextLevel', { xp: level.nextLevelXp - level.xp })}</span>
        {streak !== undefined && (
          <span className="inline-flex items-center gap-1 font-medium text-amber-700 dark:text-amber-300">
            <Flame className="h-3.5 w-3.5" /> {t('dashboard.streakDays', { count: streak })}
          </span>
        )}
      </div>
    </Card>
  );
};

export const SubjectTile = ({ subject }) => {
  const { t } = useApp();
  return (
    <Link to={`/student/subjects/${subject.id}`} className="card card-hover p-4 flex flex-col gap-3 group">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: subject.color }}>
          <NamedIcon name={subject.icon} className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold truncate">{subject.name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('subjects.counts', { chapters: subject.chapterCount, lessons: subject.lessonCount })}
          </p>
        </div>
        <ArrowRight className="ml-auto h-4 w-4 text-slate-400 group-hover:text-brand-600 transition" />
      </div>
      <div>
        <Progress value={subject.progressPercent} tone={subject.progressPercent === 100 ? 'success' : 'brand'} size="sm" />
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          {t('subjects.progress', { done: subject.completedLessons, total: subject.lessonCount, pct: subject.progressPercent })}
        </p>
      </div>
    </Link>
  );
};

export const MissionList = ({ missions }) => {
  const { t } = useApp();
  return (
    <ul className="space-y-2">
      {missions.map((m) => (
        <li key={m.code} className={cn('flex items-center gap-3 rounded-xl border p-3',
          m.completed ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-950/20'
            : 'border-slate-200 dark:border-slate-800')}>
          {m.completed ? <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" /> : <Circle className="h-5 w-5 text-slate-300 dark:text-slate-600 shrink-0" />}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{t(`missions.${m.code}.title`)}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('missions.progress', { progress: m.progress, target: m.target })}</p>
          </div>
          <Badge tone={m.completed ? 'success' : 'xp'} icon={Zap}>+{m.xpReward}</Badge>
        </li>
      ))}
    </ul>
  );
};

const KIND = {
  REVISE: { Icon: RotateCcw, tone: 'warn' },
  CONTINUE: { Icon: ArrowRight, tone: 'brand' },
  START: { Icon: Rocket, tone: 'violet' },
};

export const RecommendationList = ({ items, compact = false }) => {
  const { t, language } = useApp();
  return (
    <ul className="space-y-2.5">
      {items.map((r) => {
        const k = KIND[r.kind] ?? KIND.CONTINUE;
        return (
          <li key={r.lessonId}>
            <Link to={`/student/lessons/${r.lessonId}`} className="block rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 hover:border-brand-300 dark:hover:border-brand-700 transition">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge tone={k.tone} icon={k.Icon}>{t(`recs.kind.${r.kind}`)}</Badge>
                <span className="text-xs text-slate-500 dark:text-slate-400">{r.subjectName} · {r.chapterTitle}</span>
              </div>
              <p className="mt-2 text-sm font-semibold">{r.title}</p>
              {!compact && <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{recommendationReason(t, language, r)}</p>}
            </Link>
          </li>
        );
      })}
    </ul>
  );
};

export const AssignmentList = ({ items }) => {
  const { t } = useApp();
  return (
    <ul className="space-y-2">
      {items.map((a) => (
        <li key={a.id}>
          <Link to={a.lessonId ? `/student/lessons/${a.lessonId}` : `/student/quiz/${a.quizId}`}
            className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-800 p-3 hover:border-brand-300 dark:hover:border-brand-700">
            {a.completed ? <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" /> : <ClipboardList className="h-5 w-5 text-brand-500 shrink-0" />}
            <div className="min-w-0 flex-1">
              <p className={cn('text-sm font-medium', a.completed && 'line-through text-slate-500')}>{a.title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {a.teacherName}{a.dueDate ? ` · ${t('assignments.due', { date: new Date(a.dueDate).toLocaleDateString() })}` : ''}
              </p>
              {a.note && <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{a.note}</p>}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
};

/** Celebration panel after a rewarded action: XP, level-up, new badges, completed missions. */
export const RewardPanel = ({ reward }) => {
  const { t } = useApp();
  if (!reward) return null;
  return (
    <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 p-4 space-y-3 animate-pop">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-amber-500 text-white flex items-center justify-center"><Zap className="h-5 w-5" /></div>
        <div>
          <p className="text-lg font-semibold text-amber-800 dark:text-amber-200">+{reward.xpEarned} XP</p>
          <p className="text-xs text-amber-800/80 dark:text-amber-300/80">
            {t('rewards.total', { xp: reward.totalXp.toLocaleString(), level: reward.level.level })}
            {reward.streak > 0 && ` · ${t('dashboard.streakDays', { count: reward.streak })}`}
          </p>
        </div>
      </div>
      {reward.leveledUp && (
        <p className="flex items-center gap-2 text-sm font-medium text-violet-700 dark:text-violet-300">
          <Sparkles className="h-4 w-4" /> {t('rewards.levelUp', { level: reward.level.level })}
        </p>
      )}
      {reward.newBadges?.map((b) => {
        return (
          <p key={b.code} className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-100">
            <span className="h-7 w-7 rounded-lg bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 flex items-center justify-center"><NamedIcon name={b.icon} className="h-4 w-4" /></span>
            {t('rewards.badge', { name: badgeName(t, b) })}
          </p>
        );
      })}
      {reward.completedMissions?.map((m) => (
        <p key={m.code} className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
          <Trophy className="h-4 w-4" /> {t('rewards.mission', { title: t(`missions.${m.code}.title`), xp: m.xpReward })}
        </p>
      ))}
    </div>
  );
};

export const SectionTitle = ({ icon: Icon = BookOpen, children, action }) => (
  <div className="flex items-center justify-between gap-2 mb-3">
    <h2 className="text-sm font-semibold flex items-center gap-2"><Icon className="h-4 w-4 text-brand-500" />{children}</h2>
    {action}
  </div>
);
