import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { GRADES } from '../../data/constants';
import { homeFor } from '../routing/roles';
import {
  Sparkles,
  ArrowRight,
  Flame,
  Award,
  WifiOff,
  Globe,
  Zap,
  Search,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
  Clock,
  Cpu,
  FileCode2,
  ChevronRight
} from 'lucide-react';

/* ── Analytics Chart Data ─────────────────────────────────────── */
const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const HUD_DATA = {
  grind: {
    labelKey: 'landing.analytics.grind',
    descKey: 'landing.analytics.grindDesc',
    values: [1.5, 3.2, 2.8, 4.5, 3.0, 5.1, 4.2],
    xp: [120, 340, 290, 510, 360, 620, 480],
    color: '#F59E0B',
    fillA: 'rgba(245, 158, 11, 0.25)',
    fillB: 'rgba(245, 158, 11, 0)',
  },
  mastery: {
    labelKey: 'landing.analytics.mastery',
    descKey: 'landing.analytics.masteryDesc',
    values: [0.5, 1.2, 2.5, 1.8, 3.5, 2.2, 4.0],
    xp: [60, 180, 380, 260, 520, 340, 640],
    color: '#A855F7',
    fillA: 'rgba(168, 85, 247, 0.25)',
    fillB: 'rgba(168, 85, 247, 0)',
  },
};

const CHART_W = 560;
const CHART_H = 150;

