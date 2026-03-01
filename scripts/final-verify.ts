import { prisma } from '../lib/prisma';

async function verify() {
    try {
        const gym = await prisma.gymProfile.findFirst();
        if (gym) {
            console.log('Successfully found a gym!');
            console.log('Slug:', (gym as any).slug);
            // Check if TypeScript would complain if we didn't use any
            const slug: string | null = (gym as any).slug;
            console.log('Typed slug:', slug);
        } else {
            console.log('No gyms found to verify.');
        }
    } catch (e: any) {
        console.error('Verification error:', e.message);
    }
}

verify().catch(console.error).finally(() => prisma.$disconnect());
