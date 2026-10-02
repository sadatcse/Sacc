// Home page content. Everything here is SAMPLE content from the design mockup —
// replace names, numbers, dates and photos with the club's real data.
import {
  FaCode, FaBrain, FaLaptopCode, FaShieldAlt, FaRobot, FaLightbulb, FaDatabase, FaNetworkWired,
  FaCloud, FaEye, FaMicrochip, FaTrophy, FaChalkboardTeacher, FaUsers, FaFlask, FaBook,
  FaUserGraduate, FaProjectDiagram, FaCalendarAlt, FaTools, FaUniversity, FaWifi,
} from 'react-icons/fa';

// Unsplash photo by id, sized for the card it's shown in
export const unsplash = (id, w = 800) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`;

export const hero = {
  title: ['South Asia', 'Computer', 'Club'],
  subtitle: 'University of South Asia',
  tagline: 'Empowering Innovation Through Technology',
  description: 'A student-driven platform for programming, technology, research, innovation, and collaborative learning.',
  orbit: [FaCode, FaBrain, FaShieldAlt, FaRobot, FaCloud, FaDatabase, FaMicrochip, FaNetworkWired],
};

export const about = {
  text: 'South Asia Computer Club (SACC) is the official student club of the Department of Computer Science and Engineering at University of South Asia. We aim to create a vibrant community of learners, innovators, and leaders who are passionate about technology and its impact on society.',
  image: unsplash('1522202176988-66273c2fd55f', 900),
  stats: [
    { icon: FaUsers, value: 500, suffix: '+', label: 'Students' },
    { icon: FaCalendarAlt, value: 30, suffix: '+', label: 'Events' },
    { icon: FaProjectDiagram, value: 100, suffix: '+', label: 'Projects' },
    { icon: FaTools, value: 20, suffix: '+', label: 'Workshops' },
    { icon: FaTrophy, value: 2023, suffix: '', label: 'Since' },
  ],
};

export const whatWeDo = [
  { icon: FaCode, title: 'Programming', text: 'Programming fundamentals, competitive programming and problem solving.' },
  { icon: FaBrain, title: 'Artificial Intelligence', text: 'AI, machine learning and intelligent systems.' },
  { icon: FaLaptopCode, title: 'Web & Software', text: 'Web development, software engineering and application development.' },
  { icon: FaShieldAlt, title: 'Cyber Security', text: 'Cybersecurity awareness, ethical practices and secure computing.' },
  { icon: FaRobot, title: 'Hardware & Robotics', text: 'Embedded systems, robotics, IoT and computer hardware.' },
  { icon: FaLightbulb, title: 'Research & Innovation', text: 'Student research, final-year projects and technology innovation.' },
];

export const technologies = [
  { icon: FaBrain, label: 'AI & ML' },
  { icon: FaLaptopCode, label: 'Web Development' },
  { icon: FaShieldAlt, label: 'Cyber Security' },
  { icon: FaDatabase, label: 'Data Science' },
  { icon: FaRobot, label: 'Robotics' },
  { icon: FaWifi, label: 'IoT' },
  { icon: FaCode, label: 'Software' },
  { icon: FaCloud, label: 'Cloud Computing' },
  { icon: FaNetworkWired, label: 'Networking' },
  { icon: FaEye, label: 'Computer Vision' },
];

export const projects = [
  { title: 'Smart Home Automation', image: unsplash('1558002038-1055907df827', 600) },
  { title: 'AI-Powered Chatbot', image: unsplash('1620712943543-bcc4688e7485', 600) },
  { title: 'E-Commerce Web App', image: unsplash('1498050108023-c5249f4df085', 600) },
  { title: 'Robot Arm Controller', image: unsplash('1581092160562-40aa08e78837', 600) },
  { title: 'Traffic Sign Detection', image: unsplash('1449824913935-59a10b8d2000', 600) },
];

export const events = [
  { day: '25', month: 'MAY', title: 'Programming Contest', text: 'Test your algorithms in our intra-university programming contest.', image: unsplash('1555066931-4365d14bab8c', 600) },
  { day: '10', month: 'JUN', title: 'Robotics Competition', text: 'Showcase your robotics skills and innovation.', image: unsplash('1535378620166-273708d44e4c', 600) },
  { day: '16', month: 'JUN', title: 'Seminar on AI', text: 'Expert talk on the future of Artificial Intelligence.', image: unsplash('1540575467063-178a50c2df87', 600) },
  { day: '05', month: 'JUL', title: 'Idea & Innovation Fair', text: 'Present your ideas and innovations to experts.', image: unsplash('1591453089816-0fbb971b454c', 600) },
];

export const achievements = {
  items: [
    { icon: FaTrophy, label: 'Programming Contests' },
    { icon: FaRobot, label: 'Robotics Competitions' },
    { icon: FaProjectDiagram, label: 'Project Showcases' },
    { icon: FaChalkboardTeacher, label: 'Seminars & Workshops' },
    { icon: FaLightbulb, label: 'IEEE Activities' },
  ],
  photos: [
    unsplash('1528605248644-14dd04022da1', 500),
    unsplash('1531545514256-b1400bc00f31', 500),
    unsplash('1559223607-a43c990c692c', 500),
    unsplash('1543269865-cbf427effbad', 500),
    unsplash('1511578314322-379afb476865', 500),
  ],
};

export const workshops = [
  { day: '23', month: 'MAY', title: 'Workshop on Web Development', image: unsplash('1515378791036-0648a3ef77b2', 600) },
  { day: '29', month: 'MAY', title: 'Workshop on Python & ML', image: unsplash('1677442136019-21780ecad995', 600) },
  { day: '05', month: 'JUN', title: 'Seminar on Cyber Security', image: unsplash('1550751827-4bd374c3f58b', 600) },
  { day: '12', month: 'JUN', title: 'Workshop on Robotics', image: unsplash('1558346490-a72e53ae2d4f', 600) },
];

export const advisor = {
  name: 'Dr. Md. Ismail Jabiullah',
  lines: ['Advisor, SACC', 'Associate Professor & Head', 'Department of CSE', 'University of South Asia'],
};

export const alumniText =
  'Our strong alumni network supports students through mentorship, career guidance and real-world exposure.';

export const gallery = [
  unsplash('1523240795612-9a054b0db644', 500),
  unsplash('1529070538774-1843cb3265df', 500),
  unsplash('1517048676732-d65bc937f952', 500),
  unsplash('1524178232363-1fb2b075b655', 500),
  unsplash('1505373877841-8d25f7d46678', 500),
  unsplash('1531482615713-2afd69097998', 500),
];

export const exploreCse = [
  { icon: FaBook, label: 'Programs' },
  { icon: FaFlask, label: 'Research' },
  { icon: FaChalkboardTeacher, label: 'Faculty' },
  { icon: FaMicrochip, label: 'Labs' },
  { icon: FaUniversity, label: 'Curriculum' },
  { icon: FaUserGraduate, label: 'Alumni' },
];
