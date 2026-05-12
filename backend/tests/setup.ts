import { resetTestDatabase } from '../database/seeds/test-seed';
import { execSync } from 'child_process';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.TEST_DATABASE_URL = 'file:./database/test.db';

// Global test setup
beforeAll(async () => {
  console.log('🔧 Setting up test database...');

  // Push schema to test database
  try {
    execSync('npx prisma db push --schema src/models/prisma/schema.prisma --accept-data-loss', {
      env: { ...process.env, DATABASE_URL: 'file:./database/test.db' },
      stdio: 'inherit'
    });
    console.log('✅ Test database schema pushed.');
  } catch (error) {
    console.error('❌ Failed to push test schema:', error);
    throw error;
  }

  await resetTestDatabase();
});

afterAll(async () => {
  console.log('🧹 Cleaning up test database...');
  // Additional cleanup if needed
});