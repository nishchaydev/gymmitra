import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    console.log('--- Registration Codes ---');
    const codes = await prisma.registrationCode.findMany();
    console.log(JSON.stringify(codes, null, 2));

    console.log('\n--- Gym Profiles ---');
    const profiles = await prisma.gymProfile.findMany({
        select: {
            id: true,
            email: true,
            userId: true,
            isVerified: true,
            registrationCodeId: true
        }
    });

    // Obfuscate emails to protect PII
    const safeProfiles = profiles.map(p => ({
        ...p,
        email: p.email ? p.email.replace(/^(.)(.*)(@.*)$/, (_, first, middle, rest) =>
            first + '*'.repeat(middle.length) + rest
        ) : 'N/A'
    }));

    console.log(JSON.stringify(safeProfiles, null, 2));
}

check()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
