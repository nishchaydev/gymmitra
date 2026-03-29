"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform, useSpring } from "framer-motion"
import { Check, Sparkles } from "lucide-react"
import { WhatsAppMockup } from "@/components/landing/features/WhatsAppMockup"
import { AccessControlMockup } from "@/components/landing/features/AccessControlMockup"
import { MemberAppMockup } from "@/components/landing/features/MemberAppMockup"
import { cn } from "@/lib/utils"

const FEATURES = [
    {
        title: "Automate Renewals & Wishes",
        desc: "Stop calling members manually. GymMitra sends automated renewal reminders and birthday wishes via WhatsApp.",
        points: ["90%+ Renewal Rate", "Personalized Greetings", "24/7 Automation"],
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
        points: ["Self-service portal", "Digital Invoicing", "Professional Branding"],
        id: "memberapp"
    }
]

export function ScrollyFeatureSection() {
    const containerRef = useRef<HTMLDivElement>(null)
    
    // Improved Scroll Observation
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    })

    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    })

    // Opacity transitions for each feature card (Refined for 450vh)
    const opacity1 = useTransform(smoothProgress, [0, 0.2, 0.3], [1, 1, 0])
    const opacity2 = useTransform(smoothProgress, [0.35, 0.45, 0.65, 0.75], [0, 1, 1, 0])
    const opacity3 = useTransform(smoothProgress, [0.8, 0.9, 1], [0, 1, 1])

    // Visual Mockup Transitions
    const visual1Opacity = useTransform(smoothProgress, [0, 0.3], [1, 0])
    const visual2Opacity = useTransform(smoothProgress, [0.35, 0.45, 0.65, 0.75], [0, 1, 1, 0])
    const visual3Opacity = useTransform(smoothProgress, [0.8, 0.9], [0, 1])

    return (
        <section id="features" className="relative bg-slate-50 z-20">
            <div ref={containerRef} className="relative h-[450vh]">
                <div className="sticky top-0 h-screen w-full flex items-center overflow-hidden">
                    
                    {/* Background Texture */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] -z-10" />

                    <div className="container px-4 md:px-6 mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center min-h-[600px]">
                            
                            {/* Left: Text Content Overlay */}
                            <div className="relative h-[400px] lg:h-[500px] order-2 lg:order-1 flex items-center">
                                {FEATURES.map((feature, i) => (
                                    <motion.div
                                        key={feature.id}
                                        style={{ 
                                            opacity: i === 0 ? opacity1 : i === 1 ? opacity2 : opacity3,
                                            pointerEvents: "none", // Prevent overlap issues during transitions
                                        }}
                                        className="absolute inset-x-0 flex flex-col space-y-6 lg:space-y-8"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] bg-primary/5 text-primary border-primary/10 w-fit backdrop-blur-md">
                                                <Sparkles className="w-3 h-3 mr-1.5 fill-primary" />
                                                Feature 0{i + 1}
                                            </div>
                                        </div>

                                        <h3 className="text-4xl md:text-5xl lg:text-7xl font-black text-slate-900 leading-[0.95] tracking-tighter font-display">
                                            {feature.title}
                                        </h3>

                                        <p className="text-lg md:text-xl text-slate-500 leading-relaxed font-bold max-w-sm">
                                            {feature.desc}
                                        </p>

                                        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 pt-2">
                                            {feature.points.map((pt, idx) => (
                                                <motion.li 
                                                    key={idx} 
                                                    initial={{ x: -10, opacity: 0 }}
                                                    whileInView={{ x: 0, opacity: 1 }}
                                                    transition={{ delay: idx * 0.1 }}
                                                    className="flex items-center gap-3 text-slate-800 font-bold text-sm bg-white/50 backdrop-blur-sm p-3 rounded-2xl border border-white/40 shadow-sm"
                                                >
                                                    <div className="h-6 w-6 rounded-full flex items-center justify-center shrink-0 bg-primary/10 text-primary">
                                                        <Check className="h-3.5 w-3.5" />
                                                    </div>
                                                    <span className="truncate">{pt}</span>
                                                </motion.li>
                                            ))}
                                        </ul>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Right: Visual Mockups */}
                            <div className="relative h-[400px] lg:h-[500px] flex items-center justify-center order-1 lg:order-2">
                                <div className="relative w-full max-w-[320px] lg:max-w-md aspect-square flex items-center justify-center">
                                    
                                    {/* Feature 1 Visual */}
                                    <motion.div 
                                        className="absolute inset-0 flex items-center justify-center"
                                        style={{ opacity: visual1Opacity }}
                                    >
                                        <WhatsAppMockup progress={smoothProgress} />
                                    </motion.div>

                                    {/* Feature 2 Visual */}
                                    <motion.div 
                                        className="absolute inset-0 flex items-center justify-center"
                                        style={{ opacity: visual2Opacity }}
                                    >
                                        <AccessControlMockup progress={smoothProgress} />
                                    </motion.div>

                                    {/* Feature 3 Visual */}
                                    <motion.div 
                                        className="absolute inset-0 flex items-center justify-center"
                                        style={{ opacity: visual3Opacity }}
                                    >
                                        <MemberAppMockup progress={smoothProgress} />
                                    </motion.div>

                                    {/* Global Background Glow */}
                                    <div className="absolute inset-0 bg-primary/5 blur-[100px] rounded-full -z-10" />
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
