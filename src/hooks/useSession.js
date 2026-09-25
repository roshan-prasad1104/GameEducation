import { useEffect, useState, useCallback } from 'react';
import { auth } from '../services/api';

/**
 * useSession — single source of truth for the signed-in user.
 *
 *   const { user, status, login, logout } = useSession();
 *
 * status: 'loading' | 'anon' | 'authed'
 */
export const useSession = () => {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');

  const refresh = useCallback(async () => {
    setStatus('loading');
    const u = await auth.me();
    setUser(u);
    setStatus(u ? 'authed' : 'anon');
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = useCallback(async (creds) => {
    const { user } = await auth.login(creds);
    setUser(user);
    setStatus('authed');
    return user;
  }, []);

  const register = useCallback(async (data) => {
    const { user } = await auth.register(data);
    setUser(user);
    setStatus('authed');
    return user;
  }, []);

  const logout = useCallback(() => {
    auth.logout();
    setUser(null);
    setStatus('anon');
  }, []);

  return { user, status, login, register, logout, refresh };
};
