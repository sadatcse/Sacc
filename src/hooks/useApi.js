'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiSecure } from '@/lib/api-client';

/**
 * Loads data from an admin API route.
 *   const { data, loading, error, reload } = useApi('/contact', { select: (res) => res.data });
 * Redirects to /login on 401/403.
 */
export default function useApi(url, { initialData = null, select = (res) => res } = {}) {
  const router = useRouter();
  const selectRef = useRef(select);
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    selectRef.current = select;
  });

  const fetchData = useCallback(
    () =>
      apiSecure
        .get(url)
        .then((res) => {
          setData(selectRef.current(res.data));
          setError(null);
        })
        .catch((err) => {
          const status = err?.response?.status;
          if (status === 401 || status === 403) router.push('/login');
          setError(err?.response?.data?.message || err.message);
        })
        .finally(() => setLoading(false)),
    [url, router]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const reload = useCallback(() => {
    setLoading(true);
    return fetchData();
  }, [fetchData]);

  return { data, setData, loading, error, reload };
}
