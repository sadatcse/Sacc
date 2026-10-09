'use client';
import { useState } from 'react';
import useAuth from '@/hooks/useAuth';
import { apiSecure, apiError } from '@/lib/api-client';
import { LINK_FIELDS, PROFILE_CONFIG, formField } from '@/config/profiles';
import EntityForm, { setPath } from '@/components/forms/EntityForm';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

// Form fields for a role, built from src/config/profiles.js
function profileFields(role) {
  return (PROFILE_CONFIG[role]?.fields || []).flatMap((f) => {
    if (f.type === 'heading') return [{ type: 'heading', label: f.label }];
    if (f.type === 'links') {
      return [
        { type: 'heading', label: f.label },
        ...LINK_FIELDS.map((l) => ({
          name: `profile.links.${l.name}`,
          label: l.label,
          type: l.name === 'email' ? 'email' : 'url',
          placeholder: l.name === 'email' ? 'you@example.com' : 'https://…',
        })),
      ];
    }
    return [formField(`profile.${f.name}`, f)];
  });
}

const ACCOUNT_FIELDS = [
  { name: 'name', label: 'Full name', type: 'text', required: true },
  { name: 'phone', label: 'Phone', type: 'text', placeholder: '+8801…' },
];

// The signed-in user's own account + role profile. Saves to PUT /api/profile.
export default function ProfileForm() {
  const { user, profile, setUser, setProfile } = useAuth();
  const [values, setValues] = useState(() => ({ name: user?.name || '', phone: user?.phone || '', profile: profile || {} }));
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  if (!user) return null;

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      const res = await apiSecure.put('/profile', values);
      setUser(res.data.data.user);
      setProfile(res.data.data.profile);
      setStatus({ type: 'success', message: res.data.message });
    } catch (err) {
      setStatus({ type: 'error', message: apiError(err, 'Could not save your profile.') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-6">
      <Card title="Account">
        <EntityForm fields={ACCOUNT_FIELDS} values={values} onChange={(n, v) => setValues((s) => setPath(s, n, v))} disabled={saving} />
        <p className="mt-3 text-xs text-subtle">Signed in as <span className="font-medium text-body">{user.email}</span>. Ask an admin if you need to change your email.</p>
      </Card>

      <Card title="Profile details">
        {user.role === 'alumni' && (
          <Alert type={profile?.hideProfile ? 'warning' : profile?.approved ? 'success' : 'info'} className="mb-4">
            {profile?.hideProfile ? (
              'Your profile is hidden from the website because you ticked “Hide my profile” (under Privacy below). Untick it and save to be listed again.'
            ) : profile?.approved ? (
              <>
                Your profile is listed in the public Alumni directory —{' '}
                <a href={`/alumni/${profile.slug}`} target="_blank" rel="noopener noreferrer" className="font-semibold underline">view your public page</a>.
              </>
            ) : (
              'Your profile will appear in the Alumni directory once an admin approves it.'
            )}
          </Alert>
        )}
        <EntityForm fields={profileFields(user.role)} values={values} onChange={(n, v) => setValues((s) => setPath(s, n, v))} disabled={saving} />
      </Card>

      <Alert type={status.type || 'info'}>{status.message}</Alert>
      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</Button>
      </div>
    </form>
  );
}
