import nodemailer from 'nodemailer';
import { siteConfig } from '@/config/site';
import { escapeHtml } from './utils';

function getTransporter() {
  const { SMTP_HOST: host, SMTP_PORT, SMTP_USER: user, SMTP_PASS: pass } = process.env;
  if (!host || !user || !pass) return null;
  const port = Number(SMTP_PORT) || 465;
  return nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
}

// Emails the club when someone submits the Contact form. Silently skips if SMTP isn't configured.
export async function sendContactNotificationEmail(data) {
  try {
    const transporter = getTransporter();
    if (!transporter) return { success: false, error: 'SMTP not configured' };

    const recipient = process.env.CONTACT_NOTIFICATION_EMAIL || process.env.SMTP_USER;
    const rows = [
      ['Name', data.fullName],
      ['Email', data.email],
      ['Phone', data.phone || 'N/A'],
      ['Subject', data.subject || 'N/A'],
      ['Message', data.message],
    ]
      .map(
        ([label, value]) =>
          `<tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;width:120px;vertical-align:top">${label}</td>` +
          `<td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(value)}</td></tr>`
      )
      .join('');

    const info = await transporter.sendMail({
      from: `"${siteConfig.shortName} Website" <${process.env.SMTP_USER}>`,
      to: recipient,
      replyTo: data.email || undefined,
      subject: `New contact message: ${data.fullName}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px">
        <h2>${escapeHtml(siteConfig.name)}</h2>
        <p>A new message was submitted via the Contact page.</p>
        <table style="width:100%;border-collapse:collapse">${rows}</table>
      </div>`,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Contact email error:', error);
    return { success: false, error: error.message };
  }
}
