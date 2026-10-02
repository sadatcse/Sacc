'use client';
import { useState } from 'react';
import { api } from '@/lib/api-client';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { Input, Textarea } from './FormField';

const EMPTY = { fullName: '', email: '', phone: '', subject: '', message: '' };

// Saves to /api/contact → shows up in Dashboard › Contact Messages.
export default function ContactForm() {
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState({ type: null, message: '' });
  const [submitting, setSubmitting] = useState(false);

  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus({ type: null, message: '' });
    try {
      const res = await api.post('/contact', form);
      setStatus({ type: 'success', message: res.data?.message || 'Message sent.' });
      setForm(EMPTY);
    } catch (err) {
      setStatus({ type: 'error', message: err?.response?.data?.message || 'Something went wrong. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Alert type={status.type}>{status.message}</Alert>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Full name" name="fullName" value={form.fullName} onChange={update} required />
        <Input label="Email" name="email" type="email" value={form.email} onChange={update} required />
        <Input label="Phone" name="phone" value={form.phone} onChange={update} />
        <Input label="Subject" name="subject" value={form.subject} onChange={update} />
      </div>
      <Textarea label="Message" name="message" value={form.message} onChange={update} required />
      <Button type="submit" disabled={submitting}>{submitting ? 'Sending…' : 'Send message'}</Button>
    </form>
  );
}
