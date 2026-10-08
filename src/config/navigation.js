import { TbLayoutDashboard } from 'react-icons/tb';
import { FaGlobe, FaEnvelope, FaNewspaper, FaUsers, FaUserTie, FaUserGraduate, FaIdCard, FaLock, FaInfoCircle, FaUserPlus, FaCog } from 'react-icons/fa';

// Public site navigation (Navbar + Footer)
export const mainNav = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Executives', href: '/executives' },
  { label: 'Alumni', href: '/alumni' },
  { label: 'News', href: '/news' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Contact', href: '/contact' },
  { label: 'Join Us', href: '/join' },
];

export const legalNav = [
  { label: 'Terms of Use', href: '/legal/termsofuse' },
  { label: 'Privacy Policy', href: '/legal/appprivacypolicy' },
  { label: 'Cookie Policy', href: '/legal/cookiepolicy' },
  { label: 'Refund Policy', href: '/legal/refundpolicy' },
];

// Admin dashboard sidebar (admins = faculty)
export const dashboardNav = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: TbLayoutDashboard },
      { label: 'Traffic Analytics', href: '/dashboard/traffic', icon: FaGlobe },
    ],
  },
  {
    title: 'Content',
    items: [
      { label: 'News & Events', href: '/dashboard/news', icon: FaNewspaper },
      { label: 'Executives', href: '/dashboard/executives', icon: FaUserTie },
      { label: 'Alumni', href: '/dashboard/alumni', icon: FaUserGraduate },
      { label: 'About Page', href: '/dashboard/about', icon: FaInfoCircle },
    ],
  },
  {
    title: 'People',
    items: [
      { label: 'Membership', href: '/dashboard/membership', icon: FaUserPlus },
      { label: 'Users', href: '/dashboard/users', icon: FaUsers },
    ],
  },
  {
    title: 'Inbox',
    items: [{ label: 'Contact Messages', href: '/dashboard/contact-messages', icon: FaEnvelope }],
  },
  {
    title: 'System',
    items: [
      { label: 'Settings', href: '/dashboard/settings', icon: FaCog },
      { label: 'My Profile', href: '/dashboard/profile', icon: FaIdCard },
    ],
  },
];

// Tabs on /account (students & alumni)
export const accountNav = [
  { label: 'Profile', href: '/account', icon: FaIdCard },
  { label: 'Password', href: '/account/security', icon: FaLock },
];

// Routes where the public Navbar/Footer are hidden
export const appOnlyRoutes = ['/dashboard', '/account', '/login', '/register'];
