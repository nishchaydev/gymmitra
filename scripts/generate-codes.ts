import { PrismaClient, SaaSPlan } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function generateCodes() {
    const planArg = process.argv[2]?.toUpperCase() as SaaSPlan;
    const countArg = parseInt(process.argv[3]) || 1;
    const usesArg = parseInt(process.argv[4]) || 1;

    if (!planArg || !Object.keys(SaaSPlan).includes(planArg)) {
        console.log(`
Usage:
  npx tsx scripts/generate-codes.ts [PLAN] [COUNT] [MAX_USES]
  
Plans:
  BASIC, GROWTH, ENTERPRISE
  
Examples:
  npx tsx scripts/generate-codes.ts GROWTH
  npx tsx scripts/generate-codes.ts BASIC 5 1
  npx tsx scripts/generate-codes.ts ENTERPRISE 1 10
    `);
        process.exit(1);
    }

    console.log(`Generating ${countArg} code(s) for the ${planArg} plan (Max uses: ${usesArg})...`);

    let createdCount = 0;
    while (createdCount < countArg) {
        // Generate a secure random code like "PRO-AB12-CD34"
        const r1 = crypto.randomBytes(2).toString('hex').toUpperCase();
        const r2 = crypto.randomBytes(2).toString('hex').toUpperCase();
        const code = `${planArg.substring(0, 3)}-${r1}-${r2}`;

        try {
            const newCode = await prisma.registrationCode.create({
                data: {
                    code,
                    plan: planArg,
                    maxUses: usesArg,
                }
            });
            console.log(`✅ Created Code: ${newCode.code}`);
            createdCount++;
        } catch (e: any) {
            if (e.code === 'P2002') {
                console.log(`Collision for code ${code}, retrying...`);
                continue;
            }
            console.error('Error creating code:', e);
            break;
        }
    }

    // Auto-generate one master fallback code if missing for testing right now
    const fallbackExists = await prisma.registrationCode.findUnique({ where: { code: 'MITRA-GROWTH-VIP' } });
    if (!fallbackExists) {
        await prisma.registrationCode.create({
            data: {
                code: 'MITRA-GROWTH-VIP',
                plan: SaaSPlan.GROWTH,
                maxUses: 999
            }
        });
        console.log(`\n⭐️ Created Master Admin Code for testing: MITRA-GROWTH-VIP`);
    }
}

generateCodes()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
