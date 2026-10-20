// Background jobs for a long-running server (`next start` / `next dev`), started once by instrumentation.js.
// Serverless hosts don't keep a process alive — call GET /api/cron/donation-reminders from a cron there instead.
import connectDB from '@/lib/db';
import { sendDonationReminders } from '@/server/services/payment.service';

const EVERY_MS = 5 * 60 * 1000; // reminders are due 30 min / 3 days / 7 days after a donation starts

let started = false;

async function tick() {
  try {
    await connectDB();
    const { sent } = await sendDonationReminders();
    if (sent) console.log(`Donation reminders: ${sent} email${sent === 1 ? '' : 's'} sent.`);
  } catch (error) {
    console.error('Donation reminders failed:', error.message);
  }
}

export function startJobs() {
  if (started || !process.env.MONGO_URI) return;
  started = true;
  setTimeout(tick, 60 * 1000).unref?.(); // first run shortly after start-up
  setInterval(tick, EVERY_MS).unref?.();
}
