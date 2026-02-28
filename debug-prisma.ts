import { prisma } from './lib/prisma';

async function main() {
    console.log('Prisma Models:', Object.keys(prisma).filter(k => !k.startsWith('$') && !k.startsWith('_')));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
