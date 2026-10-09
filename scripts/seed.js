// Fills MongoDB with the starter content, the three demo accounts and two test logins (student + alumni).
//   npm run seed              → adds anything missing (safe to re-run; never overwrites dashboard edits)
//   npm run seed -- --force   → also overwrites posts / executives / alumni with the seed files
//
// Accounts come from SEED_* variables in .env (see .env.example). Existing accounts keep their password.
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import AdminProfile from '../src/models/AdminProfile.js';
import StudentProfile from '../src/models/StudentProfile.js';
import AlumniProfile from '../src/models/AlumniProfile.js';
import Post from '../src/models/Post.js';
import Executive from '../src/models/Executive.js';
import CommitteePosition from '../src/models/CommitteePosition.js';
import { posts } from '../src/data/seed/news.js';
import { people, positions } from '../src/data/seed/executives.js';
import { alumni } from '../src/data/seed/alumni.js';

const force = process.argv.includes('--force');
const env = (key, fallback) => process.env[key] || fallback;

if (!process.env.MONGO_URI) {
  console.error('MONGO_URI is missing in .env');
  process.exit(1);
}

const ACCOUNTS = [
  {
    role: 'admin',
    name: env('SEED_ADMIN_NAME', 'Gazi Md. Omar Faruque'),
    email: env('SEED_ADMIN_EMAIL', 'admin@usacc.edu.bd'),
    password: env('SEED_ADMIN_PASSWORD', 'Admin@12345'),
    Profile: AdminProfile,
    profile: { designation: 'Associate Professor & Head', department: 'Computer Science & Engineering', expertise: ['Software Engineering'] },
  },
  {
    role: 'student',
    name: env('SEED_STUDENT_NAME', 'Demo Student'),
    email: env('SEED_STUDENT_EMAIL', 'student@usacc.edu.bd'),
    password: env('SEED_STUDENT_PASSWORD', 'Student@12345'),
    Profile: StudentProfile,
    profile: { studentId: '221000101', department: 'Computer Science & Engineering', batch: 'CSE 22', semester: 'Fall 2026', skills: ['C++', 'JavaScript'] },
  },
  {
    role: 'alumni',
    name: env('SEED_ALUMNI_NAME', 'Demo Alumnus'),
    email: env('SEED_ALUMNI_EMAIL', 'alumni@usacc.edu.bd'),
    password: env('SEED_ALUMNI_PASSWORD', 'Alumni@12345'),
    Profile: AlumniProfile,
    profile: { batch: 'CSE 19', graduationYear: 2023, jobTitle: 'Software Engineer', company: 'University of South Asia', approved: true },
  },
  // Test logins with complete (fictional) profiles — for trying the student and alumni account pages
  {
    role: 'student',
    name: 'Test Student',
    email: 'test.student@usacc.edu.bd',
    password: 'TestStudent@123',
    phone: '01700-000001',
    Profile: StudentProfile,
    profile: {
      studentId: '241000555',
      department: 'Computer Science & Engineering',
      batch: 'CSE 24',
      semester: 'Fall 2026',
      section: 'B',
      skills: ['Python', 'React', 'Competitive Programming'],
      bio: 'Second-year CSE student and club member. Loves problem solving and building small web apps.',
    },
  },
  {
    role: 'alumni',
    name: 'Test Alumni',
    email: 'test.alumni@usacc.edu.bd',
    password: 'TestAlumni@123',
    phone: '01700-000002',
    Profile: AlumniProfile,
    profile: {
      studentId: '181000555',
      department: 'Computer Science & Engineering',
      degree: 'B.Sc. in Computer Science & Engineering',
      batch: 'CSE 18',
      shift: 'day',
      graduationYear: 2022,
      jobTitle: 'Backend Engineer',
      company: 'Example Tech Ltd.',
      industry: 'Software',
      location: 'Dhaka',
      country: 'Bangladesh',
      bio: 'Former club member, now building backend services. Happy to talk about internships and first jobs.',
      quote: 'Join the contests and workshops — the people you meet in the club open doors later.',
      skills: ['Node.js', 'MongoDB', 'System Design'],
      achievements: ['Club volunteer of the year 2021'],
      experience: [{ title: 'Backend Engineer', company: 'Example Tech Ltd.', location: 'Dhaka', start: 'Jan 2023', end: '', description: 'APIs and databases for client projects.' }],
      education: [{ degree: 'B.Sc. in Computer Science & Engineering', institution: 'University of South Asia', start: '2018', end: '2022' }],
      links: { email: 'test.alumni@example.com' },
      phone: '01700-000002',
      showEmail: true,
      showPhone: true,
      openToMentor: true,
      approved: true,
    },
  },
];

