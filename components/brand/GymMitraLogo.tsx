import React from 'react'
import { Zap } from 'lucide-react'
import { cn } from "@/lib/utils"

interface GymMitraLogoProps {
    className?: string;
    iconClassName?: string;
    textClassName?: string;
    showText?: boolean;
    variant?: 'default' | 'white';
}

export function GymMitraLogo({ 
    className, 
    iconClassName, 
    textClassName,
    showText = true,
    variant = 'default'
}: GymMitraLogoProps) {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div className={cn(
                "flex items-center justify-center rounded-xl",
                variant === 'default' ? "bg-primary text-white" : "bg-white text-primary",
                iconClassName || "p-2"
            )}>
                <Zap className={cn("fill-current", showText ? "w-6 h-6" : "w-full h-full")} />
            </div>
            {showText && (
                <span className={cn(
                    "text-2xl font-black tracking-tighter italic uppercase",
                    variant === 'default' ? "text-slate-900" : "text-white",
                    textClassName
                )}>
                    Gym<span className="text-primary ml-0.5">Mitra</span>
                </span>
            )}
        </div>
    )
}
