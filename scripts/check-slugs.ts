import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const gyms = await prisma.gymProfile.findMany({
        where: { slug: null },
        select: { id: true, name: true, userId: true }
    })
    console.log('Gyms with null slugs:', JSON.stringify(gyms, null, 2))

    const allSlugs = await prisma.gymProfile.findMany({
        select: { id: true, slug: true }
    })
    console.log('All IDs and Slugs:', JSON.stringify(allSlugs, null, 2))
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
