import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Globe, GraduationCap, MapPin, School, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { authApi } from '../../services/api';
import { GRADES, LANGUAGES } from '../../data/constants';
import { Button } from '../ui/Button';

/**
 * First-run setup for new students (grade, language, school), styled like the sign-in dialog.
 */
export const OnboardingModal = () => {
  const { user, setUser, language, setLanguage, showToast, t } = useApp();
  const navigate = useNavigate();
  const [grade, setGrade] = useState(user?.gradeLevel ?? 8);
  const [school, setSchool] = useState('');
  const [district, setDistrict] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await authApi.onboard({ gradeLevel: Number(grade), preferredLanguage: language, school, district });
      setUser(updated);
      showToast(t('onboarding.done'), 'success');
      navigate('/student/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-slate-900/95 text-slate-100 rounded-3xl shadow-2xl border border-slate-700 overflow-hidden">
        <div className="h-1.5 brand-gradient" />
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-xl brand-gradient flex items-center justify-center text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">{t('onboarding.title', { name: user?.name?.split(' ')[0] ?? '' })}</h2>
              <p className="text-sm text-slate-300">{t('onboarding.subtitle')}</p>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-3">
            <Field label={t('onboarding.grade')} icon={GraduationCap}>
              <select value={grade} onChange={(e) => setGrade(e.target.value)} className="input">
                {GRADES.map((g) => <option key={g.id} value={g.id.slice(1)}>{g.label} ({g.age})</option>)}
              </select>
            </Field>
            <Field label={t('onboarding.language')} icon={Globe}>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="input">
                {LANGUAGES.map((l) => <option key={l.id} value={l.id}>{l.native}</option>)}
              </select>
            </Field>
            <Field label={t('onboarding.school')} icon={School}>
              <input value={school} onChange={(e) => setSchool(e.target.value)} maxLength={160} className="input" placeholder="Govt. High School…" />
            </Field>
            <Field label={t('onboarding.district')} icon={MapPin}>
              <input value={district} onChange={(e) => setDistrict(e.target.value)} maxLength={120} className="input" placeholder="Sundargarh, Odisha" />
            </Field>

            {error && (
              <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 rounded-lg px-3 py-2">{error}</p>
            )}

            <Button type="submit" size="lg" className="w-full" loading={saving} rightIcon={ArrowRight}>
              {t('onboarding.start')}
            </Button>
          </form>
        </div>
      </div>

      <style>{`.input{width:100%;height:42px;padding:0 12px 0 38px;border-radius:10px;border:1px solid rgb(71 85 105);background:rgba(15, 23, 42, 0.7);font-size:14px;color:rgb(241 245 249);outline:none;transition:border-color .15s}.input::placeholder{color:rgb(148 163 184)}.input:focus{border-color:rgb(129 140 248)}.dark .input{border-color:rgb(51 65 85)}`}</style>
    </div>
  );
};

const Field = ({ label, icon: Icon, children }) => (
  <div>
    <label className="block text-xs font-medium text-slate-200 mb-1.5">{label}</label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />}
      {children}
    </div>
  </div>
);
