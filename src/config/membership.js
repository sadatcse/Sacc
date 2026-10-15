// Options for the club membership application (/join) — shared by the form, the API and the dashboard.
export const TSHIRT_SIZES = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];
export const SHIFT_OPTIONS = [
  { value: 'day', label: 'Day' },
  { value: 'evening', label: 'Evening' },
];

// Payment methods (bKash, Nagad, cash, cheque…) are set in Dashboard → Payment Methods — see src/config/payment-methods.js

export const SOFT_SKILLS = [
  'Leadership', 'Communication', 'Team Work', 'Problem Solving',
  'Time Management', 'Public Speaking', 'Event Management', 'Project Management',
  'Photography', 'Cinematography', 'Graphic Design', 'Video Editing',
  'Motion Graphics', 'Content Writing', 'Acting', 'Singing',
];

// Every new application is a draft until an admin reviews it
export const APPLICATION_STATUSES = [
  { value: 'draft', label: 'Draft (new)', color: 'amber' },
  { value: 'approved', label: 'Approved', color: 'green' },
  { value: 'rejected', label: 'Rejected', color: 'red' },
];

export const PHOTO_MAX_BYTES = 2 * 1024 * 1024; // 2 MB
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// A membership lasts this many years from approval; members renew for 1–3 years at a time
export const MEMBERSHIP_TERM_YEARS = 1;
export const RENEW_YEARS = [1, 2, 3];

// Money received: the joining fee (from the application), renewals (members) and donations (alumni)
export const PAYMENT_TYPES = [
  { value: 'membership', label: 'Membership fee', color: 'blue' },
  { value: 'renewal', label: 'Renewal', color: 'green' },
  { value: 'donation', label: 'Donation', color: 'amber' },
];
export const PAYMENT_STATUSES = [
  { value: 'pending', label: 'Waiting for check', color: 'amber' },
  { value: 'verified', label: 'Received', color: 'green' },
  { value: 'rejected', label: 'Rejected', color: 'red' },
];
