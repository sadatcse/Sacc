import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ContactMessage, { CONTACT_STATUSES } from '@/models/ContactMessage';
import { findRecentDuplicate } from '@/lib/dedupe-guard';
import { requireAdmin, unauthorizedResponse } from '@/lib/auth-guard';
import { after } from 'next/server';
import { sendContactAdminNotice, sendContactAutoReply } from '@/server/services/mail.service';
import { escapeRegex } from '@/lib/utils';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Public: submit the contact form
export async function POST(req) {
  try {
    const body = await req.json();
    const data = {
      fullName: String(body.fullName || '').trim().slice(0, 120),
      email: String(body.email || '').trim().toLowerCase().slice(0, 160),
      phone: String(body.phone || '').trim().slice(0, 30),
      subject: String(body.subject || '').trim().slice(0, 200),
      message: String(body.message || '').trim().slice(0, 5000),
    };

    if (!data.fullName || !data.message || !EMAIL_RE.test(data.email)) {
      return NextResponse.json({ success: false, message: 'Name, a valid email and a message are required.' }, { status: 400 });
    }

    await connectDB();
    const existing = await findRecentDuplicate(ContactMessage, { email: data.email, message: data.message });
    if (existing) {
      return NextResponse.json({ success: true, message: 'We already received your message — we will get back to you soon.' });
    }

    await ContactMessage.create(data);
    // Auto-reply to the sender + notice to the club inbox, sent after the response
    after(() => Promise.all([sendContactAutoReply(data), sendContactAdminNotice(data)]));

    return NextResponse.json({ success: true, message: 'Thanks! Your message has been sent.' }, { status: 201 });
  } catch (error) {
    console.error('Contact POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to send message.' }, { status: 500 });
  }
}

// Admin: list messages (?status=unread&search=foo)
export async function GET(req) {
  if (!requireAdmin(req)) return unauthorizedResponse();
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const filter = {};
    if (CONTACT_STATUSES.includes(status)) filter.status = status;
    if (search) {
      const re = new RegExp(escapeRegex(search), 'i');
      filter.$or = [{ fullName: re }, { email: re }, { phone: re }, { subject: re }, { message: re }];
    }

    const messages = await ContactMessage.find(filter).sort({ createdAt: -1 }).limit(500).lean();
    return NextResponse.json({ success: true, data: messages });
  } catch (error) {
    console.error('Contact GET error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
