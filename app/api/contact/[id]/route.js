import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import ContactMessage, { CONTACT_STATUSES } from '@/models/ContactMessage';
import { requireAdmin, unauthorizedResponse } from '@/lib/auth-guard';
import { recordActivity } from '@/server/services/audit.service';

function invalidId() {
  return NextResponse.json({ success: false, message: 'Invalid message id.' }, { status: 400 });
}

function notFound() {
  return NextResponse.json({ success: false, message: 'Message not found.' }, { status: 404 });
}

// Admin: change status
export async function PATCH(req, { params }) {
  const session = requireAdmin(req);
  if (!session) return unauthorizedResponse();
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return invalidId();
  try {
    const { status } = await req.json();
    if (!CONTACT_STATUSES.includes(status)) {
      return NextResponse.json({ success: false, message: 'Invalid status.' }, { status: 400 });
    }
    await connectDB();
    const updated = await ContactMessage.findByIdAndUpdate(id, { status }, { returnDocument: 'after' }).lean();
    if (!updated) return notFound();
    await recordActivity(req, { session, action: 'update', entity: 'Contact message', entityId: id, summary: `Marked the message from “${updated.fullName}” as ${status}` });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Contact PATCH error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// Admin: delete
export async function DELETE(req, { params }) {
  const session = requireAdmin(req);
  if (!session) return unauthorizedResponse();
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return invalidId();
  try {
    await connectDB();
    const deleted = await ContactMessage.findByIdAndDelete(id);
    if (!deleted) return notFound();
    await recordActivity(req, { session, action: 'delete', entity: 'Contact message', entityId: id, summary: `Deleted the message from “${deleted.fullName}”` });
    return NextResponse.json({ success: true, message: 'Message deleted.' });
  } catch (error) {
    console.error('Contact DELETE error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
