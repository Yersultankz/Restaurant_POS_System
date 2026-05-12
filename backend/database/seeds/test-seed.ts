import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { testDatabaseConfig } from '../../src/config/database';
import bcrypt from 'bcrypt';

const adapter = new PrismaBetterSqlite3({
  url: testDatabaseConfig.url
});
const prisma = new PrismaClient({ adapter });

async function resetTestDatabase() {
  console.log('🧹 Resetting test database...');

  // Clean up in correct order (respecting foreign keys)
  // Only delete tables that exist
  try {
    await prisma.payment.deleteMany();
  } catch (e) {
    console.log('Payment table not found or empty, skipping...');
  }
  try {
    await prisma.orderEvent.deleteMany();
  } catch (e) {
    console.log('OrderEvent table not found or empty, skipping...');
  }
  try {
    await prisma.orderItem.deleteMany();
  } catch (e) {
    console.log('OrderItem table not found or empty, skipping...');
  }
  try {
    await prisma.order.deleteMany();
  } catch (e) {
    console.log('Order table not found or empty, skipping...');
  }
  try {
    await prisma.menuItem.deleteMany();
  } catch (e) {
    console.log('MenuItem table not found or empty, skipping...');
  }
  try {
    await prisma.user.deleteMany();
  } catch (e) {
    console.log('User table not found or empty, skipping...');
  }

  console.log('✅ Test database reset completed.');
}

async function seedTestDatabase() {
  console.log('🌱 Seeding test database...');

  // 1. Create Test Users
  const users = [
    { name: 'Boss Admin', role: 'boss', emoji: '👑', password: '1234' },
    { name: 'John Chef', role: 'chef', emoji: '👨‍🍳', password: '1234' },
    { name: 'Alice Waiter', role: 'waiter', emoji: '💁‍♀️', password: '1111' },
    { name: 'Bob Cashier', role: 'cashier', emoji: '💰', password: '2222' },
  ];

  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    // Check if user exists by name
    const existingUser = await prisma.user.findFirst({
      where: { name: u.name }
    });

    if (existingUser) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { passwordHash }
      });
    } else {
      await prisma.user.create({
        data: {
          name: u.name,
          role: u.role,
          emoji: u.emoji,
          passwordHash,
        },
      });
    }
  }

  // 2. Create Test Menu Items
  const menuItems = [
    { name: 'Espresso', price: 800, category: 'Coffee', emoji: '☕' },
    { name: 'Latte', price: 1200, category: 'Coffee', emoji: '🥛' },
    { name: 'Cappuccino', price: 1200, category: 'Coffee', emoji: '☕' },
    { name: 'Margherita Pizza', price: 2500, category: 'Hot', emoji: '🍕' },
    { name: 'Burger', price: 1800, category: 'Hot', emoji: '🍔' },
    { name: 'Coca Cola', price: 500, category: 'Drinks', emoji: '🥤' },
    { name: 'French Fries', price: 600, category: 'Hot', emoji: '🍟' },
    { name: 'Caesar Salad', price: 1500, category: 'Cold', emoji: '🥗' },
  ];

  for (const item of menuItems) {
    await prisma.menuItem.create({
      data: item,
    });
  }

  console.log('✅ Test database seeding completed.');
}

async function main() {
  try {
    await resetTestDatabase();
    await seedTestDatabase();
    console.log('🎉 Test database setup completed successfully!');
  } catch (error) {
    console.error('❌ Test database setup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Export functions for use in tests
export { resetTestDatabase, seedTestDatabase };

if (require.main === module) {
  main();
}