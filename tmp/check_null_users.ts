
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  const currentUserId = '0415b00a-73a8-4adf-a3a1-dae4f106055d';
  let output = `Current User ID: ${currentUserId}\n\n`;

  // Search for gyms where userId is NULL
  const gyms = await prisma.gymProfile.findMany({
    select: { id: true, name: true, slug: true, userId: true }
  });
  const gymsWithNull = gyms.filter(g => g.userId === null);
  output += `GymProfiles with NULL userId: ${gymsWithNull.length}\n`;
  gymsWithNull.forEach(g => {
    output += ` - [GYM] ${g.name} (id: ${g.id})\n`;
  });

  // Search for staff where userId is NULL
  const staff = await prisma.staffMember.findMany({
    select: { id: true, name: true, role: true, userId: true, gym: { select: { name: true } } }
  });
  const staffWithNull = staff.filter(s => s.userId === null);
  output += `\nStaffMembers with NULL userId: ${staffWithNull.length}\n`;
  staffWithNull.forEach(s => {
    output += ` - [STAFF] ${s.name} (${s.role}) at gym: ${s.gym?.name || 'N/A'} (id: ${s.id})\n`;
  });

  fs.writeFileSync('tmp/check_null_users.txt', output);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
