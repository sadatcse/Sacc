'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaArrowLeft, FaExternalLinkAlt } from 'react-icons/fa';
import { apiSecure, apiError } from '@/lib/api-client';
import { blocksToText, guestsToText } from '@/lib/news-format';
import { newsCategories, UPCOMING } from '@/data/news-categories';
import { slugify } from '@/lib/utils';
import EntityForm, { setPath } from '@/components/forms/EntityForm';
import PageTitle from '@/components/dashboard/PageTitle';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

const CATEGORY_OPTIONS = newsCategories.filter((c) => c.key !== UPCOMING).map((c) => ({ value: c.key, label: c.label }));

const NEW_POST = {
  title: '', slug: '', excerpt: '', cover: '', tags: '', featured: false,
  type: 'event', status: 'published', category: CATEGORY_OPTIONS[0].value,
  date: new Date().toISOString().slice(0, 10),
  author: { name: 'University of South Asia', role: 'Official Page', verified: true },
  bodyText: '',
  event: { date: new Date().toISOString().slice(0, 10), time: '', venue: '', organizer: '', guestsText: '', participants: {}, link: {} },
};

// Stored post → editor state (body and guests become editable text)
function toForm(post) {
  return {
    ...NEW_POST,
    ...post,
    tags: (post.tags || []).join(', '),
    bodyText: blocksToText(post.body || []),
    event: { ...NEW_POST.event, ...(post.event || {}), guestsText: guestsToText(post.event?.guests || []) },
  };
}

const MAIN_FIELDS = [
  { name: 'title', label: 'Title', required: true, full: true },
  { name: 'excerpt', label: 'Summary', type: 'textarea', rows: 2, help: 'Shown on cards and as the subtitle.' },
];

const SIDE_FIELDS = [
  { name: 'status', label: 'Status', type: 'select', options: [{ value: 'published', label: 'Published' }, { value: 'draft', label: 'Draft (hidden)' }] },
  { name: 'type', label: 'Layout', type: 'select', options: [{ value: 'event', label: 'Event' }, { value: 'article', label: 'Article' }] },
  { name: 'category', label: 'Category', type: 'select', options: CATEGORY_OPTIONS, full: true },
  { name: 'date', label: 'Publish date', type: 'date', required: true },
  { name: 'slug', label: 'URL slug', placeholder: 'auto from title' },
  { name: 'cover', label: 'Cover image URL', required: true, full: true, placeholder: '/news/photo.jpg or https://…', help: 'Put photos in public/news/ and use /news/<file>.jpg' },
  { name: 'tags', label: 'Tags', type: 'list', full: true, placeholder: 'CSE, Seminar' },
  { name: 'featured', label: 'Featured at the top of /news', type: 'checkbox', full: true },
  { type: 'heading', label: 'Author' },
  { name: 'author.name', label: 'Name' },
  { name: 'author.role', label: 'Role' },
  { name: 'author.verified', label: 'Verified badge', type: 'checkbox' },
];

const EVENT_FIELDS = [
  { name: 'event.date', label: 'Event date', type: 'date', required: true },
  { name: 'event.time', label: 'Time', placeholder: '11:00 AM' },
  { name: 'event.venue', label: 'Venue', placeholder: 'University Auditorium' },
  { name: 'event.organizer', label: 'Organizer' },
  { name: 'event.participants.registered', label: 'Registered', type: 'number', help: 'Optional seats bar' },
  { name: 'event.participants.capacity', label: 'Capacity', type: 'number' },
  { name: 'event.link.label', label: 'Button label', placeholder: 'View Facebook Post' },
  { name: 'event.link.href', label: 'Button link', type: 'url', placeholder: 'https://facebook.com/…' },
  {
    name: 'event.guestsText',
    label: 'Honorable guests',
    type: 'textarea',
    rows: 5,
    placeholder: 'Chief Guest | Prof. Dr. M. A. Wadud Mondal | Vice Chancellor, University of South Asia\nSpeakers | Engr. Tania Noor | Department of ICT',
    help: 'One person per line: Group | Name | Title',
  },
];

