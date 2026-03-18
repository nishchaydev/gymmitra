import { config } from 'dotenv';
config();

import { PrismaClient } from '@prisma/client';
import { subDays } from 'date-fns';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL
    }
  }
});

async function expireGymTrial() {
    const slug = process.argv[2];
    if (!slug) {
        console.error('Usage: npx tsx scripts/expire-gym.ts <slug>');
        process.exit(1);
    }

    console.log(`Setting gym "${slug}" trial to EXPIRED (10 days ago)...`);

    try {
        const gym = await prisma.gymProfile.update({
            where: { slug },
            data: {
                saasPlan: 'TRIAL',
                trialExpiresAt: subDays(new Date(), 10)
            }
        });
        console.log(`✅ Updated ${gym.name}. Trial expired at: ${gym.trialExpiresAt}`);
        process.exit(0);
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
}

expireGymTrial()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
