// SAMPLE alumni (fictional people) for `npm run seed` — manage real ones in Dashboard → Alumni.
//
// Base record: id, name, photo?, batch ('CSE 19'), role (job title), company, links, featured? (club position)
// `withDetails()` below fills in the rest of the AlumniProfile fields with believable sample values:
//   studentId, department, degree, shift, graduationYear, industry, location, country, bio, quote,
//   skills[], achievements[], experience[], education[], openToMentor
const base = [
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

const ABROAD = {
  'University of Toronto': ['Toronto', 'Canada'],
  'Kent State University': ['Kent, Ohio', 'United States'],
};
const SKILLS = {
  'Software Engineer': ['Java', 'Spring Boot', 'System Design', 'SQL'],
  Lecturer: ['Algorithms', 'Data Structures', 'Teaching', 'Python'],
  'Full Stack Engineer': ['React', 'Node.js', 'MongoDB', 'TypeScript'],
  'PhD Student': ['Machine Learning', 'PyTorch', 'Research Writing', 'Statistics'],
  'DevOps Engineer': ['Kubernetes', 'AWS', 'Terraform', 'CI/CD'],
  'Software Engineer (QA)': ['Test Automation', 'Selenium', 'API Testing', 'Jira'],
  'Graduate Research Assistant': ['Computer Vision', 'Python', 'OpenCV', 'LaTeX'],
  'BI Analyst': ['Power BI', 'SQL', 'Data Modelling', 'Excel'],
  'Mobile Application Developer': ['Flutter', 'Kotlin', 'Firebase', 'Dart'],
  'Assistant Professor': ['Networking', 'IoT', 'Research Supervision', 'C++'],
  'Machine Learning Engineer': ['Deep Learning', 'NLP', 'MLOps', 'Python'],
  'Trainee Software Engineer': ['C#', '.NET', 'SQL Server', 'Git'],
  'Application Security Engineer': ['Penetration Testing', 'OWASP', 'Burp Suite', 'Linux'],
};
const INDUSTRY = (company, role) =>
  /University/.test(company) ? 'Education & Research' : /bKash|Bank/.test(company) ? 'Fintech' : /Security/.test(role) ? 'Cyber Security' : 'Software';

function withDetails(a, i) {
  const year = Number(a.batch.replace(/\D/g, '')) || 19; // 'CSE 19' → 19
  const [location, country] = ABROAD[a.company] || ['Dhaka', 'Bangladesh'];
  const academic = /Lecturer|Professor|PhD|Research/.test(a.role);
  const first = a.name.split(' ')[0];
  return {
    ...a,
    studentId: `${year}1000${String(100 + i).slice(-3)}`,
    department: 'Computer Science & Engineering',
    degree: 'B.Sc. in Computer Science & Engineering',
    shift: i % 3 === 2 ? 'evening' : 'day',
    graduationYear: 2000 + year + 4,
    industry: INDUSTRY(a.company, a.role),
    location,
    country,
    bio: `${first} graduated from the CSE department in ${2000 + year + 4} and now works as ${a.role} at ${a.company}. During university ${first} was an active member of the computer club, joining workshops, contests and project showcases.`,
    quote: academic
      ? 'Read papers early, ask your teachers questions, and do not be afraid to start research as an undergraduate.'
      : 'Build real projects, keep your GitHub active, and never stop learning — the club is the best place to start.',
    skills: SKILLS[a.role] || ['Programming', 'Teamwork', 'Problem Solving'],
    achievements: [
      `Graduated with distinction (batch ${a.batch})`,
      ...(a.featured ? [`Served the computer club as ${a.featured.replace(/ '\d+$/, '')}`] : []),
      ...(i % 2 === 0 ? ['Top 10 in the Intra-University Programming Contest'] : ['Best Project Award at the CSE Project Showcase']),
    ],
    experience: [
      { title: a.role, company: a.company, location, start: `Jan ${2000 + year + 6}`, end: '', description: `Working as ${a.role} at ${a.company}.` },
      ...(academic
        ? []
        : [{ title: 'Software Engineer Intern', company: 'Brain Station 23', location: 'Dhaka', start: `Jun ${2000 + year + 4}`, end: `Dec ${2000 + year + 5}`, description: 'Built and tested features for client web applications.' }]),
    ],
    education: [
      { degree: 'B.Sc. in Computer Science & Engineering', institution: 'University of South Asia', start: String(2000 + year), end: String(2000 + year + 4) },
      ...(/PhD|Research/.test(a.role) ? [{ degree: 'M.Sc. in Computer Science', institution: a.company, start: String(2000 + year + 6), end: '' }] : []),
    ],
    openToMentor: i % 3 !== 1,
  };
}

export const alumni = base.map(withDetails);
