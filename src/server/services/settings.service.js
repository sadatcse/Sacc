// Dashboard-editable site settings (Setting model): site (timezone), About page content, membership registration.
// Reads merge the stored value over DEFAULTS, so a missing document still renders a full page.
import connectDB from '@/lib/db';
import Setting from '@/models/Setting';
import { HttpError } from '@/server/http';
import { str, toPlain } from '@/server/validate';
import { DEFAULT_TIME_ZONE, isValidTimeZone } from '@/lib/timezone';

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
  membership: {
    open: true,
    notice: 'Registration is open now.',
    fee: 500,
    bkash: '',
    nagad: '',
    rocket: '',
    reference: 'Your name_Student ID (e.g. Rahim_221000101)',
  },
};

const KEYS = Object.keys(DEFAULTS);

export async function getSetting(key) {
  if (!KEYS.includes(key)) throw new HttpError(404, 'Unknown setting.');
  await connectDB();
  const doc = await Setting.findOne({ key }).lean();
  return toPlain({ ...DEFAULTS[key], ...(doc?.value || {}) });
}

const rows = (value, max, shape) =>
  (Array.isArray(value) ? value : [])
    .slice(0, max)
    .map((row) => Object.fromEntries(Object.entries(shape).map(([k, len]) => [k, str(row?.[k], len)])))
    .filter((row) => Object.values(row).some(Boolean));

const CLEANERS = {
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
  const value = CLEANERS[key](input);
  await Setting.updateOne({ key }, { $set: { value, updatedBy: userId } }, { upsert: true });
  return getSetting(key);
}
