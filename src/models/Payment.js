import mongoose from 'mongoose';

// Money received by the club (Dashboard → Payments):
//   membership → the joining fee paid with the /join application (recorded when the application is approved)
//   renewal    → a member extends the membership by `years` (sent from Account → Payments, or recorded by an admin)
//   donation   → an alumnus gives any amount
// Payments sent by members start 'pending' until an admin checks the transaction; a verified renewal moves the
// application's expiresAt forward (periodStart → periodEnd).
// 'draft' = a donation started on /alumni (details given) but never finished: the donor gets reminder emails
// 30 min, 3 days and 7 days later with a link (resumeToken) back to the payment step.
const PaymentSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['membership', 'renewal', 'donation'], required: true, index: true },
    status: { type: String, enum: ['draft', 'pending', 'verified', 'rejected'], default: 'pending', index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    application: { type: mongoose.Schema.Types.ObjectId, ref: 'MembershipApplication', index: true },
    // Snapshot of the payer, so the record stays readable if the account changes
    name: { type: String, trim: true, default: '', maxlength: 120 },
    email: { type: String, trim: true, lowercase: true, default: '', maxlength: 160 },
    phone: { type: String, trim: true, default: '', maxlength: 30 },
    studentId: { type: String, trim: true, default: '', maxlength: 40 },
    batch: { type: String, trim: true, default: '', maxlength: 40 },
    amount: { type: Number, required: true, min: 0 },
    years: { type: Number, default: 0, min: 0, max: 3 }, // renewals
    method: { type: String, trim: true, default: '' },
    paidFrom: { type: String, trim: true, default: '', maxlength: 60 }, // sender number, bank, or the cheque's bank
    transactionId: { type: String, trim: true, default: '', maxlength: 60 },
    note: { type: String, trim: true, default: '', maxlength: 1000 }, // from the payer
    adminNote: { type: String, trim: true, default: '', maxlength: 1000 },
    paidAt: { type: Date, default: Date.now },
    periodStart: { type: Date },
    periodEnd: { type: Date },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // added by an admin (e.g. cash)
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    // Unfinished donations (status 'draft')
    resumeToken: { type: String, select: false, index: { unique: true, sparse: true } }, // /alumni?donate=<token>
    remindersSent: { type: Number, default: 0 }, // automatic reminders sent so far (0–3)
    reminders: { type: [{ at: Date, auto: Boolean, sent: Boolean, error: String, _id: false }], default: undefined },
  },
  { timestamps: true }
);

PaymentSchema.index({ status: 1, remindersSent: 1, createdAt: 1 });

// One joining-fee record per application
PaymentSchema.index({ application: 1, type: 1 }, { unique: true, partialFilterExpression: { type: 'membership' } });

export default mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);
