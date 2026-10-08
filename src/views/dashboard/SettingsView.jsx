'use client';
import { useEffect, useMemo, useState } from 'react';
import { FaClock, FaUserPlus, FaPalette, FaExternalLinkAlt } from 'react-icons/fa';
import useApi from '@/hooks/useApi';
import { apiSecure, apiError } from '@/lib/api-client';
import { DEFAULT_TIME_ZONE, offsetLabel, setTimeZone } from '@/lib/timezone';
import { cn } from '@/lib/utils';
import PageTitle from '@/components/dashboard/PageTitle';
import EntityForm, { setPath } from '@/components/forms/EntityForm';
import ThemeToggle from '@/components/layout/ThemeToggle';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';

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
            <Spinner />
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
            <Spinner />
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

        <Section icon={FaPalette} title="Appearance" description="Light, dark or follow the device. Saved in this browser for each visitor.">
          <ThemeToggle variant="row" />
          <p className="mt-3 text-xs text-subtle">Visitors switch the theme with the sun / moon button in the site header.</p>
        </Section>
      </div>
    </>
  );
}
