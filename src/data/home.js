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
  image: '/about/club-campus.jpg', // public/about — club members in front of the University of South Asia campus
  stats: [
    { icon: FaUsers, value: 500, suffix: '+', label: 'Students' },
    { icon: FaCalendarAlt, value: 30, suffix: '+', label: 'Events' },
    { icon: FaProjectDiagram, value: 100, suffix: '+', label: 'Projects' },
    { icon: FaTools, value: 20, suffix: '+', label: 'Workshops' },
    { icon: FaTrophy, value: 2024, suffix: '', label: 'Since' },
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
  { title: 'Smart Home Automation', image: '/projects/smart-home-automation.jpg' },
  { title: 'AI-Powered Chatbot', image: '/projects/ai-chatbot.jpg' },
  { title: 'E-Commerce Web App', image: '/projects/ecommerce-web-app.jpg' },
  { title: 'Robot Arm Controller', image: '/projects/robot-arm-controller.jpg' },
  { title: 'Traffic Sign Detection', image: '/projects/traffic-sign-detection.jpg' },
];

export const alumniText =
  'Our strong alumni network supports students through mentorship, career guidance and real-world exposure.';

export const exploreCse = [
  { icon: FaBook, label: 'Programs' },
  { icon: FaFlask, label: 'Research' },
  { icon: FaChalkboardTeacher, label: 'Faculty' },
  { icon: FaMicrochip, label: 'Labs' },
  { icon: FaUniversity, label: 'Curriculum' },
  { icon: FaUserGraduate, label: 'Alumni' },
];
