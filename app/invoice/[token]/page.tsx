import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { apiLimiter } from '@/lib/rate-limit'

const MIN_TOKEN_LENGTH = 32

interface LegacyInvoicePageProps {
    params: Promise<{
        token: string
    }>
}

export default async function LegacyInvoicePage({ params }: LegacyInvoicePageProps) {
    const { token } = await params

    // 1. Token length validation — reject short/empty tokens before touching DB
    if (!token || token.length < MIN_TOKEN_LENGTH) {
        notFound()
    }

    // 2. Rate limiting — 10 req/min per IP to prevent token enumeration
    const headersList = await headers()
    const ipHeader = headersList.get('x-forwarded-for')
    const ip = ipHeader ? ipHeader.split(',')[0].trim() : '127.0.0.1'
    try {
        await apiLimiter.check(10, `legacy-invoice:${ip}`)
    } catch {
        notFound()
    }

    const invoice = await prisma.invoice.findFirst({
        where: {
            shareToken: token,
            OR: [
                { shareTokenExpiresAt: null },
                { shareTokenExpiresAt: { gt: new Date() } }
            ]
        },
        select: { gym: { select: { slug: true } } }
    })

    if (!invoice || !invoice.gym?.slug) {
        notFound()
    }

    // Redirect to the new professional branded URL
    redirect(`/${invoice.gym.slug}/invoice/${token}`)
}
