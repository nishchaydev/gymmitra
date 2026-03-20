
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  const userId = '0415b00a-73a8-4adf-a3a1-dae4f106055d';
  let output = `Searching for exact userId match: ${userId}\n`;

  const gyms = await prisma.gymProfile.findMany({ select: { userId: true, name: true, slug: true } });
  output += `Total GymRecords: ${gyms.length}\n`;
  gyms.forEach(g => {
    if (g.userId === userId) output += `[!] EXACT MATCH FOUND: ${g.name} (${g.slug})\n`;
    else output += ` - ID: ${g.userId} | Name: ${g.name}\n`;
  });

  const staff = await prisma.staffMember.findMany({ select: { userId: true, name: true, role: true } });
  output += `Total StaffRecords: ${staff.length}\n`;
  staff.forEach(s => {
      if (s.userId === userId) output += `[!] EXACT MATCH FOUND in Staff: ${s.name} (${s.role})\n`;
      else output += ` - ID: ${s.userId} | Name: ${s.name} | Role: ${s.role}\n`;
  });

  fs.writeFileSync('tmp/check_user_log.txt', output);
  console.log('Results written to tmp/check_user_log.txt');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
