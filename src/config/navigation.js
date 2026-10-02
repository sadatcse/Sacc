import { TbLayoutDashboard } from 'react-icons/tb';
import { FaGlobe, FaEnvelope } from 'react-icons/fa';

// Public site navigation (Navbar + Footer)
export const mainNav = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Executives', href: '/executives' },
  { label: 'Alumni', href: '/alumni' },
  { label: 'News', href: '/news' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Collaborations', href: '/collaborations' },
  { label: 'Contact', href: '/contact' },
];

export const legalNav = [
  { label: 'Terms of Use', href: '/legal/termsofuse' },
  { label: 'Privacy Policy', href: '/legal/appprivacypolicy' },
  { label: 'Cookie Policy', href: '/legal/cookiepolicy' },
  { label: 'Refund Policy', href: '/legal/refundpolicy' },
];

// Admin dashboard sidebar
export const dashboardNav = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: TbLayoutDashboard },
      { label: 'Traffic Analytics', href: '/dashboard/traffic', icon: FaGlobe },
    ],
  },
  {
    title: 'Inbox',
    items: [{ label: 'Contact Messages', href: '/dashboard/contact-messages', icon: FaEnvelope }],
  },
];

// Routes where the public Navbar/Footer are hidden
export const appOnlyRoutes = ['/dashboard', '/login'];
