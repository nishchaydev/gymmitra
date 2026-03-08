import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthGym } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const auth = await getAuthGym()
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type') || 'members'

        let data: any[] = []
        let csvContent = ""
        let filename = `report-${type}-${new Date().toISOString().split('T')[0]}.csv`

        if (type === 'members') {
            data = await prisma.member.findMany({
                where: { gymId: auth.gym.id },
                include: {
                    subscriptions: {
                        where: { status: 'ACTIVE' },
                        include: { plan: true }
                    }
                }
            })

            const headers = ['Name', 'Phone', 'Email', 'Status', 'Joining Date', 'Active Plan']
            csvContent = [
                headers.join(','),
                ...data.map(m => [
                    `"${m.name}"`,
                    `"${m.phone}"`,
                    `"${m.email || ''}"`,
                    m.status,
                    m.joiningDate.toISOString().split('T')[0],
                    `"${m.subscriptions[0]?.plan.name || 'None'}"`
                ].join(','))
            ].join('\n')
        }
        else if (type === 'invoices') {
            data = await prisma.invoice.findMany({
                where: { gymId: auth.gym.id },
                include: { member: true }
            })

            const headers = ['Invoice #', 'Member', 'Total', 'Paid', 'Balance', 'Status', 'Date']
            csvContent = [
                headers.join(','),
                ...data.map(inv => [
                    inv.invoiceNumber,
                    `"${inv.member?.name || 'Deleted Member'}"`,
                    inv.total,
                    inv.amountPaid,
                    inv.balanceDue,
                    inv.paymentStatus,
                    inv.issueDate.toISOString().split('T')[0]
                ].join(','))
            ].join('\n')
        }
        else if (type === 'inventory') {
            data = await prisma.product.findMany({
                where: { gymId: auth.gym.id, isActive: true }
            })

            const headers = ['Name', 'Category', 'Price', 'Cost', 'Stock', 'Low Stock Alert']
            csvContent = [
                headers.join(','),
                ...data.map(p => [
                    `"${p.name}"`,
                    p.category,
                    p.price,
                    p.purchasePrice || 0,
                    p.stock,
                    p.lowStockAlert
                ].join(','))
            ].join('\n')
        }
        else if (type === 'attendance') {
            data = await prisma.attendance.findMany({
                where: { gymId: auth.gym.id },
                include: { member: true, staff: true },
                orderBy: { date: 'desc' },
                take: 1000
            })

            const headers = ['Date', 'Check-in Time', 'Name', 'Type', 'Phone']
            csvContent = [
                headers.join(','),
                ...data.map(a => [
                    a.localDateString,
                    a.checkInTime.toISOString(),
                    `"${a.member?.name || a.staff?.name || 'Unknown'}"`,
                    a.memberId ? 'Member' : 'Staff',
                    `"${a.member?.phone || a.staff?.phone || ''}"`
                ].join(','))
            ].join('\n')
        }

        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        })

    } catch (error) {
        console.error('Export error:', error)
        return NextResponse.json({ error: 'Failed to generate export' }, { status: 500 })
    }
}
