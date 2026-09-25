import { Link } from 'react-router-dom';
import { Languages, Moon, Sun } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LANGUAGES } from '../../i18n';

/** Split-screen frame for login / register / onboarding. */
export const AuthLayout = ({ title, subtitle, children }) => {
  const { t, language, setLanguage, darkMode, setDarkMode } = useApp();
  return (
    <div className="min-h-screen grid lg:grid-cols-2 app-canvas dark:bg-slate-950">
      <aside className="hidden lg:flex flex-col justify-between p-10 brand-gradient text-white">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-white/15 flex items-center justify-center font-bold">S</div>
          <span className="text-lg font-semibold tracking-tight">ShikshaSetu</span>
        </Link>
        <div className="space-y-4 max-w-md">
          <h2 className="text-3xl font-semibold leading-tight">{t('landing.heroTitle')}</h2>
          <p className="text-white/80">{t('landing.heroBody')}</p>
        </div>
        <p className="text-xs text-white/60">{t('brand.footer')}</p>
      </aside>

      <main className="flex flex-col px-4 sm:px-8 py-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="lg:invisible flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg brand-gradient text-white flex items-center justify-center font-bold text-sm">S</div>
            <span className="font-semibold">ShikshaSetu</span>
          </Link>
          <div className="flex items-center gap-1">
            <button onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="h-9 px-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 text-sm dark:text-slate-200">
              <Languages className="h-4 w-4 text-brand-500" />{LANGUAGES.find((l) => l.id === language)?.label}
            </button>
            <button onClick={() => setDarkMode(!darkMode)} aria-label={t('common.toggleTheme')}
              className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-200">
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center py-10">
          <div className="w-full max-w-md">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
};
