import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'fs';
const prisma = new PrismaClient();

async function run() {
    const master = await prisma.registrationCode.findUnique({ where: { code: 'MITRA-GROWTH-VIP' } });
    const results = {
        master,
        timestamp: new Date().toISOString()
    };
    writeFileSync('master_token_status.json', JSON.stringify(results, null, 2));
}

run().catch(e => writeFileSync('master_token_error.txt', e.toString())).finally(() => prisma.$disconnect());
