"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"
import { MotionWrapper } from "@/components/landing/ui/MotionWrapper"

export function FinalCTA() {
    return (
        <section className="py-24 relative overflow-hidden bg-primary-900">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary-800 to-primary-900" />
            <div className="absolute -top-[50%] -left-[20%] w-[1000px] h-[1000px] bg-primary-500/20 rounded-full blur-[120px] animate-pulse" />

            <div className="container px-4 md:px-6 mx-auto relative z-10 text-center">
                <MotionWrapper>
                    <div className="inline-flex items-center rounded-full border border-primary-400/30 bg-primary-500/10 px-3 py-1 text-sm font-medium text-primary-100 backdrop-blur-sm mb-8">
                        <Sparkles className="h-4 w-4 mr-2 text-primary-200" />
                        Limited Time Offer
                    </div>
                </MotionWrapper>

                <MotionWrapper delay={0.1}>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6 leading-tight">
                        Ready to automate your gym?
                    </h2>
                </MotionWrapper>

                <MotionWrapper delay={0.2}>
                    <p className="text-xl text-primary-100/80 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Join 50+ other smart gym owners today. Get your 14-day free trial. No credit card required.
                    </p>
                </MotionWrapper>

                <MotionWrapper delay={0.3} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Button asChild size="lg" className="h-16 px-10 text-xl w-full rounded-full bg-white text-primary-900 hover:bg-primary-50 font-bold hover:shadow-2xl hover:shadow-primary-900/50 hover:scale-105 transition-all duration-300">
                        <Link href="/login?view=register">
                            Start Free Trial
                            <ArrowRight className="ml-2 h-6 w-6" />
                        </Link>
                    </Button>
                    <p className="text-sm text-primary-200 mt-4 sm:mt-0 sm:absolute sm:-bottom-12">
                        Includes full feature access
                    </p>
                </MotionWrapper>
            </div>
        </section>
    )
}
