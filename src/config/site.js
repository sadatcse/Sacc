// Central place for club identity. Edit here — every page reads from this file.
export const siteConfig = {
  name: 'University of South Asia Computer Club',
  shortName: 'USACC',
  tagline: 'Learn. Build. Lead.',
  description:
    'The official computer club of the University of South Asia — events, workshops, competitions and a community for every CSE student.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  contact: {
    email: 'computerclub@example.com',
    phone: '',
    address: 'University of South Asia, Dhaka, Bangladesh',
  },
  social: {
    facebook: 'https://www.facebook.com/southasiacomputerclub',
    linkedin: '',
    github: '',
    youtube: '',
  },
};
