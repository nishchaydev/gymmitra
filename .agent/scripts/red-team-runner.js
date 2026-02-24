const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function runRedTeamAudit() {
    console.log('🛡️ Starting GymMitra Red Team DB Audit...\n');

    let totalTests = 0;
    let passedTests = 0;

    const assert = (condition, failMessage) => {
        totalTests++;
        if (!condition) {
            console.error(`❌ FAIL: ${failMessage}`);
            return false;
        }
        passedTests++;
        return true;
    };

    try {
        // ---------------------------------------------------------
        // SCENARIO 1: Multi-Tenant Isolation (Foreign Key Enforcement)
        // ---------------------------------------------------------
        console.log('Testing MT-03: Foreign Key Enforcement (Orphaned Rows)');
        let fkFailed = false;
        try {
            await prisma.member.create({
                data: {
                    name: "Ghost Member",
                    phone: "9999999999",
                    status: "ACTIVE",
                    // Intentional: Supplying a fake gymId
                    gymId: "fake-gym-id-999"
                }
            });
            fkFailed = true; // Should not reach here
        } catch (e) {
            if (e.code === 'P2003') { // Prisma Foreign Key constraint failed
                fkFailed = false;
            } else {
                console.error("Unexpected error:", e);
                fkFailed = true;
            }
        }

        if (assert(!fkFailed, "Database allowed insertion of a Member with an invalid gymId. Critical Foreign Key vulnerability.")) {
            console.log('✅ PASS: DB strictly rejected orphaned Member record.');
        }

        // ---------------------------------------------------------
        // SCENARIO 2: Concurrency & Race Conditions (Double Booking)
        // ---------------------------------------------------------
        console.log('\nTesting CC-02: Concurrency Double-Booking Race Condition');

        // We need a dummy gym, staff, and member to test this.
        // Let's see if we have them, otherwise skip.
        // Wait, the Staff record expects a userId which is unique, but it's optional for staff if it's just a trainer profile?
        // Checking schema... Staff needs gymId.

        const gym = await prisma.gymProfile.findFirst();
        if (!gym) {
            console.log('⚠️ SKIPPING CC-02: No GymProfile found in DB to test with.');
        } else {
            console.log(`Using Gym: ${gym.name} for concurrency test.`);

            // Create dummy staff
            const staff = await prisma.staffMember.create({
                data: {
                    userId: "bot-user-" + Date.now(),
                    gymId: gym.id,
                    name: "Bot Trainer",
                    role: "TRAINER",
                    email: "bot" + Date.now() + "@test.com",
                    phone: "8888888888"
                }
            });

            const member = await prisma.member.create({
                data: {
                    gymId: gym.id,
                    name: "Bot Member",
                    phone: "777" + Math.floor(1000000 + Math.random() * 9000000),
                    emergencyName: "NA",
                    emergencyPhone: "NA",
                    emergencyRelation: "NA",
                    dateOfBirth: new Date("1990-01-01"),
                    status: "ACTIVE"
                }
            });

            // Simulate race condition: 2 simultaneous Promises trying to book the same slot
            // Use a dynamic future date to avoid stale test data
            const targetTime = new Date();
            targetTime.setFullYear(targetTime.getFullYear() + 1);
            targetTime.setMonth(0, 1); // Jan 1st
            targetTime.setHours(10, 0, 0, 0);

            const endTime = new Date(targetTime);
            endTime.setHours(11, 0, 0, 0);

            let successCount = 0;
            let errorCount = 0;

            const makeBooking = () => prisma.pTSession.create({
                data: {
                    gymId: gym.id,
                    trainerId: staff.id,
                    memberId: member.id,
                    startTime: targetTime,
                    endTime: endTime,
                    status: "SCHEDULED"
                }
            }).then(() => { successCount++; })
                .catch((e) => {
                    errorCount++;
                    // Log error only if it's NOT a unique constraint violation (which we expect)
                    if (e.code !== 'P2002') {
                        console.error('Unexpected booking error:', e.message);
                    }
                });

            // Fire multiple parallel booking requests
            await Promise.all([
                makeBooking(),
                makeBooking(),
                makeBooking(),
                makeBooking(),
                makeBooking()
            ]);

            if (assert(successCount === 1, `Race condition failed! ${successCount} duplicate slots were booked.`)) {
                console.log('✅ PASS: Database P2002 prevented double-booking.');
            }

            // Cleanup in a defensive block
            try {
                await prisma.pTSession.deleteMany({
                    where: { trainerId: staff.id }
                });
                await prisma.member.delete({ where: { id: member.id } });
                await prisma.staffMember.delete({ where: { id: staff.id } });
            } catch (cleanupError) {
                console.warn('⚠️ Cleanup warning:', cleanupError.message);
            }
        }


    } catch (error) {
        console.error("Audit Runtime Error:", error);
    } finally {
        await prisma.$disconnect();
        console.log(`\n📊 Audit Complete: ${passedTests}/${totalTests} Automated DB Constraints Passed.`);
    }
}

runRedTeamAudit();
