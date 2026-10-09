// Outgoing email. SMTP settings come from Dashboard → Settings → Email (Setting 'email'),
// falling back to the SMTP_* variables in .env. Senders never throw — they return { sent, error }.
import nodemailer from 'nodemailer';
import { siteConfig } from '@/config/site';
import { escapeHtml, formatPhone } from '@/lib/utils';
import { decryptSecret } from '@/lib/secret-box';
import { getContactInfo, getSetting } from '@/server/services/settings.service';
import { PAYMENT_METHODS } from '@/config/membership';

// ---------- configuration ----------

export async function getMailConfig() {
  const s = await getSetting('email');
  const pass = decryptSecret(s.passEnc) || (s.user === process.env.SMTP_USER ? process.env.SMTP_PASS || '' : '');
  return { ...s, pass, configured: Boolean(s.host && s.user && pass) };
}

// Admin view of the settings — the password itself never leaves the server
export async function getMailSettingsForAdmin() {
  const { passEnc, pass, ...rest } = await getMailConfig();
  return { ...rest, hasPassword: Boolean(pass), passwordFromEnv: Boolean(pass && !decryptSecret(passEnc)) };
}

let cached = { key: '', transport: null };
function transportFor(cfg) {
  const key = [cfg.host, cfg.port, cfg.secure, cfg.user, cfg.pass].join('|');
  if (cached.key !== key) {
    cached = {
      key,
      transport: nodemailer.createTransport({
        host: cfg.host,
        port: cfg.port,
        secure: cfg.secure,
        auth: { user: cfg.user, pass: cfg.pass },
        connectionTimeout: 15000,
        greetingTimeout: 10000,
        socketTimeout: 20000,
      }),
    };
  }
  return cached.transport;
}

// Address / email / phone lines of the email footer, from Settings → Contact details
async function contactFooter() {
  const { address, email, phones = [] } = await getContactInfo();
  return `${e(address)}<br>${email ? `<a href="mailto:${e(email)}" style="color:#ea580c">${e(email)}</a>` : ''}${phones[0] ? ` · ${e(formatPhone(phones[0]))}` : ''}<br>`;
}

