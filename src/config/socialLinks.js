// Every profile link type, in display order. Keys match LinksSchema (src/models/shared.js).
// Used by the public profile pages (SocialLinks) and the dashboard / account forms (LINK_FIELDS).
import { FaLinkedinIn, FaGithub, FaFacebookF, FaGlobe, FaEnvelope } from 'react-icons/fa';
import { SiGooglescholar, SiResearchgate, SiIeee } from 'react-icons/si';

export const SOCIAL_LINKS = [
  { key: 'linkedin', label: 'LinkedIn', icon: FaLinkedinIn },
  { key: 'googleScholar', label: 'Google Scholar', icon: SiGooglescholar },
  { key: 'researchGate', label: 'ResearchGate', icon: SiResearchgate },
  { key: 'ieee', label: 'IEEE Xplore', icon: SiIeee },
  { key: 'github', label: 'GitHub', icon: FaGithub },
  { key: 'facebook', label: 'Facebook', icon: FaFacebookF },
  { key: 'website', label: 'Website', icon: FaGlobe },
  { key: 'email', label: 'Email', icon: FaEnvelope },
];
