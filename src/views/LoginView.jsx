'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FaUserPlus } from 'react-icons/fa';
import useAuth from '@/hooks/useAuth';
import AuthCard, { AuthButton, AuthError, AuthInput } from '@/components/auth/AuthCard';

// Only send people back to a page their role can open
function safeRedirect(from, role, fallback) {
  if (!from || !from.startsWith('/') || from.startsWith('//')) return fallback;
  if (from.startsWith('/dashboard') && role !== 'admin') return fallback;
  return from;
}

export default function LoginView() {
  const { signIn } = useAuth();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const { user, redirectTo } = await signIn(email, password);
      // Full reload so the proxy sees the new cookie
      window.location.href = safeRedirect(searchParams?.get('from'), user.role, redirectTo);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in as a student, alumnus or faculty member."
      footer={
        <>
          New here?{' '}
          <Link href="/register" className="font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300">Create an account</Link>
          <Link
            href="/join"
            className="mx-auto mt-4 flex w-fit items-center gap-2 rounded-lg border border-orange-500/40 px-4 py-2 text-sm font-semibold text-orange-600 transition-colors hover:bg-orange-500/10 dark:text-orange-400"
          >
            <FaUserPlus aria-hidden /> Want to become a club member? Join Us
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthError>{error}</AuthError>
        <AuthInput label="Email" name="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <AuthInput label="Password" name="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <AuthButton disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</AuthButton>
      </form>
    </AuthCard>
  );
}
