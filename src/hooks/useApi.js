import { useCallback, useEffect, useState } from 'react';

/**
 * useApi — runs an async loader and tracks data / error / loading.
 *
 *   const { data, error, loading, reload, mutate } = useApi(() => catalogApi.subject(id), [id]);
 *
 * `loading` is derived (the last settled request key differs from the current one),
 * so changing deps shows a loading state without setting state synchronously in an effect.
 */
export const useApi = (loader, deps = []) => {
  const [reloadKey, setReloadKey] = useState(0);
  const key = `${JSON.stringify(deps)}#${reloadKey}`;
  const [state, setState] = useState({ key: null, data: null, error: null });

  useEffect(() => {
    let active = true;
    loader().then(
      (data) => { if (active) setState({ key, data, error: null }); },
      (error) => { if (active) setState((s) => ({ key, data: s.data, error })); },
    );
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  const mutate = useCallback((updater) => setState((s) => ({
    ...s, data: typeof updater === 'function' ? updater(s.data) : updater,
  })), []);

  return { data: state.data, error: state.error, loading: state.key !== key, reload, mutate };
};
