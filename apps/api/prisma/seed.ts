import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding local dev database...');

  // ── Admin user ──────────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { phone_number: '+201003028508' },
    update: {},
    create: {
      phone_number: '+201003028508',
      full_name: 'Admin',
      role_type: 'manager',
      status: 'active',
    },
  });
  console.log(`✓ Admin user: ${admin.phone_number} (${admin.id})`);

  // ── Test resident ───────────────────────────────────────────────────────────
  const resident = await prisma.user.upsert({
    where: { phone_number: '+201558606258' },
    update: {},
    create: {
      phone_number: '+201558606258',
      full_name: 'Test Resident',
      role_type: 'resident',
      status: 'active',
    },
  });
  console.log(`✓ Resident user: ${resident.phone_number} (${resident.id})`);

  // ── Community ───────────────────────────────────────────────────────────────
  const community = await prisma.community.upsert({
    where: { slug: 'tajo' },
    update: {},
    create: {
      name: 'Tajo',
      slug: 'tajo',
      type: 'residential',
      status: 'active',
    },
  });
  console.log(`✓ Community: ${community.name} (${community.id})`);

  // ── Unit ────────────────────────────────────────────────────────────────────
  const unit = await prisma.unit.upsert({
    where: { community_id_unit_code: { community_id: community.id, unit_code: '001' } },
    update: {},
    create: {
      community_id: community.id,
      unit_code: '001',
      unit_type: 'apartment',
    },
  });
  console.log(`✓ Unit: ${unit.unit_code} (${unit.id})`);

  // ── Membership ──────────────────────────────────────────────────────────────
  const existing = await prisma.membership.findFirst({
    where: { user_id: resident.id, community_id: community.id },
  });

  const membership = existing ?? await prisma.membership.create({
    data: {
      user_id: resident.id,
      community_id: community.id,
      unit_id: unit.id,
      relationship_type: 'owner',
      role_type: 'resident',
      approval_status: 'approved',
    },
  });
  console.log(`✓ Membership: ${resident.phone_number} → ${community.name} / Unit ${unit.unit_code} [${membership.approval_status}]`);

  // ── Scanner ─────────────────────────────────────────────────────────────────
  const deviceKey = crypto.randomBytes(32).toString('hex');
  const existingScanner = await prisma.scanner.findUnique({ where: { scanner_code: 'sc-1' } });

  const scanner = existingScanner ?? await prisma.scanner.create({
    data: {
      community_id: community.id,
      scanner_name: 'Main Gate',
      scanner_code: 'sc-1',
      location_label: 'Main Entrance',
      device_key: deviceKey,
      is_active: true,
    },
  });
  console.log(`✓ Scanner: ${scanner.scanner_code} — device_key: ${existingScanner ? '(existing, unchanged)' : scanner.device_key}`);

  console.log('\nSeed complete.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
