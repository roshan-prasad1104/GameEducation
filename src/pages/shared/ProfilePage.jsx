import { useState } from 'react';
import { Save } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { authApi } from '../../services/api';
import { Button, Card, Field, FormError, PageHeader } from '../../components/ui';
import { LANGUAGES } from '../../i18n';

export const ProfilePage = () => {
  const { user, setUser, setLanguage, t, showToast, online } = useApp();
  const isStudent = user.role === 'STUDENT';
  const [form, setForm] = useState({
    name: user.name ?? '',
    preferredLanguage: user.preferredLanguage ?? 'en',
    gradeLevel: user.gradeLevel ?? '',
    school: user.school ?? '',
    district: user.district ?? '',
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setErrors({ name: t('validation.nameRequired') }); return; }
    setSaving(true);
    setFormError(null);
    setErrors({});
    try {
      const updated = await authApi.updateMe({
        ...form,
        gradeLevel: isStudent && form.gradeLevel ? Number(form.gradeLevel) : null,
      });
      setUser(updated);
      setLanguage(updated.preferredLanguage);
      showToast(t('profile.saved'), 'success');
    } catch (err) {
      setFormError(err.message);
      setErrors(err.fieldErrors ?? {});
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-5">
      <PageHeader title={t('profile.title')} subtitle={user.email} />
      <Card className="p-5 sm:p-6">
        <form onSubmit={save} className="space-y-4" noValidate>
          <FormError message={formError} />
          <Field label={t('auth.name')} value={form.name} onChange={set('name')} error={errors.name} maxLength={120} />
          <Field as="select" label={t('common.language')} value={form.preferredLanguage} onChange={set('preferredLanguage')}>
            {LANGUAGES.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
          </Field>
          {isStudent && (
            <>
              <Field as="select" label={t('onboarding.grade')} value={form.gradeLevel} onChange={set('gradeLevel')} error={errors.gradeLevel}>
                {[6, 7, 8, 9, 10, 11, 12].map((g) => <option key={g} value={g}>{t('common.grade', { grade: g })}</option>)}
              </Field>
              <Field label={t('onboarding.school')} value={form.school} onChange={set('school')} maxLength={160} />
              <Field label={t('onboarding.district')} value={form.district} onChange={set('district')} maxLength={120} />
            </>
          )}
          <Button type="submit" leftIcon={Save} loading={saving} disabled={!online}>{t('common.save')}</Button>
        </form>
      </Card>
    </div>
  );
};
