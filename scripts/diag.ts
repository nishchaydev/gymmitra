import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- Diagnostic Start ---')
    try {
        console.log('Testing Database Connection...')
        const count = await prisma.member.count()
        console.log(`Connection Successful. Total Members: ${count}`)

        console.log('Checking for Gym Profiles...')
        const profiles = await prisma.gymProfile.findMany()
        console.log(`Found ${profiles.length} profiles.`)
        profiles.forEach(p => {
            console.log(`- Profile: ${p.name}, ID: ${p.id}, UserID: ${p.userId}`)
        })

        if (profiles.length === 0) {
            console.warn('CRITICAL: No Gym Profiles found. Users might be redirected from the dashboard.')
        }

    } catch (error) {
        console.error('DIAGNOSTIC FAILED:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
