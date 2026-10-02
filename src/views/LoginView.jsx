'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import useAuth from '@/hooks/useAuth';
import { siteConfig } from '@/config/site';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { Input } from '@/components/forms/FormField';
import Logo from '@/components/layout/Logo';

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
      await signIn(email, password);
      // Full reload so the proxy sees the new cookie
      window.location.href = searchParams?.get('from') || '/dashboard';
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo />
          <h1 className="mt-4 text-2xl">Admin sign in</h1>
          <p className="mt-1 text-sm text-gray-500">{siteConfig.name}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert type="error">{error}</Alert>
          <Input label="Email" name="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label="Password" name="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button type="submit" className="w-full" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</Button>
        </form>
      </div>
    </div>
  );
}