async function seedAccounts() {
  for (const { Profile, profile, password, ...account } of ACCOUNTS) {
    let user = await User.findOne({ email: account.email.toLowerCase() });
    if (user) {
      console.log(`  account exists  ${account.role.padEnd(7)} ${account.email} (password unchanged)`);
    } else {
      user = await User.create({ ...account, password });
      console.log(`  account created ${account.role.padEnd(7)} ${account.email} / ${password}`);
    }
    const extra = account.role === 'alumni' ? { name: user.name } : {};
    await Profile.updateOne({ user: user._id }, { $setOnInsert: { user: user._id, ...profile, ...extra } }, { upsert: true });
  }
  // Accounts created before the status field existed are active
  await User.updateMany({ status: { $exists: false } }, { $set: { status: 'active' } });
  // Every existing admin gets a faculty profile
  for (const admin of await User.find({ role: 'admin' }).select('_id')) {
    await AdminProfile.updateOne({ user: admin._id }, { $setOnInsert: { user: admin._id } }, { upsert: true });
  }
}

async function upsert(Model, filter, doc) {
  const result = await Model.updateOne(filter, force ? { $set: doc } : { $setOnInsert: doc }, { upsert: true, runValidators: true });
  return result.upsertedCount ? 'added' : force ? 'updated' : 'kept';
}

// Sets only the fields that are still empty on an existing record (new fields added to a model later)
async function fillMissing(Model, filter, doc) {
  const existing = await Model.findOne(filter).lean();
  if (!existing) return false;
  const $set = Object.fromEntries(
    Object.entries(doc).filter(([key, value]) => {
      const empty = existing[key] === undefined || existing[key] === '' || (Array.isArray(existing[key]) && existing[key].length === 0);
      if (Array.isArray(value)) return value.length > 0 && empty;
      return value !== '' && value !== undefined && typeof value !== 'object' && empty;
    })
  );
  if (!Object.keys($set).length) return false;
  await Model.updateOne(filter, { $set });
  return true;
}

const tally = () => ({ added: 0, updated: 0, kept: 0, filled: 0 });
const report = (label, t) =>
  console.log(`  ${label.padEnd(12)} added ${t.added}, updated ${t.updated}, unchanged ${t.kept}${t.filled ? `, filled missing details on ${t.filled}` : ''}`);

async function seedPosts() {
  const t = tally();
  for (const post of posts) t[await upsert(Post, { slug: post.slug }, { status: 'published', ...post })]++;
  report('news posts', t);
}

async function seedExecutives() {
  const t = tally();
  const ids = new Map();
  for (const { links = {}, ...person } of people) {
    const result = await upsert(Executive, { slug: person.slug }, { ...person, links });
    t[result]++;
    if (result === 'kept' && (await fillMissing(Executive, { slug: person.slug }, person))) t.filled++;
    ids.set(person.slug, (await Executive.findOne({ slug: person.slug }).select('_id'))._id);
  }
  report('executives', t);

  const p = tally();
  const orderInYear = new Map();
  for (const { slug, ...pos } of positions) {
    const order = orderInYear.get(pos.year) ?? 0;
    orderInYear.set(pos.year, order + 1);
    const executive = ids.get(slug);
    if (!executive) continue;
    p[await upsert(CommitteePosition, { executive, year: pos.year, role: pos.role }, { executive, ...pos, order })]++;
  }
  report('positions', p);
}

async function seedAlumni() {
  const t = tally();
  for (const { id, role, ...entry } of alumni) {
    const doc = { ...entry, jobTitle: role, approved: true };
    const filter = { name: entry.name, batch: entry.batch, user: { $exists: false } };
    const result = await upsert(AlumniProfile, filter, doc);
    t[result]++;
    if (result === 'kept' && (await fillMissing(AlumniProfile, filter, doc))) t.filled++;
  }
  report('alumni', t);
  // Every entry needs a URL slug for /alumni/<slug> (the model's pre-validate hook makes one on save)
  let slugged = 0;
  for (const row of await AlumniProfile.find({ $or: [{ slug: { $exists: false } }, { slug: '' }] })) {
    row.slug = undefined;
    await row.save();
    slugged++;
  }
  if (slugged) console.log(`  alumni slugs  created ${slugged}`);
}

await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
console.log(`Seeding "${mongoose.connection.db.databaseName}"${force ? ' (force)' : ''}…`);
// Build indexes (unique slugs/emails) before inserting
await Promise.all([User, AdminProfile, StudentProfile, AlumniProfile, Post, Executive, CommitteePosition].map((M) => M.init()));
await seedAccounts();
await seedPosts();
await seedExecutives();
await seedAlumni();
console.log('Done.');
await mongoose.disconnect();
