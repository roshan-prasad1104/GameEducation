import { useMemo, useState } from 'react';
import { KeyRound, Pencil, Plus, School, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useApi } from '../../hooks/useApi';
import { adminApi } from '../../services/api';
import { Badge, Button, Card, EmptyState, ErrorState, Field, FormError, LoadingState, Modal, PageHeader } from '../../components/ui';

/** Create or edit a school (name + district). */
const SchoolForm = ({ school, onDone, onCancel }) => {
  const { t } = useApp();
  const [form, setForm] = useState({ name: school?.name ?? '', district: school?.district ?? '' });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError(t('classes.schoolNameRequired')); return; }
    setSaving(true);
    setError(null);
    try {
      const body = { name: form.name.trim(), district: form.district.trim() || null };
      if (school) await adminApi.updateSchool(school.id, body);
      else await adminApi.createSchool(body);
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <FormError message={error} />
      <Field label={t('classes.schoolName')} value={form.name} maxLength={160}
        onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <Field label={t('onboarding.district')} value={form.district} maxLength={120}
        onChange={(e) => setForm({ ...form, district: e.target.value })} />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit" loading={saving}>{t('common.save')}</Button>
      </div>
    </form>
  );
};

/** Create or edit a class: school, name, grade and teacher. */
const ClassForm = ({ klass, schools, teachers, defaultSchoolId, onDone, onCancel }) => {
  const { t } = useApp();
  const [form, setForm] = useState({
    schoolId: klass?.schoolId ?? defaultSchoolId ?? schools[0]?.id ?? '',
    name: klass?.name ?? '', gradeLevel: klass?.gradeLevel ?? '', teacherId: klass?.teacherId ?? '',
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError(t('classes.classNameRequired')); return; }
    setSaving(true);
    setError(null);
    const body = {
      schoolId: Number(form.schoolId), name: form.name.trim(),
      gradeLevel: form.gradeLevel ? Number(form.gradeLevel) : null,
      teacherId: form.teacherId ? Number(form.teacherId) : null,
    };
    try {
      if (klass) await adminApi.updateClass(klass.id, body);
      else await adminApi.createClass(body);
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <FormError message={error} />
      <Field as="select" label={t('classes.school')} value={form.schoolId} onChange={set('schoolId')}>
        {schools.map((s) => <option key={s.id} value={s.id}>{s.name}{s.district ? ` · ${s.district}` : ''}</option>)}
      </Field>
      <Field label={t('classes.className')} value={form.name} onChange={set('name')} maxLength={80}
        placeholder="Class 8 – Section A" />
      <div className="grid sm:grid-cols-2 gap-4">
        <Field as="select" label={t('onboarding.grade')} value={form.gradeLevel} onChange={set('gradeLevel')}>
          <option value="">—</option>
          {[6, 7, 8, 9, 10, 11, 12].map((g) => <option key={g} value={g}>{t('common.grade', { grade: g })}</option>)}
        </Field>
        <Field as="select" label={t('roles.TEACHER')} value={form.teacherId} onChange={set('teacherId')}>
          <option value="">{t('admin.noTeacher')}</option>
          {teachers.map((tc) => <option key={tc.id} value={tc.id}>{tc.name}</option>)}
        </Field>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit" loading={saving}>{t('common.save')}</Button>
      </div>
    </form>
  );
};

/**
 * Admin: schools and their classes. Each class has a teacher and a join code that students
 * enter during onboarding (or in their profile) to join it.
 */
export const ClassesPage = () => {
  const { t, showToast } = useApp();
  const { data, error, loading, reload } = useApi(() => adminApi.schools(), []);
  const users = useApi(() => adminApi.users(), []);
  const [editingSchool, setEditingSchool] = useState(null); // null | 'new' | school
  const [editingClass, setEditingClass] = useState(null);   // null | { schoolId } | class

  const teachers = useMemo(() => (users.data ?? []).filter((u) => u.role === 'TEACHER' && u.active), [users.data]);
  const schools = data ?? [];

  const act = async (fn, message, confirmText) => {
    if (confirmText && !window.confirm(confirmText)) return;
    try {
      await fn();
      if (message) showToast(message, 'success');
      reload();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  if (loading && !data) return <LoadingState rows={3} />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="space-y-5">
      <PageHeader title={t('classes.title')} subtitle={t('classes.subtitle')}
        actions={<Button leftIcon={Plus} onClick={() => setEditingSchool('new')}>{t('classes.addSchool')}</Button>} />

      {schools.length === 0 ? <EmptyState icon={School} title={t('classes.noSchools')} /> : schools.map((s) => (
        <Card key={s.id} className="p-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">{s.name}</h2>
              {s.district && <p className="text-xs text-slate-500">{s.district}</p>}
            </div>
            <div className="flex gap-1">
              <Button size="sm" leftIcon={Plus} onClick={() => setEditingClass({ schoolId: s.id })}>{t('classes.addClass')}</Button>
              <Button variant="ghost" size="sm" aria-label={t('common.edit')} onClick={() => setEditingSchool(s)}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm" aria-label={t('common.delete')}
                onClick={() => act(() => adminApi.deleteSchool(s.id), t('classes.deleted'), t('classes.confirmDelete', { name: s.name }))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {s.classes.length === 0 ? <p className="text-sm text-slate-500">{t('classes.noClasses')}</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead className="text-left text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-2 pr-3 font-medium">{t('classes.class')}</th>
                    <th className="px-3 py-2 font-medium">{t('roles.TEACHER')}</th>
                    <th className="px-3 py-2 font-medium">{t('classes.students')}</th>
                    <th className="px-3 py-2 font-medium">{t('classes.joinCode')}</th>
                    <th className="py-2 pl-3 font-medium text-right">{t('admin.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {s.classes.map((c) => (
                    <tr key={c.id}>
                      <td className="py-2.5 pr-3">
                        <p className="font-medium">{c.name}</p>
                        {c.gradeLevel && <p className="text-xs text-slate-500">{t('common.grade', { grade: c.gradeLevel })}</p>}
                      </td>
                      <td className="px-3 py-2.5">{c.teacherName ?? <Badge tone="warning">{t('admin.noTeacher')}</Badge>}</td>
                      <td className="px-3 py-2.5">{c.studentCount}</td>
                      <td className="px-3 py-2.5"><span className="font-mono font-semibold tracking-widest">{c.joinCode}</span></td>
                      <td className="py-2.5 pl-3 text-right whitespace-nowrap">
                        <Button variant="ghost" size="sm" aria-label={t('common.edit')} onClick={() => setEditingClass(c)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" aria-label={t('classes.newCode')} title={t('classes.newCode')}
                          onClick={() => act(() => adminApi.newJoinCode(c.id), t('classes.codeChanged'), t('classes.confirmNewCode'))}>
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" aria-label={t('common.delete')}
                          onClick={() => act(() => adminApi.deleteClass(c.id), t('classes.deleted'), t('classes.confirmDelete', { name: c.name }))}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ))}

      <Modal open={editingSchool !== null} title={editingSchool === 'new' ? t('classes.addSchool') : t('classes.editSchool')}
        onClose={() => setEditingSchool(null)}>
        {editingSchool !== null && (
          <SchoolForm school={editingSchool === 'new' ? null : editingSchool} onCancel={() => setEditingSchool(null)}
            onDone={() => { setEditingSchool(null); showToast(t('classes.saved'), 'success'); reload(); }} />
        )}
      </Modal>

      <Modal open={editingClass !== null} title={editingClass?.id ? t('classes.editClass') : t('classes.addClass')}
        onClose={() => setEditingClass(null)}>
        {editingClass !== null && (
          <ClassForm klass={editingClass.id ? editingClass : null} defaultSchoolId={editingClass.schoolId}
            schools={schools} teachers={teachers} onCancel={() => setEditingClass(null)}
            onDone={() => { setEditingClass(null); showToast(t('classes.saved'), 'success'); reload(); }} />
        )}
      </Modal>
    </div>
  );
};
