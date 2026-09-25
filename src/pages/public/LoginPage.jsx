import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button, Field, FormError } from '../../components/ui';
import { homeFor } from '../../components/routing/roles';
import { AuthLayout } from './AuthLayout';

/** Seeded development accounts (see README). Only shown in `npm run dev`. */
const DEMO_ACCOUNTS = [
  { role: 'STUDENT', email: 'aarav@shiksha.org', password: 'Student@123' },
  { role: 'TEACHER', email: 'teacher@shiksha.org', password: 'Teacher@123' },
  { role: 'ADMIN', email: 'admin@shiksha.org', password: 'Admin@123' },
];

export const LoginPage = () => {
  const { login, t } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const signIn = async (email, password) => {
    setSubmitting(true);
    setFormError(null);
    try {
      const user = await login(email.trim(), password);
      const from = location.state?.from;
      navigate(from && from.startsWith(`/${user.role.toLowerCase()}`) ? from : homeFor(user.role), { replace: true });
    } catch (e) {
      setFormError(e.status === 401 ? t('auth.invalidCredentials') : e.message);
      setErrors(e.fieldErrors ?? {});
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const next = {};
    if (!form.email.trim()) next.email = t('validation.emailRequired');
    if (!form.password) next.password = t('validation.passwordRequired');
    setErrors(next);
    if (Object.keys(next).length === 0) signIn(form.email, form.password);
  };

  return (
    <AuthLayout title={t('auth.loginTitle')} subtitle={t('auth.loginSubtitle')}>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <FormError message={formError} />
        <Field label={t('auth.email')} type="email" autoComplete="email" value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} />
        <Field label={t('auth.password')} type="password" autoComplete="current-password" value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} error={errors.password} />
        <Button type="submit" size="lg" className="w-full" loading={submitting} leftIcon={LogIn}>{t('auth.signIn')}</Button>
      </form>

      <p className="mt-6 text-sm text-slate-600 dark:text-slate-400">
        {t('auth.noAccount')} <Link to="/register" className="font-medium text-brand-600 dark:text-brand-300 hover:underline">{t('auth.createAccount')}</Link>
      </p>

      {import.meta.env.DEV && (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-4">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">{t('auth.demoAccounts')}</p>
          <div className="grid grid-cols-3 gap-2">
            {DEMO_ACCOUNTS.map((a) => (
              <Button key={a.role} variant="outline" size="sm" disabled={submitting} onClick={() => signIn(a.email, a.password)}>
                {t(`roles.${a.role}`)}
              </Button>
            ))}
          </div>
        </div>
      )}
    </AuthLayout>
  );
};
