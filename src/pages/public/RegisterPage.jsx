import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button, Field, FormError } from '../../components/ui';
import { AuthLayout } from './AuthLayout';
import { validateRegistration } from './validation';

/** Public sign-up is for students only; staff accounts are created by an admin. */
export const RegisterPage = () => {
  const { register, t } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    const next = validateRegistration(form, t);
    setErrors(next);
    if (Object.keys(next).length) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      navigate('/onboarding', { replace: true });
    } catch (err) {
      setFormError(err.message);
      setErrors(err.fieldErrors ?? {});
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title={t('auth.registerTitle')} subtitle={t('auth.registerSubtitle')}>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <FormError message={formError} />
        <Field label={t('auth.name')} autoComplete="name" value={form.name} onChange={set('name')} error={errors.name} />
        <Field label={t('auth.email')} type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} />
        <Field label={t('auth.password')} type="password" autoComplete="new-password" value={form.password}
          onChange={set('password')} error={errors.password} hint={t('validation.passwordHint')} />
        <Field label={t('auth.confirmPassword')} type="password" autoComplete="new-password" value={form.confirm}
          onChange={set('confirm')} error={errors.confirm} />
        <Button type="submit" size="lg" className="w-full" loading={submitting} leftIcon={UserPlus}>{t('auth.createAccount')}</Button>
      </form>
      <p className="mt-6 text-sm text-slate-600 dark:text-slate-400">
        {t('auth.haveAccount')} <Link to="/login" className="font-medium text-brand-600 dark:text-brand-300 hover:underline">{t('auth.signIn')}</Link>
      </p>
    </AuthLayout>
  );
};
