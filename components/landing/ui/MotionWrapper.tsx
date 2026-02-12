"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface MotionWrapperProps {
    children: React.ReactNode
    className?: string
    delay?: number
    direction?: "up" | "down" | "left" | "right"
}

export function MotionWrapper({
    children,
    className,
    delay = 0,
    direction = "up"
}: MotionWrapperProps) {

    const variants = {
        hidden: {
            opacity: 0,
            y: direction === "up" ? 20 : direction === "down" ? -20 : 0,
            x: direction === "left" ? 20 : direction === "right" ? -20 : 0,
        },
        visible: {
            opacity: 1,
            y: 0,
            x: 0,
            transition: {
                duration: 0.5,
                delay: delay,
                ease: [0.25, 0.4, 0.25, 1], // easeOutQuad-ish
            },
        },
    }

    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={variants}
            className={cn(className)}
        >
            {children}
        </motion.div>
    )
}
