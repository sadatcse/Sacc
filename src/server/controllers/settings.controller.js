import { HttpError, ok, readJson } from '@/server/http';
import * as settings from '@/server/services/settings.service';
import { getMailSettingsForAdmin, sendTestEmail } from '@/server/services/mail.service';

// Public: /api/settings/site, /api/settings/about, /api/settings/membership
// Admin only: /api/settings/email (the password is never returned)
export async function show({ params, session }) {
  if (settings.PRIVATE_KEYS.includes(params.key)) {
    if (session?.role !== 'admin') throw new HttpError(403, 'Admins only.');
    return ok(await getMailSettingsForAdmin());
  }
  return ok(await settings.getSetting(params.key));
}

export async function update({ req, params, session }) {
  await settings.updateSetting(params.key, await readJson(req), { userId: session._id });
  return ok(params.key === 'email' ? await getMailSettingsForAdmin() : await settings.getSetting(params.key), 'Saved.');
}

// POST /api/settings/email/test  { to }
export async function testEmail({ req, session }) {
  const { to } = await readJson(req);
  const recipient = String(to || session.email || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) throw new HttpError(400, 'Enter a valid email address to send the test to.');
  const result = await sendTestEmail(recipient);
  if (!result.sent) throw new HttpError(400, `Could not send: ${result.error}`);
  return ok({ to: recipient }, `Test email sent to ${recipient}. Check the inbox (and spam folder).`);
}