async function send(cfg, { to, subject, html: template, text, replyTo }) {
  if (!cfg.enabled) return { sent: false, error: 'Email sending is turned off in Settings.' };
  if (!cfg.configured) return { sent: false, error: 'Email is not set up yet (host, username and password are required).' };
  if (!to) return { sent: false, error: 'No recipient.' };
  const html = template.replace('<!--CONTACT-->', await contactFooter());
  try {
    const info = await transportFor(cfg).sendMail({
      from: `"${(cfg.fromName || siteConfig.name).replace(/"/g, '')}" <${cfg.fromEmail || cfg.user}>`,
      to,
      subject,
      html,
      text,
      ...(replyTo && { replyTo }),
    });
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Email "${subject}" to ${to} failed:`, error.message);
    return { sent: false, error: error.message };
  }
}

// ---------- layout ----------

const e = (v) => escapeHtml(String(v ?? ''));

function layout({ heading, intro, body = '', button }) {
  const site = siteConfig.url.replace(/\/$/, '');
  return `<!doctype html><html><body style="margin:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#27272a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 12px"><tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e4e4e7">
      <tr><td style="background:linear-gradient(90deg,#dc2626,#f97316);background-color:#ea580c;padding:22px 28px">
        <img src="${site}/logo.png" alt="" width="44" height="41" style="vertical-align:middle;border:0;background:#fff;border-radius:8px;padding:3px">
        <span style="vertical-align:middle;margin-left:10px;color:#fff;font-size:17px;font-weight:bold">${e(siteConfig.name)}</span>
      </td></tr>
      <tr><td style="padding:28px">
        <h1 style="margin:0 0 12px;font-size:22px;color:#18181b">${e(heading)}</h1>
        ${intro ? `<p style="margin:0 0 16px;font-size:15px;line-height:1.6">${intro}</p>` : ''}
        ${body}
        ${button ? `<p style="margin:24px 0 4px"><a href="${button.href}" style="display:inline-block;background:#ea580c;color:#fff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:8px">${e(button.label)}</a></p>` : ''}
      </td></tr>
      <tr><td style="padding:18px 28px;background:#fafafa;border-top:1px solid #e4e4e7;font-size:12px;color:#71717a;line-height:1.6">
        ${e(siteConfig.name)}<br><!--CONTACT-->
        <a href="${site}" style="color:#ea580c">${e(site.replace(/^https?:\/\//, ''))}</a>
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
}

const table = (rows) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;margin:8px 0 4px">${rows
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `<tr><td style="padding:8px 10px;border-bottom:1px solid #f0f0f0;color:#71717a;width:150px;vertical-align:top">${e(k)}</td><td style="padding:8px 10px;border-bottom:1px solid #f0f0f0;font-weight:bold">${e(v)}</td></tr>`)
    .join('')}</table>`;

const toText = (...lines) => lines.filter(Boolean).join('\n');
const site = () => siteConfig.url.replace(/\/$/, '');
const SHIFT = { day: 'Day', evening: 'Evening' };
const reference = (id) => String(id).slice(-8).toUpperCase();

// ---------- membership ----------

function applicationRows(app) {
  return [
    ['Reference', reference(app._id)],
    ['Name', `${app.firstName} ${app.lastName}`],
    ['Student ID', app.studentId],
    ['Batch · Shift', `${app.batch} · ${SHIFT[app.shift] || app.shift}`],
    ['Department', app.department],
    ['Payment', [PAYMENT_METHODS.find((m) => m.value === app.paymentMethod)?.label || app.paymentMethod, app.amount ? `${app.amount} BDT` : '', app.transactionId && `TrxID ${app.transactionId}`].filter(Boolean).join(' · ')],
  ];
}

export async function sendMembershipReceived(app) {
  const cfg = await getMailConfig();
  if (!cfg.notify.membershipReceived) return { sent: false, error: 'Turned off' };
  return send(cfg, {
    to: app.personalEmail,
    subject: `We received your membership application — ${siteConfig.shortName}`,
    html: layout({
      heading: `Thank you, ${app.firstName}!`,
      intro: `We have received your application to join the <b>${e(siteConfig.name)}</b>. Our team will verify your details and payment and let you know by email once it is reviewed.`,
      body: `${table(applicationRows(app))}<p style="font-size:13px;color:#71717a;margin-top:14px">${
        app.user ? 'Your member account is created and will be activated together with your membership — you can sign in once it is approved. ' : ''
      }Keep your reference number. If anything is wrong, simply reply to this email.</p>`,
      button: { label: 'Visit the club website', href: site() },
    }),
    text: toText(`Thank you, ${app.firstName}!`, `We received your application to join the ${siteConfig.name}.`, `Reference: ${reference(app._id)}`, 'We will email you once it is reviewed.'),
    replyTo: cfg.adminEmail || undefined,
  });
}

export async function sendMembershipApproved(app) {
  const cfg = await getMailConfig();
  if (!cfg.notify.membershipApproved) return { sent: false, error: 'Turned off' };
  return send(cfg, {
    to: app.personalEmail,
    subject: `Welcome to the ${siteConfig.shortName}! Your membership is approved 🎉`,
    html: layout({
      heading: `Welcome to the club, ${app.firstName}! 🎉`,
      intro: `Great news — your membership application to the <b>${e(siteConfig.name)}</b> has been <b style="color:#16a34a">approved</b>. You are now an official member.`,
      body: `${table(applicationRows(app))}<p style="font-size:14px;line-height:1.6">${
        app.user
          ? `Your member account is now active — sign in with <b>${e(app.personalEmail)}</b> and the password you chose on the Join form to update your profile.`
          : 'Follow our News page and Facebook for upcoming workshops, contests and events.'
      }</p>`,
      button: app.user ? { label: 'Sign in', href: `${site()}/login` } : { label: 'Visit the club website', href: site() },
    }),
    text: toText(`Welcome to the club, ${app.firstName}!`, `Your membership application to the ${siteConfig.name} has been approved.`, `Reference: ${reference(app._id)}`, app.user && `Sign in: ${site()}/login`),
    replyTo: cfg.adminEmail || undefined,
  });
}

export async function sendMembershipRejected(app) {
  const cfg = await getMailConfig();
  if (!cfg.notify.membershipRejected) return { sent: false, error: 'Turned off' };
  return send(cfg, {
    to: app.personalEmail,
    subject: `About your membership application — ${siteConfig.shortName}`,
    html: layout({
      heading: `Hello ${app.firstName},`,
      intro: `Thank you for applying to the <b>${e(siteConfig.name)}</b>. Unfortunately we could not approve your application this time.`,
      body: `${app.adminNote ? `<p style="font-size:14px;line-height:1.6"><b>Note from the club:</b> ${e(app.adminNote)}</p>` : ''}<p style="font-size:14px;line-height:1.6">If you think this is a mistake (for example a payment that wasn’t matched), just reply to this email.</p>`,
    }),
    text: toText(`Hello ${app.firstName},`, `We could not approve your application to the ${siteConfig.name} this time.`, app.adminNote && `Note: ${app.adminNote}`, 'Reply to this email if you think this is a mistake.'),
    replyTo: cfg.adminEmail || undefined,
  });
}

export async function sendMembershipAdminNotice(app) {
  const cfg = await getMailConfig();
  if (!cfg.notify.membershipAdmin || !cfg.adminEmail) return { sent: false, error: 'Turned off' };
  return send(cfg, {
    to: cfg.adminEmail,
    subject: `New membership application: ${app.firstName} ${app.lastName} (${app.studentId})`,
    html: layout({
      heading: 'New membership application',
      intro: 'A new application was submitted on the Join page. It is waiting for review as a draft.',
      body: table([...applicationRows(app), ['Email', app.personalEmail], ['Phone', app.phone]]),
      button: { label: 'Review in the dashboard', href: `${site()}/dashboard/membership` },
    }),
    text: toText('New membership application', `${app.firstName} ${app.lastName} (${app.studentId})`, `${site()}/dashboard/membership`),
    replyTo: app.personalEmail,
  });
}

// ---------- accounts (alumni / faculty sign-up, approved by an admin) ----------

const ACCOUNT_KIND = { alumni: 'alumni', admin: 'faculty', student: 'member' };

function accountRows(user, profile = {}) {
  return [
    ['Name', user.name],
    ['Email', user.email],
    ['Phone', user.phone],
    ['Student ID', profile.studentId],
    ['Batch', profile.batch],
    ['Designation', profile.designation],
    ['Department', profile.department],
  ];
}

export async function sendAccountReceived(user) {
  const cfg = await getMailConfig();
  if (!cfg.notify.accountReceived) return { sent: false, error: 'Turned off' };
  const first = user.name.split(' ')[0];
  return send(cfg, {
    to: user.email,
    subject: `Your ${ACCOUNT_KIND[user.role]} account is waiting for approval — ${siteConfig.shortName}`,
    html: layout({
      heading: `Thanks for signing up, ${first}!`,
      intro: `We have received your ${ACCOUNT_KIND[user.role]} account request on the <b>${e(siteConfig.name)}</b> website. A club admin will check your details — you can sign in as soon as it is approved, and we will email you when that happens.`,
      body: '<p style="font-size:13px;color:#71717a">Didn’t sign up? You can ignore this email.</p>',
    }),
    text: toText(`Thanks for signing up, ${first}!`, 'Your account is waiting for approval. We will email you when you can sign in.'),
    replyTo: cfg.adminEmail || undefined,
  });
}

export async function sendAccountApproved(user) {
  const cfg = await getMailConfig();
  if (!cfg.notify.accountApproved) return { sent: false, error: 'Turned off' };
  const first = user.name.split(' ')[0];
  return send(cfg, {
    to: user.email,
    subject: `Your account is approved — ${siteConfig.shortName}`,
    html: layout({
      heading: `You're all set, ${first}! ✔`,
      intro: `Your account on the <b>${e(siteConfig.name)}</b> website has been <b style="color:#16a34a">approved</b>. Sign in with <b>${e(user.email)}</b> and your password to complete your profile.${
        user.role === 'alumni' ? ' Your profile is now listed in the Alumni Directory.' : ''
      }`,
      button: { label: 'Sign in', href: `${site()}/login` },
    }),
    text: toText(`You're all set, ${first}!`, 'Your account has been approved.', `Sign in: ${site()}/login`),
    replyTo: cfg.adminEmail || undefined,
  });
}

