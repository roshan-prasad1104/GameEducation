import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { LANGUAGES, GRADES } from '../../data/constants';
import { X, Mail, KeyRound, Globe, ShieldCheck, ArrowRight, User, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import { homeFor } from '../routing/roles';

/** Seeded development accounts (documented in README). Shown only in `npm run dev`. */
const DEMO_ACCOUNTS = [
  { email: 'aarav@shiksha.org', password: 'Student@123', label: 'Student demo' },
  { email: 'teacher@shiksha.org', password: 'Teacher@123', label: 'Teacher demo' },
  { email: 'admin@shiksha.org', password: 'Admin@123', label: 'Admin demo' },
];

/**
 * Sign-in / sign-up dialog, shown over the landing page at /login and /register.
 * Public sign-up creates student accounts; teacher and admin accounts are created by an admin.
 */
export const AuthModal = ({ mode }) => {
  const { language, setLanguage, showToast, login, register, t } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [grade, setGrade] = useState(8);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const close = () => navigate('/');
  const setMode = (m) => { setError(null); navigate(m === 'login' ? '/login' : '/register', { replace: true, state: location.state }); };

  const goHome = (u) => {
    const from = location.state?.from;
    if (u.role === 'STUDENT' && u.onboarded === false) return navigate('/onboarding', { replace: true });
    navigate(from && from.startsWith(`/${u.role.toLowerCase()}/`) ? from : homeFor(u.role), { replace: true });
  };

  const signInDemo = async (acct) => {
    setSubmitting(true); setError(null);
    try {
      const u = await login(acct.email, acct.password);
      showToast(`Welcome back, ${u.name.split(' ')[0]}!`, 'success');
      goHome(u);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'register' && password.length < 8) { setError(t('validation.passwordHint')); return; }
    setSubmitting(true); setError(null);
    try {
      const u = mode === 'login'
        ? await login(email.trim(), password)
        : await register({ name: name.trim(), email: email.trim(), password, gradeLevel: Number(grade) });
      showToast(mode === 'login' ? `Welcome back, ${u.name.split(' ')[0]}!` : `Account created — welcome, ${u.name.split(' ')[0]}!`, 'success');
      goHome(u);
    } catch (e) {
      setError(e.status === 401 ? t('auth.invalidCredentials') : e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const demos = import.meta.env.DEV ? DEMO_ACCOUNTS : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-slate-900/95 text-slate-100 rounded-3xl shadow-2xl border border-slate-700 overflow-hidden">
        <div className="h-1.5 brand-gradient" />
        <button onClick={close} aria-label="Close" className="absolute top-4 right-4 p-2 text-slate-300 hover:text-white rounded-full hover:bg-slate-800">
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-xl brand-gradient flex items-center justify-center text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                {mode === 'login' ? 'Welcome back' : 'Create your account'}
              </h2>
              <p className="text-sm text-slate-300">
                {mode === 'login' ? 'Sign in to continue your learning journey' : 'Start learning in minutes — free for rural students'}
              </p>
            </div>
          </div>

          {/* Demo accounts (login only) */}
          {mode === 'login' && demos.length > 0 && (
            <div className="mb-5 p-3 rounded-xl bg-slate-800/80 border border-slate-700">
              <p className="text-xs font-semibold text-brand-200 mb-2 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" /> Demo accounts (one click)
              </p>
              <div className="grid grid-cols-3 gap-2">
                {demos.map(d => (
                  <button
                    key={d.email}
                    type="button"
                    onClick={() => signInDemo(d)}
                    disabled={submitting}
                    className="text-xs font-medium px-2 py-1.5 rounded-lg bg-slate-900 border border-brand-500/60 text-slate-100 hover:border-brand-400 transition-colors disabled:opacity-50"
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <>
                <Field label="Full name" icon={User}>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} className="input" placeholder="Your name" />
                </Field>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Grade</label>
                  <select value={grade} onChange={e => setGrade(e.target.value)} className="input">
                    {GRADES.map(g => <option key={g.id} value={g.id.slice(1)}>{g.label} ({g.age})</option>)}
                  </select>
                </div>
              </>
            )}
            <Field label="Email" icon={Mail}>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="input" placeholder="you@example.com" />
            </Field>
            <Field label="Password" icon={KeyRound}>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="input" placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
            </Field>

            {error && (
              <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 rounded-lg px-3 py-2">{error}</p>
            )}

            <Button type="submit" size="lg" className="w-full" loading={submitting} rightIcon={ArrowRight}>
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
            {mode === 'login' ? "Don't have an account?" : 'Already have one?'}{' '}
            <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-brand-300 font-medium hover:underline">
              {mode === 'login' ? 'Create one' : 'Sign in'}
            </button>
          </p>

          {/* Language */}
          <div className="mt-5 pt-5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <span className="inline-flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> Language</span>
            <select value={language} onChange={e => setLanguage(e.target.value)} className="text-xs bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-slate-100">
              {LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.native}</option>)}
            </select>
          </div>
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
