import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import EditMemberForm from './EditMemberForm'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function EditMemberPage({ params }: { params: Promise<{ id: string, slug: string }> }) {
    const { id, slug } = await params
    const auth = await import('@/lib/auth').then(mod => mod.getAuthGym())

    if (!auth) redirect('/login')

    const member = await prisma.member.findUnique({ where: { id } })

    if (!member || member.gymId !== auth.gym.id) notFound()

    return (
        <div className="container mx-auto p-8 max-w-2xl">
            <div className="flex items-center gap-4 mb-8">
                <Link href={`/${slug}/members/${id}`}>
                    <Button variant="ghost" size="icon"><ChevronLeft className="h-4 w-4" /></Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">Edit Member</h1>
                    <p className="text-muted-foreground">Update {member.name}&apos;s profile</p>
                </div>
            </div>
            <EditMemberForm member={member as any} gymSlug={slug} />
        </div>
    )
}
