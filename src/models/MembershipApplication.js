import mongoose from 'mongoose';

// A club membership application from /join. New applications are 'draft' until an admin
// approves or rejects them in Dashboard → Membership. The photo is stored in the document
// (max 2 MB) and served to admins by /api/membership/<id>/photo.
const MembershipApplicationSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 60 },
    lastName: { type: String, required: true, trim: true, maxlength: 60 },
    personalEmail: { type: String, required: true, trim: true, lowercase: true, maxlength: 160 },
    phone: { type: String, required: true, trim: true, maxlength: 30 }, // WhatsApp
    backupPhone: { type: String, trim: true, default: '', maxlength: 30 },
    studentId: { type: String, required: true, trim: true, maxlength: 40, index: true },
    department: { type: String, required: true, trim: true, maxlength: 120 },
    batch: { type: String, required: true, trim: true, maxlength: 40 },
    shift: { type: String, enum: ['day', 'evening'], required: true },
    tshirtSize: { type: String, required: true },
    bloodGroup: { type: String, required: true },
    facebook: { type: String, trim: true, default: '', maxlength: 300 },
    paymentMethod: { type: String, required: true },
    paymentFrom: { type: String, trim: true, default: '', maxlength: 30 }, // sender number
    transactionId: { type: String, trim: true, default: '', maxlength: 60 },
    amount: { type: Number, default: 0 }, // fee at the time of applying
    softSkills: { type: [String], default: [] },
    experience: { type: String, trim: true, default: '', maxlength: 3000 },
    photo: {
      data: { type: Buffer, select: false },
      contentType: { type: String, default: '' },
      size: { type: Number, default: 0 },
    },
    status: { type: String, enum: ['draft', 'approved', 'rejected'], default: 'draft', index: true },
    // The member's login (role student). accountCreated = the Join form created it (pending until approved);
    // false = the applicant already had an account and linked it with its password.
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    accountCreated: { type: Boolean, default: false },
    adminNote: { type: String, trim: true, default: '', maxlength: 1000 },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    ip: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.models.MembershipApplication || mongoose.model('MembershipApplication', MembershipApplicationSchema);
