// Fills the caches behind the public pages (site settings, home page, committee, gallery, club contacts), so the
// first visitor after a (re)start doesn't wait for MongoDB. Runs when the server starts (instrumentation.js) and on
// every /api/health call (the keep-alive cron job). Never throws.
import { getCachedSetting, getContactInfo } from '@/server/services/settings.service';
import { getClubContacts, getCommittee, getLatestYear } from '@/server/services/executive.service';
import { getGalleryPhotos } from '@/server/services/gallery.service';
import { getHomeFeed } from '@/server/services/news.service';

export async function warmPublicData() {
  const started = Date.now();
  const results = await Promise.allSettled([
    getCachedSetting('site'),
    getContactInfo().then((contact) => getClubContacts(contact.executiveCount || 2)),
    getHomeFeed(),
    getGalleryPhotos(),
    getLatestYear().then((year) => getCommittee(year)),
  ]);
  const failed = results.filter((r) => r.status === 'rejected');
  return { ms: Date.now() - started, ok: failed.length === 0, error: failed[0]?.reason?.message };
}