export async function sendAccountAdminNotice(user, profile) {
  const cfg = await getMailConfig();
  if (!cfg.notify.accountAdmin || !cfg.adminEmail) return { sent: false, error: 'Turned off' };
  return send(cfg, {
    to: cfg.adminEmail,
    subject: `New ${ACCOUNT_KIND[user.role]} account to approve: ${user.name}`,
    html: layout({
      heading: `New ${ACCOUNT_KIND[user.role]} account waiting for approval`,
      intro: user.role === 'admin'
        ? '<b>Faculty accounts get full dashboard access</b> once approved — please confirm this person is a faculty member first.'
        : 'Someone signed up on the website. They cannot sign in until an admin approves the account.',
      body: table(accountRows(user, profile)),
      button: { label: 'Review in the dashboard', href: `${site()}/dashboard/users?status=pending` },
    }),
    text: toText(`New ${ACCOUNT_KIND[user.role]} account to approve: ${user.name} <${user.email}>`, `${site()}/dashboard/users?status=pending`),
    replyTo: user.email,
  });
}

// ---------- student → alumni requests ----------

export async function sendAlumniRequestDecision(req, slug) {
  const cfg = await getMailConfig();
  if (!cfg.notify.accountApproved || !req.email) return { sent: false, error: 'Turned off' };
  const first = req.name.split(' ')[0];
  const approved = req.status === 'approved';
  return send(cfg, {
    to: req.email,
    subject: approved ? `Welcome to the alumni network — ${siteConfig.shortName}` : `About your alumni request — ${siteConfig.shortName}`,
    html: layout({
      heading: approved ? `Congratulations, ${first}! 🎓` : `Hello ${first},`,
      intro: approved
        ? `Your account is now an <b>alumni account</b>. ${req.hideProfile ? 'As you asked, your profile is hidden from the website — you can change that any time.' : 'Your profile is listed in the Alumni Directory.'} Sign in to add your job, links and story.`
        : 'We could not approve your request to become alumni this time.',
      body: req.adminNote ? `<p style="font-size:14px;line-height:1.6"><b>Note from the club:</b> ${e(req.adminNote)}</p>` : '',
      button: approved ? { label: 'Update my alumni profile', href: `${site()}/account` } : undefined,
    }),
    text: toText(approved ? `Your account is now an alumni account. ${slug ? `${site()}/alumni/${slug}` : ''}` : 'Your alumni request was not approved.', req.adminNote && `Note: ${req.adminNote}`),
    replyTo: cfg.adminEmail || undefined,
  });
}

