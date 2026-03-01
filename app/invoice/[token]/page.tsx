import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'

interface LegacyInvoicePageProps {
    params: Promise<{
        token: string
    }>
}

export default async function LegacyInvoicePage({ params }: LegacyInvoicePageProps) {
    const { token } = await params

    const invoice = await prisma.invoice.findUnique({
        where: { shareToken: token },
        include: { gym: true }
    })

    if (!invoice || !invoice.gym?.slug) {
        notFound()
    }

    // Redirect to the new professional branded URL
    redirect(`/${invoice.gym.slug}/invoice/${token}`)
}
