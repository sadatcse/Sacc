import mongoose from 'mongoose';
import { LinksSchema } from './shared.js';

export const PERSON_KINDS = ['student', 'faculty'];
export const SHIFTS = ['day', 'evening'];

// A person who has served on a committee (faculty advisor or student executive).
// Their roles per year live in CommitteePosition. Profile page: /executives/<slug>
// Required details (checked in executive.service.js):
//   student → studentId, batch, department, shift     faculty → department, designation
// links.email is the public (official) email; phone and personalEmail are private.
const ExecutiveSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 120 },
    photo: { type: String, trim: true, default: '' },
    kind: { type: String, enum: PERSON_KINDS, default: 'student' },
    studentId: { type: String, trim: true, default: '', maxlength: 40 },
    batch: { type: String, trim: true, default: '', maxlength: 40 }, // e.g. 'CSE 22'
    department: { type: String, trim: true, default: '', maxlength: 120 },
    shift: { type: String, enum: [...SHIFTS, ''], default: '' }, // Day / Evening program (students)
    designation: { type: String, trim: true, default: '', maxlength: 120 }, // faculty, e.g. 'Assistant Professor'
    // Faculty details (public, as on the university website)
    employeeId: { type: String, trim: true, default: '', maxlength: 40 },
    school: { type: String, trim: true, default: '', maxlength: 160 }, // e.g. 'School of Engineering'
    office: { type: String, trim: true, default: '', maxlength: 120 },
    officePhone: { type: String, trim: true, default: '', maxlength: 60 }, // e.g. '09614008008 Ext. 1015'
    // Private contact details — admins only. select:false keeps them out of every public query and API response.
    phone: { type: String, trim: true, default: '', maxlength: 30, select: false },
    personalEmail: { type: String, trim: true, lowercase: true, default: '', maxlength: 160, select: false },
    bio: { type: String, trim: true, default: '', maxlength: 1000 },
    links: { type: LinksSchema, default: () => ({}) },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // optional link to a login account
  },
  { timestamps: true }
);

export default mongoose.models.Executive || mongoose.model('Executive', ExecutiveSchema);
