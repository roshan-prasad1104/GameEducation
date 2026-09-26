import { useMemo, useState } from 'react';
import { FileDown, Pencil, Plus, Search, Trash2, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useApi } from '../../hooks/useApi';
import { adminApi } from '../../services/api';
import { Badge, Button, Card, EmptyState, ErrorState, Field, FormError, LoadingState, Modal, PageHeader } from '../../components/ui';
import { EMAIL_RE } from '../public/validation';

const ROLE_TONE = { STUDENT: 'brand', TEACHER: 'success', ADMIN: 'neutral' };

const UserForm = ({ user, classes, onDone, onCancel }) => {
  const { t } = useApp();
  const editing = Boolean(user);
  const [form, setForm] = useState({
    name: user?.name ?? '', email: user?.email ?? '', password: '', role: user?.role ?? 'STUDENT',
    gradeLevel: user?.gradeLevel ?? 8, classId: user?.classId ?? '', active: user?.active ?? true,
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.name.trim()) next.name = t('validation.nameRequired');
    if (!editing && !EMAIL_RE.test(form.email.trim())) next.email = t('validation.emailInvalid');
    if ((!editing || form.password) && form.password.length < 8) next[editing ? 'newPassword' : 'password'] = t('validation.passwordHint');
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    setFormError(null);
    const isStudent = form.role === 'STUDENT';
    try {
      if (editing) {
        await adminApi.updateUser(user.id, {
          name: form.name.trim(), active: form.active, newPassword: form.password || null,
          gradeLevel: isStudent ? Number(form.gradeLevel) : null, classId: isStudent && form.classId ? Number(form.classId) : null,
        });
      } else {
        await adminApi.createUser({
          name: form.name.trim(), email: form.email.trim(), password: form.password, role: form.role,
          gradeLevel: isStudent ? Number(form.gradeLevel) : null, classId: isStudent && form.classId ? Number(form.classId) : null,
        });
      }
      onDone();
    } catch (err) {
      setFormError(err.message);
      setErrors(err.fieldErrors ?? {});
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <FormError message={formError} />
      <Field label={t('auth.name')} value={form.name} onChange={set('name')} error={errors.name} />
      {!editing && <Field label={t('auth.email')} type="email" value={form.email} onChange={set('email')} error={errors.email} />}
      <Field label={editing ? t('admin.newPassword') : t('auth.password')} type="password" autoComplete="new-password"
        value={form.password} onChange={set('password')} error={errors.password ?? errors.newPassword}
        hint={editing ? t('admin.passwordKeep') : t('validation.passwordHint')} />
      {!editing && (
        <Field as="select" label={t('admin.role')} value={form.role} onChange={set('role')}>
          {/* The platform has a single admin account (the server rejects creating another). */}
          {['STUDENT', 'TEACHER'].map((r) => <option key={r} value={r}>{t(`roles.${r}`)}</option>)}
        </Field>
      )}
      {form.role === 'STUDENT' && (
        <div className="grid sm:grid-cols-2 gap-4">
          <Field as="select" label={t('onboarding.grade')} value={form.gradeLevel} onChange={set('gradeLevel')}>
            {[6, 7, 8, 9, 10, 11, 12].map((g) => <option key={g} value={g}>{t('common.grade', { grade: g })}</option>)}
          </Field>
          <Field as="select" label={t('classes.class')} value={form.classId} onChange={set('classId')}>
            <option value="">{t('classes.noClass')}</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name} · {c.schoolName}{c.teacherName ? ` (${c.teacherName})` : ''}</option>
            ))}
          </Field>
        </div>
      )}
      {editing && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.active} onChange={set('active')} className="h-4 w-4 accent-brand-600" /> {t('admin.active')}
        </label>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit" loading={saving}>{t('common.save')}</Button>
      </div>
    </form>
  );
};

