"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { MotionWrapper } from "@/components/landing/ui/MotionWrapper"
import { useState } from "react"
import { ArrowRight, User, Phone, Zap, MessageSquare, Mail, Loader2 } from "lucide-react"

export function Contact() {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        const { toast } = await import('sonner');

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                let errorMessage = 'Failed to send message';
                try {
                    const text = await response.text();
                    try {
                        const errorData = JSON.parse(text);
                        errorMessage = errorData.error || errorMessage;
                    } catch (e) {
                        errorMessage = response.statusText || text || errorMessage;
                    }
                } catch (e) {
                    errorMessage = response.statusText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            toast.success("Message sent!", {
                description: "We've received your request and will contact you soon."
            });

            (e.target as HTMLFormElement).reset();
        } catch (error: unknown) {
            console.error('Contact form error:', error);
            toast.error("Submission failed", {
                description: error instanceof Error ? error.message : "Failed to send message. Please try again."
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section id="contact" className="py-24 bg-white relative overflow-hidden">
            <div className="container px-4 md:px-6 mx-auto relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
                    <div className="space-y-8">
                        <MotionWrapper>
                            <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-black text-primary shadow-sm mb-6 uppercase tracking-widest">
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Get in Touch
                            </div>
                        </MotionWrapper>

                        <MotionWrapper delay={0.1}>
                            <h2 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 mb-6 leading-tight font-display">
                                Start Your Gym&apos;s <br />
                                <span className="text-primary">Digital Journey</span>
                            </h2>
                        </MotionWrapper>

                        <MotionWrapper delay={0.2}>
                            <p className="text-lg text-slate-700 leading-relaxed max-w-lg font-medium">
                                Ready to automate? Send us a message and our team will get in touch within 24 hours to set up your profile.
                            </p>
                        </MotionWrapper>

                        <MotionWrapper delay={0.3}>
                            <div className="space-y-6">
                                <div className="flex items-center gap-4 text-slate-600">
                                    <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                                        <Mail className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 tracking-tight font-display">Email Us</p>
                                        <p className="text-sm font-medium">hello@gymmitra.in</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-slate-600">
                                    <div className="h-12 w-12 rounded-2xl bg-ocean/5 border border-ocean/10 flex items-center justify-center shrink-0">
                                        <Zap className="h-6 w-6 text-ocean" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 tracking-tight font-display">WhatsApp Support</p>
                                        <p className="text-sm font-medium">+91 62618 54014</p>
                                    </div>
                                </div>
                            </div>
                        </MotionWrapper>
                    </div>

                    <MotionWrapper delay={0.2}>
                        <div className="relative p-8 md:p-10 rounded-[2.5rem] bg-white border border-slate-100 shadow-2xl shadow-slate-200/50">
                            <form
                                className="space-y-6 relative z-10"
                                onSubmit={handleSubmit}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-slate-900 font-bold uppercase tracking-widest text-[10px]">Full Name</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                                            <Input
                                                id="name"
                                                name="name"
                                                placeholder="John Doe"
                                                className="pl-10 h-10 bg-white border-slate-200 focus:border-primary focus:ring-primary"
                                                required
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="text-slate-900 font-bold uppercase tracking-widest text-[10px]">Phone Number</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                                            <Input
                                                id="phone"
                                                name="phone"
                                                type="tel"
                                                placeholder="+91 98765 43210"
                                                pattern="(?=(.*\d){10,})[0-9\s\-\+]+"
                                                title="Please enter a phone number with at least 10 digits"
                                                className="pl-10 h-10 bg-white border-slate-200 focus:border-primary focus:ring-primary"
                                                required
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="gymName" className="text-slate-900 font-bold uppercase tracking-widest text-[10px]">Gym Name</Label>
                                    <Input
                                        id="gymName"
                                        name="gymName"
                                        placeholder="Elite Fitness Hub"
                                        className="h-10 bg-white border-slate-200 focus:border-primary focus:ring-primary"
                                        required
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="message" className="text-slate-900 font-bold uppercase tracking-widest text-[10px]">Message</Label>
                                    <Textarea
                                        id="message"
                                        name="message"
                                        placeholder="Tell us about your requirements..."
                                        className="min-h-[120px] bg-white border-slate-200 focus:border-primary focus:ring-primary"
                                        required
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full h-16 text-lg font-black bg-primary hover:bg-primary-600 shadow-xl shadow-primary/20 transition-all active:scale-[0.98] uppercase tracking-widest rounded-2xl"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="h-5 w-5 animate-spin text-white" /> Sending...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            Request Free Demo <ArrowRight className="h-5 w-5" />
                                        </span>
                                    )}
                                </Button>
                            </form>
                        </div>
                    </MotionWrapper>
                </div>
            </div>
        </section>
    );
}
