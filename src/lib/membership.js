// Membership period helpers (client-safe). Applications approved before join / expiry dates were stored
// count from the approval date (or the submission date).
import { MEMBERSHIP_TERM_YEARS } from '@/config/membership';

export function addYears(date, years) {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

// { joinedAt, expiresAt, expired, daysLeft } for an approved application, else null
export function membershipPeriod(app) {
  if (!app || app.status !== 'approved') return null;
  const joinedAt = new Date(app.joinedAt || app.reviewedAt || app.createdAt);
  const expiresAt = new Date(app.expiresAt || addYears(joinedAt, MEMBERSHIP_TERM_YEARS));
  const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / 86400000);
  return { joinedAt, expiresAt, expired: daysLeft <= 0, daysLeft };
}

// "2026-10-13" in the local calendar, for <input type="date">
export function toDateInput(value) {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
