// Site-wide timezone (Dashboard → Settings). app/layout.jsx sets it on the server for every request
// and AppShell sets the same value in the browser, so dates format identically on both sides.
export const DEFAULT_TIME_ZONE = 'Asia/Dhaka';

let current = DEFAULT_TIME_ZONE;

export function isValidTimeZone(tz) {
  if (!tz || typeof tz !== 'string') return false;
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function setTimeZone(tz) {
  if (isValidTimeZone(tz)) current = tz;
}

export const getTimeZone = () => current;

// "YYYY-MM-DD" for today in the site timezone (used to decide upcoming vs. past events)
export function todayInTimeZone(tz = current) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

// "GMT+6" style offset label for a timezone
export function offsetLabel(tz) {
  try {
    return new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' }).formatToParts(new Date()).find((p) => p.type === 'timeZoneName')?.value || '';
  } catch {
    return '';
  }
}
