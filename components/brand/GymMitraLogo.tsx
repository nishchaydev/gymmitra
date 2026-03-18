import React from 'react'
import Image from 'next/image'
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
                "flex items-center justify-center rounded-xl overflow-hidden",
                iconClassName || "w-10 h-10"
            )}>
                <Image
                    src="/icon.png"
                    alt="GymMitra"
                    width={40}
                    height={40}
                    className="w-full h-full object-contain"
                    priority
                />
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
