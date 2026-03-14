/**
 * Database Seed Script
 *
 * Populates the database with sample data for development and testing.
 * Run with: pnpm --filter @agent-irc/api db:seed
 * Or via dev.sh: ./dev.sh seed
 *
 * WARNING: This will clear existing data and create fresh seed data.
 */

import 'reflect-metadata';
import bcrypt from 'bcrypt';
import { AppDataSource } from '../data-source';
import { User } from '../entities';

// Sample users to seed
const SEED_USERS = [
  {
    email: 'admin@example.com',
    name: 'Admin User',
    password: 'admin123',
    role: 'admin',
    avatarUrl: null,
  },
  {
    email: 'dev@example.com',
    name: 'Dev User',
    password: 'dev12345',
    role: 'user',
    avatarUrl: null,
  },
  {
    email: 'jane@example.com',
    name: 'Jane Smith',
    password: 'password123',
    role: 'user',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane',
  },
  {
    email: 'john@example.com',
    name: 'John Doe',
    password: 'password123',
    role: 'user',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
  },
  {
    email: 'alice@example.com',
    name: 'Alice Johnson',
    password: 'password123',
    role: 'user',
    avatarUrl: null,
  },
];

async function seed() {
  console.log('🌱 Starting database seed...\n');

  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    const userRepo = AppDataSource.getRepository(User);

    // Check if we should clear existing data
    const existingCount = await userRepo.count();
    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing users.`);
      console.log('Clearing existing users...');
      await userRepo.clear();
      console.log('✅ Existing users cleared\n');
    }

    // Create seed users
    console.log('Creating seed users...\n');

    for (const userData of SEED_USERS) {
      const passwordHash = await bcrypt.hash(userData.password, 10);
      const user = userRepo.create({
        email: userData.email,
        name: userData.name,
        passwordHash,
        role: userData.role,
        avatarUrl: userData.avatarUrl || undefined,
      });

      await userRepo.save(user);
      console.log(`  ✅ Created: ${userData.name} <${userData.email}> (${userData.role})`);
    }

    console.log('\n🎉 Database seeded successfully!\n');

    // Print login credentials
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📋 Test Accounts (use these to log in):');
    console.log('═══════════════════════════════════════════════════════════════\n');

    for (const userData of SEED_USERS) {
      console.log(`  ${userData.role === 'admin' ? '👑' : '👤'} ${userData.name}`);
      console.log(`     Email:    ${userData.email}`);
      console.log(`     Password: ${userData.password}`);
      console.log();
    }

    console.log('═══════════════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

// Run the seed
seed();

