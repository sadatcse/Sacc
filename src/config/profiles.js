// Profile fields per role — used by the API (src/server/services/user.service.js) to decide what
// can be saved, and by the profile form (src/components/account/ProfileForm.jsx) to render inputs.
// Types: text | longtext | url | number | list (comma separated) | lines (one per line) | boolean | shift
//        | experience / education (repeatable rows) | links (social links group) | heading (form section title only)
export const ROLE_LABELS = {
  admin: 'Admin (Faculty)',
  student: 'Student',
  alumni: 'Alumni',
};

export const PROFILE_CONFIG = {
  student: {
    title: 'Student Profile',
    fields: [
      { name: 'studentId', label: 'Student ID', type: 'text', placeholder: '221000101' },
      { name: 'department', label: 'Department', type: 'text' },
      { name: 'batch', label: 'Batch', type: 'text', placeholder: 'CSE 22' },
      { name: 'semester', label: 'Semester', type: 'text', placeholder: 'Spring 2026' },
      { name: 'section', label: 'Section', type: 'text', placeholder: 'A' },
      { name: 'photo', label: 'Photo URL', type: 'url', placeholder: 'https://…' },
      { name: 'skills', label: 'Skills', type: 'list', placeholder: 'C++, React, Python' },
      { name: 'bio', label: 'About you', type: 'longtext' },
      { name: 'links', label: 'Links', type: 'links' },
    ],
  },
  admin: {
    title: 'Faculty Profile',
    fields: [
      { name: 'designation', label: 'Designation', type: 'text', placeholder: 'Assistant Professor' },
      { name: 'department', label: 'Department', type: 'text' },
      { name: 'employeeId', label: 'Employee ID', type: 'text' },
      { name: 'office', label: 'Office / Room', type: 'text' },
      { name: 'photo', label: 'Photo URL', type: 'url', placeholder: 'https://…' },
      { name: 'expertise', label: 'Areas of expertise', type: 'list', placeholder: 'Machine Learning, Networks' },
      { name: 'bio', label: 'Biography', type: 'longtext' },
      { name: 'links', label: 'Links', type: 'links' },
    ],
  },
  alumni: {
    title: 'Alumni Profile',
    fields: [
      { type: 'heading', label: 'At the university' },
      { name: 'studentId', label: 'Student ID', type: 'text', placeholder: '191000101' },
      { name: 'department', label: 'Department', type: 'text', placeholder: 'Computer Science & Engineering' },
      { name: 'degree', label: 'Degree', type: 'text', placeholder: 'B.Sc. in CSE' },
      { name: 'batch', label: 'Batch', type: 'text', placeholder: 'CSE 19' },
      { name: 'shift', label: 'Shift', type: 'shift' },
      { name: 'graduationYear', label: 'Graduation year', type: 'number', placeholder: '2023' },
      { type: 'heading', label: 'Now' },
      { name: 'jobTitle', label: 'Job title', type: 'text', placeholder: 'Software Engineer' },
      { name: 'company', label: 'Company / University', type: 'text' },
      { name: 'industry', label: 'Industry', type: 'text', placeholder: 'Software, Banking, Research…' },
      { name: 'location', label: 'City', type: 'text', placeholder: 'Dhaka' },
      { name: 'country', label: 'Country', type: 'text', placeholder: 'Bangladesh' },
      { name: 'photo', label: 'Photo URL', type: 'url', placeholder: 'https://…' },
      { type: 'heading', label: 'Your story' },
      { name: 'bio', label: 'About you', type: 'longtext' },
      { name: 'quote', label: 'Message to current students', type: 'longtext' },
      { name: 'skills', label: 'Skills', type: 'list', placeholder: 'React, Go, Machine Learning' },
      { name: 'achievements', label: 'Achievements (one per line)', type: 'lines' },
      { name: 'experience', label: 'Work experience', type: 'experience' },
      { name: 'education', label: 'Education', type: 'education' },
      { name: 'openToMentor', label: 'I am open to mentoring students', type: 'boolean' },
      { name: 'showEmail', label: 'Show my contact email on my public profile', type: 'boolean' },
      { name: 'links', label: 'Links', type: 'links' },
    ],
  },
};

// Columns for the repeatable rows (ListEditor) used by profile and admin forms
export const EXPERIENCE_COLUMNS = [
  { key: 'title', label: 'Job title', placeholder: 'Software Engineer' },
  { key: 'company', label: 'Company', placeholder: 'Brain Station 23' },
  { key: 'location', label: 'Location', placeholder: 'Dhaka' },
  { key: 'start', label: 'From', placeholder: 'Jan 2023', className: 'max-w-[8rem]' },
  { key: 'end', label: 'To', placeholder: 'Present', className: 'max-w-[8rem]' },
  { key: 'description', label: 'What you did', multiline: true, className: 'basis-full' },
];
export const EDUCATION_COLUMNS = [
  { key: 'degree', label: 'Degree', placeholder: 'M.Sc. in Computer Science' },
  { key: 'institution', label: 'Institution', placeholder: 'University of Toronto' },
  { key: 'start', label: 'From', placeholder: '2023', className: 'max-w-[7rem]' },
  { key: 'end', label: 'To', placeholder: '2025', className: 'max-w-[7rem]' },
];
export const SHIFT_SELECT = [
  { value: '', label: 'Choose…' },
  { value: 'day', label: 'Day' },
  { value: 'evening', label: 'Evening' },
];

// Server field type → EntityForm field props
export function formField(name, f) {
  switch (f.type) {
    case 'longtext': return { name, label: f.label, type: 'textarea', placeholder: f.placeholder };
    case 'lines': return { name, label: f.label, type: 'lines', placeholder: f.placeholder };
    case 'shift': return { name, label: f.label, type: 'select', options: SHIFT_SELECT };
    case 'boolean': return { name, label: f.label, type: 'checkbox', full: true };
    case 'experience': return { name, label: f.label, type: 'rows', columns: EXPERIENCE_COLUMNS, addLabel: 'Add position' };
    case 'education': return { name, label: f.label, type: 'rows', columns: EDUCATION_COLUMNS, addLabel: 'Add degree' };
    default: return { name, label: f.label, type: f.type, placeholder: f.placeholder };
  }
}

export const LINK_FIELDS = [
  { name: 'linkedin', label: 'LinkedIn' },
  { name: 'googleScholar', label: 'Google Scholar' },
  { name: 'researchGate', label: 'ResearchGate' },
  { name: 'ieee', label: 'IEEE Xplore' },
  { name: 'github', label: 'GitHub' },
  { name: 'facebook', label: 'Facebook' },
  { name: 'website', label: 'Website' },
  { name: 'email', label: 'Contact email' },
];

// { studentId: 'text', … } for a role — what the API accepts
export const profileFieldTypes = (role) =>
  Object.fromEntries((PROFILE_CONFIG[role]?.fields || []).filter((f) => f.name).map((f) => [f.name, f.type]));