// ---------- contact form ----------

export async function sendContactAutoReply(msg) {
  const cfg = await getMailConfig();
  if (!cfg.notify.contactAutoReply) return { sent: false, error: 'Turned off' };
  return send(cfg, {
    to: msg.email,
    subject: `We received your message — ${siteConfig.shortName}`,
    html: layout({
      heading: `Thanks for getting in touch, ${msg.fullName.split(' ')[0]}!`,
      intro: 'We have received your message and will reply as soon as possible — usually within a few working days.',
      body: `${table([['Subject', msg.subject || '—']])}<blockquote style="margin:12px 0;padding:12px 16px;background:#fafafa;border-left:4px solid #f97316;font-size:14px;line-height:1.6;white-space:pre-wrap">${e(msg.message)}</blockquote>`,
    }),
    text: toText(`Thanks for getting in touch, ${msg.fullName}!`, 'We received your message and will reply soon.', '', msg.message),
    replyTo: cfg.adminEmail || undefined,
  });
}

export async function sendContactAdminNotice(msg) {
  const cfg = await getMailConfig();
  if (!cfg.notify.contactAdmin || !cfg.adminEmail) return { sent: false, error: 'Turned off' };
  return send(cfg, {
    to: cfg.adminEmail,
    subject: `New contact message: ${msg.fullName}`,
    html: layout({
      heading: 'New message from the Contact page',
      body: `${table([['Name', msg.fullName], ['Email', msg.email], ['Phone', msg.phone], ['Subject', msg.subject]])}<blockquote style="margin:12px 0;padding:12px 16px;background:#fafafa;border-left:4px solid #f97316;font-size:14px;line-height:1.6;white-space:pre-wrap">${e(msg.message)}</blockquote>`,
      button: { label: 'Open the inbox', href: `${site()}/dashboard/contact-messages` },
    }),
    text: toText(`New contact message from ${msg.fullName} <${msg.email}>`, msg.subject, '', msg.message),
    replyTo: msg.email,
  });
}

// ---------- test ----------

export async function sendTestEmail(to) {
  const cfg = await getMailConfig();
  return send(
    { ...cfg, enabled: true },
    {
      to,
      subject: `Test email from the ${siteConfig.shortName} website ✔`,
      html: layout({
        heading: 'Your email settings work! ✔',
        intro: `This test was sent from Dashboard → Settings → Email using <b>${e(cfg.host)}:${e(cfg.port)}</b> as <b>${e(cfg.user)}</b>.`,
        body: '<p style="font-size:14px;line-height:1.6">Membership and contact emails will be delivered the same way.</p>',
      }),
      text: 'Your email settings work!',
    }
  );
}
