import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Book, HelpCircle, MessageSquare, Search, Zap } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"

const HELP_CATEGORIES = [
    {
        title: "Getting Started",
        icon: Zap,
        description: "New to Gym Mitra? Start here with our quick setup guides.",
        links: ["System Requirements", "Setting up your Gym Profile", "First 10 minutes"]
    },
    {
        title: "Member Management",
        icon: Book,
        description: "Learn how to add, track, and manage your gym members.",
        links: ["Adding New Members", "Attendance Tracking", "Member Import Guide"]
    },
    {
        title: "Invoicing & Billing",
        icon: HelpCircle,
        description: "Manage your revenue, generate GST invoices, and track payments.",
        links: ["Generating Invoices", "WhatsApp Automation", "Tax Settings"]
    },
    {
        title: "Support",
        icon: MessageSquare,
        description: "Can't find what you're looking for? Reach out to our team.",
        links: ["Contact Support", "Feature Requests", "Report a Bug"]
    }
]

export default function HelpPage() {
    return (
        <div className="container max-w-6xl mx-auto py-12 px-4 space-y-12">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-black text-slate-900">Help Center</h1>
                <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium">
                    Everything you need to know about growing your gym with Gym Mitra.
                </p>
                <div className="relative max-w-xl mx-auto mt-8">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                        className="pl-10 h-14 rounded-2xl border-slate-200 shadow-xl shadow-slate-200/50"
                        placeholder="Search for articles, guides, and more..."
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {HELP_CATEGORIES.map((cat) => (
                    <Card key={cat.title} className="border-slate-100 shadow-lg shadow-slate-100/50 overflow-hidden group hover:shadow-xl transition-all">
                        <CardHeader className="flex flex-row items-center gap-4 bg-slate-50/50">
                            <div className="w-12 h-12 rounded-xl bg-[#4FC3F7]/10 flex items-center justify-center text-[#4FC3F7]">
                                <cat.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold">{cat.title}</CardTitle>
                                <p className="text-sm text-slate-500 font-medium">{cat.description}</p>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <ul className="space-y-3">
                                {cat.links.map((link) => (
                                    <li key={link}>
                                        <Link href="#" className="text-slate-600 hover:text-[#4FC3F7] font-bold text-sm flex items-center gap-2 group/item">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover/item:bg-[#4FC3F7]" />
                                            {link}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="bg-slate-900 rounded-[2rem] p-8 md:p-12 text-center text-white space-y-6">
                <h2 className="text-3xl font-bold">Still need help?</h2>
                <p className="text-slate-400 font-medium">Our support team is available from 9 AM to 9 PM IST to help you succeed.</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button className="px-8 py-4 rounded-full bg-[#4FC3F7] text-white font-bold hover:scale-105 transition-transform">
                        Chat with Support
                    </button>
                    <button className="px-8 py-4 rounded-full bg-white/10 text-white font-bold hover:bg-white/20 transition-all backdrop-blur-sm">
                        Schedule a Demo
                    </button>
                </div>
            </div>
        </div>
    )
}
