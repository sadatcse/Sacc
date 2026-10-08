import { ok, readJson } from '@/server/http';
import * as settings from '@/server/services/settings.service';

// Public: /api/settings/about, /api/settings/membership
export async function show({ params }) {
  return ok(await settings.getSetting(params.key));
}

export async function update({ req, params, session }) {
  return ok(await settings.updateSetting(params.key, await readJson(req), { userId: session._id }), 'Saved.');
}
