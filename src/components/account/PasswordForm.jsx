'use client';
import { useState } from 'react';
import { apiSecure, apiError } from '@/lib/api-client';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { Input } from '@/components/forms/FormField';

const EMPTY = { currentPassword: '', newPassword: '', confirm: '' };

export default function PasswordForm() {
  const [values, setValues] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    if (values.newPassword !== values.confirm) {
      setStatus({ type: 'error', message: 'The new passwords do not match.' });
      return;
    }
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      const res = await apiSecure.put('/auth/password', { currentPassword: values.currentPassword, newPassword: values.newPassword });
      setValues(EMPTY);
      setStatus({ type: 'success', message: res.data.message });
    } catch (err) {
      setStatus({ type: 'error', message: apiError(err, 'Could not change your password.') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="Change password">
      <form onSubmit={save} className="max-w-md space-y-4">
        <Input label="Current password" name="currentPassword" type="password" autoComplete="current-password" value={values.currentPassword} onChange={set('currentPassword')} required />
        <Input label="New password" name="newPassword" type="password" autoComplete="new-password" minLength={8} value={values.newPassword} onChange={set('newPassword')} required />
        <Input label="Confirm new password" name="confirm" type="password" autoComplete="new-password" minLength={8} value={values.confirm} onChange={set('confirm')} required />
        <Alert type={status.type || 'info'}>{status.message}</Alert>
        <Button type="submit" disabled={saving}>{saving ? 'Updating…' : 'Update password'}</Button>
      </form>
    </Card>
  );
}
