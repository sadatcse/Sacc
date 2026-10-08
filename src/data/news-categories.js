// News categories, in the order they appear in the /news filter bar.
// A post's `category` in src/data/news.js must be one of these keys.
// "Upcoming Events" is not stored on posts — it is every event whose date hasn't passed yet
// (its chip is always shown). Other categories with no posts are hidden automatically.
import {
  FaCalendarCheck, FaTrophy, FaChalkboardTeacher, FaFutbol, FaGlassCheers, FaCode, FaFlask,
  FaLightbulb, FaBookOpen, FaBriefcase, FaHandsHelping, FaBullhorn,
} from 'react-icons/fa';

export const UPCOMING = 'upcoming';

export const newsCategories = [
  { key: UPCOMING, label: 'Upcoming Events', icon: FaCalendarCheck },
  { key: 'activities-achievements', label: 'Activities & Achievements', icon: FaTrophy },
  { key: 'workshops-seminars', label: 'Workshops & Seminars', icon: FaChalkboardTeacher },
  { key: 'sports-games', label: 'Sports & Games', icon: FaFutbol },
  { key: 'celebrations-culture', label: 'Celebrations & Culture', icon: FaGlassCheers },
  { key: 'contests-hackathons', label: 'Contests & Hackathons', icon: FaCode },
  { key: 'career-alumni', label: 'Career & Alumni', icon: FaBriefcase },
  { key: 'research-publications', label: 'Research & Publications', icon: FaFlask },
  { key: 'projects-innovation', label: 'Projects & Innovation', icon: FaLightbulb },
  { key: 'tutorials-guides', label: 'Tutorials & Guides', icon: FaBookOpen },
  { key: 'community-outreach', label: 'Community & Outreach', icon: FaHandsHelping },
  { key: 'announcements', label: 'Announcements', icon: FaBullhorn },
];

export const categoryLabel = (key) => newsCategories.find((c) => c.key === key)?.label || key;
