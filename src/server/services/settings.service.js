// Dashboard-editable site settings (Setting model): site (timezone), contact details, About page content,
// membership registration, email, certificate wording.
// Reads merge the stored value over DEFAULTS, so a missing document still renders a full page.
import connectDB from '@/lib/db';
import Setting from '@/models/Setting';
import { HttpError } from '@/server/http';
import { str, toPlain } from '@/server/validate';
import { DEFAULT_TIME_ZONE, isValidTimeZone } from '@/lib/timezone';
import { encryptSecret } from '@/lib/secret-box';
import { siteConfig } from '@/config/site';
import { DEFAULT_PAYMENT_METHODS, KIND, MOBILE_ACCOUNT_TYPES, PAYMENT_PURPOSES } from '@/config/payment-methods';

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
    departmentFacebook: 'https://www.facebook.com/southasiauni.cse/',
    social: { ...siteConfig.social },
    showExecutives: true, // newest committee's top student executives on /contact and the home page
    executiveCount: 2,
  },
  membership: {
    open: true,
    notice: 'Registration is open now.',
    fee: 500,
    renewFee: 300, // per year — Account → Payments renews for 1–3 years
    reference: 'Your name_Student ID (e.g. Rahim_221000101)',
  },
  // Payment methods accepted for joining fees, renewals and donations (Dashboard → Payment Methods)
  payments: {
    methods: DEFAULT_PAYMENT_METHODS,
  },
  // Wording on student executive certificates (Dashboard → Certificates → Edit wording).
  // Placeholders: {name} {role} {year} {club} {batch} {department} {studentId}
  certificate: {
    title: 'Certificate of Appreciation',
    organization: siteConfig.name,
    subtitle: 'Department of Computer Science & Engineering, University of South Asia',
    intro: 'This certificate is proudly presented to',
    body: 'for serving as {role} of the {club} Executive Committee {year}. We sincerely appreciate the leadership, dedication and hard work given to the club and its members.',
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
      donationReminder: true, // donor: unfinished donation reminders (30 min, 3 days, 7 days)
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
  if (key === 'payments' && !doc) merged.methods = await legacyPaymentMethods();
  return toPlain(merged);
}

// Before Dashboard → Payment Methods existed, the bKash / Nagad / Rocket numbers lived in the membership setting
async function legacyPaymentMethods() {
  const old = (await Setting.findOne({ key: 'membership' }).lean())?.value || {};
  return DEFAULT_PAYMENT_METHODS.map((m) => (m.kind === 'mobile' && old[m.key] ? { ...m, account: String(old[m.key]) } : m));
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

// Optional link on an About timeline entry (the whole card opens it): a page on this site (/news/…) or a full http(s) link
function timelineLink(item) {
  if (!item.link) return item;
  if (!/^\/(?!\/)[^\s]*$/.test(item.link) && !HTTP_URL.test(item.link)) {
    throw new HttpError(400, `"${item.title || item.year}": the link must start with / (a page on this site) or https://`);
  }
  return item;
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
      departmentFacebook: url(input.departmentFacebook, 'CSE department Facebook page'),
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
    timeline: rows(input.timeline, 40, { year: 10, title: 120, text: 600, link: 600 }).map(timelineLink),
  }),
  certificate: (input) => {
    const data = {
      title: str(input.title, 80),
      organization: str(input.organization, 120),
      subtitle: str(input.subtitle, 160),
      intro: str(input.intro, 160),
      body: str(input.body, 600),
    };
    if (!data.title || !data.body) throw new HttpError(400, 'The certificate needs a title and the main text.');
    return data;
  },
  payments: (input) => {
    const list = Array.isArray(input.methods) ? input.methods.slice(0, 20) : [];
    const purposes = PAYMENT_PURPOSES.map((p) => p.value);
    const keys = new Set();
    const methods = list.map((m) => {
      const label = str(m?.label, 40);
      if (!label) throw new HttpError(400, 'Every payment method needs a name.');
      const kind = KIND[m.kind] ? m.kind : 'other';
      // The key is stored on payments, so it never changes once made (new methods get one from the name)
      let key = str(m.key, 30).toLowerCase().replace(/[^a-z0-9-]/g, '') || label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'method';
      for (let i = 2; keys.has(key); i++) key = `${key.replace(/-\d+$/, '')}-${i}`;
      keys.add(key);
      const account = str(m.account, 60);
      if (kind === 'mobile' && account && !PHONE.test(account)) throw new HttpError(400, `${label}: "${account}" is not a valid mobile number.`);
      return {
        key,
        label,
        kind,
        enabled: m.enabled === true || m.enabled === 'true',
        purposes: (Array.isArray(m.purposes) ? m.purposes : []).filter((p) => purposes.includes(p)),
        account,
        accountName: str(m.accountName, 120),
        accountType: kind === 'mobile' && MOBILE_ACCOUNT_TYPES.includes(m.accountType) ? m.accountType : '',
        bankName: kind === 'bank' ? str(m.bankName, 120) : '',
        branch: kind === 'bank' ? str(m.branch, 120) : '',
        instructions: str(m.instructions, 500),
      };
    });
    return { methods };
  },
  membership: (input) => {
    const fee = Number(input.fee);
    if (!Number.isFinite(fee) || fee < 0) throw new HttpError(400, 'Fee must be a positive number.');
    const renewFee = input.renewFee === undefined || input.renewFee === '' ? DEFAULTS.membership.renewFee : Number(input.renewFee);
    if (!Number.isFinite(renewFee) || renewFee < 0) throw new HttpError(400, 'Renewal fee must be a positive number.');
    return {
      open: input.open === true || input.open === 'true',
      notice: str(input.notice, 300),
      fee,
      renewFee,
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

// Every configured payment method (Dashboard → Payment Methods); filter with methodsFor() for payers
export async function getPaymentMethods() {
  return (await getSetting('payments')).methods || [];
}
