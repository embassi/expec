/**
 * One-time fix: normalize users.role_type to valid global role values.
 * Any value that isn't 'user' or 'super_admin' is coerced to 'user'.
 * Run via: railway run --service patient-presence node scripts/fix-role-type.mjs
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

try {
  const updated = await prisma.$executeRaw`
    UPDATE users
    SET role_type = 'user'
    WHERE role_type NOT IN ('user', 'super_admin')
  `;
  console.log(`Fixed ${updated} row(s) with invalid role_type.`);
} finally {
  await prisma.$disconnect();
}
