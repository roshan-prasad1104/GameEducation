import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { homeFor } from '../../components/routing/roles';

export const NotFoundPage = () => {
  const { t, user } = useApp();
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-3 p-6">
      <div className="h-12 w-12 rounded-2xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 flex items-center justify-center"><Compass className="h-6 w-6" /></div>
      <h1 className="text-xl font-semibold">{t('errors.notFoundTitle')}</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">{t('errors.notFoundBody')}</p>
      <Link to={user ? homeFor(user.role) : '/'} className="mt-2 text-sm font-medium text-brand-600 dark:text-brand-300 hover:underline">{t('errors.goHome')}</Link>
    </div>
  );
};
