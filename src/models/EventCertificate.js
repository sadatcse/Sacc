import mongoose from 'mongoose';
import { EVENT_CERT_TYPE_VALUES } from '../config/event-certificates.js';

// One certificate for one person at an event (CertificateEvent). Verify page: /certificates/<code>
// PDF: /api/event-certificates/pdf/<code> (admins; anyone with the code when the event allows it)
const EventCertificateSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true }, // e.g. SACC-E26-7KQ4MZ
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'CertificateEvent', required: true, index: true },
    type: { type: String, enum: EVENT_CERT_TYPE_VALUES, default: 'participant' },
    recipient: {
      name: { type: String, trim: true, required: [true, 'Name is required'], maxlength: 120 },
      institution: { type: String, trim: true, default: '', maxlength: 160 }, // university / company / student ID
      email: { type: String, trim: true, lowercase: true, default: '', maxlength: 160 },
    },
    detail: { type: String, trim: true, default: '', maxlength: 160 }, // position, topic, team… (see the type)
    revoked: { type: Boolean, default: false },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

EventCertificateSchema.index({ event: 1, type: 1 });

export default mongoose.models.EventCertificate || mongoose.model('EventCertificate', EventCertificateSchema);
