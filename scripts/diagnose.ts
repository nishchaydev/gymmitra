import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function diagnose() {
    console.log('--- Diagnostic Report ---');
    const masterCode = await prisma.registrationCode.findUnique({
        where: { code: 'MITRA-GROWTH-VIP' }
    });

    if (masterCode) {
        console.log('Master Token Found:');
        console.log(`  Code: ${masterCode.code}`);
        console.log(`  usedCount: ${masterCode.usedCount}`);
        console.log(`  maxUses: ${masterCode.maxUses}`);
        console.log(`  isActive: ${masterCode.isActive}`);
        console.log(`  expiresAt: ${masterCode.expiresAt}`);
    } else {
        console.log('Master Token "MITRA-GROWTH-VIP" NOT FOUND.');
    }

    const allCodes = await prisma.registrationCode.count();
    console.log(`\nTotal Registration Codes in DB: ${allCodes}`);

    const gyms = await prisma.gymProfile.count();
    console.log(`Total Gym Profiles in DB: ${gyms}`);
}

diagnose()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
