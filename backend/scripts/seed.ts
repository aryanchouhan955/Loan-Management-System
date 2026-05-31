import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import mongoose from 'mongoose';
import User from '../src/models/User.model';

const seeds = [
  { fullName: 'Admin User',        email: 'admin@lms.com',        password: 'Admin@123',       role: 'admin' },
  { fullName: 'Sales Executive',   email: 'sales@lms.com',        password: 'Sales@123',       role: 'sales' },
  { fullName: 'Sanction Officer',  email: 'sanction@lms.com',     password: 'Sanction@123',    role: 'sanction' },
  { fullName: 'Disburse Officer',  email: 'disburse@lms.com',     password: 'Disburse@123',    role: 'disbursement' },
  { fullName: 'Collection Agent',  email: 'collection@lms.com',   password: 'Collection@123',  role: 'collection' },
  {
    fullName: 'Test Borrower',
    email: 'borrower@lms.com',
    password: 'Borrower@123',
    role: 'borrower',
    pan: 'ABCDE1234F',
    dob: new Date('1990-06-15'),
    monthlySalary: 50000,
    employmentMode: 'salaried',
    personalDetailsSubmitted: true,
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/lms');
    console.log('✅ Connected to MongoDB');

    for (const s of seeds) {
      const existing = await User.findOne({ email: s.email });
      if (existing) {
        console.log(`⏭  Skipping ${s.email} (already exists)`);
        continue;
      }

      // Pass plain password as passwordHash — the pre('save') hook will hash it exactly once
      await User.create({ ...s, passwordHash: s.password });
      console.log(`✅ Created ${s.role}: ${s.email} / ${s.password}`);
    }

    console.log('\n🎉 Seed complete! Login credentials:');
    seeds.forEach(s => console.log(`  ${s.role.padEnd(12)} ${s.email.padEnd(25)} ${s.password}`));

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();