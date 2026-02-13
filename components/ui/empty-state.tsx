import { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
    icon: LucideIcon
    title: string
    description: string
    actionLabel?: string
    actionHref?: string
    className?: string
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    actionHref,
    className
}: EmptyStateProps) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center text-center p-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200",
            className
        )}>
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Icon className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
            <p className="text-slate-500 max-w-sm mb-8">{description}</p>
            {actionLabel && actionHref && (
                <Link href={actionHref}>
                    <Button className="shadow-lg shadow-primary/20 px-8">
                        {actionLabel}
                    </Button>
                </Link>
            )}
        </div>
    )
}
