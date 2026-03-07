import MemberForm from "@/components/members/MemberForm"
import { createMember } from "../actions"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { notFound } from "next/navigation"

export default async function NewMemberPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params

    const gym = await prisma.gymProfile.findUnique({
        where: { slug }
    })

    if (!gym) notFound()

    const rawPlans = gym ? await prisma.membershipPlan.findMany({
        where: { gymId: gym.id, isActive: true },
        select: { id: true, name: true, price: true, duration: true }
    }) : []

    const activePlans = rawPlans.map(plan => ({
        ...plan,
        price: Number(plan.price)
    }))

    return (
        <div className="container mx-auto p-8">
            <div className="flex items-center gap-4 mb-8">
                <Link href={`/${slug}/members`}>
                    <Button variant="ghost" size="icon" aria-label="Back to Members List">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold">Add New Member</h1>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <MemberForm gymSlug={slug} onSubmitAction={createMember} activePlans={activePlans} />
            </div>
        </div>
    )
}
