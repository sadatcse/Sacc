// Admin dashboard counters
import { ok } from '@/server/http';
import { countUsersByRole } from '@/server/services/user.service';
import { countPosts } from '@/server/services/news.service';
import { countAlumni } from '@/server/services/alumni.service';
import { getLatestYear, getCommittee } from '@/server/services/executive.service';
import { countApplications } from '@/server/services/membership.service';
import ContactMessage from '@/models/ContactMessage';

export async function overview() {
  const year = await getLatestYear();
  const [users, posts, alumni, committee, unreadMessages, applications] = await Promise.all([
    countUsersByRole(),
    countPosts(),
    countAlumni(),
    getCommittee(year),
    ContactMessage.countDocuments({ status: 'unread' }),
    countApplications(),
  ]);
  return ok({
    users,
    posts,
    alumni,
    committee: { year, members: committee.advisors.length + committee.executives.length },
    unreadMessages,
    applications,
  });
}
