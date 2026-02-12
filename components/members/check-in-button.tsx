"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { CheckCircle2, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface CheckInButtonProps {
    memberId: string
}

export function CheckInButton({ memberId }: CheckInButtonProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleCheckIn = async () => {
        setLoading(true)
        try {
            const response = await fetch("/api/attendance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ memberId }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to check in")
            }

            toast.success("Member checked in successfully")
            router.refresh()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button onClick={handleCheckIn} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Check In
        </Button>
    )
}
