import { createElement } from 'react';
import {
  FaCrown, FaUserTie, FaCoins, FaClipboardList, FaCode, FaFileAlt, FaShareAlt, FaBookOpen, FaPalette,
  FaCamera, FaTrophy, FaCalendarCheck, FaUser, FaUserGraduate,
} from 'react-icons/fa';

// First matching keyword wins — order matters ("joint secretary" before "secretary", etc.)
const RULES = [
  [/president/i, FaCrown],
  [/moderator|advisor/i, FaUserGraduate],
  [/treasurer/i, FaCoins],
  [/programming/i, FaCode],
  [/organi[sz]ing/i, FaClipboardList],
  [/information/i, FaFileAlt],
  [/outreach/i, FaShareAlt],
  [/publication/i, FaBookOpen],
  [/cultural/i, FaPalette],
  [/graphics|multimedia|photography/i, FaCamera],
  [/sports/i, FaTrophy],
  [/event/i, FaCalendarCheck],
  [/secretary/i, FaUserTie],
];

function roleIcon(role = '') {
  return RULES.find(([pattern]) => pattern.test(role))?.[1] || FaUser;
}

// Renders the icon for a role title (createElement: the icon type is looked up, not created)
export default function RoleIcon({ role, ...props }) {
  return createElement(roleIcon(role), { 'aria-hidden': true, ...props });
}
