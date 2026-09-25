import { Link } from 'react-router-dom';
import {
  ArrowRight, BookOpen, BrainCircuit, CloudOff, Flame, Languages, LineChart, Moon, Sparkles, Sun, Trophy, Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LANGUAGES } from '../../i18n';
import { homeFor } from '../../components/routing/roles';

const FEATURES = [
  { Icon: BookOpen, key: 'curriculum' },
  { Icon: Zap, key: 'quizzes' },
  { Icon: Trophy, key: 'gamification' },
  { Icon: BrainCircuit, key: 'ai' },
  { Icon: CloudOff, key: 'offline' },
  { Icon: LineChart, key: 'teachers' },
];

const STEPS = ['learn', 'practice', 'earn', 'track', 'improve'];

export const LandingPage = () => {
  const { t, language, setLanguage, darkMode, setDarkMode, status, user } = useApp();
  const signedIn = status === 'authed' && user;

  return (
    <div className="min-h-screen app-canvas dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/70 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg brand-gradient flex items-center justify-center text-white font-bold text-sm">S</div>
            <span className="font-semibold tracking-tight">ShikshaSetu</span>
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <button onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="h-9 px-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 text-sm">
              <Languages className="h-4 w-4 text-brand-500" />
              <span className="hidden sm:inline">{LANGUAGES.find((l) => l.id === language)?.label}</span>
            </button>
            <button onClick={() => setDarkMode(!darkMode)} aria-label={t('common.toggleTheme')}
              className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800">
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            {signedIn ? (
              <Link to={homeFor(user.role)} className="h-9 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium inline-flex items-center gap-1.5">
                {t('landing.openApp')} <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="h-9 px-3 rounded-xl text-sm font-medium inline-flex items-center hover:bg-slate-100 dark:hover:bg-slate-800">{t('auth.signIn')}</Link>
                <Link to="/register" className="hidden sm:inline-flex h-9 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium items-center">{t('landing.getStarted')}</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 sm:pt-20 pb-16 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 px-3 py-1 text-xs font-medium ring-1 ring-inset ring-brand-200 dark:ring-brand-800">
            <Sparkles className="h-3.5 w-3.5" /> {t('landing.eyebrow')}
          </span>
          <h1 className="mt-5 text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.1]">{t('landing.heroTitle')}</h1>
          <p className="mt-5 text-lg text-slate-600 dark:text-slate-300 max-w-xl">{t('landing.heroBody')}</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link to={signedIn ? homeFor(user.role) : '/register'}
              className="h-12 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium inline-flex items-center justify-center gap-2 shadow-sm">
              {signedIn ? t('landing.openApp') : t('landing.getStarted')} <ArrowRight className="h-4 w-4" />
            </Link>
            {!signedIn && (
              <Link to="/login" className="h-12 px-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-transparent font-medium inline-flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-900">
                {t('auth.signIn')}
              </Link>
            )}
          </div>
        </div>

        {/* Illustrative product preview */}
        <div className="relative" aria-hidden>
          <div className="absolute -inset-6 brand-gradient opacity-10 blur-3xl rounded-full" />
          <div className="relative card-premium p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('dashboard.level')}</p>
                <p className="text-2xl font-semibold">5 · <span className="text-amber-600">960 XP</span></p>
              </div>
              <div className="flex items-center gap-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-3 py-1.5 text-sm font-medium">
                <Flame className="h-4 w-4" /> 7
              </div>
            </div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className="h-full w-[86%] bg-gradient-to-r from-brand-500 to-violet-500 rounded-full" />
            </div>
            {['Mathematics', 'Physics', 'Biology'].map((s, i) => (
              <div key={s} className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 flex items-center justify-center text-xs font-bold">{s[0]}</div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm"><span>{s}</span><span className="text-slate-500">{[100, 67, 33][i]}%</span></div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${[100, 67, 33][i]}%` }} />
                  </div>
                </div>
              </div>
            ))}
            <div className="rounded-xl border border-violet-200 dark:border-violet-900/50 bg-violet-50 dark:bg-violet-950/30 p-3 text-sm">
              <p className="font-medium text-violet-800 dark:text-violet-200 flex items-center gap-1.5"><BrainCircuit className="h-4 w-4" /> {t('recs.title')}</p>
              <p className="text-violet-700/80 dark:text-violet-300/80 text-xs mt-1">{t('landing.previewRec')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">{t('landing.featuresTitle')}</h2>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ Icon, key }) => (
            <div key={key} className="card p-6">
              <div className="h-10 w-10 rounded-xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-300 flex items-center justify-center">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{t(`landing.features.${key}.title`)}</h3>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">{t(`landing.features.${key}.body`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">{t('landing.howTitle')}</h2>
        <ol className="mt-8 grid sm:grid-cols-5 gap-3">
          {STEPS.map((s, i) => (
            <li key={s} className="card p-5">
              <span className="text-xs font-semibold text-brand-600 dark:text-brand-300">0{i + 1}</span>
              <p className="mt-2 font-medium">{t(`landing.steps.${s}`)}</p>
            </li>
          ))}
        </ol>
      </section>

      <footer className="border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-sm text-slate-500 dark:text-slate-400">{t('brand.footer')}</div>
      </footer>
    </div>
  );
};