const BODY_HELP = '## Heading · ### Sub-heading · - bullet · 1. numbered · > quote · **bold** · *italic* · [link](https://…) · ![alt](/news/photo.jpg "Caption") · tables: | A | B | rows. Blank line = new paragraph.';

export default function NewsEditor({ id }) {
  const router = useRouter();
  const isNew = !id;
  const [values, setValues] = useState(isNew ? NEW_POST : null);
  const [loadError, setLoadError] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (isNew) return;
    apiSecure
      .get(`/news/${id}`)
      .then((res) => setValues(toForm(res.data.data)))
      .catch((err) => setLoadError(apiError(err, 'Could not load this post.')));
  }, [id, isNew]);

  if (loadError) return <Alert type="error">{loadError}</Alert>;
  if (!values) return <Spinner label="Loading post…" />;

  const onChange = (name, value) => setValues((s) => setPath(s, name, value));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus({ type: '', message: '' });
    const { event, ...rest } = values;
    const payload = { ...rest, ...(values.type === 'event' && { event }) };
    try {
      if (isNew) {
        const res = await apiSecure.post('/news', payload);
        router.replace(`/dashboard/news/${res.data.data._id}`);
        return;
      }
      const res = await apiSecure.patch(`/news/${id}`, payload);
      setValues(toForm(res.data.data));
      setStatus({ type: 'success', message: res.data.message });
    } catch (err) {
      setStatus({ type: 'error', message: apiError(err, 'Could not save the post.') });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    try {
      await apiSecure.delete(`/news/${id}`);
      router.replace('/dashboard/news');
    } catch (err) {
      setStatus({ type: 'error', message: apiError(err, 'Could not delete the post.') });
      setConfirmDelete(false);
      setSaving(false);
    }
  };

  const publicSlug = values.slug || slugify(values.title);

  return (
    <form onSubmit={save}>
      <Link href="/dashboard/news" className="mb-4 inline-flex items-center gap-2 text-sm text-subtle hover:text-ink-2">
        <FaArrowLeft className="text-xs" /> All posts
      </Link>
      <PageTitle
        title={isNew ? 'New post' : 'Edit post'}
        description={isNew ? 'Create an article or event for the News page.' : `/news/${values.slug}`}
        actions={
          <>
            {!isNew && values.status === 'published' && (
              <Button variant="secondary" href={`/news/${publicSlug}`} target="_blank"><FaExternalLinkAlt /> View</Button>
            )}
            {!isNew && <Button variant="danger" onClick={() => setConfirmDelete(true)} disabled={saving}>Delete</Button>}
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : isNew ? 'Create post' : 'Save changes'}</Button>
          </>
        }
      />

      <Alert type={status.type || 'info'} className="mb-4">{status.message}</Alert>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card title="Content">
            <EntityForm fields={MAIN_FIELDS} values={values} onChange={onChange} disabled={saving} />
            <div className="mt-4">
              <EntityForm
                fields={[{ name: 'bodyText', label: values.type === 'event' ? 'About the event' : 'Article body', type: 'textarea', rows: 18, className: 'font-mono text-[13px]' }]}
                values={values}
                onChange={onChange}
                disabled={saving}
              />
              <p className="mt-2 text-xs leading-relaxed text-subtle">{BODY_HELP}</p>
            </div>
          </Card>

          {values.type === 'event' && (
            <Card title="Event details">
              <EntityForm fields={EVENT_FIELDS} values={values} onChange={onChange} disabled={saving} />
            </Card>
          )}
        </div>

        <div className="space-y-6 lg:sticky lg:top-6">
          <Card title="Settings">
            <EntityForm fields={SIDE_FIELDS} values={values} onChange={onChange} disabled={saving} />
          </Card>
          {values.cover && (
            <Card title="Cover preview">
              {/* eslint-disable-next-line @next/next/no-img-element -- preview of any URL the admin types */}
              <img src={values.cover} alt="" className="aspect-video w-full rounded-lg object-cover" />
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete post?"
        message={`“${values.title}” will be removed from the site permanently.`}
        confirmLabel="Delete"
        loading={saving}
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </form>
  );
}
