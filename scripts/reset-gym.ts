import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🗑️  Starting Gym Reset...')

    // Delete transactional data in order (child tables first)

    await prisma.auditLog.deleteMany({});
    console.log('✅ Cleared Audit Logs');

    await prisma.notification.deleteMany({});
    console.log('✅ Cleared Notifications');

    await prisma.nudgeLog.deleteMany({});
    console.log('✅ Cleared Nudge Logs');

    await prisma.expense.deleteMany({});
    console.log('✅ Cleared Expenses');

    await prisma.invoiceItem.deleteMany({});
    await prisma.invoice.deleteMany({});
    console.log('✅ Cleared Invoices');

    await prisma.sale.deleteMany({});
    console.log('✅ Cleared Sales');

    await prisma.attendance.deleteMany({});
    console.log('✅ Cleared Attendance Logs');

    await prisma.pTSession.deleteMany({});
    console.log('✅ Cleared PT Sessions');

    await prisma.memberSubscription.deleteMany({});
    console.log('✅ Cleared Subscriptions');

    await prisma.member.deleteMany({});
    console.log('✅ Cleared Members');

    await prisma.lead.deleteMany({});
    console.log('✅ Cleared Leads');

    await prisma.staffMember.deleteMany({});
    console.log('✅ Cleared Staff Members');

    await prisma.product.deleteMany({});
    console.log('✅ Cleared Products');

    await prisma.invoiceSequence.deleteMany({});
    console.log('✅ Cleared Invoice Sequences');

    await prisma.membershipPlan.deleteMany({});
    console.log('✅ Cleared Membership Plans');

    await prisma.gymProfile.deleteMany({});
    console.log('✅ Cleared ALL Gym Profiles & Users');

    await prisma.registrationCode.deleteMany({});
    console.log('✅ Cleared Registration Codes');

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
