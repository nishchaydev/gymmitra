const { PrismaClient } = require('@prisma/client')
const { startOfMonth, subMonths, format, startOfDay, subDays, endOfDay, eachMonthOfInterval, addDays } = require('date-fns')

const testPrisma = new PrismaClient()

// Production Guard
if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PROD_TEST !== 'true') {
    console.error("❌ ERROR: Running tests against production is forbidden. Set ALLOW_PROD_TEST=true to override.");
    process.exit(1);
}

async function runTests() {
    try {
        console.log("Fetching test gym...")
        const gym = await testPrisma.gymProfile.findFirst()
        if (!gym) throw new Error("No gym found")
        console.log(`Testing with Gym ID: ${gym.id}`)

        console.log("\n--- Testing Churn ---")
        const startDate = startOfMonth(subMonths(new Date(), 5))
        const churnResult = await testPrisma.$queryRaw`
            WITH MonthlyChurn AS (
                SELECT 
                    date_trunc('month', "updatedAt") as month_date,
                    COUNT(*) as churned
                FROM "Member"
                WHERE "gymId" = ${gym.id}
                    AND status IN ('INACTIVE', 'EXPIRED')
                    AND "updatedAt" >= ${startDate}
                GROUP BY date_trunc('month', "updatedAt")
            )
            SELECT 
                to_char(month_date, 'YYYY-MM-DD') as month,
                churned,
                (SELECT COUNT(*) FROM "Member" m2 WHERE m2."gymId" = ${gym.id} AND m2."createdAt" <= month_date + interval '1 month') as total_active
            FROM MonthlyChurn
            ORDER BY month_date ASC
        `
        console.log(churnResult)

        console.log("\n--- Testing Retention ---")
        const retentionResult = await testPrisma.$queryRaw`
            SELECT 
                to_char(date_trunc('month', "endDate"), 'YYYY-MM-DD') as month,
                SUM(CASE WHEN "status" = 'ACTIVE' THEN 1 ELSE 0 END) as renewed,
                SUM(CASE WHEN "status" = 'EXPIRED' THEN 1 ELSE 0 END) as expired
            FROM "MemberSubscription"
            WHERE "gymId" = ${gym.id}
                AND "endDate" >= ${startDate}
            GROUP BY 1
            ORDER BY 1 ASC
        `
        console.log(retentionResult)

        console.log("\n--- Testing Member Frequency ---")
        const thirtyDaysAgo = startOfDay(subDays(new Date(), 30))
        const frequencyResult = await testPrisma.$queryRaw`
            SELECT 
                m.id as member_id,
                m.name as member_name,
                m.phone,
                COUNT(a.id) as visit_count,
                MAX(a.date) as last_visit
            FROM "Member" m
            LEFT JOIN "Attendance" a ON m.id = a."memberId" AND a.date >= ${thirtyDaysAgo}
            WHERE m."gymId" = ${gym.id}
                AND m.status = 'ACTIVE'
            GROUP BY m.id
            ORDER BY visit_count ASC, last_visit ASC NULLS FIRST
            LIMIT 5
        `
        console.log(frequencyResult.map(r => ({
            ...r,
            phone: r.phone ? r.phone.replace(/(\d{3})(\d+)(\d{4})/, "$1****$3") : null
        })))

        console.log("\n--- Testing Reminders (Expiring) ---")
        const todayStart = startOfDay(new Date())
        const expiringSubs = await testPrisma.memberSubscription.findMany({
            where: {
                gymId: gym.id,
                status: 'ACTIVE',
                endDate: { gte: todayStart, lte: addDays(todayStart, 7) }
            },
            take: 2
        })
        console.log(`Found ${expiringSubs.length} expiring subs`)

        console.log("\n✅ ALL QUERIES EXECUTED SUCCESSFULLY")
    } catch (e) {
        console.error("❌ TEST FAILED:", e)
    } finally {
        await testPrisma.$disconnect()
    }
}

runTests()
