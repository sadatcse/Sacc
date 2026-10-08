import mongoose from 'mongoose';
import { LinksSchema } from './shared.js';

// One per user with role 'admin' — teachers and faculty members
const AdminProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    designation: { type: String, trim: true, default: '', maxlength: 120 }, // e.g. Assistant Professor
    department: { type: String, trim: true, default: 'Computer Science & Engineering', maxlength: 120 },
    employeeId: { type: String, trim: true, default: '', maxlength: 40 },
    office: { type: String, trim: true, default: '', maxlength: 120 },
    photo: { type: String, trim: true, default: '' },
    bio: { type: String, trim: true, default: '', maxlength: 2000 },
    expertise: { type: [String], default: [] },
    links: { type: LinksSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export default mongoose.models.AdminProfile || mongoose.model('AdminProfile', AdminProfileSchema);
