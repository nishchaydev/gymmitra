import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthGym } from '@/lib/auth'

/**
 * Sanitizes a CSV cell value to prevent CSV injection.
 * Excel/LibreOffice execute cells starting with =, +, -, @, \t, \r as formulas.
 * Prefixing with a single quote neutralizes them.
 */
function csvEscape(value: string | null | undefined): string {
    const str = String(value ?? '')
    const dangerous = ['=', '+', '-', '@', '\t', '\r']
    if (dangerous.some(ch => str.startsWith(ch))) {
        return `'${str.replace(/"/g, '""')}`
    }
    return str.replace(/"/g, '""')
}

export async function GET(request: NextRequest) {
    try {
        const auth = await getAuthGym()
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type') || 'members'
        const gymId = auth.gym.id

        let csvContent = ""
        const filename = `${type}-${new Date().toISOString().split('T')[0]}.csv`

        switch (type) {
            case 'members': {
                const members = await prisma.member.findMany({
                    where: { gymId, deletedAt: null },
                    include: {
                        subscriptions: {
                            where: { status: 'ACTIVE' },
                            include: { plan: true }
                        }
                    },
                    take: 5000, // Guard against unbounded export on large gyms
                    orderBy: { createdAt: 'desc' }
                })
                const headers = ['Name', 'Phone', 'Email', 'Status', 'Joining Date', 'Active Plan']
                csvContent = [
                    headers.join(','),
                    ...members.map(m => [
                        `"${csvEscape(m.name)}"`,
                        `"${csvEscape(m.phone)}"`,
                        `"${csvEscape(m.email)}"`,
                        m.status,
                        m.joiningDate.toISOString().split('T')[0],
                        `"${csvEscape(m.subscriptions[0]?.plan.name ?? 'None')}"`
                    ].join(','))
                ].join('\n')
                break
            }
            case 'invoices': {
                const invoices = await prisma.invoice.findMany({
                    where: { gymId, deletedAt: null },
                    include: { member: { select: { name: true } } },
                    orderBy: { issueDate: 'desc' },
                    take: 10000
                })
                const headers = ['Invoice Number', 'Member', 'Status', 'Date', 'Amount']
                csvContent = [
                    headers.join(','),
                    ...invoices.map(i => [
                        csvEscape(i.invoiceNumber),
                        `"${csvEscape(i.member?.name ?? 'Walk-in')}"`,
                        i.paymentStatus,
                        i.issueDate.toISOString().split('T')[0],
                        i.total
                    ].join(','))
                ].join('\n')
                break
            }
            case 'attendance': {
                const attendance = await prisma.attendance.findMany({
                    where: { gymId },
                    include: { member: true, staff: true },
                    orderBy: { date: 'desc' },
                    take: 1000
                })
                const headers = ['Date', 'Check-in Time', 'Name', 'Type', 'Phone']
                csvContent = [
                    headers.join(','),
                    ...attendance.map(a => [
                        a.localDateString,
                        a.checkInTime.toISOString(),
                        `"${csvEscape(a.member?.name ?? a.staff?.name ?? 'Unknown')}"`,
                        a.memberId ? 'Member' : 'Staff',
                        `"${csvEscape(a.member?.phone ?? a.staff?.phone ?? '')}"`
                    ].join(','))
                ].join('\n')
                break
            }
            case 'products':
            case 'inventory': {
                const products = await prisma.product.findMany({
                    where: { gymId, isActive: true },
                    take: 5000
                })
                const headers = ['Name', 'Category', 'Price', 'Cost', 'Stock', 'Low Stock Alert']
                csvContent = [
                    headers.join(','),
                    ...products.map(p => [
                        `"${csvEscape(p.name)}"`,
                        p.category,
                        p.price,
                        p.purchasePrice || 0,
                        p.stock,
                        p.lowStockAlert
                    ].join(','))
                ].join('\n')
                break
            }
            case 'plans': {
                const plans = await prisma.membershipPlan.findMany({
                    where: { gymId },
                    orderBy: { name: 'asc' }
                })
                const headers = ['Name', 'Duration (Months)', 'Price', 'Description']
                csvContent = [
                    headers.join(','),
                    ...plans.map(p => [
                        `"${csvEscape(p.name)}"`,
                        p.duration,
                        p.price,
                        `"${csvEscape(p.description ?? '')}"`
                    ].join(','))
                ].join('\n')
                break
            }
            case 'renewals': {
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                const plus30Days = new Date(today); plus30Days.setDate(today.getDate() + 30)
                const minus30Days = new Date(today); minus30Days.setDate(today.getDate() - 30)

                const subscriptions = await prisma.memberSubscription.findMany({
                    where: {
                        gymId,
                        OR: [
                            { status: 'ACTIVE', endDate: { gte: today, lte: plus30Days } },
                            { endDate: { gte: minus30Days, lt: today } }
                        ]
                    },
                    include: {
                        member: { select: { name: true, phone: true } },
                        plan: { select: { name: true } }
                    },
                    orderBy: { endDate: 'asc' },
                    take: 5000
                })

                const headers = ['Member Name', 'Phone', 'Plan Name', 'Expiry Date', 'Days Offset']
                csvContent = [
                    headers.join(','),
                    ...subscriptions.map(sub => {
                        const endDate = new Date(sub.endDate)
                        endDate.setHours(0, 0, 0, 0)
                        const diffTime = endDate.getTime() - today.getTime()
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                        return [
                            `"${csvEscape(sub.member?.name ?? 'Unknown')}"`,
                            csvEscape(sub.member?.phone ?? ''),
                            `"${csvEscape(sub.plan?.name ?? 'Unknown')}"`,
                            sub.endDate.toISOString().split('T')[0],
                            diffDays
                        ].join(',')
                    })
                ].join('\n')
                break
            }
            case 'expenses': {
                const expenses = await prisma.expense.findMany({
                    where: { gymId },
                    orderBy: { date: 'desc' },
                    take: 10000
                })
                const headers = ['Date', 'Category', 'Amount', 'Description']
                const rows = expenses.map(e => [
                    e.date.toISOString().split('T')[0],
                    csvEscape(e.category),
                    e.amount.toString(),
                    csvEscape(e.description || '')
                ].join(','))
                csvContent = [headers.join(','), ...rows].join('\n')
                break
            }
            default:
                return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
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
