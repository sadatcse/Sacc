import mongoose from 'mongoose';

export const ALUMNI_REQUEST_STATUSES = ['pending', 'approved', 'rejected'];

// A student's request to become alumni (the student form has been removed; older requests remain). When an admin approves it
// (Dashboard → Alumni → Requests) the account's role changes to 'alumni' and an AlumniProfile is
// created from these details plus the student profile.
const AlumniRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, trim: true, default: '', maxlength: 120 },
    email: { type: String, trim: true, lowercase: true, default: '', maxlength: 160 },
    studentId: { type: String, trim: true, default: '', maxlength: 40 },
    department: { type: String, trim: true, default: '', maxlength: 120 },
    batch: { type: String, trim: true, default: '', maxlength: 40 },
    shift: { type: String, enum: ['day', 'evening', ''], default: '' },
    degree: { type: String, trim: true, default: '', maxlength: 120 },
    graduationYear: { type: Number, min: 1990, max: 2100 },
    jobTitle: { type: String, trim: true, default: '', maxlength: 120 },
    company: { type: String, trim: true, default: '', maxlength: 160 },
    location: { type: String, trim: true, default: '', maxlength: 120 },
    note: { type: String, trim: true, default: '', maxlength: 1000 }, // message to the admins
    hideProfile: { type: Boolean, default: false }, // keep the new alumni profile off the website
    status: { type: String, enum: ALUMNI_REQUEST_STATUSES, default: 'pending', index: true },
    adminNote: { type: String, trim: true, default: '', maxlength: 1000 },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.AlumniRequest || mongoose.model('AlumniRequest', AlumniRequestSchema);
