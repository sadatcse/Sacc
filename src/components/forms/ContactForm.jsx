'use client';
import { useState } from 'react';
import { FaPaperPlane, FaCheckCircle } from 'react-icons/fa';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { Input, Textarea } from './FormField';

const EMPTY = { fullName: '', email: '', phone: '', subject: '', message: '' };
const MAX_MESSAGE = 5000; // same limit as POST /api/contact
// One tap fills the subject
const TOPICS = ['Membership', 'Events & workshops', 'Sponsorship / partnership', 'Alumni', 'Something else'];

// Saves to /api/contact → shows up in Dashboard › Contact Messages (and emails the club inbox).
export default function ContactForm() {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(null); // success message once sent
  const [submitting, setSubmitting] = useState(false);

  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/contact', form);
      setSent({ message: res.data?.message || 'Message sent.', email: form.email });
      setForm(EMPTY);
    } catch (err) {
      setError(err?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-green-500/30 bg-green-500/5 px-6 py-10 text-center">
        <FaCheckCircle className="text-5xl text-green-500" aria-hidden />
        <h3 className="mt-4 text-xl font-bold text-ink">Message sent</h3>
        <p className="mt-1 max-w-sm text-sm text-muted">{sent.message} We&apos;ll reply to <span className="font-medium text-body">{sent.email}</span>.</p>
        <Button variant="secondary" className="mt-6" onClick={() => setSent(null)}>Send another message</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Alert type="error">{error}</Alert>

      <div>
        <p className="mb-2 text-sm font-medium text-body">What is it about?</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Topic">
          {TOPICS.map((topic) => {
            const active = form.subject === topic;
            return (
              <button
                key={topic}
                type="button"
                aria-pressed={active}
                onClick={() => setForm((f) => ({ ...f, subject: active ? '' : topic }))}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                  active ? 'border-orange-500 bg-orange-500 text-white' : 'border-line/15 text-muted hover:border-orange-500/60 hover:text-ink'
                )}
              >
                {topic}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Full name" name="fullName" value={form.fullName} onChange={update} placeholder="Your name" autoComplete="name" maxLength={120} required />
        <Input label="Email" name="email" type="email" value={form.email} onChange={update} placeholder="you@example.com" autoComplete="email" maxLength={160} required />
        <Input label="Phone (optional)" name="phone" type="tel" value={form.phone} onChange={update} placeholder="01XXXXXXXXX" autoComplete="tel" maxLength={30} />
        <Input label="Subject" name="subject" value={form.subject} onChange={update} placeholder="Pick a topic above or type one" maxLength={200} />
      </div>
      <div>
        <Textarea
          label="Message"
          name="message"
          rows={6}
          value={form.message}
          onChange={update}
          placeholder="Tell us how we can help…"
          maxLength={MAX_MESSAGE}
          required
        />
        <p className={cn('mt-1 text-right text-xs', form.message.length > MAX_MESSAGE * 0.9 ? 'text-amber-600' : 'text-faint')}>
          {form.message.length} / {MAX_MESSAGE}
        </p>
      </div>
      <div className="flex flex-col gap-3 border-t border-line/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-subtle">Your details are only used to answer this message.</p>
        <Button type="submit" variant="brand" size="lg" disabled={submitting} className="w-full sm:w-auto">
          <FaPaperPlane aria-hidden /> {submitting ? 'Sending…' : 'Send message'}
        </Button>
      </div>
    </form>
  );
}