function SvgChart({ mode, tooltip, setTooltip }) {
  const { t } = useApp();
  const d = HUD_DATA[mode];
  const max = Math.max(...d.values) + 0.5;
  const min = Math.min(...d.values) - 0.5;

  const pts = d.values.map((v, i) => {
    const x = (i / (d.values.length - 1)) * CHART_W;
    const y = CHART_H - 12 - ((v - min) / (max - min)) * (CHART_H - 24);
    return { x, y, v, xp: d.xp[i] };
  });

  let lineD = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const cpx = (pts[i - 1].x + pts[i].x) / 2;
    lineD += ` C ${cpx} ${pts[i - 1].y} ${cpx} ${pts[i].y} ${pts[i].x} ${pts[i].y}`;
  }

  const areaD = `${lineD} L ${CHART_W} ${CHART_H} L 0 ${CHART_H} Z`;
  const gradId = `chartGrad-${mode}`;

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="w-full overflow-visible h-44">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={d.fillA} />
            <stop offset="100%" stopColor={d.fillB} />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1={0}
            y1={CHART_H * (1 - f)}
            x2={CHART_W}
            y2={CHART_H * (1 - f)}
            stroke="rgba(255,255,255,0.08)"
            strokeDasharray="4 4"
          />
        ))}

        <path d={areaD} fill={`url(#${gradId})`} />
        <path d={lineD} fill="none" stroke={d.color} strokeWidth={2.5} strokeLinecap="round" />

        {pts.map((pt, i) => (
          <g key={i}>
            <rect
              x={pt.x - 20}
              y={0}
              width={40}
              height={CHART_H}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setTooltip(i)}
              onMouseLeave={() => setTooltip(null)}
            />
            <circle
              cx={pt.x}
              cy={pt.y}
              r={tooltip === i ? 6 : 4}
              fill="#0B071A"
              stroke={d.color}
              strokeWidth={2.5}
            />
            {tooltip === i && (
              <g>
                <rect
                  x={Math.max(10, Math.min(CHART_W - 90, pt.x - 40))}
                  y={pt.y - 48}
                  width={80}
                  height={38}
                  rx={6}
                  fill="#1E1B3A"
                  stroke={d.color}
                  strokeWidth={1}
                />
                <text
                  x={Math.max(50, Math.min(CHART_W - 50, pt.x))}
                  y={pt.y - 31}
                  textAnchor="middle"
                  fill="#FFF"
                  fontSize={10}
                  fontWeight="bold"
                >
                  {t('landing.analytics.focus', { h: pt.v.toFixed(1) })}
                </text>
                <text
                  x={Math.max(50, Math.min(CHART_W - 50, pt.x))}
                  y={pt.y - 18}
                  textAnchor="middle"
                  fill={d.color}
                  fontSize={10}
                  fontWeight="bold"
                >
                  {t('dashboard.plusXp', { xp: pt.xp })}
                </text>
              </g>
            )}
          </g>
        ))}
      </svg>

      <div className="flex justify-between mt-2 px-1 text-[11px] font-mono text-indigo-300/60">
        {DAYS.map((day) => (
          <span key={day}>{t(`landing.analytics.days.${day}`)}</span>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Landing Page Component
───────────────────────────────────────────── */

export const LandingPage = () => {
  const { language, setLanguage, online, status, user, t } = useApp();
  const isOffline = !online;
  const navigate = useNavigate();
  const [activeGradeTab, setActiveGradeTab] = useState('Grade 8');
  const [searchQuery, setSearchQuery] = useState('');
  const [chartMode, setChartMode] = useState('grind');
  const [chartTooltip, setChartTooltip] = useState(null);

  /** Signed-in users go to the requested area (or their own home if it belongs to another role). */
  const handlePortalAccess = (target = '/student/dashboard') => {
    if (status === 'authed' && user) {
      const own = `/${user.role.toLowerCase()}/`;
      navigate(target.startsWith(own) ? target : homeFor(user.role));
      return;
    }
    navigate('/login', { state: { from: target } });
  };

  return (
    <div className="min-h-screen bg-[#0B071A] text-slate-100 selection:bg-amber-500 selection:text-black">

      {/* ── Floating Centered Glassmorphic Header ── */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-5xl">
        <nav className="bg-[#0B071A]/85 backdrop-blur-md border border-white/10 rounded-full px-5 sm:px-7 py-2.5 shadow-2xl shadow-indigo-950/60 flex items-center justify-between">
          
          {/* Left: Brand logo mark */}
          <a href="#" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-amber-500/20">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <div>
              <span className="font-serif text-base font-bold text-white tracking-tight">ShikshaSetu</span>
              <span className="hidden sm:inline-block ml-2 text-[9px] font-mono text-amber-400 uppercase tracking-widest bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                STEM v2.4
              </span>
            </div>
          </a>

          {/* Center: Nav links */}
          <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <a href="#curriculum" className="hover:text-amber-400 transition-colors">{t('landing.header.curriculum')}</a>
            <a href="#quests" className="hover:text-amber-400 transition-colors">{t('landing.header.quests')}</a>
            <a href="#analytics" className="hover:text-amber-400 transition-colors">{t('landing.header.analytics')}</a>
            <a href="#offline" className="hover:text-amber-400 transition-colors">{t('landing.header.offlineSync')}</a>
          </div>

          {/* Right: Lang switcher + Portal CTA */}
          <div className="flex items-center gap-3">
            {/* Language toggle pill [ EN | HI | OR ] */}
            <div className="flex items-center bg-white/5 border border-white/10 rounded-full p-0.5 text-[11px] font-mono">
              {[
                { id: 'en', label: 'EN' },
                { id: 'hi', label: 'HI' },
                { id: 'or', label: 'OD' },
              ].map((l) => (
                <button
                  key={l.id}
                  onClick={() => setLanguage(l.id)}
                  className={`px-2.5 py-1 rounded-full font-bold transition-all ${
                    language === l.id
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            {/* Launch Portal button */}
            <button
              onClick={() => handlePortalAccess('/student/dashboard')}
              className="bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600 hover:opacity-95 text-black font-bold text-xs px-4 py-2 rounded-full shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all hover:scale-105"
            >
              <span>{t('landing.header.launchPortal')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </nav>
      </header>

      {/* ── HERO SECTION ── */}
      <section className="relative pt-32 pb-24 overflow-hidden bg-gradient-to-br from-[#0B071A] via-[#140E2E] to-[#1F1746]">
        {/* Glow textures */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-indigo-600/15 via-violet-500/20 to-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 items-center">

            {/* Left Column: Hero copy */}
            <div className="lg:col-span-7 space-y-7 text-center lg:text-left">

              {/* Tag pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono tracking-widest uppercase">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('landing.hero.tag')}</span>
              </div>

              {/* Editorial Serif Headline */}
              <h1 className="font-serif text-4xl sm:text-6xl lg:text-6xl font-bold leading-[1.08] tracking-tight text-white">
                {t('landing.hero.titleStart')}{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-violet-400">
                  {t('landing.hero.titleHighlight')}
                </span>
                ,<br className="hidden sm:inline" /> {t('landing.hero.titleEnd')}
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                {t('landing.hero.subtitle')}
              </p>

              {/* Grade Selector Chips */}
              <div className="space-y-2 pt-2">
                <p className="text-[11px] font-mono text-indigo-300/70 uppercase tracking-widest">
                  {t('landing.hero.selectGrade')}
                </p>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                  {GRADES.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setActiveGradeTab(g.label)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all ${
                        activeGradeTab === g.label
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/20'
                          : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {t('common.grade', { grade: g.id.slice(1) })}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search & Action bar */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 max-w-md mx-auto lg:mx-0">
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('landing.hero.searchPlaceholder')}
                    className="w-full bg-white/5 border border-white/15 rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-400 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                  />
                </div>
                <button
                  onClick={() => handlePortalAccess('/student/dashboard')}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-indigo-600/30 whitespace-nowrap flex items-center justify-center gap-2 transition"
                >
                  <span>{t('landing.hero.startQuest')}</span>
                  <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                </button>
              </div>

              {/* Social proof strip */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-400 font-mono">
                <div className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>{t('landing.hero.streakEngine')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <WifiOff className="w-4 h-4 text-emerald-400" />
                  <span>{t('landing.hero.offlineReady')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-violet-400" />
                  <span>{t('landing.hero.languages')}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Live Student Telemetry HUD */}
            <div className="lg:col-span-5">
              <div className="relative bg-[#140E2E]/90 border border-indigo-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-indigo-950/80 space-y-6 backdrop-blur-xl">

                {/* HUD Header */}
                <div className="flex items-center justify-between border-b border-indigo-500/20 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-black font-black text-sm shadow-md">
                      A
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Aarav Sharma</h3>
                      <p className="text-[11px] font-mono text-amber-400">{t('landing.hud.level')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-bold font-mono">
                    <Flame className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{t('landing.hud.streak')}</span>
                  </div>
                </div>

                {/* Live XP Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400 uppercase">{t('landing.hud.weekly')}</span>
                    <span className="text-amber-400 font-bold">8,420 / 10,000 XP</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-indigo-500 rounded-full"
                      style={{ width: '84%' }}
                    />
                  </div>
                </div>

                {/* Active Quest Card */}
                <div className="bg-[#0B071A]/70 border border-indigo-500/25 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      {t('landing.hud.activeQuest')}
                    </span>
                    <span className="text-amber-400 font-bold font-mono">+250 XP</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{t('landing.hud.questTitle')}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{t('landing.hud.questBody')}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-amber-400" /> {t('landing.hud.minsLeft')}</span>
                    <button
                      onClick={() => handlePortalAccess('/student/dashboard')}
                      className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1"
                    >
                      {t('landing.hud.resumeQuest')} <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Milestone Badges */}
                <div className="space-y-2">
                  <p className="text-[11px] font-mono text-slate-400 uppercase tracking-widest">
                    {t('landing.hud.milestones')}
                  </p>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { titleKey: 'landing.hud.badgeStreak', icon: Flame, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
                      { titleKey: 'landing.hud.badgeMath', icon: Award, color: 'text-violet-400 bg-violet-500/10 border-violet-500/30' },
                      { titleKey: 'landing.hud.badgeOffline', icon: WifiOff, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
                    ].map((b, i) => {
                      const Icon = b.icon;
                      return (
                        <div key={i} className={`p-2.5 rounded-xl border ${b.color} text-center space-y-1`}>
                          <Icon className="w-4 h-4 mx-auto" />
                          <p className="text-[10px] font-bold truncate text-slate-200">{t(b.titleKey)}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── MODULE SEQUENCE CARDS (01 / 02 / 03) ── */}
      <section id="curriculum" className="py-24 bg-[#0B071A] relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">

          {/* Section header */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
              {t('landing.modules.eyebrow')}
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white leading-tight">
              {t('landing.modules.title')}
            </h2>
            <p className="text-sm text-slate-400">
              {t('landing.modules.subtitle')}
            </p>
          </div>

          {/* 3 Cards */}
          <div className="grid md:grid-cols-3 gap-8">

            {/* Card 01 - DISCOVERY */}
            <div className="bg-[#FAF8F5] text-slate-900 rounded-3xl p-7 border border-amber-200/60 space-y-6 shadow-xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-start justify-between">
                <span className="font-mono text-5xl font-black text-amber-500/20">01</span>
                <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-amber-700 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
                  {t('landing.modules.discovery')}
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-slate-900 mb-2">{t('landing.modules.discoveryTitle')}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {t('landing.modules.discoveryBody')}
                </p>
              </div>
              <ul className="space-y-2 text-xs text-slate-700 border-t border-slate-200/80 pt-4">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> {t('landing.modules.discovery1')}</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> {t('landing.modules.discovery2')}</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> {t('landing.modules.discovery3')}</li>
              </ul>
            </div>

            {/* Card 02 - EVALUATION */}
            <div className="bg-[#FAF8F5] text-slate-900 rounded-3xl p-7 border border-indigo-200/60 space-y-6 shadow-xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-start justify-between">
                <span className="font-mono text-5xl font-black text-indigo-500/20">02</span>
                <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full border border-indigo-300">
                  {t('landing.modules.evaluation')}
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                <FileCode2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-slate-900 mb-2">{t('landing.modules.evaluationTitle')}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {t('landing.modules.evaluationBody')}
                </p>
              </div>
              <ul className="space-y-2 text-xs text-slate-700 border-t border-slate-200/80 pt-4">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" /> {t('landing.modules.evaluation1')}</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" /> {t('landing.modules.evaluation2')}</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" /> {t('landing.modules.evaluation3')}</li>
              </ul>
            </div>

            {/* Card 03 - ADAPTATION */}
            <div className="bg-[#FAF8F5] text-slate-900 rounded-3xl p-7 border border-violet-200/60 space-y-6 shadow-xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-start justify-between">
                <span className="font-mono text-5xl font-black text-violet-500/20">03</span>
                <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-violet-700 bg-violet-100 px-3 py-1 rounded-full border border-violet-300">
                  {t('landing.modules.adaptation')}
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-600 flex items-center justify-center">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-slate-900 mb-2">{t('landing.modules.adaptationTitle')}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {t('landing.modules.adaptationBody')}
                </p>
              </div>
              <ul className="space-y-2 text-xs text-slate-700 border-t border-slate-200/80 pt-4">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-violet-600 shrink-0" /> {t('landing.modules.adaptation1')}</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-violet-600 shrink-0" /> {t('landing.modules.adaptation2')}</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-violet-600 shrink-0" /> {t('landing.modules.adaptation3')}</li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* ── TELEMETRY ANALYTICS HUD (Data Visualization) ── */}
      <section id="analytics" className="py-24 bg-gradient-to-b from-[#0B071A] to-[#140E2E] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                {t('landing.analytics.eyebrow')}
              </span>
              <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white">
                {t('landing.analytics.title')}
              </h2>
            </div>

            {/* Mode toggle */}
            <button
              onClick={() => setChartMode((m) => (m === 'grind' ? 'mastery' : 'grind'))}
              className={`flex items-center gap-3 px-5 py-2.5 rounded-full border text-xs font-mono font-bold transition-all ${
                chartMode === 'mastery'
                  ? 'border-violet-500/50 bg-violet-500/10 text-violet-300'
                  : 'border-amber-500/50 bg-amber-500/10 text-amber-300'
              }`}
            >
              {chartMode === 'grind' ? <ToggleLeft className="w-5 h-5 text-amber-400" /> : <ToggleRight className="w-5 h-5 text-violet-400" />}
              <span>{t(HUD_DATA[chartMode].labelKey)}</span>
            </button>
          </div>

          {/* Main Chart Container */}
          <div className="bg-[#140E2E] border border-indigo-500/25 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            {/* Top metric row */}
            <div className="grid grid-cols-3 gap-4 border-b border-indigo-500/20 pb-6 text-center">
              <div>
                <p className="text-[10px] font-mono uppercase text-slate-400">{t('landing.analytics.totalXp')}</p>
                <p className="text-xl sm:text-2xl font-black text-amber-400 font-mono mt-1">+2,720 XP</p>
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase text-slate-400">{t('landing.analytics.accuracy')}</p>
                <p className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-1">88.4%</p>
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase text-slate-400">{t('landing.analytics.stability')}</p>
                <p className="text-xl sm:text-2xl font-black text-violet-400 font-mono mt-1">99.1%</p>
              </div>
            </div>

            {/* Svg chart */}
            <div className="space-y-2">
              <p className="text-xs font-mono text-indigo-300/70">
                {t('landing.analytics.hint', { desc: t(HUD_DATA[chartMode].descKey) })}
              </p>
              <SvgChart mode={chartMode} tooltip={chartTooltip} setTooltip={setChartTooltip} />
            </div>
          </div>

        </div>
      </section>

      {/* ── EDITORIAL STATEMENT & HIGH-CONTRAST BANNER ── */}
      <section className="py-24 bg-[#0B071A] border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-amber-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 text-center space-y-8 relative z-10">
          <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3.5 py-1.5 rounded-full border border-amber-400/20">
            {t('landing.promise.eyebrow')}
          </span>

          <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold leading-tight text-white">
            {t('landing.promise.line1')}<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-violet-400 italic">
              {t('landing.promise.line2')}
            </span>
          </h2>

          <p className="text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {t('landing.promise.body')}
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => handlePortalAccess('/student/dashboard')}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600 hover:opacity-95 text-black font-bold text-sm rounded-2xl shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 transition"
            >
              <span>{t('landing.promise.cta')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate(status === 'authed' && user ? homeFor(user.role) : '/login')}
              className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/15 font-bold text-sm rounded-2xl transition"
            >
              <span>{t('landing.promise.signIn')}</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── EDITORIAL FOOTER WITH BRACKETED LINKS ── */}
      <footer className="bg-[#070412] border-t border-white/10 text-slate-400 py-16 text-xs font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <p className="text-white font-bold tracking-widest uppercase text-[11px]">{t('landing.footer.student')}</p>
              <ul className="space-y-2">
                <li><button onClick={() => handlePortalAccess('/student/dashboard')} className="hover:text-amber-400">{t('nav.dashboard')}</button></li>
                <li><button onClick={() => handlePortalAccess('/student/subjects')} className="hover:text-amber-400">{t('landing.footer.subjectsCourses')}</button></li>
                <li><button onClick={() => handlePortalAccess('/student/subjects')} className="hover:text-amber-400">{t('landing.footer.quizzes')}</button></li>
                <li><button onClick={() => handlePortalAccess('/student/leaderboard')} className="hover:text-amber-400">{t('nav.leaderboard')}</button></li>
              </ul>
            </div>

            <div className="space-y-3">
              <p className="text-white font-bold tracking-widest uppercase text-[11px]">{t('landing.footer.teacher')}</p>
              <ul className="space-y-2">
                <li><button onClick={() => handlePortalAccess('/teacher/dashboard')} className="hover:text-amber-400">{t('landing.footer.classProgress')}</button></li>
                <li><button onClick={() => handlePortalAccess('/teacher/dashboard')} className="hover:text-amber-400">{t('landing.footer.weakMap')}</button></li>
                <li><button onClick={() => handlePortalAccess('/teacher/dashboard')} className="hover:text-amber-400">{t('landing.footer.syncExport')}</button></li>
              </ul>
            </div>

            <div className="space-y-3">
              <p className="text-white font-bold tracking-widest uppercase text-[11px]">{t('landing.footer.admin')}</p>
              <ul className="space-y-2">
                <li><button onClick={() => handlePortalAccess('/admin/dashboard')} className="hover:text-amber-400">{t('landing.footer.telemetry')}</button></li>
                <li><button onClick={() => handlePortalAccess('/admin/dashboard')} className="hover:text-amber-400">{t('landing.footer.content')}</button></li>
                <li><button onClick={() => handlePortalAccess('/admin/dashboard')} className="hover:text-amber-400">{t('landing.footer.governance')}</button></li>
              </ul>
            </div>

            <div className="space-y-3">
              <p className="text-white font-bold tracking-widest uppercase text-[11px]">{t('landing.footer.pwa')}</p>
              <ul className="space-y-2">
                <li><span>{isOffline ? t('landing.footer.modeOffline') : t('landing.footer.modeOnline')}</span></li>
                <li><a href="#" className="hover:text-amber-400">{t('landing.footer.sdCache')}</a></li>
                <li><a href="#" className="hover:text-amber-400">{t('landing.footer.swStatus')}</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{t('landing.footer.status')}</span>
            </div>
            <p>{t('landing.footer.copyright')}</p>
          </div>

        </div>
      </footer>

    </div>
  );
};
