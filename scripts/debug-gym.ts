import { PrismaClient } from '@prisma/client'

const raw = new PrismaClient()

async function main() {
    try {
        const gym = await raw.gymProfile.create({
            data: {
                name: '__TEST__',
                slug: `test-${Date.now()}`,
                email: 'test@local.test',
                phone: '0000000000',
                userId: `test-${Date.now()}`,
                isVerified: true,
                onboardingStep: 0,
            }
        })
        console.log('SUCCESS: gym created:', gym.id)
        await raw.gymProfile.delete({ where: { id: gym.id } })
    } catch (e: any) {
        console.log('FULL ERROR:')
        console.log(JSON.stringify(e, null, 2))
    }
    await raw.$disconnect()
}

main()
