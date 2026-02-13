"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { MotionWrapper } from "@/components/landing/ui/MotionWrapper"
import { Building2, Mail, MessageSquare, Phone, Send, User } from "lucide-react"

export function Contact() {
    return (
        <section id="contact" className="py-24 bg-white relative overflow-hidden">
            <div className="container px-4 md:px-6 mx-auto relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
                    <div className="space-y-8">
                        <MotionWrapper>
                            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary mb-6">
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Get in Touch
                            </div>
                        </MotionWrapper>

                        <MotionWrapper delay={0.1}>
                            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
                                Ready to transform <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-400">
                                    your gym business?
                                </span>
                            </h2>
                        </MotionWrapper>

                        <MotionWrapper delay={0.2}>
                            <p className="text-lg text-slate-700 leading-relaxed max-w-lg font-medium">
                                Fill out the form and our team will get back to you within 24 hours.
                                We'll schedule a <span className="text-slate-900 font-bold underline decoration-[#4FC3F7]/30 decoration-4">personalized demo</span> to show you how Gym Mitra can save you time and money.
                            </p>
                        </MotionWrapper>

                        <MotionWrapper delay={0.3}>
                            <div className="space-y-6">
                                <div className="flex items-center gap-4 text-slate-600">
                                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                        <Mail className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">Email Us</p>
                                        <p className="text-sm">sales@emitra.tech</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-slate-600">
                                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                        <Phone className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">Call Us</p>
                                        <p className="text-sm">+91 98765 43210</p>
                                    </div>
                                </div>
                            </div>
                        </MotionWrapper>
                    </div>

                    <MotionWrapper delay={0.4}>
                        <div className="bg-slate-50 p-8 md:p-10 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 relative">
                            <form
                                className="space-y-6 relative z-10"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.currentTarget);
                                    const data = Object.fromEntries(formData.entries());
                                    console.log('Contact form submission:', data);

                                    import('sonner').then(({ toast }) => {
                                        toast.success("Demo requested!", {
                                            description: "We've received your request and will contact you soon."
                                        });
                                    });

                                    (e.target as HTMLFormElement).reset();
                                }}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-slate-900 font-semibold">Full Name</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                            <Input
                                                id="name"
                                                name="name"
                                                placeholder="John Doe"
                                                className="pl-10 h-10 bg-white border-slate-200 focus:border-primary focus:ring-primary"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="text-slate-900 font-semibold">Phone Number</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                            <Input
                                                id="phone"
                                                name="phone"
                                                type="tel"
                                                placeholder="+91 98765 43210"
                                                pattern="^\+?[0-9\s\-]{10,}$"
                                                title="Please enter a valid phone number"
                                                className="pl-10 h-10 bg-white border-slate-200 focus:border-primary focus:ring-primary"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="gym-name" className="text-slate-900 font-semibold">Gym / Studio Name</Label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                        <Input
                                            id="gym-name"
                                            name="gymName"
                                            placeholder="Your Gym Name"
                                            className="pl-10 h-10 bg-white border-slate-200 focus:border-primary focus:ring-primary"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="message" className="text-slate-900 font-semibold">Message (Optional)</Label>
                                    <Textarea
                                        id="message"
                                        name="message"
                                        placeholder="Tell us about your requirements..."
                                        className="min-h-[100px] bg-white border-slate-200 focus:border-primary focus:ring-primary"
                                    />
                                </div>

                                <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary-600 text-white font-bold text-lg rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                                    Request Demo
                                    <Send className="ml-2 h-4 w-4" />
                                </Button>
                            </form>

                            {/* Form Decoration */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />
                        </div>
                    </MotionWrapper>
                </div>
            </div>
        </section>
    )
}
