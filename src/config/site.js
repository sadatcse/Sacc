// Central place for club identity. Edit here — every page reads from this file.
export const siteConfig = {
  name: 'University of South Asia Computer Club',
  shortName: 'SACC',
  tagline: 'Learn. Build. Lead.',
  // Used in the browser-tab / search-result title of the home page and in link previews
  slogan: 'Empowering Innovation Through Technology',
  description:
    'The official computer club of the University of South Asia — events, workshops, competitions and a community for every CSE student.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  contact: {
    email: 'computerclub@southasiauni.ac.bd',
    // Shown as tap-to-call links. Display format is kept as written.
    // Fixed numbers. The current President / Vice President (from Dashboard → Executives) are added on /contact and the home page.
    phones: ['09614008008', '+8801763030636'],
    address: 'Permanent Campus - Amin Bazar, Savar, Dhaka-1348, Bangladesh',
    // Google Maps: link for "Open in Maps", embed for the map on /contact (University of South Asia, 23.7932, 90.3162)
    mapUrl: 'https://maps.app.goo.gl/7TL1jfYZFiRLAU6p8',
    mapEmbed: 'https://maps.google.com/maps?q=University%20of%20South%20Asia&ll=23.7931971,90.3161747&z=16&output=embed',
  },
  social: {
    facebook: 'https://www.facebook.com/southasiacomputerclub',
    linkedin: '',
    github: '',
    youtube: '',
  },
};
