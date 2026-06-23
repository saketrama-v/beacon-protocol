import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const signals = await prisma.signal.findMany();
  console.log(JSON.stringify(signals, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
