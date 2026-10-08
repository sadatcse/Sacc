'use client';
import { useEffect, useState } from 'react';
import { FaExternalLinkAlt } from 'react-icons/fa';
import { api, apiSecure, apiError } from '@/lib/api-client';
import EntityForm, { setPath } from '@/components/forms/EntityForm';
import ListEditor from '@/components/forms/ListEditor';
import PageTitle from '@/components/dashboard/PageTitle';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';

const TEXT_FIELDS = [
  { name: 'title', label: 'Heading', placeholder: 'About' },
  { name: 'accent', label: 'Heading (orange part)', placeholder: 'South Asia Computer Club' },
  { name: 'intro', label: 'Introduction', type: 'textarea', rows: 3 },
  { name: 'mission', label: 'Our Mission', type: 'textarea', rows: 4 },
  { name: 'vision', label: 'Our Vision', type: 'textarea', rows: 4 },
];

const FOUNDING_FIELDS = [
  { name: 'founding.title', label: 'Title', full: true, placeholder: 'Inauguration Ceremony of South Asia Computer Club' },
  { name: 'founding.date', label: 'Date', placeholder: '9 March 2024' },
  { name: 'founding.time', label: 'Time', placeholder: '11:00 AM' },
  { name: 'founding.venue', label: 'Venue', placeholder: 'Prof. M A Matin Building (Room 2103)' },
  { name: 'founding.organizer', label: 'Organized by', placeholder: 'Department of CSE' },
  { name: 'founding.photo', label: 'Photo URL', full: true, placeholder: '/about/inauguration-2024.jpg', help: 'Put the photo in public/about/ and use /about/<file>.jpg' },
  { name: 'founding.text', label: 'Story', type: 'textarea', rows: 4 },
];

const STAT_COLUMNS = [
  { key: 'value', label: 'Number', placeholder: '500+', className: 'max-w-[8rem]' },
  { key: 'label', label: 'Label', placeholder: 'Active Members' },
];

const TIMELINE_COLUMNS = [
  { key: 'year', label: 'Year', placeholder: '2026', className: 'max-w-[6rem]' },
  { key: 'title', label: 'Title', placeholder: 'Club Founded' },
  { key: 'text', label: 'Description', multiline: true, className: 'basis-full' },
];

// Edits the public /about page (Setting 'about')
export default function AboutEditor() {
  const [values, setValues] = useState(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    api
      .get('/settings/about')
      .then((res) => setValues(res.data.data))
      .catch((err) => setStatus({ type: 'error', message: apiError(err, 'Could not load the About page.') }));
  }, []);

  if (!values) return status.message ? <Alert type="error">{status.message}</Alert> : <Spinner label="Loading…" />;

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      const res = await apiSecure.put('/settings/about', values);
      setValues(res.data.data);
      setStatus({ type: 'success', message: 'About page saved — it is live now.' });
    } catch (err) {
      setStatus({ type: 'error', message: apiError(err, 'Could not save.') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save}>
      <PageTitle
        title="About Page"
        description="Mission, vision, numbers and the journey timeline shown on /about."
        actions={
          <>
            <Button variant="secondary" href="/about" target="_blank"><FaExternalLinkAlt /> View page</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
          </>
        }
      />
      <Alert type={status.type || 'info'} className="mb-4">{status.message}</Alert>

      <div className="space-y-6">
        <Card title="Text">
          <EntityForm fields={TEXT_FIELDS} values={values} onChange={(n, v) => setValues((s) => setPath(s, n, v))} disabled={saving} />
        </Card>
        <Card title="How it all started (founding)">
          <EntityForm fields={FOUNDING_FIELDS} values={values} onChange={(n, v) => setValues((s) => setPath(s, n, v))} disabled={saving} />
        </Card>
        <Card title="Numbers">
          <ListEditor items={values.stats} onChange={(stats) => setValues((s) => ({ ...s, stats }))} columns={STAT_COLUMNS} addLabel="Add number" max={8} disabled={saving} />
          <p className="mt-2 text-xs text-subtle">Numbers like “500+” count up when they scroll into view.</p>
        </Card>
        <Card title="Our Journey (timeline)">
          <ListEditor items={values.timeline} onChange={(timeline) => setValues((s) => ({ ...s, timeline }))} columns={TIMELINE_COLUMNS} addLabel="Add milestone" max={40} disabled={saving} />
        </Card>
      </div>

      <div className="mt-6 flex justify-end">
        <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
      </div>
    </form>
  );
}
