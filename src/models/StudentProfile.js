import mongoose from 'mongoose';
import { LinksSchema } from './shared.js';

// One per user with role 'student'
const StudentProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    studentId: { type: String, trim: true, default: '', maxlength: 40 },
    department: { type: String, trim: true, default: 'Computer Science & Engineering', maxlength: 120 },
    batch: { type: String, trim: true, default: '', maxlength: 40 },
    semester: { type: String, trim: true, default: '', maxlength: 40 },
    section: { type: String, trim: true, default: '', maxlength: 20 },
    photo: { type: String, trim: true, default: '' },
    bio: { type: String, trim: true, default: '', maxlength: 1000 },
    skills: { type: [String], default: [] },
    links: { type: LinksSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export default mongoose.models.StudentProfile || mongoose.model('StudentProfile', StudentProfileSchema);
