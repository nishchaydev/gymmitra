import { config } from 'dotenv';
config();
import { PrismaClient, LicenseKeyType, LicenseKeyStatus } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function run() {
    const rawKey = crypto.randomBytes(8).toString('hex').toUpperCase();
    const formattedKey = `TRIAL-${rawKey.slice(0, 4)}-${rawKey.slice(4, 8)}-${rawKey.slice(8, 12)}-${rawKey.slice(12, 16)}`;

    const code = await prisma.licenseKey.create({
        data: {
            key: formattedKey,
            type: LicenseKeyType.TRIAL,
            maxDays: 14,
            status: LicenseKeyStatus.ACTIVE
        }
    });
    console.log("SUCCESS_GENERATED_CODE:" + code.key);
}

run()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
