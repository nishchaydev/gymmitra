import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { FirstLoginPageClient } from './FirstLoginPageClient'

interface FirstLoginPageProps {
    params: Promise<{ slug: string }>
}

export default async function FirstLoginPage({ params }: FirstLoginPageProps) {
    const { slug } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Find the staff record scoped to this specific gym (prevents cross-gym IDOR)
    const staff = await prisma.staffMember.findFirst({
        where: { userId: user.id, isActive: true, gym: { slug } },
        include: { gym: { select: { name: true, slug: true } } }
    })

    // If not a staff member, or isFirstLogin is already false, redirect to dashboard
    if (!staff || !staff.isFirstLogin) {
        redirect(`/${slug}/dashboard`)
    }

    return (
        <FirstLoginPageClient
            slug={slug}
            staffName={staff.name}
            gymName={staff.gym.name}
        />
    )
}
