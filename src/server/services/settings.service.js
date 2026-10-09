// Dashboard-editable site settings (Setting model): site (timezone), contact details, About page content,
// membership registration, email.
// Reads merge the stored value over DEFAULTS, so a missing document still renders a full page.
import connectDB from '@/lib/db';
import Setting from '@/models/Setting';
import { HttpError } from '@/server/http';
import { str, toPlain } from '@/server/validate';
import { DEFAULT_TIME_ZONE, isValidTimeZone } from '@/lib/timezone';
import { encryptSecret } from '@/lib/secret-box';
import { siteConfig } from '@/config/site';

export const DEFAULTS = {
  site: {
    timezone: DEFAULT_TIME_ZONE,
  },
  about: {
    title: 'About',
    accent: 'South Asia Computer Club',
    intro:
      'Inaugurated on 9 March 2024, South Asia Computer Club (SACC) is the official student club of the Department of Computer Science and Engineering at the University of South Asia — a community of learners, builders and leaders who love technology.',
    // "How it all started" section
    founding: {
      title: 'Inauguration Ceremony of South Asia Computer Club',
      date: '9 March 2024',
      time: '11:00 AM',
      venue: 'Prof. M A Matin Building (Room 2103), University of South Asia',
      organizer: 'Department of Computer Science & Engineering, University of South Asia',
      photo: '/about/inauguration-2024.jpg',
      text: 'South Asia Computer Club began its journey on Saturday, 9 March 2024, with an inauguration ceremony organized by the Department of Computer Science & Engineering. Teachers and students of the department came together to launch a club where CSE students could learn, build and lead — through programming contests, workshops, seminars, projects and sports.',
    },
    mission:
      'To build a dynamic community of tech enthusiasts, giving students hands-on skills and opportunities to innovate, while nurturing the next generation of problem-solvers and developers.',
    vision:
      'To be a leading student-run tech hub in Bangladesh, recognised for excellence in computing, innovation and community engagement.',
    stats: [
      { value: '500+', label: 'Active Members' },
      { value: '30+', label: 'Events Organized' },
      { value: '20+', label: 'Workshops' },
      { value: '100+', label: 'Student Projects' },
    ],
    timeline: [
      { year: 'Mar 2024', title: 'Club Inaugurated', text: 'South Asia Computer Club was inaugurated on 9 March 2024 at the Prof. M A Matin Building (Room 2103), organized by the Department of CSE.' },
      { year: 'Nov 2024', title: 'Fall Fest Champions', text: 'CSE won both football and chess at South Asia Fall Fest 2024 (Sports Day 2).' },
      { year: 'Mar 2025', title: 'CSE Cricket Championship 2025', text: 'The club organized the CSE Cricket Championship — Boundary Blasters became champions.' },
      { year: 'Nov 2025', title: 'New Executive Committee', text: 'A 29-member student executive committee was approved on 04.11.2025, guided by five faculty advisors of the Department of CSE.' },
      { year: 'Dec 2025', title: 'Industrial Visit — Creative IT', text: 'Students visited Creative IT Web and Software Production to see real-world software development.' },
      { year: '2026', title: 'Intra-Department Programming Contest', text: 'Celebrated our problem solvers with a certificate distribution ceremony.' },
      { year: '2026', title: 'CSE Championship — Season 2', text: 'Organized cricket, football, chess, carrom and chair sitting for the whole department.' },
    ],
  },
  // Contact details shown on /contact, the home page, the footer, legal pages and emails (Settings → Contact details)
  contact: {
    email: siteConfig.contact.email,
    phones: siteConfig.contact.phones,
    address: siteConfig.contact.address,
    mapUrl: siteConfig.contact.mapUrl,
    mapEmbed: siteConfig.contact.mapEmbed,
    departmentUrl: 'https://southasiauni.ac.bd/department/bsc-in-computer-science-and-engineering',
    social: { ...siteConfig.social },
    showExecutives: true, // newest committee's top student executives on /contact and the home page
    executiveCount: 2,
  },
  membership: {
    open: true,
    notice: 'Registration is open now.',
    fee: 500,
    bkash: '',
    nagad: '',
    rocket: '',
    reference: 'Your name_Student ID (e.g. Rahim_221000101)',
  },
  // Outgoing email (SMTP). Empty fields fall back to the SMTP_* variables in .env.
  // The password is stored encrypted as passEnc and never sent to the browser.
  email: {
    enabled: true,
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: (Number(process.env.SMTP_PORT) || 465) === 465,
    user: process.env.SMTP_USER || '',
    passEnc: '',
    fromName: siteConfig.name,
    fromEmail: process.env.SMTP_USER || siteConfig.contact.email,
    adminEmail: process.env.CONTACT_NOTIFICATION_EMAIL || siteConfig.contact.email,
    notify: {
      membershipReceived: true, // applicant: "we received your application"
      membershipApproved: true, // applicant: "welcome to the club"
      membershipRejected: false, // applicant: "your application was not approved"
      membershipAdmin: true, // admin inbox: new application
      contactAutoReply: true, // sender: "we got your message"
      contactAdmin: true, // admin inbox: new contact message
      accountReceived: true, // alumni / faculty sign-up: "your account is waiting for approval"
      accountApproved: true, // alumni / faculty: "your account is approved, you can sign in"
      accountAdmin: true, // admin inbox: new account waiting for approval
    },
  },
};

