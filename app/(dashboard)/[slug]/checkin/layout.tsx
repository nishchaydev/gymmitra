import type { ReactNode } from "react"
import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>
}): Promise<Metadata> {
    const { slug } = await params
    const gym = await prisma.gymProfile.findUnique({
        where: { slug },
        select: { name: true },
    })
    return {
        title: gym ? `Check In — ${gym.name}` : "Member Check-In | GymMitra",
        description: "Scan or enter your phone number to check in to the gym.",
    }
}

export default function CheckInLayout({ children }: { children: ReactNode }) {
    return <>{children}</>
}
