import { getTimeZone } from './timezone';

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function escapeRegex(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Date (and optional time) in the site timezone set in Dashboard → Settings
export function formatDate(value, withTime = false) {
  if (!value) return '—';
  const options = { year: 'numeric', month: 'short', day: 'numeric', timeZone: getTimeZone() };
  if (withTime) Object.assign(options, { hour: '2-digit', minute: '2-digit' });
  return new Date(value).toLocaleString('en-GB', options);
}

// "2026-04-27" → "27 April 2026". Fixed locale + UTC so server and client render the same string.
export function formatCalendarDate(date, options = { day: 'numeric', month: 'long', year: 'numeric' }) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', { ...options, timeZone: 'UTC' });
}

// Turns "Md. Sadat Khan" into "md-sadat-khan" — used for executive / news URLs.
export function slugify(text = '') {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
