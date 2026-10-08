'use client';
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api-client';

export const AuthContext = createContext(null);

const errorMessage = (err, fallback) => err?.response?.data?.message || fallback;

// Session for /login, /register, /account and /dashboard.
// user = { _id, name, email, role, status, … }, profile = the role's profile document.
export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(
    () =>
      api
        .get('/auth/me', { withCredentials: true })
        .then((res) => {
          setUser(res.data.data.user);
          setProfile(res.data.data.profile);
          return res.data.data;
        })
        .catch(() => {
          setUser(null);
          setProfile(null);
          return null;
        }),
    []
  );

  // Restore the session from the httpOnly cookie on first load
  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  // Both return { user, redirectTo }
  const signIn = useCallback(async (email, password) => {
    try {
      const res = await api.post('/auth/sign-in', { email, password }, { withCredentials: true });
      setUser(res.data.data.user);
      return res.data.data;
    } catch (err) {
      throw new Error(errorMessage(err, 'Sign-in failed.'));
    }
  }, []);

  const register = useCallback(async (payload) => {
    try {
      const res = await api.post('/auth/register', payload, { withCredentials: true });
      setUser(res.data.data.user);
      return { ...res.data.data, message: res.data.message };
    } catch (err) {
      throw new Error(errorMessage(err, 'Registration failed.'));
    }
  }, []);

  const logOut = useCallback(async () => {
    await api.post('/auth/logout', {}, { withCredentials: true }).catch(() => {});
    setUser(null);
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({ user, profile, loading, signIn, register, logOut, refresh, setUser, setProfile }),
    [user, profile, loading, signIn, register, logOut, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
