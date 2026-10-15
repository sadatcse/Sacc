import mongoose from 'mongoose';

// An event that gives certificates — programming contest, seminar, workshop… (Dashboard → Event Certificates).
// Its certificates (participants, winners, speakers, guests…) are EventCertificate documents. The signers are
// copied in (name / role / designation); a signer picked from Executives also has their signature image printed.
const SignerSchema = new mongoose.Schema(
  {
    executive: { type: mongoose.Schema.Types.ObjectId, ref: 'Executive' }, // signature image is read from here (optional)
    name: { type: String, trim: true, default: '' },
    role: { type: String, trim: true, default: '' }, // e.g. 'Chief Advisor', 'Convener'
    designation: { type: String, trim: true, default: '' },
    department: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const CertificateEventSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Event name is required'], trim: true, maxlength: 160 },
    date: { type: String, required: true }, // YYYY-MM-DD
    endDate: { type: String, default: '' }, // YYYY-MM-DD, multi-day events
    venue: { type: String, trim: true, default: '' },
    organizer: { type: String, trim: true, default: '' }, // line under the club name on the certificate
    issuedOn: { type: String, default: '' }, // YYYY-MM-DD printed on every certificate
    signers: { type: [SignerSchema], default: [] },
    // Per certificate type: { title, body } overriding the defaults in src/config/event-certificates.js
    wording: { type: mongoose.Schema.Types.Mixed, default: {} },
    publicPdf: { type: Boolean, default: true }, // recipients can download the PDF from the verify page
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, minimize: false }
);

CertificateEventSchema.index({ date: -1 });

export default mongoose.models.CertificateEvent || mongoose.model('CertificateEvent', CertificateEventSchema);
