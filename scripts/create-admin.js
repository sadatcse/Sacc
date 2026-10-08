// Creates an admin (faculty) account, or promotes / resets an existing one.
//   npm run create-admin -- admin@example.com "StrongPassword123" "Your Name"
import mongoose from 'mongoose';
import User, { MIN_PASSWORD_LENGTH } from '../src/models/User.js';
import AdminProfile from '../src/models/AdminProfile.js';

const [email, password, name = ''] = process.argv.slice(2);

if (!email || !password) {
  console.error('Usage: npm run create-admin -- <email> <password> [name]');
  process.exit(1);
}
if (password.length < MIN_PASSWORD_LENGTH) {
  console.error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  process.exit(1);
}
if (!process.env.MONGO_URI) {
  console.error('MONGO_URI is missing in .env');
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);
let user = await User.findOne({ email: email.toLowerCase().trim() });
if (user) {
  Object.assign(user, { password, role: 'admin', status: 'active', ...(name && { name }) });
} else {
  user = new User({ email, password, role: 'admin', name: name || email.split('@')[0] });
}
await user.save(); // the model hashes the password
await AdminProfile.updateOne({ user: user._id }, { $setOnInsert: { user: user._id } }, { upsert: true });
console.log(`Admin ready: ${user.email}`);
await mongoose.disconnect();
