'use client';
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api-client';

export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore the session from the httpOnly cookie on first load
  useEffect(() => {
    api
      .get('/auth/me', { withCredentials: true })
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const signIn = useCallback(async (email, password) => {
    try {
      const res = await api.post('/auth/sign-in', { email, password }, { withCredentials: true });
      setUser(res.data.user);
      return res.data.user;
    } catch (err) {
      throw new Error(err?.response?.data?.message || 'Sign-in failed.');
    }
  }, []);

  const logOut = useCallback(async () => {
    await api.post('/auth/logout', {}, { withCredentials: true }).catch(() => {});
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, signIn, logOut }), [user, loading, signIn, logOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
