import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    // Check if the property exists in the model's fields
    const fields = (prisma as any)._dmmf.modelMap.GymProfile.fields;
    const hasSlug = fields.some((f: any) => f.name === 'slug');
    console.log(`Prisma GymProfile has 'slug' field: ${hasSlug}`);

    // Check if we can find by slug
    try {
        const gym = await prisma.gymProfile.findFirst({
            where: { slug: { not: null } }
        });
        console.log(`Successfully fetched gym by slug: ${gym?.slug}`);
    } catch (e: any) {
        console.error(`Error fetching by slug: ${e.message}`);
    }
}

check().catch(console.error).finally(() => prisma.$disconnect());
