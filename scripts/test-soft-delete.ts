import { PrismaClient } from '@prisma/client'

const db = new PrismaClient({
    datasourceUrl: process.env.DIRECT_URL || undefined,
})

async function main() {
    console.log('=== SOFT DELETE SMOKE TEST ===\n')

    const gym = await db.gymProfile.create({
        data: {
            name: '__SD_TEST__', slug: `test-sd-${Date.now()}`,
            email: 'test@local.test', phone: '0000000000',
            userId: `test-${Date.now()}`, isVerified: true, onboardingStep: 0,
        }
    })
    console.log(`✅ 1. Gym: ${gym.id}`)

    const member = await db.member.create({
        data: {
            name: '__SD_MEMBER__', phone: '9999999999', gymId: gym.id,
            dateOfBirth: new Date('2000-01-01'),
            emergencyName: 'Test', emergencyPhone: '0000000000', emergencyRelation: 'Self',
        }
    })
    console.log(`✅ 2. Member: ${member.id}`)

    // Simulate middleware: updateMany with deletedAt (same as middleware does)
    const r = await db.member.updateMany({
        where: { id: member.id, gymId: gym.id },
        data: { deletedAt: new Date() } as any
    })
    console.log(`✅ 3. updateMany (soft-delete): count=${r.count}`)

    // Verify deletedAt is set
    const raw = await db.member.findUnique({ where: { id: member.id } })
    const deletedAt = (raw as any)?.deletedAt
    if (!raw) { console.error('❌ HARD DELETED!'); process.exit(1) }
    if (!deletedAt) { console.error('❌ deletedAt=null'); process.exit(1) }
    console.log(`✅ 4. deletedAt=${deletedAt.toISOString()}`)

    // Verify filtering works
    const filtered = await db.member.findMany({
        where: { gymId: gym.id, deletedAt: null } as any
    })
    if (filtered.some((m: any) => m.id === member.id)) {
        console.error('❌ Still visible!')
        process.exit(1)
    }
    console.log(`✅ 5. Filtered: invisible`)

    await db.member.delete({ where: { id: member.id } })
    await db.gymProfile.delete({ where: { id: gym.id } })
    console.log(`✅ 6. Cleanup done\n`)
    console.log('=== ALL PASSED ✅ ===')
    console.log('  updateMany({ deletedAt }) ✓')
    console.log('  findMany({ deletedAt: null }) filters correctly ✓')
}

main()
    .catch(e => { console.error('ERROR:', e.message); process.exit(1) })
    .finally(() => db.$disconnect())
