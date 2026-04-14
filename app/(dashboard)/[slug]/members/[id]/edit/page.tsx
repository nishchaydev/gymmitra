import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getIsDemo } from '@/lib/demo'
import { getShowcaseMember } from '@/lib/showcase-data'
import EditMemberForm from './EditMemberForm'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function EditMemberPage({ params }: { params: Promise<{ id: string, slug: string }> }) {
    const { id, slug } = await params
    const isDemo = await getIsDemo(slug)
    const auth = await import('@/lib/auth').then(mod => mod.getAuthGym())

    if (!auth && !isDemo) redirect('/login')

    const member = isDemo 
        ? getShowcaseMember(id)
        : await prisma.member.findUnique({ where: { id } })

    if (!member) notFound()
    if (!isDemo && auth && (member as any).gymId !== auth.gym.id) notFound()

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
            <EditMemberForm member={member as any} gymSlug={slug} dobMandatory={auth?.gym.dobMandatory || false} />
        </div>
    )
}
