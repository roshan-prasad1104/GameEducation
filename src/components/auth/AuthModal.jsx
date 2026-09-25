import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { LANGUAGES, GRADES } from '../../data/mockData';
import { auth } from '../../services/api';
import { X, Mail, KeyRound, Globe, GraduationCap, ShieldCheck, ArrowRight, Loader2, User, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';

const ROLE_HOME = {
  student: '/student/dashboard',
  teacher: '/teacher/dashboard',
  admin:   '/admin/dashboard',
};

export const AuthModal = () => {
  const { authModalMode, setAuthModalMode, language, setLanguage, showToast, login, register, setActiveTab } = useApp();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [role, setRole] = useState('student'); // for register
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('Grade 8');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!authModalMode) return null;

  const reset = () => {
    setMode('login');
    setRole('student');
    setEmail(''); setPassword(''); setName(''); setGrade('Grade 8');
    setError(null); setSubmitting(false);
  };
  const close = () => { setAuthModalMode(null); reset(); };

  const useDemoAccount = async (acct) => {
    setSubmitting(true); setError(null);
    try {
      const u = await login({ email: acct.email, password: acct.password });
      showToast(`Welcome back, ${u.name.split(' ')[0]}!`, 'success');
      close();
      const targetTab = u.role === 'teacher' ? 'teacher' : 'dashboard';
      setActiveTab(targetTab);
      navigate(ROLE_HOME[u.role] ?? '/student/dashboard');
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError(null);
    try {
      const u = mode === 'login'
        ? await login({ email, password })
        : await register({ name, email, password, grade, role });
      showToast(mode === 'login' ? `Welcome back, ${u.name.split(' ')[0]}!` : `Account created — welcome, ${u.name.split(' ')[0]}!`, 'success');
      close();
      const targetTab = u.role === 'teacher' ? 'teacher' : 'dashboard';
      setActiveTab(targetTab);
      navigate(ROLE_HOME[u.role] ?? '/student/dashboard');
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const demos = auth.demoAccounts();

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
          {mode === 'login' && (
            <div className="mb-5 p-3 rounded-xl bg-slate-800/80 border border-slate-700">
              <p className="text-xs font-semibold text-brand-200 mb-2 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" /> Demo accounts (one click)
              </p>
              <div className="grid grid-cols-3 gap-2">
                {demos.map(d => (
                  <button
                    key={d.email}
                    type="button"
                    onClick={() => useDemoAccount(d)}
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
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">I am a</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['student','teacher'].map(r => (
                      <button key={r} type="button" onClick={() => setRole(r)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${role === r ? 'bg-brand-500/20 border-brand-400 text-brand-100' : 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700'}`}>
                        <span className="capitalize">{r}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {role === 'student' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Grade</label>
                    <select value={grade} onChange={e => setGrade(e.target.value)} className="input">
                      {GRADES.map(g => <option key={g.id} value={g.label}>{g.label} ({g.age})</option>)}
                    </select>
                  </div>
                )}
              </>
            )}
            <Field label="Email" icon={Mail}>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="input" placeholder="you@example.com" />
            </Field>
            <Field label="Password" icon={KeyRound}>
              <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} className="input" placeholder="At least 6 characters" />
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
            <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
              className="text-brand-300 font-medium hover:underline">
              {mode === 'login' ? 'Create one' : 'Sign in'}
            </button>
          </p>

          {/* Language */}
          <div className="mt-5 pt-5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <span className="inline-flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> Language</span>
            <select value={language} onChange={e => setLanguage(e.target.value)} className="text-xs bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-slate-100">
              {LANGUAGES.slice(0, 3).map(l => <option key={l.id} value={l.id}>{l.native}</option>)}
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
