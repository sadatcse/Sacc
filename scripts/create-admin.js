// Creates or updates an admin account.
//   npm run create-admin -- admin@example.com "StrongPassword123" "Your Name"
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const [email, password, name = ''] = process.argv.slice(2);

if (!email || !password) {
  console.error('Usage: npm run create-admin -- <email> <password> [name]');
  process.exit(1);
}
if (password.length < 8) {
  console.error('Password must be at least 8 characters.');
  process.exit(1);
}
if (!process.env.MONGO_URI) {
  console.error('MONGO_URI is missing in .env');
  process.exit(1);
}

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, default: 'admin' },
  },
  { timestamps: true }
);
const User = mongoose.models.User || mongoose.model('User', UserSchema);

await mongoose.connect(process.env.MONGO_URI);
const hash = await bcrypt.hash(password, 12);
await User.findOneAndUpdate(
  { email: email.toLowerCase().trim() },
  { $set: { password: hash, role: 'admin', ...(name && { name }) } },
  { upsert: true, returnDocument: 'after' }
);
console.log(`Admin ready: ${email}`);
await mongoose.disconnect();
