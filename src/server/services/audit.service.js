// Login history and user activity tracking (Dashboard → Login History / User Activity).
// Writing a log must never break the request that triggered it, so record* functions swallow errors.
import LoginLog from '@/models/LoginLog';
import ActivityLog from '@/models/ActivityLog';
import User from '@/models/User';
import { getClientIp } from '@/lib/visitor';
import { parseUserAgent } from '@/lib/user-agent';
import { escapeRegex } from '@/lib/utils';
import { str, toPlain } from '@/server/validate';

// Where the request came from — IP, country/city (Vercel headers) and the device
function requestContext(req) {
  const ua = req.headers.get('user-agent') || '';
  let city = req.headers.get('x-vercel-ip-city') || '';
  try {
    city = decodeURIComponent(city);
  } catch {
    /* keep raw value */
  }
  return {
    ip: getClientIp(req),
    country: req.headers.get('x-vercel-ip-country') || '',
    city,
    userAgent: ua.slice(0, 400),
    ...parseUserAgent(ua),
  };
}

// ---------- recording ----------

export async function recordLogin(req, { email, success, reason = '', user }) {
  try {
    const account = user || (email ? await User.findOne({ email: str(email, 160).toLowerCase() }).select('name role').lean() : null);
    await LoginLog.create({
      ...requestContext(req),
      email: str(email, 160).toLowerCase(),
      success,
      reason,
      ...(account && { user: account._id, name: account.name, role: account.role }),
    });
  } catch (error) {
    console.error('Login log failed:', error.message);
  }
}

export async function recordActivity(req, { session, user, action, entity = '', entityId = '', summary = '' }) {
  try {
    const actor = user || session;
    const { userAgent, city, ...ctx } = requestContext(req);
    await ActivityLog.create({
      ...ctx,
      user: actor?._id,
      name: actor?.name || '',
      email: actor?.email || '',
      role: actor?.role || '',
      action,
      entity,
      entityId: String(entityId || ''),
      summary: str(summary, 300),
      method: req.method,
      path: new URL(req.url).pathname,
    });
  } catch (error) {
    console.error('Activity log failed:', error.message);
  }
}

// Turns an API change (method + path + response data) into an activity entry
const ENTITIES = [
  [/^\/api\/executives\/[^/]+\/alumni/, 'Alumni entry'],
  [/^\/api\/gallery/, 'Gallery photo'],
  [/^\/api\/news/, 'News post'],
  [/^\/api\/executives/, 'Executive'],
  [/^\/api\/committee/, 'Committee position'],
  [/^\/api\/alumni-requests/, 'Alumni request'],
  [/^\/api\/alumni/, 'Alumni entry'],
  [/^\/api\/users/, 'User'],
  [/^\/api\/membership/, 'Membership application'],
  [/^\/api\/settings\/site/, 'Site settings'],
  [/^\/api\/settings\/about/, 'About page'],
  [/^\/api\/settings\/membership/, 'Registration settings'],
  [/^\/api\/settings\/email$/, 'Email settings'],
  [/^\/api\/profile/, 'Own profile'],
  [/^\/api\/contact/, 'Contact message'],
];
const VERBS = { create: 'Created', update: 'Updated', delete: 'Deleted' };

export function describeChange(method, path, data) {
  if (path.startsWith('/api/auth/logout')) return { action: 'logout', entity: 'Session', summary: 'Signed out' };
  if (path.startsWith('/api/auth/password')) return { action: 'password_change', entity: 'Password', summary: 'Changed their password' };
  const entity = ENTITIES.find(([re]) => re.test(path))?.[1];
  if (!entity) return null;
  const action = method === 'POST' ? 'create' : method === 'DELETE' ? 'delete' : 'update';
  const d = data && typeof data === 'object' ? data : {};
  const label = d.title || d.name || d.user?.name || [d.firstName, d.lastName].filter(Boolean).join(' ') || d.executive?.name || '';
  const extra = [d.role && entity === 'Committee position' && `${d.role}${d.year ? ` ${d.year}` : ''}`, d.status && entity !== 'Contact message' && `status: ${d.status}`]
    .filter(Boolean)
    .join(', ');
  const id = d._id || path.split('/')[3] || '';
  return {
    action,
    entity,
    entityId: id,
    summary: `${VERBS[action]} ${entity.toLowerCase()}${label ? ` “${label}”` : ''}${extra ? ` (${extra})` : ''}`,
  };
}

// ---------- reading (admin) ----------

const since = (days) => (Number(days) > 0 ? new Date(Date.now() - Number(days) * 86400000) : null);

export async function listLogins({ result, role, search, days } = {}) {
  const filter = {};
  if (result === 'success') filter.success = true;
  if (result === 'failed') filter.success = false;
  if (role) filter.role = role;
  const from = since(days);
  if (from) filter.createdAt = { $gte: from };
  if (search) {
    const re = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ email: re }, { name: re }, { ip: re }, { country: re }, { browser: re }];
  }
  return toPlain(await LoginLog.find(filter).select('-userAgent').sort({ createdAt: -1 }).limit(1000).lean());
}

export async function listActivity({ action, entity, role, search, days, user } = {}) {
  const filter = {};
  if (action) filter.action = action;
  if (entity) filter.entity = entity;
  if (role) filter.role = role;
  if (user) filter.user = user;
  const from = since(days);
  if (from) filter.createdAt = { $gte: from };
  if (search) {
    const re = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ email: re }, { name: re }, { summary: re }, { ip: re }];
  }
  return toPlain(await ActivityLog.find(filter).sort({ createdAt: -1 }).limit(1000).lean());
}

export async function loginStats() {
  const day = since(1);
  const week = since(7);
  const [today, failedToday, activeUsers, total] = await Promise.all([
    LoginLog.countDocuments({ success: true, createdAt: { $gte: day } }),
    LoginLog.countDocuments({ success: false, createdAt: { $gte: day } }),
    LoginLog.distinct('user', { success: true, createdAt: { $gte: week } }),
    LoginLog.estimatedDocumentCount(),
  ]);
  return { today, failedToday, activeUsers7d: activeUsers.length, total };
}

export async function activityStats() {
  const day = since(1);
  const week = since(7);
  const [today, activeUsers, byAction] = await Promise.all([
    ActivityLog.countDocuments({ createdAt: { $gte: day } }),
    ActivityLog.distinct('user', { createdAt: { $gte: week } }),
    ActivityLog.aggregate([{ $match: { createdAt: { $gte: since(30) } } }, { $group: { _id: '$action', count: { $sum: 1 } } }]),
  ]);
  return { today, activeUsers7d: activeUsers.length, last30d: Object.fromEntries(byAction.map((r) => [r._id, r.count])) };
}
