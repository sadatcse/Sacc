'use client';
import { useRef, useState } from 'react';
import { FaCloudUploadAlt, FaImage, FaTimes } from 'react-icons/fa';
import { apiSecure, apiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';

// Shrinks big phone photos in the browser before upload (max 2400 px, JPEG) so uploads stay quick on slow
// connections. The server re-encodes everything to WebP anyway; any failure just sends the original file.
async function shrink(file) {
  if (file.size < 1.5 * 1024 * 1024 || !window.createImageBitmap || file.type === 'image/gif') return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
    return blob ? new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }) : file;
  } catch {
    return file;
  }
}

// Uploads one image → its URL (/uploads/…). `folder`: news | about | executives | alumni | profiles | general
export async function uploadImage(file, folder = 'general') {
  const form = new FormData();
  form.append('file', await shrink(file));
  form.append('folder', folder);
  const res = await apiSecure.post('/uploads', form);
  return res.data.data.url;
}

/**
 * Photo field: paste an image link OR upload a file (button or drag & drop), with a preview.
 *   <ImageField label="Photo" name="photo" value={url} onChange={(url) => …} folder="executives" />
 * In EntityForm: { name: 'photo', label: 'Photo', type: 'image', folder: 'executives' }
 */
export default function ImageField({ label, name, value = '', onChange, folder = 'general', placeholder = 'https://… or upload', help, required, disabled, aspect = 'square' }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [broken, setBroken] = useState(false);

  const upload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/') && !/\.(heic|heif)$/i.test(file.name)) return setError('Choose an image file (JPG, PNG, WebP…).');
    setBusy(true);
    setError('');
    try {
      onChange(await uploadImage(file, folder));
      setBroken(false);
    } catch (err) {
      setError(apiError(err, 'Upload failed. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  const locked = disabled || busy;
  return (
    <div>
      {label && (
        <label htmlFor={name} className="mb-1 block text-sm font-medium text-body">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="flex items-start gap-3">
        {/* Preview — also a drop zone */}
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (!locked) upload(e.dataTransfer.files?.[0]);
          }}
          disabled={locked}
          title="Click or drop an image here"
          className={cn(
            'relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-canvas-2 text-faint transition-colors',
            aspect === 'wide' ? 'h-20 w-32' : 'h-20 w-20',
            dragging ? 'border-primary-500 ring-2 ring-primary-500/30' : 'border-dashed border-line/25 hover:border-primary-500'
          )}
        >
          {value && !broken ? (
            // eslint-disable-next-line @next/next/no-img-element -- preview of any URL the admin pasted
            <img src={value} alt="" onError={() => setBroken(true)} className="h-full w-full object-cover" />
          ) : (
            <FaImage className="text-2xl" aria-hidden />
          )}
          {busy && <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-[11px] font-semibold text-white">Uploading…</span>}
        </button>

        <div className="min-w-0 flex-1 space-y-2">
          <input
            id={name}
            name={name}
            value={value}
            onChange={(e) => {
              setBroken(false);
              onChange(e.target.value);
            }}
            placeholder={placeholder}
            required={required}
            disabled={locked}
            className="w-full rounded-lg border border-line/20 bg-surface px-3 py-2 text-sm text-ink placeholder-faint focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:opacity-60 dark:focus:ring-primary-500/20"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => input.current?.click()}
              disabled={locked}
              className="inline-flex items-center gap-1.5 rounded-md border border-line/20 bg-surface px-2.5 py-1 text-xs font-medium text-body hover:border-primary-500 hover:text-primary-600 disabled:opacity-60 dark:hover:text-primary-400"
            >
              <FaCloudUploadAlt aria-hidden /> {busy ? 'Uploading…' : value ? 'Upload new' : 'Upload image'}
            </button>
            {value && (
              <button type="button" onClick={() => onChange('')} disabled={locked} className="inline-flex items-center gap-1 text-xs text-subtle hover:text-red-600">
                <FaTimes aria-hidden /> Remove
              </button>
            )}
            {broken && value && <span className="text-xs text-amber-700 dark:text-amber-300">The image at this link can’t be loaded.</span>}
          </div>
        </div>
        <input
          ref={input}
          type="file"
          accept="image/*,.heic,.heif"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            upload(file);
          }}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
      {help && <p className="mt-1 text-xs text-subtle">{help}</p>}
    </div>
  );
}
