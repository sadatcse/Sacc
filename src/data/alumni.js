// SAMPLE alumni (fictional people) — replace with real data, or later load the same
// shape from MongoDB / an API and pass it to <AlumniDirectory alumni={…} />.
//
// Shape of one record:
//   id        unique string
//   name      full name
//   photo     optional image URL (in /public or remote) — initials are shown when empty
//   batch     e.g. 'CSE 19'
//   role      job title
//   company   employer / university
//   links     { linkedin?, github?, website? }
//   featured  optional club position held, e.g. "President '24"
export const alumni = [
  { id: '1', name: 'Arif Hossain', batch: 'CSE 17', role: 'Software Engineer', company: 'Samsung R&D', links: { linkedin: '#' } },
  { id: '2', name: 'Ayesha Rahman', batch: 'CSE 18', role: 'Lecturer', company: 'University of South Asia', links: { linkedin: '#' } },
  { id: '3', name: 'Bashir Ahmed', batch: 'CSE 19', role: 'Full Stack Engineer', company: 'Brain Station 23', links: { linkedin: '#', github: '#' }, featured: "Executive Director '22" },
  { id: '4', name: 'Fahim Chowdhury', batch: 'CSE 17', role: 'PhD Student', company: 'University of Toronto', links: { linkedin: '#', website: '#' } },
  { id: '5', name: 'Imran Kabir', batch: 'CSE 20', role: 'DevOps Engineer', company: 'Pathao', links: { linkedin: '#', github: '#' } },
  { id: '6', name: 'Jannatul Ferdous', batch: 'CSE 19', role: 'Software Engineer (QA)', company: 'TigerIT Bangladesh', links: { linkedin: '#' } },
  { id: '7', name: 'Kamrul Islam', batch: 'CSE 18', role: 'Graduate Research Assistant', company: 'Kent State University', links: { linkedin: '#' } },
  { id: '8', name: 'Lamia Akter', batch: 'CSE 20', role: 'BI Analyst', company: 'bKash', links: { linkedin: '#' } },
  { id: '9', name: 'Mahmudul Hasan', batch: 'CSE 21', role: 'Mobile Application Developer', company: 'ReliSource', links: { linkedin: '#', github: '#' } },
  { id: '10', name: 'Nabila Sultana', batch: 'CSE 20', role: 'Software Engineer', company: 'Samsung R&D', links: { linkedin: '#' } },
  { id: '11', name: 'Omar Faruk', batch: 'CSE 16', role: 'Assistant Professor', company: 'University of South Asia', links: { linkedin: '#', website: '#' } },
  { id: '12', name: 'Priya Das', batch: 'CSE 19', role: 'Machine Learning Engineer', company: 'Brain Station 23', links: { linkedin: '#', github: '#' } },
  { id: '13', name: 'Rafiq Uddin', batch: 'CSE 21', role: 'Trainee Software Engineer', company: 'Enosis Solutions', links: { linkedin: '#' } },
  { id: '14', name: 'Sadia Islam', batch: 'CSE 18', role: 'Application Security Engineer', company: 'Startise', links: { linkedin: '#' } },
  { id: '15', name: 'Tahmid Karim', batch: 'CSE 21', role: 'Software Engineer', company: 'Chaldal', links: { linkedin: '#', github: '#' }, featured: "President '24" },
  { id: '16', name: 'Zubair Alam', batch: 'CSE 20', role: 'Lecturer', company: 'University of South Asia', links: { linkedin: '#' } },
];
