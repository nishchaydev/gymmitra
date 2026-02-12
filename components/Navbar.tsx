"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { Button } from "./ui/button"
import { LogOut, User as UserIcon, Building2 } from "lucide-react"

export function Navbar() {
    const pathname = usePathname()
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
            setLoading(false)
        }
        getUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })

        return () => subscription.unsubscribe()
    }, [supabase])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push("/")
        router.refresh()
    }

    // Hide App Navbar on public landing/auth pages IF NOT logged in
    // or always hide on specific public pages if preferred.
    const isPublicPage = pathname === "/" || pathname === "/login" || pathname === "/error"

    if (isPublicPage && !user) {
        return null
    }

    const routes = [
        {
            href: "/dashboard",
            label: "Dashboard",
            active: pathname === "/dashboard",
        },
        {
            href: "/members",
            label: "Members",
            active: pathname === "/members" || pathname.startsWith("/members/"),
        },
        {
            href: "/products",
            label: "Products",
            active: pathname === "/products" || pathname.startsWith("/products/"),
        },
        {
            href: "/invoices",
            label: "Invoices",
            active: pathname === "/invoices" || pathname.startsWith("/invoices/"),
        },
        {
            href: "/attendance",
            label: "Attendance",
            active: pathname === "/attendance",
        },
        {
            href: "/settings",
            label: "Settings",
            active: pathname === "/settings",
        },
    ]

    return (
        <nav className="border-b bg-white shadow-sm sticky top-0 z-50">
            <div className="flex h-16 items-center px-4 md:px-8 max-w-screen-2xl mx-auto w-full">
                <Link href="/" className="mr-8 flex items-center gap-2 font-bold text-xl text-emerald-600">
                    <Building2 className="h-6 w-6" />
                    <span className="hidden md:inline">GymMitra</span>
                </Link>

                <div className="flex items-center space-x-4 lg:space-x-6 flex-1">
                    {user && routes.map((route) => (
                        <Link
                            key={route.href}
                            href={route.href}
                            className={cn(
                                "text-sm font-medium transition-colors hover:text-emerald-600",
                                route.active
                                    ? "text-emerald-700"
                                    : "text-muted-foreground"
                            )}
                        >
                            {route.label}
                        </Link>
                    ))}
                </div>

                <div className="ml-auto flex items-center space-x-4">
                    {user ? (
                        <div className="flex items-center gap-4">
                            <div className="hidden lg:flex flex-col items-end">
                                <span className="text-xs font-semibold text-slate-900">{user.email}</span>
                                <span className="text-[10px] text-emerald-600 uppercase tracking-wider font-bold">Administrator</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleLogout}
                                className="text-slate-500 hover:text-red-600 hover:bg-red-50"
                            >
                                <LogOut className="h-5 w-5" />
                            </Button>
                        </div>
                    ) : (
                        <Link href="/login">
                            <Button variant="default" className="bg-emerald-600 hover:bg-emerald-700">
                                Sign In
                            </Button>
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    )
}
