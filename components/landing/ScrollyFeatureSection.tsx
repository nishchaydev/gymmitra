"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform, useSpring } from "framer-motion"
import { Check } from "lucide-react"
import { WhatsAppMockup } from "@/components/landing/features/WhatsAppMockup"
import { AccessControlMockup } from "@/components/landing/features/AccessControlMockup"
import { MemberAppMockup } from "@/components/landing/features/MemberAppMockup"

const FEATURES = [
    {
        title: "Automate Renewals & Wishes",
        desc: "Stop calling members manually. GymMitra sends automated renewal reminders and birthday wishes via WhatsApp.",
        points: ["Reliable renewal alerts", "Personalized birthday greetings", "Automated daily delivery"],
        id: "whatsapp"
    },
    {
        title: "Smart Attendance Tracking",
        desc: "Daily check-in with automated records and attendance analytics. Track peak hours with ease.",
        points: ["Real-time digital logs", "Peak occupancy insights", "Attendance history"],
        id: "attendance"
    },
    {
        title: "Branded Member Experience",
        desc: "Provide your members with a premium portal to track attendance, plans, and invoices.",
        points: ["Self-service portal", "Clean digital interface", "Professional branding"],
        id: "memberapp"
    }
]

export function ScrollyFeatureSection() {
    const containerRef = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    })

    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    })

    // Transform for which feature is active
    const activeIndex = useTransform(smoothProgress, [0, 0.33, 0.66, 1], [0, 0, 1, 2])
    
    // Opacity transforms for each text block - TIGHTER TRANSITIONS
    const opacity1 = useTransform(smoothProgress, [0, 0.4, 0.5], [1, 1, 0])
    const opacity2 = useTransform(smoothProgress, [0.35, 0.5, 0.75, 0.85], [0, 1, 1, 0])
    const opacity3 = useTransform(smoothProgress, [0.75, 0.9, 1], [0, 1, 1])

    // Specific progress for each mockup - CONTINUOUS FLOW
    const progress1 = useTransform(smoothProgress, [0, 0.5], [0, 1])
    const progress2 = useTransform(smoothProgress, [0.35, 0.85], [0, 1])
    const progress3 = useTransform(smoothProgress, [0.75, 1], [0, 1])

    return (
        <div ref={containerRef} className="relative h-[450vh] hidden lg:block">
            <div className="sticky top-0 h-screen w-full flex items-center overflow-hidden">
                <div className="container px-6 mx-auto grid grid-cols-[1fr_1.5fr] gap-32 items-center">
                    
                    {/* Left: Text Content & Indicator */}
                    <div className="flex gap-12 items-center">
                        {/* Scroll Progress Indicator */}
                        <div className="flex flex-col gap-3 h-[200px] w-1 justify-center shrink-0">
                            {FEATURES.map((_, i) => (
                                <div key={i} className="flex-1 w-full bg-slate-200 rounded-full overflow-hidden">
                                     <motion.div 
                                        style={{ 
                                            scaleY: i === 0 ? useTransform(smoothProgress, [0, 0.5], [1, 1]) : 
                                                    i === 1 ? useTransform(smoothProgress, [0.35, 0.85], [0, 1]) :
                                                    useTransform(smoothProgress, [0.75, 1], [0, 1]),
                                            transformOrigin: "top",
                                            opacity: i === 0 ? useTransform(smoothProgress, [0, 0.5], [1, 1]) : 
                                                     i === 1 ? useTransform(smoothProgress, [0.35, 0.5, 0.85], [0, 1, 1]) :
                                                     useTransform(smoothProgress, [0.75, 0.85, 1], [0, 1, 1])
                                        }}
                                        className="h-full w-full bg-primary" 
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="relative h-[400px] flex-1">
                        {FEATURES.map((feature, i) => (
                            <motion.div
                                key={feature.id}
                                style={{ 
                                    opacity: i === 0 ? opacity1 : i === 1 ? opacity2 : opacity3,
                                    pointerEvents: i === 0 ? "auto" : "none" // Only first is interactive for now, or use index
                                }}
                                className="absolute inset-0 flex flex-col justify-center space-y-8"
                            >
                                <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide bg-ocean/10 text-ocean border-ocean/20 w-fit">
                                    Solution 0{i + 1}
                                </div>
                                <h3 className="text-5xl font-bold text-slate-900 leading-[1.1] font-display">
                                    {feature.title}
                                </h3>
                                <p className="text-xl text-slate-600 leading-relaxed font-medium max-w-md">
                                    {feature.desc}
                                </p>
                                <ul className="space-y-4">
                                    {feature.points.map((pt, idx) => (
                                        <li key={idx} className="flex items-center gap-4 text-slate-700 font-semibold text-lg">
                                            <div className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 bg-ocean/10 text-ocean">
                                                <Check className="h-4 w-4" />
                                            </div>
                                            {pt}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                        </div>
                    </div>

                    {/* Right: Mockups */}
                    <div className="relative flex items-center justify-center">
                         {/* Background Blur */}
                         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] -z-10">
                            <div className="absolute inset-0 bg-gradient-to-tr from-ocean/20 to-transparent rounded-full blur-[100px] opacity-40" />
                        </div>

                        <div className="relative w-full max-w-md aspect-square flex items-center justify-center">
                            {/* WhatsApp Mockup */}
                            <motion.div 
                                className="absolute inset-0 flex items-center justify-center"
                                style={{ 
                                    opacity: useTransform(smoothProgress, [0, 0.33, 0.4], [1, 1, 0]),
                                    scale: useTransform(smoothProgress, [0, 0.33], [1, 0.95]),
                                    y: useTransform(smoothProgress, [0, 0.33], [0, -20])
                                }}
                            >
                                <WhatsAppMockup progress={progress1} />
                            </motion.div>

                            {/* Access Control Mockup */}
                            <motion.div 
                                className="absolute inset-0 flex items-center justify-center"
                                style={{ 
                                    opacity: useTransform(smoothProgress, [0.3, 0.36, 0.66, 0.7], [0, 1, 1, 0]),
                                    scale: useTransform(smoothProgress, [0.33, 0.4, 0.6, 0.66], [0.95, 1, 1, 0.95])
                                }}
                            >
                                <AccessControlMockup progress={progress2} />
                            </motion.div>

                            {/* Member App Mockup */}
                            <motion.div 
                                className="absolute inset-0 flex items-center justify-center"
                                style={{ 
                                    opacity: useTransform(smoothProgress, [0.63, 0.7], [0, 1]),
                                    scale: useTransform(smoothProgress, [0.66, 0.75], [0.95, 1])
                                }}
                            >
                                <div className="max-w-[280px]">
                                    <MemberAppMockup progress={progress3} />
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
