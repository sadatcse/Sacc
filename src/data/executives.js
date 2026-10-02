// SAMPLE committee data (fictional people) — replace with the real committees, or later
// load the same two collections from MongoDB and keep using the helpers below.
//
// people:    one record per person (profile info)
//   slug      URL id → /executives/<slug>
//   name, photo? (URL; initials shown when empty), studentId?, department?
//   links     { linkedin?, github?, facebook?, email? }
//
// positions: one record per role held in a given year (a person can have many)
//   slug      → people.slug
//   year      committee year
//   type      'advisor' | 'executive'
//   role      position title
//   Order inside a year = display order (put the President first).

export const people = [
  // Faculty advisors
  { slug: 'dr-rezaul-karim', name: 'Dr. Rezaul Karim', department: 'Department of CSE', links: { email: 'advisor@example.com' } },
  { slug: 'nasrin-sultana', name: 'Nasrin Sultana', department: 'Department of CSE', links: { linkedin: '#' } },
  { slug: 'mahfuz-alam', name: 'Mahfuz Alam', department: 'Department of CSE', links: { linkedin: '#' } },

  // Students
  { slug: 'tanvir-hasan', name: 'Tanvir Hasan', studentId: '221000101', links: { linkedin: '#', github: '#', facebook: '#', email: 'tanvir@example.com' } },
  { slug: 'farhana-islam', name: 'Farhana Islam', studentId: '221000102', links: { linkedin: '#', facebook: '#' } },
  { slug: 'sabbir-rahman', name: 'Sabbir Rahman', studentId: '221000103', links: { linkedin: '#', github: '#' } },
  { slug: 'nusrat-jahan', name: 'Nusrat Jahan', studentId: '221000104', links: { linkedin: '#' } },
  { slug: 'rakibul-islam', name: 'Rakibul Islam', studentId: '221000105', links: { github: '#' } },
  { slug: 'sumaiya-akter', name: 'Sumaiya Akter', studentId: '221000106', links: { linkedin: '#' } },
  { slug: 'mehedi-hasan', name: 'Mehedi Hasan', studentId: '221000107', links: { linkedin: '#', github: '#' } },
  { slug: 'tasnim-ara', name: 'Tasnim Ara', studentId: '221000108', links: { facebook: '#' } },
  { slug: 'arif-chowdhury', name: 'Arif Chowdhury', studentId: '221000109', links: { linkedin: '#' } },
  { slug: 'jannat-ferdous', name: 'Jannat Ferdous', studentId: '221000110', links: { linkedin: '#' } },
  { slug: 'shakil-ahmed', name: 'Shakil Ahmed', studentId: '221000111', links: { github: '#' } },
  { slug: 'mim-rahman', name: 'Mim Rahman', studentId: '221000112', links: { facebook: '#' } },
  { slug: 'kamal-uddin', name: 'Kamal Uddin', studentId: '201000201', links: { linkedin: '#' } },
  { slug: 'sadia-afrin', name: 'Sadia Afrin', studentId: '201000202', links: { linkedin: '#' } },
  { slug: 'hasib-reza', name: 'Hasib Reza', studentId: '201000203', links: { github: '#' } },
];

export const positions = [
  // 2026
  { slug: 'dr-rezaul-karim', year: 2026, type: 'advisor', role: 'Moderator' },
  { slug: 'nasrin-sultana', year: 2026, type: 'advisor', role: 'Deputy Moderator' },
  { slug: 'mahfuz-alam', year: 2026, type: 'advisor', role: 'Deputy Moderator' },
  { slug: 'tanvir-hasan', year: 2026, type: 'executive', role: 'President' },
  { slug: 'farhana-islam', year: 2026, type: 'executive', role: 'Vice President (Activity)' },
  { slug: 'sabbir-rahman', year: 2026, type: 'executive', role: 'Vice President (Technical)' },
  { slug: 'nusrat-jahan', year: 2026, type: 'executive', role: 'General Secretary' },
  { slug: 'rakibul-islam', year: 2026, type: 'executive', role: 'Joint General Secretary' },
  { slug: 'sumaiya-akter', year: 2026, type: 'executive', role: 'Treasurer' },
  { slug: 'mehedi-hasan', year: 2026, type: 'executive', role: 'Programming Secretary' },
  { slug: 'tasnim-ara', year: 2026, type: 'executive', role: 'Organizing Secretary' },
  { slug: 'arif-chowdhury', year: 2026, type: 'executive', role: 'Information Secretary' },
  { slug: 'jannat-ferdous', year: 2026, type: 'executive', role: 'Publication Secretary' },
  { slug: 'shakil-ahmed', year: 2026, type: 'executive', role: 'Graphics & Multimedia Coordinator' },
  { slug: 'mim-rahman', year: 2026, type: 'executive', role: 'Cultural Secretary' },

  // 2025
  { slug: 'dr-rezaul-karim', year: 2025, type: 'advisor', role: 'Moderator' },
  { slug: 'nasrin-sultana', year: 2025, type: 'advisor', role: 'Deputy Moderator' },
  { slug: 'kamal-uddin', year: 2025, type: 'executive', role: 'President' },
  { slug: 'sadia-afrin', year: 2025, type: 'executive', role: 'Vice President' },
  { slug: 'hasib-reza', year: 2025, type: 'executive', role: 'General Secretary' },
  { slug: 'tanvir-hasan', year: 2025, type: 'executive', role: 'Event Coordinator' },
  { slug: 'nusrat-jahan', year: 2025, type: 'executive', role: 'Organizing Secretary' },
  { slug: 'mehedi-hasan', year: 2025, type: 'executive', role: 'Programming Secretary' },
  { slug: 'sumaiya-akter', year: 2025, type: 'executive', role: 'Joint Treasurer' },
  { slug: 'jannat-ferdous', year: 2025, type: 'executive', role: 'Executive Member' },

  // 2024
  { slug: 'dr-rezaul-karim', year: 2024, type: 'advisor', role: 'Moderator' },
  { slug: 'hasib-reza', year: 2024, type: 'executive', role: 'President' },
  { slug: 'kamal-uddin', year: 2024, type: 'executive', role: 'General Secretary' },
  { slug: 'sadia-afrin', year: 2024, type: 'executive', role: 'Treasurer' },
  { slug: 'tanvir-hasan', year: 2024, type: 'executive', role: 'Executive Member' },
];
