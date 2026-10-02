import mongoose from 'mongoose';

export const CONTACT_STATUSES = ['unread', 'read', 'replied'];

const ContactMessageSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: [true, 'Name is required'], trim: true },
    email: { type: String, required: [true, 'Email is required'], trim: true, lowercase: true },
    phone: { type: String, trim: true, default: '' },
    subject: { type: String, trim: true, default: '' },
    message: { type: String, required: [true, 'Message is required'], trim: true },
    status: { type: String, enum: CONTACT_STATUSES, default: 'unread' },
  },
  { timestamps: true }
);

export default mongoose.models.ContactMessage || mongoose.model('ContactMessage', ContactMessageSchema);
