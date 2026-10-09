// SAMPLE club members (fictional people) for `npm run seed` — approved membership applications so the
// members list (Dashboard → Membership → Club Members, Account → Club Members) can be tried out.
// Emails are @example.com and phones use the 01700-00xxxx test range. Delete them in Dashboard → Membership
// (search "SAMPLE") once real members are approved.
// `login`: links the member to a seed test account (see ACCOUNTS in scripts/seed.js) to test the privacy rule.
const people = [
  ['Tahsin', 'Rahman', 'male', 'CSE 26', 'day', 'A+'],
  ['Nusrat', 'Jahan', 'female', 'CSE 26', 'day', 'B+', 'test.female@usacc.edu.bd'],
  ['Arafat', 'Hossain', 'male', 'CSE 26', 'evening', 'O+'],
  ['Sumaiya', 'Akter', 'female', 'CSE 26', 'evening', 'AB+'],
  ['Test', 'Student', 'male', 'CSE 24', 'day', 'O+', 'test.student@usacc.edu.bd', '241000555'],
  ['Mehedi', 'Hasan', 'male', 'CSE 25', 'day', 'B+'],
  ['Farzana', 'Islam', 'female', 'CSE 25', 'day', 'A-'],
  ['Rifat', 'Ahmed', 'male', 'CSE 25', 'evening', 'O-'],
  ['Tasnim', 'Chowdhury', 'female', 'CSE 25', 'day', 'B-'],
  ['Shakil', 'Mia', 'male', 'CSE 24', 'evening', 'A+'],
  ['Mim', 'Sultana', 'female', 'CSE 24', 'day', 'O+'],
  ['Nayeem', 'Uddin', 'male', 'CSE 24', 'day', 'AB-'],
  ['Jannatul', 'Mawa', 'female', 'CSE 24', 'evening', 'A+'],
  ['Sabbir', 'Khan', 'male', 'CSE 23', 'day', 'B+'],
  ['Rumana', 'Parvin', 'female', 'CSE 23', 'day', 'O+'],
  ['Imtiaz', 'Karim', 'male', 'CSE 23', 'evening', 'A-'],
  ['Sadia', 'Afrin', 'female', 'CSE 23', 'day', 'B+'],
  ['Fahad', 'Sarker', 'male', 'CSE 22', 'day', 'O+'],
  ['Lamiya', 'Noor', 'female', 'CSE 22', 'evening', 'AB+'],
  ['Asif', 'Iqbal', 'male', 'CSE 22', 'day', 'A+'],
];

const SKILLS = ['Leadership', 'Teamwork', 'Communication', 'Problem Solving', 'Event Management', 'Graphic Design', 'Public Speaking'];
const SIZES = ['M', 'L', 'XL', 'S', 'L', 'M'];

export const members = people.map(([firstName, lastName, gender, batch, shift, bloodGroup, login, id], i) => {
  const year = batch.replace(/\D/g, '');
  const n = String(i + 1).padStart(2, '0');
  return {
    firstName,
    lastName,
    gender,
    batch,
    shift,
    bloodGroup,
    studentId: id || `${year}1000${String(500 + i)}`,
    department: 'Computer Science & Engineering',
    personalEmail: login || `${firstName}.${lastName}`.toLowerCase() + '@example.com',
    phone: `0170000${String(1100 + i)}`, // 01700-001100 … — test range
    tshirtSize: SIZES[i % SIZES.length],
    paymentMethod: i % 3 === 0 ? 'cash' : 'bkash',
    ...(i % 3 !== 0 && { paymentFrom: `0170000${String(1100 + i)}`, transactionId: `SAMPLE${n}TRX` }),
    amount: 200,
    softSkills: [SKILLS[i % SKILLS.length], SKILLS[(i + 3) % SKILLS.length]],
    experience: '',
    status: 'approved',
    adminNote: 'SAMPLE member (seed data)',
    ip: 'seed',
    login,
  };
});
