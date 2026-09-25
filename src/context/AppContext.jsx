import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { authApi, setOfflineOwner } from '../services/api';
import { SESSION_EXPIRED_EVENT, setContentLanguage, tokenStore } from '../lib/api';
import { flushOutbox, pendingCount } from '../lib/sync';
import { translate } from '../i18n';

const AppContext = createContext(null);

const USER_KEY = 'shikshasetu.user';
const PREFS_KEY = 'shikshasetu.prefs';

const readJson = (key) => {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null'); } catch { return null; }
};
const writeJson = (key, value) => {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch { /* storage unavailable */ }
};

/**
 * Global client state: session, language, theme, connectivity, offline sync and toasts.
 */
export const AppProvider = ({ children }) => {
  const prefs = readJson(PREFS_KEY) ?? {};
  const [user, setUserState] = useState(null);
  const [status, setStatus] = useState(tokenStore.get() ? 'loading' : 'anon');
  const [language, setLanguageState] = useState(() => {
    const initial = prefs.language ?? 'en';
    setContentLanguage(initial);
    return initial;
  });
  // The API header changes together with the state, before any screen refetches in the new language.
  const applyLanguage = useCallback((lang) => {
    setContentLanguage(lang);
    setLanguageState(lang);
  }, []);
  const [darkMode, setDarkMode] = useState(prefs.darkMode ?? false);
  const [audioNarrator, setAudioNarrator] = useState(prefs.audioNarrator ?? false);
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((message, tone = 'success') => {
    clearTimeout(toastTimer.current);
    setToast({ message, tone, id: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  }, []);

  const setUser = useCallback((u) => {
    setUserState(u);
    writeJson(USER_KEY, u);
    setOfflineOwner(u?.id ?? null);
  }, []);

  const t = useCallback((key, vars) => translate(language, key, vars), [language]);

  // ---- session bootstrap: validate the stored token; stay signed in offline using the cached user
  useEffect(() => {
    if (!tokenStore.get()) return;
    let cancelled = false;
    authApi.me()
      .then((u) => { if (!cancelled) { setUser(u); setStatus('authed'); } })
      .catch((e) => {
        if (cancelled) return;
        const cached = readJson(USER_KEY);
        if (e?.isNetwork && cached) { setUser(cached); setStatus('authed'); return; }
        tokenStore.clear(); setUser(null); setStatus('anon');
      });
    return () => { cancelled = true; };
  }, [setUser]);

  const logout = useCallback(() => {
    authApi.logout();
    setUser(null);
    setStatus('anon');
  }, [setUser]);

  useEffect(() => {
    const onExpired = () => {
      logout();
      showToast(translate(language, 'auth.sessionExpired'), 'warn');
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [logout, showToast, language]);

  const login = useCallback(async (email, password) => {
    const u = await authApi.login(email, password);
    setUser(u);
    setStatus('authed');
    if (u.preferredLanguage) applyLanguage(u.preferredLanguage);
    return u;
  }, [setUser, applyLanguage]);

  const register = useCallback(async (data) => {
    const u = await authApi.register(data);
    setUser(u);
    setStatus('authed');
    return u;
  }, [setUser]);

  const setLanguage = applyLanguage;

  /** Reflect a server RewardSummary (XP, level, streak) in the signed-in user without refetching. */
  const applyReward = useCallback((reward) => {
    if (!reward) return;
    setUserState((u) => {
      if (!u) return u;
      const next = { ...u, xp: reward.totalXp, level: reward.level?.level ?? u.level, streak: reward.streak ?? u.streak };
      writeJson(USER_KEY, next);
      return next;
    });
  }, []);

  // ---- persist preferences & apply theme
  useEffect(() => {
    writeJson(PREFS_KEY, { language, darkMode, audioNarrator });
    document.documentElement.classList.toggle('dark', darkMode);
    document.documentElement.lang = language;
  }, [language, darkMode, audioNarrator]);

  // ---- connectivity + offline sync
  const syncNow = useCallback(async ({ silent = false } = {}) => {
    if (!user || user.role !== 'STUDENT') return;
    setSyncing(true);
    try {
      const res = await flushOutbox(user.id);
      if (!silent && res.synced > 0) {
        showToast(translate(language, 'sync.done', { count: res.synced }), 'success');
      }
      if (res.failed > 0) showToast(translate(language, 'sync.someFailed', { count: res.failed }), 'warn');
      return res;
    } finally {
      setPending(await pendingCount(user.id));
      setSyncing(false);
    }
  }, [user, language, showToast]);

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, []);

  // Sync shortly after we are (back) online with a signed-in student (debounced for flaky networks).
  useEffect(() => {
    if (!online || status !== 'authed') return;
    const id = setTimeout(() => syncNow(), 1500);
    return () => clearTimeout(id);
  }, [online, status, syncNow]);

  const refreshPending = useCallback(async () => {
    setPending(user ? await pendingCount(user.id) : 0);
  }, [user]);

  const value = useMemo(() => ({
    user, status, setUser, login, register, logout,
    language, setLanguage, t,
    darkMode, setDarkMode, audioNarrator, setAudioNarrator, applyReward,
    online, pending, syncing, syncNow, refreshPending,
    toast, showToast,
  }), [user, status, setUser, login, register, logout, language, setLanguage, t, darkMode, audioNarrator, applyReward, online, pending,
    syncing, syncNow, refreshPending, toast, showToast]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useApp = () => useContext(AppContext);
