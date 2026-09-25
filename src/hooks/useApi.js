import { useEffect, useState, useCallback } from 'react';

/**
 * useApi — wraps any async function with loading/error/data state.
 *
 *   const { data, loading, error, refetch } = useApi(() => catalog.subject(id), [id]);
 */
export const useApi = (fn, deps = []) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      setData(result);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { refetch(); }, [refetch]);

  return { data, error, loading, refetch, setData };
};
