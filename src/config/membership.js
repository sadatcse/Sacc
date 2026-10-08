// Options for the club membership application (/join) — shared by the form, the API and the dashboard.
export const TSHIRT_SIZES = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export const SHIFT_OPTIONS = [
  { value: 'day', label: 'Day' },
  { value: 'evening', label: 'Evening' },
];

// Payment methods; the club's receiving number for each comes from the dashboard settings
export const PAYMENT_METHODS = [
  { value: 'bkash', label: 'bKash' },
  { value: 'nagad', label: 'Nagad' },
  { value: 'rocket', label: 'Rocket' },
  { value: 'cash', label: 'Cash (pay at the club desk)' },
];
export const MOBILE_PAYMENT_METHODS = ['bkash', 'nagad', 'rocket'];

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
