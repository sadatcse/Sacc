import mongoose from 'mongoose';

// A certificate given to a student executive for serving on one year's committee
// (Dashboard → Certificates). One per person per year. The recipient and the signing faculty advisors
// (top 3 of that year's committee) are copied in when it is issued, so later edits don't change it —
// "Update" re-copies them. PDF: /api/certificates/pdf/<code> · verify page: /certificates/<code>
const PersonSnapshot = {
  name: { type: String, trim: true, default: '' },
  studentId: { type: String, trim: true, default: '' },
  batch: { type: String, trim: true, default: '' },
  department: { type: String, trim: true, default: '' },
  shift: { type: String, trim: true, default: '' },
};

const SignerSchema = new mongoose.Schema(
  {
    executive: { type: mongoose.Schema.Types.ObjectId, ref: 'Executive' }, // signature image is read from here
    name: { type: String, trim: true, default: '' },
    role: { type: String, trim: true, default: '' }, // committee role, e.g. 'Chief Advisor'
    designation: { type: String, trim: true, default: '' },
    department: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const CertificateSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true }, // e.g. SACC-2026-7KQ4MZ (in the barcode)
    executive: { type: mongoose.Schema.Types.ObjectId, ref: 'Executive', required: true, index: true },
    year: { type: Number, required: true, index: true },
    role: { type: String, trim: true, default: '' }, // every role held that year, joined with " & "
    recipient: PersonSnapshot,
    signers: { type: [SignerSchema], default: [] },
    issuedOn: { type: String, default: '' }, // YYYY-MM-DD
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    revoked: { type: Boolean, default: false }, // no longer valid (the verify page says so; no PDF)
  },
  { timestamps: true }
);

CertificateSchema.index({ executive: 1, year: 1 }, { unique: true });

export default mongoose.models.Certificate || mongoose.model('Certificate', CertificateSchema);
