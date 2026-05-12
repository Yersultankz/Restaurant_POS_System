import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Create Initial Users
  const users = [
    { name: 'Boss Admin', role: 'boss', emoji: '👑', password: '1234' },
    { name: 'John Chef', role: 'chef', emoji: '👨‍🍳', password: '1234' },
    { name: 'Alice Waiter', role: 'waiter', emoji: '💁‍♀️', password: '1111' },
    { name: 'Bob Cashier', role: 'cashier', emoji: '💰', password: '2222' },
  ];

  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { id: u.name }, // This is a bit hacky, but for seeding it works if we use name as ID or check existence
      update: { passwordHash },
      create: {
        name: u.name,
        role: u.role,
        emoji: u.emoji,
        passwordHash,
      },
    });
  }

  // 2. Create Initial Menu Items
  const menuItems = [
    { name: 'Espresso', price: 800, category: 'Coffee', emoji: '☕' },
    { name: 'Latte', price: 1200, category: 'Coffee', emoji: '🥛' },
    { name: 'Cappuccino', price: 1200, category: 'Coffee', emoji: '☕' },
    { name: 'Margherita Pizza', price: 2500, category: 'Food', emoji: '🍕' },
    { name: 'Burger', price: 1800, category: 'Food', emoji: '🍔' },
    { name: 'Coca Cola', price: 500, category: 'Drinks', emoji: '🥤' },
  ];

  for (const item of menuItems) {
    await prisma.menuItem.create({
      data: item,
    });
  }

  console.log('✅ Seeding completed.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