export const UsersPage = () => {
  const { t, showToast, user: me } = useApp();
  const { data, error, loading, reload } = useApi(() => adminApi.users(), []);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('ALL');
  const [editing, setEditing] = useState(null); // null | 'new' | user

  const schools = useApi(() => adminApi.schools(), []);
  const classes = useMemo(() => (schools.data ?? []).flatMap((s) => s.classes), [schools.data]);
  const rows = useMemo(() => (data ?? [])
    .filter((u) => role === 'ALL' || u.role === role)
    .filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(query.trim().toLowerCase())), [data, role, query]);

  const downloadReport = async (u) => {
    try {
      await adminApi.studentReport(u.id);
    } catch {
      showToast(t('teacherView.reportFailed'), 'error');
    }
  };

  const remove = async (u) => {
    if (!window.confirm(t('admin.confirmDeleteUser', { name: u.name }))) return;
    try {
      await adminApi.deleteUser(u.id);
      showToast(t('admin.userDeleted'), 'info');
      reload();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  if (loading && !data) return <LoadingState rows={3} />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="space-y-5">
      <PageHeader title={t('admin.usersTitle')} subtitle={t('admin.usersSubtitle', { count: data.length })}
        actions={<Button leftIcon={Plus} onClick={() => setEditing('new')}>{t('admin.addUser')}</Button>} />
      <div className="flex flex-col sm:flex-row gap-3">
        <label className="relative flex-1">
          <span className="sr-only">{t('common.search')}</span>
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('admin.searchUsers')}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/30" />
        </label>
        <select value={role} onChange={(e) => setRole(e.target.value)} aria-label={t('admin.role')}
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm">
          <option value="ALL">{t('common.all')}</option>
          {['STUDENT', 'TEACHER', 'ADMIN'].map((r) => <option key={r} value={r}>{t(`roles.${r}`)}</option>)}
        </select>
      </div>

      {rows.length === 0 ? <EmptyState icon={Users} title={t('teacher.noMatches')} /> : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="text-left text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3 font-medium">{t('auth.name')}</th>
                <th className="px-3 py-3 font-medium">{t('admin.role')}</th>
                <th className="px-3 py-3 font-medium">{t('admin.details')}</th>
                <th className="px-3 py-3 font-medium">{t('admin.status')}</th>
                <th className="px-5 py-3 font-medium text-right">{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((u) => (
                <tr key={u.id}>
                  <td className="px-5 py-3"><p className="font-medium">{u.name}</p><p className="text-xs text-slate-500">{u.email}</p></td>
                  <td className="px-3 py-3"><Badge tone={ROLE_TONE[u.role]}>{t(`roles.${u.role}`)}</Badge></td>
                  <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                    {u.role === 'STUDENT'
                      ? `${u.gradeLevel ? t('common.grade', { grade: u.gradeLevel }) : '—'} · ${u.className ? `${u.className}${u.teacherName ? ` (${u.teacherName})` : ''}` : t('classes.noClass')} · ${u.xp ?? 0} XP`
                      : u.lastLoginAt ? t('admin.lastLogin', { date: new Date(u.lastLoginAt).toLocaleDateString() }) : '—'}
                  </td>
                  <td className="px-3 py-3">{u.active ? <Badge tone="success">{t('admin.active')}</Badge> : <Badge tone="danger">{t('admin.inactive')}</Badge>}</td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    {u.role === 'STUDENT' && (
                      <Button variant="ghost" size="sm" aria-label={t('teacherView.downloadPdf')} title={t('teacherView.downloadPdf')}
                        onClick={() => downloadReport(u)}><FileDown className="h-4 w-4" /></Button>
                    )}
                    <Button variant="ghost" size="sm" aria-label={t('common.edit')} onClick={() => setEditing(u)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" aria-label={t('common.delete')} disabled={u.id === me.id} onClick={() => remove(u)}><Trash2 className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={editing !== null} title={editing === 'new' ? t('admin.addUser') : t('admin.editUser')} onClose={() => setEditing(null)}>
        {editing !== null && (
          <UserForm user={editing === 'new' ? null : editing} classes={classes} onCancel={() => setEditing(null)}
            onDone={() => { setEditing(null); showToast(t('admin.userSaved'), 'success'); reload(); }} />
        )}
      </Modal>
    </div>
  );
};
