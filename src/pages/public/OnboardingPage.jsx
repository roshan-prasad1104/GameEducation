import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { authApi } from '../../services/api';
import { Button, Field, FormError } from '../../components/ui';
import { LANGUAGES } from '../../i18n';
import { cn } from '../../lib/cn';
import { AuthLayout } from './AuthLayout';

const GRADES = [6, 7, 8, 9, 10, 11, 12];

/** First-run setup for new students: grade, language and school. */
export const OnboardingPage = () => {
  const { user, setUser, language, setLanguage, t } = useApp();
  const navigate = useNavigate();
  const [grade, setGrade] = useState(user?.gradeLevel ?? null);
  const [school, setSchool] = useState('');
  const [district, setDistrict] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!grade) { setError(t('onboarding.pickGrade')); return; }
    setSaving(true);
    setError(null);
    try {
      const updated = await authApi.onboard({ gradeLevel: grade, preferredLanguage: language, school, district });
      setUser(updated);
      navigate('/student/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthLayout title={t('onboarding.title', { name: user?.name?.split(' ')[0] ?? '' })} subtitle={t('onboarding.subtitle')}>
      <form onSubmit={submit} className="space-y-6">
        <FormError message={error} />
        <fieldset>
          <legend className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">{t('onboarding.grade')}</legend>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {GRADES.map((g) => (
              <button type="button" key={g} onClick={() => setGrade(g)} aria-pressed={grade === g}
                className={cn('h-11 rounded-xl border text-sm font-semibold transition',
                  grade === g ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-200'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:text-slate-200')}>
                {g}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">{t('onboarding.language')}</legend>
          <div className="grid grid-cols-2 gap-2">
            {LANGUAGES.map((l) => (
              <button type="button" key={l.id} onClick={() => setLanguage(l.id)} aria-pressed={language === l.id}
                className={cn('h-11 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition',
                  language === l.id ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-200'
                    : 'border-slate-200 dark:border-slate-700 dark:text-slate-200')}>
                {language === l.id && <Check className="h-4 w-4" />}{l.label}
              </button>
            ))}
          </div>
        </fieldset>
        <Field label={t('onboarding.school')} value={school} onChange={(e) => setSchool(e.target.value)} maxLength={160} />
        <Field label={t('onboarding.district')} value={district} onChange={(e) => setDistrict(e.target.value)} maxLength={120} />
        <Button type="submit" size="lg" className="w-full" loading={saving} rightIcon={ArrowRight}>{t('onboarding.start')}</Button>
      </form>
    </AuthLayout>
  );
};
