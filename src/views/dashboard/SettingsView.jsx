'use client';
import { useEffect, useMemo, useState } from 'react';
import { FaClock, FaUserPlus, FaPalette, FaExternalLinkAlt, FaEnvelopeOpenText, FaPaperPlane } from 'react-icons/fa';
import useApi from '@/hooks/useApi';
import useAuth from '@/hooks/useAuth';
import { apiSecure, apiError } from '@/lib/api-client';
import { DEFAULT_TIME_ZONE, offsetLabel, setTimeZone } from '@/lib/timezone';
import { cn } from '@/lib/utils';
import PageTitle from '@/components/dashboard/PageTitle';
import EntityForm, { setPath } from '@/components/forms/EntityForm';
import ThemeToggle from '@/components/layout/ThemeToggle';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { FormSkeleton } from '@/components/loading/PageSkeletons';

const PINNED_ZONES = ['Asia/Dhaka', 'Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Europe/London', 'America/New_York', 'UTC'];

function allTimeZones() {
  try {
    const zones = Intl.supportedValuesOf('timeZone');
    return [...PINNED_ZONES, ...zones.filter((z) => !PINNED_ZONES.includes(z))];
  } catch {
    return PINNED_ZONES;
  }
}

function useClock(timeZone) {
  const [now, setNow] = useState(null);
  useEffect(() => {
    const tick = () =>
      setNow(new Intl.DateTimeFormat('en-GB', { timeZone, dateStyle: 'full', timeStyle: 'medium' }).format(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timeZone]);
  return now;
}

function Section({ icon: Icon, title, description, children, footer }) {
  return (
    <Card className="p-0">
      <div className="flex items-start gap-3 border-b border-line/10 px-5 py-4">
        <span className="rounded-lg bg-primary-50 p-2.5 text-primary-600 dark:bg-primary-500/15 dark:text-primary-300"><Icon /></span>
        <div>
          <h2 className="text-base">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-subtle">{description}</p>}
        </div>
      </div>
      <div className="px-5 py-5">{children}</div>
      {footer && <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line/10 px-5 py-3">{footer}</div>}
    </Card>
  );
}

function Switch({ checked, onChange, label, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={cn('relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-50', checked ? 'bg-green-500' : 'bg-line/20')}
    >
      <span className={cn('inline-block h-5 w-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-6' : 'translate-x-1')} />
    </button>
  );
}

// Saves one settings key and reports the result
function useSettingForm(key) {
  const loaded = useApi(`/settings/${key}`, { select: (res) => res.data });
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const values = draft ?? loaded.data;

  const save = async (override) => {
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      const res = await apiSecure.put(`/settings/${key}`, override ?? values);
      loaded.setData(res.data.data);
      setDraft(null);
      setStatus({ type: 'success', message: 'Saved.' });
      return res.data.data;
    } catch (err) {
      setStatus({ type: 'error', message: apiError(err, 'Could not save.') });
      return null;
    } finally {
      setSaving(false);
    }
  };

  return { values, setDraft: (fn) => setDraft((d) => fn(d ?? loaded.data)), saving, status, save, loading: loaded.loading, error: loaded.error, dirty: draft !== null };
}

const PAYMENT_FIELDS = [
  { name: 'notice', label: 'Notice shown on the Join page', full: true, placeholder: 'Registration is open now.' },
  { name: 'fee', label: 'Membership fee (BDT)', type: 'number' },
  { name: 'reference', label: 'Payment reference instruction', placeholder: 'Your name_Student ID' },
  { name: 'bkash', label: 'bKash number', placeholder: '01XXXXXXXXX' },
  { name: 'nagad', label: 'Nagad number', placeholder: '01XXXXXXXXX' },
  { name: 'rocket', label: 'Rocket number', placeholder: '01XXXXXXXXX' },
];

const SMTP_FIELDS = [
  { name: 'host', label: 'SMTP host', placeholder: 'smtp.gmail.com' },
  { name: 'port', label: 'Port', type: 'number', placeholder: '465', help: '465 = SSL, 587 = STARTTLS' },
  { name: 'user', label: 'Username', placeholder: 'computerclub@southasiauni.ac.bd', autoComplete: 'off' },
  { name: 'pass', label: 'Password / app password', type: 'password', autoComplete: 'new-password' },
  { name: 'secure', label: 'Use SSL (port 465)', type: 'checkbox', full: true },
  { type: 'heading', label: 'Sender' },
  { name: 'fromName', label: 'From name', placeholder: 'South Asia Computer Club' },
  { name: 'fromEmail', label: 'From email', type: 'email', placeholder: 'computerclub@southasiauni.ac.bd' },
  { name: 'adminEmail', label: 'Club inbox (receives notifications)', type: 'email', full: true },
  { type: 'heading', label: 'Send these emails' },
  { name: 'notify.membershipReceived', label: 'Join request received → applicant', type: 'checkbox' },
  { name: 'notify.membershipApproved', label: 'Membership approved → applicant', type: 'checkbox' },
  { name: 'notify.membershipRejected', label: 'Membership rejected → applicant', type: 'checkbox' },
  { name: 'notify.membershipAdmin', label: 'New join request → club inbox', type: 'checkbox' },
  { name: 'notify.contactAutoReply', label: 'Contact form → "we got your message" to sender', type: 'checkbox' },
  { name: 'notify.contactAdmin', label: 'Contact form → club inbox', type: 'checkbox' },
  { name: 'notify.accountReceived', label: 'Alumni / faculty sign-up → "waiting for approval"', type: 'checkbox' },
  { name: 'notify.accountApproved', label: 'Account approved → user', type: 'checkbox' },
  { name: 'notify.accountAdmin', label: 'New account to approve → club inbox', type: 'checkbox' },
];

// Dashboard → Settings → Email: SMTP login, sender, which emails are sent, and a test button
function EmailSettings() {
  const { user } = useAuth();
  const email = useSettingForm('email');
  const [testTo, setTestTo] = useState('');
  const [testing, setTesting] = useState(false);
  const [testStatus, setTestStatus] = useState({ type: '', message: '' });
  const v = email.values;

  const save = () => email.save({ ...v, port: Number(v.port) || 465 });
  const sendTest = async () => {
    setTesting(true);
    setTestStatus({ type: '', message: '' });
    try {
      const res = await apiSecure.post('/settings/email/test', { to: testTo || user?.email });
      setTestStatus({ type: 'success', message: res.data.message });
    } catch (err) {
      setTestStatus({ type: 'error', message: apiError(err, 'Could not send the test email.') });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Section
      icon={FaEnvelopeOpenText}
      title="Email"
      description="Mail server used for join-request, approval and contact-form emails."
      footer={
        <>
          <Alert type={email.status.type || 'info'} className="mr-auto py-1.5">{email.status.message}</Alert>
          <Button onClick={save} disabled={email.saving || !email.dirty}>{email.saving ? 'Saving…' : 'Save email settings'}</Button>
        </>
      }
    >
      {email.loading || !v ? (
        <FormSkeleton cards={1} />
      ) : (
        <>
          <div className={cn('mb-5 flex items-center justify-between gap-4 rounded-xl border px-4 py-4', v.configured && v.enabled ? 'border-green-500/30 bg-green-500/5' : 'border-amber-500/30 bg-amber-500/5')}>
            <div>
              <p className="font-semibold text-ink">
                {!v.enabled ? 'Email sending is OFF' : v.configured ? 'Email is set up' : 'Email is not set up yet'}
              </p>
              <p className="text-sm text-subtle">
                {v.configured
                  ? `Sending as ${v.fromEmail || v.user} through ${v.host}:${v.port}${v.passwordFromEnv ? ' (password from .env)' : ''}.`
                  : 'Fill in the host, username and password below, save, then send a test email.'}
              </p>
            </div>
            <Switch checked={Boolean(v.enabled)} onChange={(on) => email.setDraft((d) => ({ ...d, enabled: on }))} label="Send emails" disabled={email.saving} />
          </div>

          <EntityForm
            fields={SMTP_FIELDS.map((f) =>
              f.name === 'pass' ? { ...f, placeholder: v.hasPassword ? '•••••••• saved — leave empty to keep' : 'Enter the password', help: 'Stored encrypted. For Gmail use an App Password.' } : f
            )}
            values={{ ...v, pass: v.pass || '' }}
            onChange={(name, value) => email.setDraft((d) => setPath(d, name, value))}
            disabled={email.saving}
          />

          <div className="mt-6 rounded-xl border border-line/10 bg-canvas p-4">
            <p className="mb-2 text-sm font-medium text-body">Send a test email</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                value={testTo}
                onChange={(e) => setTestTo(e.target.value)}
                placeholder={user?.email || 'you@example.com'}
                className="h-10 flex-1 rounded-lg border border-line/20 bg-surface px-3 text-sm text-ink placeholder-faint focus:border-primary-500 focus:outline-none"
              />
              <Button variant="secondary" onClick={sendTest} disabled={testing || email.dirty}>
                <FaPaperPlane /> {testing ? 'Sending…' : 'Send test'}
              </Button>
            </div>
            {email.dirty && <p className="mt-2 text-xs text-subtle">Save your changes first, then send a test.</p>}
            <Alert type={testStatus.type || 'info'} className="mt-3">{testStatus.message}</Alert>
          </div>
        </>
      )}
    </Section>
  );
}

export default function SettingsView() {
  const site = useSettingForm('site');
  const membership = useSettingForm('membership');
  const zones = useMemo(() => allTimeZones(), []);
  const timeZone = site.values?.timezone || DEFAULT_TIME_ZONE;
  const clock = useClock(timeZone);

  const saveSite = async () => {
    const saved = await site.save();
    if (saved) setTimeZone(saved.timezone); // dates in this tab use the new zone right away
  };

  // The on/off switch saves immediately
  const toggleRegistration = (open) => membership.save({ ...membership.values, open, fee: Number(membership.values.fee) || 0 });

  return (
    <>
      <PageTitle title="Settings" description="Site-wide options for the website and the club." />

      <div className="grid gap-6 xl:grid-cols-2">
        <Section
          icon={FaClock}
          title="Timezone"
          description="Used for every date and time on the site and dashboard, and to decide which events are upcoming."
          footer={
            <>
              <Alert type={site.status.type || 'info'} className="mr-auto py-1.5">{site.status.message}</Alert>
              <Button onClick={saveSite} disabled={site.saving || !site.dirty}>{site.saving ? 'Saving…' : 'Save timezone'}</Button>
            </>
          }
        >
          {site.loading ? (
            <FormSkeleton cards={1} />
          ) : (
            <>
              <label htmlFor="timezone" className="mb-1 block text-sm font-medium text-body">Site timezone</label>
              <select
                id="timezone"
                value={timeZone}
                onChange={(e) => site.setDraft((v) => ({ ...v, timezone: e.target.value }))}
                className="w-full rounded-lg border border-line/20 bg-surface px-3 py-2 text-sm text-ink focus:border-primary-500 focus:outline-none"
              >
                {zones.map((z) => (
                  <option key={z} value={z}>
                    {z.replace(/_/g, ' ')} ({offsetLabel(z)})
                  </option>
                ))}
              </select>
              <div className="mt-4 rounded-lg border border-line/10 bg-canvas px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-subtle">Current time in {timeZone.replace(/_/g, ' ')}</p>
                <p className="mt-1 font-mono text-sm text-ink">{clock || '…'}</p>
              </div>
            </>
          )}
        </Section>

        <Section
          icon={FaUserPlus}
          title="Club member registration"
          description="Turn the membership form on the Join page on or off."
          footer={
            <>
              <Alert type={membership.status.type || 'info'} className="mr-auto py-1.5">{membership.status.message}</Alert>
              <Button variant="secondary" href="/join" target="_blank"><FaExternalLinkAlt /> Join page</Button>
              <Button onClick={() => membership.save({ ...membership.values, fee: Number(membership.values.fee) || 0 })} disabled={membership.saving || !membership.dirty}>
                {membership.saving ? 'Saving…' : 'Save details'}
              </Button>
            </>
          }
        >
          {membership.loading || !membership.values ? (
            <FormSkeleton cards={1} />
          ) : (
            <>
              <div className={cn('flex items-center justify-between gap-4 rounded-xl border px-4 py-4', membership.values.open ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5')}>
                <div>
                  <p className="font-semibold text-ink">Registration is {membership.values.open ? 'ON' : 'OFF'}</p>
                  <p className="text-sm text-subtle">
                    {membership.values.open ? 'Students can submit applications. New ones arrive as drafts.' : 'The Join form is locked and new applications are refused.'}
                  </p>
                </div>
                <Switch checked={Boolean(membership.values.open)} onChange={toggleRegistration} label="Club member registration" disabled={membership.saving} />
              </div>
              <div className="mt-5">
                <EntityForm
                  fields={PAYMENT_FIELDS}
                  values={membership.values}
                  onChange={(name, value) => membership.setDraft((v) => setPath(v, name, value))}
                  disabled={membership.saving}
                />
              </div>
            </>
          )}
        </Section>

        <EmailSettings />

        <Section icon={FaPalette} title="Appearance" description="Light, dark or follow the device. Saved in this browser for each visitor.">
          <ThemeToggle variant="row" />
          <p className="mt-3 text-xs text-subtle">Visitors switch the theme with the sun / moon button in the site header.</p>
        </Section>
      </div>
    </>
  );
}
