import MemberForm from "@/components/members/MemberForm"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export default function NewMemberPage() {
    return (
        <div className="container mx-auto p-8">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/members">
                    <Button variant="ghost" size="icon">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold">Add New Member</h1>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <MemberForm />
            </div>
        </div>
    )
}
