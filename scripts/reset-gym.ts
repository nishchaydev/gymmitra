import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🗑️  Starting Gym Reset...')

    // Delete transactional data in order (child tables first)

    // 1. Notifications
    await prisma.notification.deleteMany({})
    console.log('✅ Cleared Notifications')

    // 2. Invoice Items & Invoices
    await prisma.invoiceItem.deleteMany({})
    await prisma.invoice.deleteMany({})
    console.log('✅ Cleared Invoices')

    // 3. Sales
    await prisma.sale.deleteMany({})
    console.log('✅ Cleared Sales')

    // 4. Attendance
    await prisma.attendance.deleteMany({})
    console.log('✅ Cleared Attendance Logs')

    // 5. Member Subscriptions
    await prisma.memberSubscription.deleteMany({})
    console.log('✅ Cleared Subscriptions')

    // 6. Members
    await prisma.member.deleteMany({})
    console.log('✅ Cleared Members')

    // 7. Products (Optional - user might want to keep inventory)
    // For a true reset, we clear products too.
    await prisma.product.deleteMany({})
    console.log('✅ Cleared Products')

    // NOTE: We KEEP GymProfile and MembershipPlan
    // GymProfile has the user's settings.
    // MembershipPlans are likely reusable.

    console.log('✨ Gym Reset Complete! Ready for Production.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
