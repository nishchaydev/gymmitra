import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

function toSlug(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

async function populate() {
    console.log('--- Populating Slugs ---');
    const gyms = await prisma.gymProfile.findMany({
        where: { slug: null }
    });

    console.log(`Found ${gyms.length} gyms without slugs.`);

    for (const gym of gyms) {
        const baseSlug = toSlug(gym.businessName || gym.name || 'gym');
        let uniqueSlug = baseSlug;
        let counter = 1;

        // Ensure uniqueness
        while (true) {
            const existing = await prisma.gymProfile.findUnique({
                where: { slug: uniqueSlug }
            });
            if (!existing) break;
            uniqueSlug = `${baseSlug}-${counter++}`;
        }

        await prisma.gymProfile.update({
            where: { id: gym.id },
            data: { slug: uniqueSlug }
        });
        console.log(`✅ ${gym.name} -> ${uniqueSlug}`);
    }
}

populate()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
