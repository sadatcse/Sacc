'use client';
import { useState } from 'react';
import Link from 'next/link';
import { FaChalkboardTeacher, FaCheckCircle, FaUserGraduate, FaUserPlus } from 'react-icons/fa';
import { useSearchParams } from 'next/navigation';
import useAuth from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import AuthCard, { AuthButton, AuthError, AuthInput } from '@/components/auth/AuthCard';

// Alumni and faculty sign up here; current students get their login through the Join Us form.
// Every new account waits for an admin to approve it before it can sign in.
const TYPES = [
  {
    key: 'alumni',
    label: 'Alumni',
    icon: FaUserGraduate,
    fields: [
      { name: 'studentId', label: 'Student ID', placeholder: '191000101', required: true },
      { name: 'batch', label: 'Batch', placeholder: 'CSE 19', required: true },
      { name: 'department', label: 'Department', placeholder: 'Computer Science & Engineering' },
    ],
  },
  {
    key: 'faculty',
    label: 'Faculty',
    icon: FaChalkboardTeacher,
    fields: [
      { name: 'designation', label: 'Designation', placeholder: 'Lecturer', required: true },
      { name: 'department', label: 'Department', placeholder: 'Computer Science & Engineering', required: true },
    ],
  },
];

const EMPTY = { name: '', email: '', phone: '', password: '', confirm: '', studentId: '', batch: '', department: '', designation: '' };

export default function RegisterView() {
  const { register } = useAuth();
  const params = useSearchParams();
  const from = params?.get('from') || '';
  // ?type=faculty opens the faculty form (default: alumni)
  const [type, setType] = useState(params?.get('type') === 'faculty' ? 'faculty' : 'alumni');
  const [values, setValues] = useState(EMPTY);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null); // { email, message } once the account is created
  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));
  const { fields } = TYPES.find((t) => t.key === type);
  const loginHref = from ? `/login?from=${encodeURIComponent(from)}` : '/login';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (values.password !== values.confirm) {
      setError('The passwords do not match.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await register({
        type,
        name: values.name,
        email: values.email,
        phone: values.phone,
        password: values.password,
        profile: Object.fromEntries(fields.map((f) => [f.name, values[f.name]])),
      });
      setDone({ email: res.email, message: res.message });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <AuthCard title="Waiting for approval" subtitle="Your account has been created.">
        <div className="space-y-4 text-center">
          <FaCheckCircle className="mx-auto text-5xl text-green-500" aria-hidden />
          <p className="text-sm leading-relaxed text-body">{done.message}</p>
          <p className="rounded-lg border border-line/10 bg-canvas/60 px-3 py-2 text-sm text-muted">
            We will write to <span className="font-semibold text-ink">{done.email}</span>
          </p>
          <Link href="/" className="inline-block text-sm font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300">
            Back to the website
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="For alumni and faculty members. An admin approves every new account."
      footer={
        <>
          Already have an account?{' '}
          <Link href={loginHref} className="font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300">Sign in</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-line/10 bg-canvas/60 p-1" role="radiogroup" aria-label="I am">
          {TYPES.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={type === key}
              onClick={() => setType(key)}
              className={cn(
                'flex h-10 items-center justify-center gap-2 rounded-md text-sm font-semibold transition-colors',
                type === key ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white' : 'text-muted hover:text-ink'
              )}
            >
              <Icon aria-hidden /> {label}
            </button>
          ))}
        </div>

        <AuthError>{error}</AuthError>
        <AuthInput label="Full name" name="name" autoComplete="name" value={values.name} onChange={set('name')} required />
        <div className="grid gap-4 sm:grid-cols-2">
          <AuthInput label="Email" name="email" type="email" autoComplete="email" value={values.email} onChange={set('email')} required />
          <AuthInput label="Phone (optional)" name="phone" type="tel" autoComplete="tel" placeholder="01XXXXXXXXX" value={values.phone} onChange={set('phone')} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <AuthInput
              key={f.name}
              label={f.required ? f.label : `${f.label} (optional)`}
              name={f.name}
              placeholder={f.placeholder}
              value={values[f.name]}
              onChange={set(f.name)}
              required={f.required}
            />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <AuthInput label="Password" name="password" type="password" autoComplete="new-password" minLength={8} value={values.password} onChange={set('password')} required />
          <AuthInput label="Confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} value={values.confirm} onChange={set('confirm')} required />
        </div>
        <p className="text-xs text-subtle">At least 8 characters. You can sign in once an admin approves your account — we’ll email you.</p>
        <AuthButton disabled={submitting}>{submitting ? 'Creating account…' : 'Create account'}</AuthButton>
      </form>

      <Link
        href="/join"
        className="mt-5 flex items-center gap-3 rounded-lg border border-orange-500/30 bg-orange-500/5 px-4 py-3 text-sm text-body transition-colors hover:border-orange-500/60"
      >
        <FaUserPlus className="shrink-0 text-orange-500" aria-hidden />
        <span>
          <span className="font-semibold text-ink">Current student?</span> Apply on the Join Us form — your member login is created with it.
        </span>
      </Link>
    </AuthCard>
  );
}
