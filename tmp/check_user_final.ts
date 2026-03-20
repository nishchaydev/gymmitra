
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  const currentUserId = '0415b00a-73a8-4adf-a3a1-dae4f106055d';
  let output = `Current User ID: ${currentUserId}\n\n`;

  const gyms = await prisma.gymProfile.findMany({
    select: { userId: true, name: true, slug: true }
  });
  output += `GymProfiles: ${gyms.length}\n`;
  gyms.forEach(g => {
    if (g.userId === currentUserId) output += `[!] OWNER MATCH: ${g.name}\n`;
  });

  const staff = await prisma.staffMember.findMany({
    select: { userId: true, name: true, role: true, gym: { select: { name: true } } }
  });
  output += `\nStaffMembers: ${staff.length}\n`;
  staff.forEach(s => {
    if (s.userId === currentUserId) output += `[!] STAFF MATCH: ${s.name} (${s.role}) at ${s.gym?.name}\n`;
    else output += ` - ID: ${s.userId} | Name: ${s.name} | Role: ${s.role} | Gym: ${s.gym?.name}\n`;
  });

  fs.writeFileSync('tmp/check_user_final.txt', output);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
