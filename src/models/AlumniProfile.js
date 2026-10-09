import mongoose from 'mongoose';
import { LinksSchema } from './shared.js';

export const ALUMNI_SHIFTS = ['day', 'evening'];

const ExperienceSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, maxlength: 120 },
    company: { type: String, trim: true, maxlength: 120 },
    location: { type: String, trim: true, default: '', maxlength: 120 },
    start: { type: String, trim: true, default: '', maxlength: 20 }, // e.g. 'Jan 2023'
    end: { type: String, trim: true, default: '', maxlength: 20 }, // empty = present
    description: { type: String, trim: true, default: '', maxlength: 600 },
  },
  { _id: false }
);

const EducationSchema = new mongoose.Schema(
  {
    degree: { type: String, trim: true, maxlength: 160 },
    institution: { type: String, trim: true, maxlength: 160 },
    start: { type: String, trim: true, default: '', maxlength: 20 },
    end: { type: String, trim: true, default: '', maxlength: 20 },
  },
  { _id: false }
);

const slugify = (text = '') =>
  String(text).toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

// An entry in the public Alumni directory (/alumni) with a profile page at /alumni/<slug>.
// `user` is set when the alumnus has a login (role 'alumni'); admins can also add entries for graduates
// without an account. Only `approved` entries are shown publicly.
const AlumniProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, sparse: true },
    slug: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 120 },
    photo: { type: String, trim: true, default: '' },

    // University record
    studentId: { type: String, trim: true, default: '', maxlength: 40 },
    department: { type: String, trim: true, default: '', maxlength: 120 },
    degree: { type: String, trim: true, default: '', maxlength: 120 }, // e.g. 'B.Sc. in CSE'
    batch: { type: String, trim: true, default: '', maxlength: 40 }, // e.g. 'CSE 19'
    shift: { type: String, enum: [...ALUMNI_SHIFTS, ''], default: '' },
    graduationYear: { type: Number, min: 1990, max: 2100 },

    // Now
    jobTitle: { type: String, trim: true, default: '', maxlength: 120 },
    company: { type: String, trim: true, default: '', maxlength: 120 },
    industry: { type: String, trim: true, default: '', maxlength: 80 },
    location: { type: String, trim: true, default: '', maxlength: 120 }, // city
    country: { type: String, trim: true, default: '', maxlength: 80 },

    // Profile page
    bio: { type: String, trim: true, default: '', maxlength: 2000 },
    quote: { type: String, trim: true, default: '', maxlength: 400 }, // message to current students
    skills: { type: [String], default: [] },
    achievements: { type: [String], default: [] },
    experience: { type: [ExperienceSchema], default: [] },
    education: { type: [EducationSchema], default: [] },
    links: { type: LinksSchema, default: () => ({}) },
    openToMentor: { type: Boolean, default: false },
    showEmail: { type: Boolean, default: false }, // show links.email to signed-in members
    phone: { type: String, trim: true, default: '', maxlength: 30 },
    showPhone: { type: Boolean, default: false }, // show the phone to signed-in members

    featured: { type: String, trim: true, default: '', maxlength: 80 }, // club position held, e.g. "President '24"
    approved: { type: Boolean, default: false, index: true },
    // The alumnus' own choice: true = keep my profile off the website (directory + profile page),
    // even when an admin has approved it
    hideProfile: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Every entry gets a URL slug from its name (with a short suffix if the name is taken)
AlumniProfileSchema.pre('validate', async function assignSlug() {
  if (this.slug) return;
  const base = slugify(this.name) || 'alumnus';
  const taken = await this.constructor.exists({ slug: base, _id: { $ne: this._id } });
  this.slug = taken ? `${base}-${String(this._id).slice(-4)}` : base;
});

export default mongoose.models.AlumniProfile || mongoose.model('AlumniProfile', AlumniProfileSchema);
