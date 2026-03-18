import { config } from 'dotenv';
config();

import { PrismaClient, SaaSPlan } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL
    }
  }
});

async function generateLicense() {
    const countArg = parseInt(process.argv[2]) || 1;

    console.log(`Generating ${countArg} License Key(s) for the MAIN_PLAN...`);

    let createdCount = 0;
    while (createdCount < countArg) {
        // Generate a secure random license key like "MAIN-ABCD-1234-XYZ9"
        const r1 = crypto.randomBytes(3).toString('hex').toUpperCase();
        const r2 = crypto.randomBytes(3).toString('hex').toUpperCase();
        const r3 = crypto.randomBytes(3).toString('hex').toUpperCase();
        const code = `MAIN-${r1}-${r2}-${r3}`;

        try {
            // We use the RegistrationCode model for these licenses as well, 
            // but mapped specifically to the MAIN_PLAN.
            const newCode = await prisma.registrationCode.create({
                data: {
                    code,
                    plan: 'MAIN_PLAN' as SaaSPlan,
                    maxUses: 1, // License keys are single-use by default
                }
            });
            console.log(`✅ Created License Key: ${newCode.code}`);
            createdCount++;
        } catch (e: any) {
            if (e.code === 'P2002') {
                console.log(`Collision for key ${code}, retrying...`);
                continue;
            }
            console.error('Error creating license key:', e);
            break;
        }
    }
}

generateLicense()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
