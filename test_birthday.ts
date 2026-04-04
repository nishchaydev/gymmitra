import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const gymId = 'demo' // Replace with actual gymId if testing
    const gym = await prisma.gymProfile.findFirst()
    
    if (!gym) {
        console.log("No gym")
        return
    }

    try {
        const query = await prisma.$queryRaw`
            WITH ist AS (
                SELECT
                    (NOW() AT TIME ZONE 'Asia/Kolkata')::date AS today_ist,
                    ((NOW() AT TIME ZONE 'Asia/Kolkata')::date + INTERVAL '30 days')::date AS end_ist
            ),
            birthdays AS (
                SELECT
                    m."name",
                    m."phone",
                    m."dateOfBirth",
                    EXTRACT(MONTH FROM m."dateOfBirth")::int AS dob_month,
                    EXTRACT(DAY FROM m."dateOfBirth")::int AS dob_day
                FROM "Member" m
                WHERE m."gymId" = ${gym.id}
                  AND m."status" = 'ACTIVE'
                  AND m."deletedAt" IS NULL
                  AND m."dateOfBirth" IS NOT NULL
            )
            SELECT
                b."name",
                b."phone",
                b."dateOfBirth"
            FROM birthdays b
            CROSS JOIN ist
            WHERE (
                make_date(
                    EXTRACT(YEAR FROM ist.today_ist)::int,
                    b.dob_month,
                    LEAST(
                        b.dob_day,
                        EXTRACT(DAY FROM (date_trunc('month', make_date(EXTRACT(YEAR FROM ist.today_ist)::int, b.dob_month, 1)) + INTERVAL '1 month - 1 day'))::int
                    )
                ) BETWEEN ist.today_ist AND ist.end_ist
                OR
                make_date(
                    EXTRACT(YEAR FROM ist.today_ist)::int + 1,
                    b.dob_month,
                    LEAST(
                        b.dob_day,
                        EXTRACT(DAY FROM (date_trunc('month', make_date(EXTRACT(YEAR FROM ist.today_ist)::int + 1, b.dob_month, 1)) + INTERVAL '1 month - 1 day'))::int
                    )
                ) BETWEEN ist.today_ist AND ist.end_ist
            )
        `
        console.log("SUCCESS:", query)
    } catch (e) {
        console.error("ERROR:", e)
    }
}
main()
