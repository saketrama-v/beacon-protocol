import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Organization
  const org = await prisma.organization.upsert({
    where: { id: 'org_1' },
    update: {},
    create: {
      id: 'org_1',
      name: 'Matrix Corp',
    },
  });

  // 2. Create Admin User
  const passwordHash = await bcrypt.hash('password123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'neo@matrix.com' },
    update: {},
    create: {
      email: 'neo@matrix.com',
      passwordHash,
      role: 'ADMIN',
      orgId: org.id,
    },
  });

  // 3. Create Agent
  const agent = await prisma.agent.create({
    data: {
      name: 'DataScraper-GPT',
      framework: 'langchain',
      orgId: org.id,
      apiKey: 'beac_test_key_123',
    },
  });

  console.log('✅ Seed successful!');
  console.log('--------------------------------------------------');
  console.log('🔑 Login Email: neo@matrix.com');
  console.log('🔑 Login Password: password123');
  console.log('🤖 Agent API Key: beac_test_key_123');
  console.log('--------------------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