// Settings only admins may read (the email settings contain the mail server login)
export const PRIVATE_KEYS = ['email'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NOTIFY_KEYS = Object.keys(DEFAULTS.email.notify);

const KEYS = Object.keys(DEFAULTS);

// Short in-memory cache for the site settings read by every page (app/layout.jsx)
const CACHE_MS = 60 * 1000;
const cache = new Map();

export async function getCachedSetting(key) {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;
  const value = await getSetting(key);
  cache.set(key, { value, expires: Date.now() + CACHE_MS });
  return value;
}

export async function getSetting(key) {
  if (!KEYS.includes(key)) throw new HttpError(404, 'Unknown setting.');
  await connectDB();
  const doc = await Setting.findOne({ key }).lean();
  const merged = { ...DEFAULTS[key], ...(doc?.value || {}) };
  if (key === 'email') merged.notify = { ...DEFAULTS.email.notify, ...(doc?.value?.notify || {}) };
  if (key === 'contact') merged.social = { ...DEFAULTS.contact.social, ...(doc?.value?.social || {}) };
  return toPlain(merged);
}

const rows = (value, max, shape) =>
  (Array.isArray(value) ? value : [])
    .slice(0, max)
    .map((row) => Object.fromEntries(Object.entries(shape).map(([k, len]) => [k, str(row?.[k], len)])))
    .filter((row) => Object.values(row).some(Boolean));

const HTTP_URL = /^https:\/\/[^\s]+$|^http:\/\/[^\s]+$/i;
// Only Google Maps may be embedded in the iframe on /contact
const MAP_EMBED = /^https:\/\/(www\.)?google\.[a-z.]+\/maps\/embed\?|^https:\/\/maps\.google\.[a-z.]+\/maps\?/i;
const PHONE = /^\+?[\d\s()-]{6,20}$/;

function url(value, label, { required = false } = {}) {
  const v = str(value, 600);
  if (!v) {
    if (required) throw new HttpError(400, `${label} is required.`);
    return '';
  }
  if (!HTTP_URL.test(v)) throw new HttpError(400, `${label} must be a full link starting with https://`);
  return v;
}

const CLEANERS = {
  contact: (input) => {
    const email = str(input.email, 160).toLowerCase();
    if (!EMAIL_RE.test(email)) throw new HttpError(400, 'Enter a valid contact email.');
    const phones = (Array.isArray(input.phones) ? input.phones : String(input.phones || '').split(/\r?\n/))
      .map((p) => str(p, 30))
      .filter(Boolean)
      .slice(0, 6);
    const badPhone = phones.find((p) => !PHONE.test(p));
    if (badPhone) throw new HttpError(400, `"${badPhone}" is not a valid phone number.`);
    // Accept either the iframe src or the whole <iframe …> code copied from Google Maps → Share → Embed a map
    let mapEmbed = str(input.mapEmbed, 2000);
    const fromIframe = mapEmbed.match(/src=["']([^"']+)["']/i);
    if (fromIframe) mapEmbed = fromIframe[1].replace(/&amp;/g, '&');
    if (mapEmbed && !MAP_EMBED.test(mapEmbed)) throw new HttpError(400, 'The map must be a Google Maps embed link (Google Maps → Share → Embed a map).');
    const count = Number(input.executiveCount);
    return {
      email,
      phones,
      address: str(input.address, 300),
      mapUrl: url(input.mapUrl, 'Google Maps link'),
      mapEmbed,
      departmentUrl: url(input.departmentUrl, 'CSE department link'),
      social: Object.fromEntries(Object.keys(DEFAULTS.contact.social).map((k) => [k, url(input.social?.[k], `${k[0].toUpperCase()}${k.slice(1)} link`)])),
      showExecutives: input.showExecutives === true || input.showExecutives === 'true',
      executiveCount: Number.isInteger(count) && count >= 1 && count <= 6 ? count : 2,
    };
  },
  email: (input, current) => {
    const port = Number(input.port);
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new HttpError(400, 'Port must be a number between 1 and 65535.');
    const fromEmail = str(input.fromEmail, 160).toLowerCase();
    const adminEmail = str(input.adminEmail, 160).toLowerCase();
    if (fromEmail && !EMAIL_RE.test(fromEmail)) throw new HttpError(400, 'Enter a valid "From" email address.');
    if (adminEmail && !EMAIL_RE.test(adminEmail)) throw new HttpError(400, 'Enter a valid admin notification email.');
    // New password → encrypt; empty → keep the saved one; clearPassword → remove it
    const pass = typeof input.pass === 'string' ? input.pass : '';
    const passEnc = input.clearPassword ? '' : pass ? encryptSecret(pass) : current.passEnc || '';
    return {
      enabled: input.enabled === true || input.enabled === 'true',
      host: str(input.host, 200),
      port,
      secure: input.secure === true || input.secure === 'true',
      user: str(input.user, 200),
      passEnc,
      fromName: str(input.fromName, 120),
      fromEmail,
      adminEmail,
      notify: Object.fromEntries(NOTIFY_KEYS.map((k) => [k, Boolean(input.notify?.[k])])),
    };
  },
  site: (input) => {
    const timezone = str(input.timezone, 60);
    if (!isValidTimeZone(timezone)) throw new HttpError(400, 'Choose a valid timezone.');
    return { timezone };
  },
  about: (input) => ({
    title: str(input.title, 80),
    accent: str(input.accent, 120),
    intro: str(input.intro, 1500),
    founding: {
      title: str(input.founding?.title, 160),
      date: str(input.founding?.date, 60),
      time: str(input.founding?.time, 40),
      venue: str(input.founding?.venue, 200),
      organizer: str(input.founding?.organizer, 200),
      photo: str(input.founding?.photo, 500),
      text: str(input.founding?.text, 2000),
    },
    mission: str(input.mission, 1500),
    vision: str(input.vision, 1500),
    stats: rows(input.stats, 8, { value: 20, label: 60 }),
    timeline: rows(input.timeline, 40, { year: 10, title: 120, text: 600 }),
  }),
  membership: (input) => {
    const fee = Number(input.fee);
    if (!Number.isFinite(fee) || fee < 0) throw new HttpError(400, 'Fee must be a positive number.');
    return {
      open: input.open === true || input.open === 'true',
      notice: str(input.notice, 300),
      fee,
      bkash: str(input.bkash, 20),
      nagad: str(input.nagad, 20),
      rocket: str(input.rocket, 20),
      reference: str(input.reference, 200),
    };
  },
};

export async function updateSetting(key, input = {}, { userId } = {}) {
  if (!KEYS.includes(key)) throw new HttpError(404, 'Unknown setting.');
  const current = key === 'email' ? await getSetting(key) : {};
  const value = CLEANERS[key](input, current);
  await Setting.updateOne({ key }, { $set: { value, updatedBy: userId } }, { upsert: true });
  cache.delete(key);
  return getSetting(key);
}

// Contact details for public pages and emails (cached 60 s; falls back to the defaults if the database is down)
export async function getContactInfo() {
  try {
    return await getCachedSetting('contact');
  } catch {
    return toPlain(DEFAULTS.contact);
  }
}
