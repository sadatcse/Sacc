'use client';
import { useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import {
  FaCloudUploadAlt, FaNewspaper, FaFolderOpen, FaImages, FaEyeSlash, FaEye, FaThumbtack, FaTrashAlt, FaPen, FaSyncAlt, FaCheck, FaExternalLinkAlt,
} from 'react-icons/fa';
import useApi from '@/hooks/useApi';
import { apiSecure, apiError } from '@/lib/api-client';
import { cn, formatDate } from '@/lib/utils';
import PageTitle from '@/components/dashboard/PageTitle';
import StatCard, { StatGrid } from '@/components/dashboard/StatCard';
import CrudModal from '@/components/dashboard/CrudModal';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Skeleton from '@/components/ui/Skeleton';

const SOURCE_LABELS = { upload: ['Uploaded', 'blue'], folder: ['Folder', 'gray'], news: ['From news', 'amber'] };
const isRemote = (src) => /^https?:/.test(src);
const selectClass =
  'h-10 rounded-lg border border-line/15 bg-surface px-3 text-sm text-ink focus:border-primary-500 focus:outline-none';
const inputClass =
  'h-10 w-full rounded-lg border border-line/15 bg-surface px-3 text-sm text-ink placeholder-faint focus:border-primary-500 focus:outline-none';

// Shrinks big phone photos in the browser before upload (max 2000 px, JPEG) so every request stays small.
// Falls back to the original file if the browser can't decode it (the server re-encodes everything anyway).
async function shrink(file) {
  if (file.size < 1.5 * 1024 * 1024 || !window.createImageBitmap) return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.88));
    return blob ? new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }) : file;
  } catch {
    return file;
  }
}

async function sendPhoto(url, file, extra = {}, method = 'post') {
  const form = new FormData();
  form.append('photo', await shrink(file));
  Object.entries(extra).forEach(([k, v]) => form.append(k, v));
  return apiSecure[method](url, form);
}

// "Readable" file names become captions ("Freshers 2026.jpg"); camera names don't (IMG_1234.jpg)
function captionFromFile(name) {
  const base = name.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ').replace(/\s\d{8,14}$/, '').trim();
  return /^[\d\s-]+n?$/i.test(base) || /^(img|dsc|pxl|photo|image|screenshot|whatsapp image)[\s-]*\d/i.test(base) ? '' : base;
}

// `fill` image in a positioned box; pass `absolute inset-0` to fill a parent instead of `relative`
function Thumb({ photo, className = 'relative' }) {
  return (
    <div className={cn('overflow-hidden bg-line/5', className)}>
      <Image src={photo.src} alt={photo.caption || 'Gallery photo'} fill sizes="(min-width: 1280px) 20vw, (min-width: 640px) 33vw, 50vw" unoptimized={isRemote(photo.src)} className="object-cover" />
    </div>
  );
}

function IconButton({ label, icon: Icon, active, ...props }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={cn('flex h-8 w-8 items-center justify-center rounded-md hover:bg-line/10 hover:text-ink', active && 'text-primary-600 dark:text-primary-400')}
      {...props}
    >
      <Icon aria-hidden />
    </button>
  );
}

// ---------- upload panel ----------

