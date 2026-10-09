// Admin: login history and user activity (src/server/services/audit.service.js)
import { ok } from '@/server/http';
import * as audit from '@/server/services/audit.service';

const pick = (query, keys) => Object.fromEntries(keys.map((k) => [k, query.get(k) || '']).filter(([, v]) => v));

// ?result=success|failed&role=&search=&days=
export async function logins({ query }) {
  const [rows, stats] = await Promise.all([audit.listLogins(pick(query, ['result', 'role', 'search', 'days'])), audit.loginStats()]);
  return ok({ rows, stats });
}

// ?action=&entity=&role=&search=&days=&user=
export async function activity({ query }) {
  const [rows, stats] = await Promise.all([audit.listActivity(pick(query, ['action', 'entity', 'role', 'search', 'days', 'user'])), audit.activityStats()]);
  return ok({ rows, stats });
}
