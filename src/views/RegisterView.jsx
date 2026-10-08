'use client';
import { useState } from 'react';
import Link from 'next/link';
import { FaUserGraduate, FaUserTie } from 'react-icons/fa';
import useAuth from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import AuthCard, { AuthButton, AuthError, AuthInput } from '@/components/auth/AuthCard';

// Students and alumni can sign up themselves; faculty (admin) accounts are created by an admin.
const ROLES = [
  { key: 'student', label: 'Student', icon: FaUserGraduate, extra: { name: 'studentId', label: 'Student ID', placeholder: '221000101' } },
  { key: 'alumni', label: 'Alumni', icon: FaUserTie, extra: { name: 'batch', label: 'Batch', placeholder: 'CSE 19' } },
];

export default function RegisterView() {
  const { register } = useAuth();
  const [role, setRole] = useState('student');
  const [values, setValues] = useState({ name: '', email: '', password: '', confirm: '', studentId: '', batch: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));
  const extra = ROLES.find((r) => r.key === role).extra;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (values.password !== values.confirm) {
      setError('The passwords do not match.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const { redirectTo } = await register({
        role,
        name: values.name,
        email: values.email,
        password: values.password,
        profile: { [extra.name]: values[extra.name] },
      });
      window.location.href = redirectTo;
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Create your account"
      subtitle="Join the club community as a student or an alumnus."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300">Sign in</Link>
          <span className="mt-2 block text-xs text-subtle">Faculty accounts are created by the club admins.</span>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-line/10 bg-canvas/60 p-1" role="radiogroup" aria-label="I am a">
          {ROLES.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={role === key}
              onClick={() => setRole(key)}
              className={cn(
                'flex h-10 items-center justify-center gap-2 rounded-md text-sm font-semibold transition-colors',
                role === key ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white' : 'text-muted hover:text-ink'
              )}
            >
              <Icon aria-hidden /> {label}
            </button>
          ))}
        </div>

        <AuthError>{error}</AuthError>
        <AuthInput label="Full name" name="name" autoComplete="name" value={values.name} onChange={set('name')} required />
        <AuthInput label="Email" name="email" type="email" autoComplete="email" value={values.email} onChange={set('email')} required />
        <AuthInput label={extra.label} name={extra.name} placeholder={extra.placeholder} value={values[extra.name]} onChange={set(extra.name)} />
        <div className="grid gap-4 sm:grid-cols-2">
          <AuthInput label="Password" name="password" type="password" autoComplete="new-password" minLength={8} value={values.password} onChange={set('password')} required />
          <AuthInput label="Confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} value={values.confirm} onChange={set('confirm')} required />
        </div>
        <p className="text-xs text-subtle">At least 8 characters.</p>
        <AuthButton disabled={submitting}>{submitting ? 'Creating account…' : 'Create account'}</AuthButton>
      </form>
    </AuthCard>
  );
}