function UploadPanel({ files, albums, onDone, onCancel }) {
  const [album, setAlbum] = useState('');
  const [caption, setCaption] = useState('');
  const [progress, setProgress] = useState(null); // { done, total, errors: [] }

  const start = async () => {
    const errors = [];
    const added = [];
    setProgress({ done: 0, total: files.length, errors });
    for (const [i, file] of files.entries()) {
      try {
        const res = await sendPhoto('/gallery', file, { album: album || 'Moments', caption: caption || captionFromFile(file.name) });
        added.push(res.data.data);
      } catch (err) {
        errors.push(`${file.name}: ${apiError(err, 'upload failed')}`);
      }
      setProgress({ done: i + 1, total: files.length, errors: [...errors] });
    }
    onDone(added, errors);
  };

  const busy = progress && progress.done < progress.total;
  return (
    <Card className="mb-6 border-primary-500/40" title={`Upload ${files.length} photo${files.length > 1 ? 's' : ''}`}>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {files.slice(0, 12).map((f) => (
          // eslint-disable-next-line @next/next/no-img-element -- local preview of a file that isn't uploaded yet
          <img key={f.name + f.size} src={URL.createObjectURL(f)} alt="" className="h-20 w-20 shrink-0 rounded-lg object-cover" />
        ))}
        {files.length > 12 && <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-line/5 text-sm text-muted">+{files.length - 12}</span>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-body">Album</span>
          <input list="gallery-albums" value={album} onChange={(e) => setAlbum(e.target.value)} placeholder="Moments (or type a new album)" className={inputClass} disabled={Boolean(progress)} />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-body">Caption (optional)</span>
          <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Leave empty to use readable file names" className={inputClass} disabled={Boolean(progress)} />
        </label>
      </div>
      <datalist id="gallery-albums">{albums.map((a) => <option key={a} value={a} />)}</datalist>

      {progress && (
        <div className="mt-4">
          <div className="h-2 overflow-hidden rounded-full bg-line/10">
            <div className="h-full bg-primary-500 transition-all" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-muted">{busy ? `Uploading ${progress.done + 1} of ${progress.total}…` : `Done — ${progress.total - progress.errors.length} uploaded.`}</p>
          {progress.errors.length > 0 && <Alert type="error" className="mt-2">{progress.errors.join(' · ')}</Alert>}
        </div>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={busy}>{progress && !busy ? 'Close' : 'Cancel'}</Button>
        {!progress && <Button onClick={start}><FaCloudUploadAlt /> Upload</Button>}
      </div>
    </Card>
  );
}

// ---------- pick photos from news ----------

function NewsPicker({ albums, onClose, onAdded }) {
  const { data: posts, loading, error } = useApi('/gallery/news', { initialData: [], select: (res) => res.data || [] });
  const [selected, setSelected] = useState({}); // src → postId
  const [search, setSearch] = useState('');
  const [album, setAlbum] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const count = Object.keys(selected).length;

  const shown = useMemo(() => {
    const q = search.toLowerCase();
    return posts.filter((p) => p.images.length && (!q || p.title.toLowerCase().includes(q)));
  }, [posts, search]);

  const toggle = (postId, src) =>
    setSelected((s) => {
      const next = { ...s };
      if (next[src]) delete next[src];
      else next[src] = postId;
      return next;
    });

  const add = async () => {
    setSaving(true);
    setMessage('');
    try {
      const items = Object.entries(selected).map(([src, postId]) => ({ src, postId }));
      const res = await apiSecure.post('/gallery/news', { items, album });
      onAdded(res.data.message);
    } catch (err) {
      setMessage(apiError(err));
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      size="lg"
      title="Add photos from News & Events"
      onClose={onClose}
      footer={
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
          <input list="gallery-albums" value={album} onChange={(e) => setAlbum(e.target.value)} placeholder="Album (empty = the post's title)" className={cn(inputClass, 'sm:max-w-xs')} />
          <div className="flex gap-2 sm:ml-auto">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={add} disabled={!count || saving}><FaCheck /> {saving ? 'Adding…' : `Add ${count || ''} photo${count === 1 ? '' : 's'}`}</Button>
          </div>
        </div>
      }
    >
      <datalist id="gallery-albums">{albums.map((a) => <option key={a} value={a} />)}</datalist>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search posts…" className={cn(inputClass, 'mb-4')} />
      <Alert type="error" className="mb-3">{error || message}</Alert>
      {loading ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="aspect-square rounded-lg" />)}</div>
      ) : (
        <div className="space-y-5">
          {shown.map((post) => (
            <section key={post._id}>
              <p className="mb-2 text-sm font-semibold text-ink">
                {post.title} <span className="font-normal text-subtle">· {formatDate(post.date)}</span>
              </p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                {post.images.map((img) => {
                  const checked = Boolean(selected[img.src]);
                  return (
                    <button
                      key={img.src}
                      type="button"
                      disabled={img.added}
                      onClick={() => toggle(post._id, img.src)}
                      aria-pressed={checked}
                      title={img.added ? 'Already in the gallery' : img.kind}
                      className={cn(
                        'relative aspect-square overflow-hidden rounded-lg ring-2 ring-offset-2 ring-offset-surface transition',
                        checked ? 'ring-primary-500' : 'ring-transparent hover:ring-line/30',
                        img.added && 'cursor-not-allowed opacity-50'
                      )}
                    >
                      <Thumb photo={{ src: img.src, caption: img.caption }} className="absolute inset-0" />
                      <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">{img.added ? 'In gallery' : img.kind}</span>
                      {checked && (
                        <span className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary-500 text-xs text-white"><FaCheck /></span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
          {!shown.length && <p className="py-8 text-center text-sm text-subtle">No posts with photos found.</p>}
        </div>
      )}
    </Modal>
  );
}

// ---------- page ----------

export default function GalleryManager() {
  const { data, setData, loading, error, reload } = useApi('/gallery?all=1', { initialData: { photos: [], albums: [] }, select: (res) => res.data });
  const { photos, albums } = data;
  const [album, setAlbum] = useState('');
  const [show, setShow] = useState('all'); // all | visible | hidden
  const [search, setSearch] = useState('');
  const [files, setFiles] = useState(null);
  const [picking, setPicking] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(null);
  const [notice, setNotice] = useState({ type: '', text: '' });
  const uploadRef = useRef(null);
  const replaceRef = useRef(null);
  const replaceTarget = useRef(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return photos.filter(
      (p) =>
        (!album || p.album === album) &&
        (show === 'all' || (show === 'hidden' ? p.hidden : !p.hidden)) &&
        (!q || [p.caption, p.album, p.post?.title].some((f) => f?.toLowerCase().includes(q)))
    );
  }, [photos, album, show, search]);

  const replaceRow = (row) => setData((d) => ({ ...d, photos: d.photos.map((p) => (p._id === row._id ? row : p)) }));
  const say = (type, text) => setNotice({ type, text });

  const patch = async (photo, body, okText) => {
    setBusy(photo._id);
    try {
      const res = await apiSecure.patch(`/gallery/${photo._id}`, body);
      replaceRow(res.data.data);
      if (okText) say('success', okText);
    } catch (err) {
      say('error', apiError(err));
    } finally {
      setBusy(null);
    }
  };

  const onReplaceFile = async (e) => {
    const file = e.target.files?.[0];
    const photo = replaceTarget.current;
    e.target.value = '';
    if (!file || !photo) return;
    setBusy(photo._id);
    try {
      const res = await sendPhoto(`/gallery/${photo._id}/image`, file, {}, 'put');
      replaceRow({ ...res.data.data, post: photo.post });
      say('success', 'Picture changed — the website shows the new one right away.');
    } catch (err) {
      say('error', apiError(err, 'Could not change the picture.'));
    } finally {
      setBusy(null);
    }
  };

  // Opens the file chooser for "Change picture"
  const pickReplacement = (photo) => {
    replaceTarget.current = photo;
    replaceRef.current?.click();
  };

  const importFolder = async () => {
    setBusy('import');
    try {
      const res = await apiSecure.post('/gallery/import-folder');
      say('success', res.data.message);
      if (res.data.data.added || res.data.data.restored || res.data.data.removed) reload();
    } catch (err) {
      say('error', apiError(err));
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    setBusy(deleting._id);
    try {
      await apiSecure.delete(`/gallery/${deleting._id}`);
      setData((d) => ({ ...d, photos: d.photos.filter((p) => p._id !== deleting._id) }));
      say('success', 'Photo deleted.');
    } catch (err) {
      say('error', apiError(err));
    } finally {
      setBusy(null);
      setDeleting(null);
    }
  };

  const visibleCount = photos.filter((p) => !p.hidden).length;

  return (
    <>
      <PageTitle
        title="Gallery"
        description="Photos on the Gallery page and the home page. Upload new ones, pick photos from news posts, change or hide any picture."
        actions={
          <>
            <Button variant="secondary" href="/gallery" target="_blank"><FaExternalLinkAlt /> View page</Button>
            <Button variant="secondary" onClick={() => setPicking(true)}><FaNewspaper /> Add from News</Button>
            <Button onClick={() => uploadRef.current?.click()}><FaCloudUploadAlt /> Upload photos</Button>
          </>
        }
      />
      <input
        ref={uploadRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          const list = [...(e.target.files || [])];
          e.target.value = '';
          if (list.length) setFiles(list);
        }}
      />
      <input ref={replaceRef} type="file" accept="image/*" hidden onChange={onReplaceFile} />

      <StatGrid>
        <StatCard label="On the website" value={visibleCount} icon={FaImages} tone="green" loading={loading} />
        <StatCard label="Albums" value={albums.length} icon={FaFolderOpen} loading={loading} />
        <StatCard label="Hidden" value={photos.length - visibleCount} icon={FaEyeSlash} tone="gray" loading={loading} />
        <StatCard label="From news" value={photos.filter((p) => p.source === 'news').length} icon={FaNewspaper} tone="amber" loading={loading} />
      </StatGrid>

      <Alert type="error" className="mb-4">{error}</Alert>
      <Alert type={notice.type || 'info'} className="mb-4">{notice.text}</Alert>

      {files && (
        <UploadPanel
          key={files.map((f) => f.name).join()}
          files={files}
          albums={albums}
          onCancel={() => setFiles(null)}
          onDone={(added, errors) => {
            if (added.length) setData((d) => ({ ...d, photos: [...added, ...d.photos], albums: [...new Set([...d.albums, ...added.map((p) => p.album)])].sort() }));
            if (!errors.length) {
              setFiles(null);
              say('success', `${added.length} photo${added.length === 1 ? '' : 's'} uploaded.`);
            }
          }}
        />
      )}

      <Card className="p-0">
        <div className="flex flex-col gap-3 border-b border-line/10 p-4 lg:flex-row lg:items-center">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search caption, album or post…" className={cn(inputClass, 'lg:max-w-xs')} />
          <div className="flex flex-wrap gap-2">
            <select value={album} onChange={(e) => setAlbum(e.target.value)} className={selectClass} aria-label="Album">
              <option value="">All albums</option>
              {albums.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <select value={show} onChange={(e) => setShow(e.target.value)} className={selectClass} aria-label="Visibility">
              <option value="all">Visible & hidden</option>
              <option value="visible">On the website</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>
          <button type="button" onClick={importFolder} disabled={busy === 'import'} className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:underline disabled:opacity-50 dark:text-primary-400 lg:ml-auto" title="Adds every image in public/gallery — new files and ones deleted earlier — and removes entries whose file is gone">
            <FaSyncAlt aria-hidden className={busy === 'import' ? 'animate-spin' : ''} /> Import from public/gallery folder
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 xl:grid-cols-5">
            {Array.from({ length: 10 }, (_, i) => <Skeleton key={i} className="aspect-[4/3] rounded-xl" />)}
          </div>
        ) : !filtered.length ? (
          <div className="py-16 text-center">
            <FaImages className="mx-auto text-4xl text-faint" aria-hidden />
            <p className="mt-3 font-semibold text-ink">No photos here</p>
            <p className="mt-1 text-sm text-subtle">Upload photos or add some from news posts.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 xl:grid-cols-5">
            {filtered.map((p) => {
              const [sourceLabel, sourceColor] = SOURCE_LABELS[p.source] || SOURCE_LABELS.upload;
              const working = busy === p._id;
              return (
                <li key={p._id} className={cn('group overflow-hidden rounded-xl border border-line/10 bg-surface', p.hidden && 'opacity-60')}>
                  <div className="relative">
                    <Thumb photo={p} className="relative aspect-[4/3]" />
                    <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                      <Badge color={sourceColor} className="!text-[10px] shadow">{sourceLabel}</Badge>
                      {p.featured && <Badge color="red" className="!text-[10px] shadow">Pinned</Badge>}
                      {p.hidden && <Badge color="gray" className="!text-[10px] shadow">Hidden</Badge>}
                    </div>
                    {working && <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm font-medium text-white">Working…</div>}
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-medium text-ink" title={p.caption}>{p.caption || <span className="text-faint">No caption</span>}</p>
                    <p className="truncate text-xs text-subtle">
                      {p.album}
                      {p.post?.slug && (
                        <> · <a href={`/news/${p.post.slug}`} target="_blank" rel="noopener noreferrer" className="hover:underline">post ↗</a></>
                      )}
                    </p>
                    <div className="mt-2.5 flex items-center gap-1 text-sm text-muted">
                      <IconButton label="Edit caption / album" icon={FaPen} disabled={working} onClick={() => setEditing(p)} />
                      <IconButton label="Change picture" icon={FaSyncAlt} disabled={working} onClick={() => pickReplacement(p)} />
                      <IconButton
                        label={p.hidden ? 'Show on the website' : 'Hide from the website'}
                        icon={p.hidden ? FaEye : FaEyeSlash}
                        disabled={working}
                        onClick={() => patch(p, { hidden: !p.hidden })}
                      />
                      <IconButton label={p.featured ? 'Unpin' : 'Pin to the top'} icon={FaThumbtack} active={p.featured} disabled={working} onClick={() => patch(p, { featured: !p.featured })} />
                      <button type="button" onClick={() => setDeleting(p)} disabled={working} title="Delete" aria-label="Delete" className="ml-auto flex h-8 w-8 items-center justify-center rounded-md hover:bg-red-500/10 hover:text-red-600">
                        <FaTrashAlt aria-hidden />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {editing && (
        <CrudModal
          key={editing._id}
          open
          title="Edit photo"
          fields={[
            { name: 'caption', label: 'Caption', full: true },
            { name: 'album', label: 'Album', full: true, help: albums.length ? `Existing: ${albums.join(', ')}` : undefined },
            { name: 'featured', label: 'Pin to the top of the gallery', type: 'checkbox', full: true },
            { name: 'hidden', label: 'Hide from the website', type: 'checkbox', full: true },
          ]}
          initial={{ caption: editing.caption || '', album: editing.album || '', featured: Boolean(editing.featured), hidden: Boolean(editing.hidden) }}
          onSubmit={async (values) => {
            const res = await apiSecure.patch(`/gallery/${editing._id}`, values);
            replaceRow(res.data.data);
            setData((d) => ({ ...d, albums: [...new Set([...d.albums, res.data.data.album])].sort() }));
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
        />
      )}

      {picking && (
        <NewsPicker
          albums={albums}
          onClose={() => setPicking(false)}
          onAdded={(message) => {
            setPicking(false);
            say('success', message);
            reload();
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this photo?"
        message="It is removed from the website. This can't be undone."
        confirmLabel="Delete photo"
        loading={busy === deleting?._id}
        onConfirm={remove}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
