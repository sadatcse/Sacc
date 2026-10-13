'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FaUserPlus, FaHourglassHalf, FaSyncAlt } from 'react-icons/fa';
import useAuth from '@/hooks/useAuth';
import { safeRedirect } from '@/lib/redirect';
import { api } from '@/lib/api-client';
import AuthCard, { AuthButton, AuthError, AuthInput } from '@/components/auth/AuthCard';

export default function LoginView() {
  const { signIn } = useAuth();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [captcha, setCaptcha] = useState(null); // { question, token }
  const [answer, setAnswer] = useState('');
  const from = searchParams?.get('from') || '';
  const registerHref = from ? `/register?from=${encodeURIComponent(from)}` : '/register';

  // Each question works once, so a new one is loaded after every failed attempt
  const loadCaptcha = useCallback(() => {
    return api
      .get('/auth/captcha')
      .then((res) => {
        setCaptcha(res.data.data);
        setAnswer('');
      })
      .catch(() => setCaptcha({ question: '', token: '' }));
  }, []);

  useEffect(() => {
    loadCaptcha();
  }, [loadCaptcha]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const { user, redirectTo } = await signIn(email, password, { captchaToken: captcha?.token, captchaAnswer: answer });
      // Full reload so the proxy sees the new cookie
      window.location.assign(safeRedirect(from, user.role, redirectTo));
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
      loadCaptcha();
    }
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in as a student, alumnus or faculty member."
      footer={
        <>
          New here?{' '}
          <Link href={registerHref} className="font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300">Create an account</Link>
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
        {from.startsWith('/alumni/') && (
          <p className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-sm text-orange-700 dark:text-orange-300">
            Alumni profiles are for members. Sign in (or create a free account) and we’ll take you straight to the profile.
          </p>
        )}
        {/not approved yet/.test(error) ? (
          <div role="alert" className="flex gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-3 text-sm text-amber-800 dark:text-amber-200">
            <FaHourglassHalf className="mt-0.5 shrink-0" aria-hidden />
            <span>
              <span className="block font-semibold">Not approved yet</span>
              {error}
            </span>
          </div>
        ) : (
          <AuthError>{error}</AuthError>
        )}
        <AuthInput label="Email" name="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <AuthInput label="Password" name="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <div>
          <span className="mb-1.5 block text-sm font-medium text-body">Security check</span>
          <div className="flex items-center gap-2">
            <span
              aria-live="polite"
              className="flex h-11 min-w-[7.5rem] select-none items-center justify-center rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 font-mono text-base font-bold tracking-wider text-orange-700 dark:text-orange-300"
            >
              {captcha ? (captcha.question ? `${captcha.question} = ?` : 'Unavailable') : '…'}
            </span>
            <button
              type="button"
              onClick={loadCaptcha}
              aria-label="New question"
              title="New question"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-line/10 text-muted transition-colors hover:border-orange-500/50 hover:text-orange-600 dark:hover:text-orange-400"
            >
              <FaSyncAlt aria-hidden />
            </button>
            <input
              id="captcha"
              name="captcha"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              aria-label={captcha?.question ? `What is ${captcha.question}?` : 'Answer'}
              placeholder="Answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value.replace(/\D/g, '').slice(0, 3))}
              required
              className="h-11 w-full min-w-0 rounded-lg border border-line/10 bg-canvas/60 px-3 text-sm text-ink outline-none transition-colors placeholder:text-faint hover:border-orange-500/50 focus:border-orange-500"
            />
          </div>
        </div>
        <AuthButton disabled={submitting || !captcha?.token}>{submitting ? 'Signing in…' : 'Sign in'}</AuthButton>
      </form>
    </AuthCard>
  );
}
