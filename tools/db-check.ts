import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  const r = await prisma.$queryRawUnsafe('select 1 as ok');
  console.log('Query ok:', r);
}
main().then(()=>process.exit(0)).catch(e=>{console.error(e); process.exit(1);});
