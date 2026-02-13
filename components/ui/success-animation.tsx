"use client"

import { motion } from "framer-motion"
import { Check } from "lucide-react"

export function SuccessCheckmark({ className }: { className?: string }) {
    return (
        <div className={className}>
            <motion.div
                initial={{ scale: 0, boxShadow: "0px 0px 0px rgba(79, 195, 247, 0)" }}
                animate={{
                    scale: 1,
                    boxShadow: "0px 10px 30px rgba(79, 195, 247, 0.4)"
                }}
                transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    delay: 0.1
                }}
                className="w-20 h-20 bg-[#4FC3F7] rounded-full flex items-center justify-center mx-auto mb-6 relative"
            >
                <motion.div
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{
                        duration: 0.5,
                        ease: "easeInOut",
                        delay: 0.4
                    }}
                >
                    <Check className="w-10 h-10 text-white stroke-[4px]" />
                </motion.div>

                {/* Sprinkles/Particles */}
                {[0, 45, 90, 135, 180, 225, 270, 315].map((degree, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1, x: Math.cos(degree * Math.PI / 180) * 40, y: Math.sin(degree * Math.PI / 180) * 40 }}
                        transition={{ delay: 0.6, duration: 0.3 }}
                        className="absolute w-1.5 h-1.5 bg-[#4FC3F7] rounded-full"
                    />
                ))}
            </motion.div>
        </div>
    )
}
