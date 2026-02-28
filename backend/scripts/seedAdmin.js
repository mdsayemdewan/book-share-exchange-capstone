import 'dotenv/config';
import bcrypt from 'bcryptjs';
import connectDB from '../config/db.js';
import User from '../models/User.js';

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  console.error('Missing ADMIN_EMAIL or ADMIN_PASSWORD in .env');
  process.exit(1);
}

await connectDB();

const existing = await User.findOne({ email });
if (existing) {
  console.log('Admin already exists:', existing.email);
  process.exit(0);
}

const passwordHash = await bcrypt.hash(password, 10);

await User.create({
  role: 'admin',
  status: 'approved',
  name: 'Admin',
  email,
  phone: '0000000000',
  passwordHash,
  location: { lat: 0, lng: 0 },
  imageUrls: ['https://placehold.co/200x200?text=Admin'],
});

console.log('Admin created:', email);
process.exit(0);
