import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

// 🛠️ 加载环境变量
dotenv.config();

// ✅ 使用适配器
const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:./database/dev.db'
});
const prisma = new PrismaClient({ adapter });

async function resetAdmin() {
  const pin = '1234';
  const hash = await bcrypt.hash(pin, 10);

  console.log('--- Database Reset Tool (Admin/Boss) ---');

  try {
    const result = await (prisma.user as any).updateMany({
      where: { role: { in: ['admin', 'boss'] } },
      data: { passwordHash: hash }
    });

    if (result.count === 0) {
      console.log('No admin or boss found. Creating one...');
      await (prisma.user as any).create({
        data: {
          name: 'Administrator',
          role: 'admin',
          passwordHash: hash,
          emoji: '👑'
        }
      });
      console.log('✅ Created new admin user with PIN: 1234');
    } else {
      console.log(`✅ Success! Updated ${result.count} admin/boss user(s). PIN reset to: ${pin}`);
    }
  } catch (error) {
    console.error('❌ Error during reset:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdmin();
