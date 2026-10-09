'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaUserGraduate, FaHourglassHalf, FaCheckCircle, FaTimesCircle, FaEyeSlash } from 'react-icons/fa';
import useAuth from '@/hooks/useAuth';
import { apiSecure, apiError } from '@/lib/api-client';
import { formatDate } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { Input, Select, Textarea } from '@/components/forms/FormField';
import { FormSkeleton } from '@/components/loading/PageSkeletons';

const SHIFTS = [
  { value: '', label: 'Select shift' },
  { value: 'day', label: 'Day' },
  { value: 'evening', label: 'Evening' },
];

// Account → Become Alumni (students). Sends a request; an admin approves it and the account becomes alumni.
export default function AlumniRequestForm() {
  const { user, profile, refresh } = useAuth();
  const router = useRouter();
  const [request, setRequest] = useState(undefined); // undefined = loading, null = none yet
  const [values, setValues] = useState(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    let active = true;
    apiSecure
      .get('/alumni-requests/me')
      .then((res) => active && setRequest(res.data.data))
      .catch(() => active && setRequest(null));
    return () => {
      active = false;
    };
  }, []);

  // Pre-filled from the student profile the first time the form is shown
  const form = values || {
    studentId: profile?.studentId || '',
    department: profile?.department || '',
    batch: profile?.batch || '',
    shift: '',
    degree: 'B.Sc. in Computer Science & Engineering',
    graduationYear: String(new Date().getFullYear()),
    jobTitle: '',
    company: '',
    location: '',
    note: '',
    hideProfile: false,
  };
  const set = (key) => (e) => setValues({ ...form, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      const res = await apiSecure.post('/alumni-requests', { ...form, graduationYear: Number(form.graduationYear) });
      setRequest(res.data.data);
      setStatus({ type: 'success', message: res.data.message });
    } catch (err) {
      setStatus({ type: 'error', message: apiError(err, 'Could not send your request.') });
    } finally {
      setSaving(false);
    }
  };

  if (request === undefined || !user) return <FormSkeleton cards={1} />;

  // Approved: the account is alumni now (the role comes from the server on refresh)
  if (user.role === 'alumni' || request?.status === 'approved') {
    return (
      <Card>
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <FaCheckCircle className="text-5xl text-green-500" aria-hidden />
          <h2 className="text-xl font-bold text-ink">You are part of the alumni network 🎓</h2>
          <p className="max-w-md text-sm text-muted">Your account is an alumni account now. Add your job, links and story on your profile.</p>
          <Button onClick={() => refresh().then(() => router.push('/account'))}>Open my alumni profile</Button>
        </div>
      </Card>
    );
  }

  if (user.role !== 'student') {
    return <Alert type="info">Only student accounts can ask to become alumni.</Alert>;
  }

  if (request?.status === 'pending') {
    return (
      <Card>
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <FaHourglassHalf className="text-4xl text-amber-500" aria-hidden />
          <h2 className="text-xl font-bold text-ink">Your request is waiting for review</h2>
          <p className="max-w-md text-sm text-muted">
            Sent on {formatDate(request.createdAt)} — graduated {request.graduationYear}, batch {request.batch}. We will email you when an admin decides.
          </p>
          {request.hideProfile && (
            <p className="flex items-center gap-2 text-xs text-subtle"><FaEyeSlash aria-hidden /> Your alumni profile will be hidden from the website.</p>
          )}
          <Alert type={status.type || 'info'}>{status.message}</Alert>
        </div>
      </Card>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {request?.status === 'rejected' && (
        <Alert type="error">
          <span className="flex items-start gap-2">
            <FaTimesCircle className="mt-0.5 shrink-0" aria-hidden />
            <span>
              Your previous request was not approved{request.adminNote ? `: ${request.adminNote}` : '.'} You can correct the details and send it again.
            </span>
          </span>
        </Alert>
      )}

      <Card title="Become Alumni">
        <p className="mb-5 flex items-start gap-3 text-sm text-muted">
          <FaUserGraduate className="mt-0.5 shrink-0 text-orange-500" aria-hidden />
          Graduated? Ask to turn your account into an alumni account. Once an admin approves, your student details move to a new alumni profile
          that you can complete with your job, links and story. Your login and password stay the same.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Student ID" name="studentId" value={form.studentId} onChange={set('studentId')} required />
          <Input label="Batch" name="batch" placeholder="CSE 20" value={form.batch} onChange={set('batch')} required />
          <Input label="Department" name="department" value={form.department} onChange={set('department')} />
          <Select label="Shift" name="shift" options={SHIFTS} value={form.shift} onChange={set('shift')} />
          <Input label="Degree" name="degree" value={form.degree} onChange={set('degree')} />
          <Input label="Graduation year" name="graduationYear" type="number" min="1990" max={new Date().getFullYear() + 1} value={form.graduationYear} onChange={set('graduationYear')} required />
          <Input label="Current job title (optional)" name="jobTitle" placeholder="Software Engineer" value={form.jobTitle} onChange={set('jobTitle')} />
          <Input label="Company / University (optional)" name="company" value={form.company} onChange={set('company')} />
          <Input label="City (optional)" name="location" placeholder="Dhaka" value={form.location} onChange={set('location')} />
        </div>
        <div className="mt-4">
          <Textarea label="Message to the admins (optional)" name="note" rows={3} value={form.note} onChange={set('note')} placeholder="e.g. Graduated in Spring 2026, final result published." />
        </div>

        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-line/10 bg-canvas p-4">
          <input type="checkbox" checked={form.hideProfile} onChange={set('hideProfile')} className="mt-1 h-4 w-4 accent-orange-500" />
          <span>
            <span className="flex items-center gap-2 font-medium text-ink"><FaEyeSlash aria-hidden className="text-muted" /> Don’t show my profile on the website</span>
            <span className="mt-0.5 block text-sm text-subtle">
              Your alumni profile stays private — not in the Alumni Directory and no public profile page. You can change this later in your profile.
            </span>
          </span>
        </label>
      </Card>

      <Alert type={status.type || 'info'}>{status.message}</Alert>
      <div className="flex items-center justify-between gap-3">
        <Link href="/account" className="text-sm text-muted hover:text-ink">Cancel</Link>
        <Button type="submit" disabled={saving}>{saving ? 'Sending…' : 'Send request'}</Button>
      </div>
    </form>
  );
}
