"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { Button } from "./ui/button"
import { LogOut, User as UserIcon, Building2, Menu, X } from "lucide-react"

export function Navbar() {
    const pathname = usePathname()
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [isDemo, setIsDemo] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)

            // Check for demo mode cookie
            const demoCookie = document.cookie.split('; ').find(row => row.startsWith('mitra_demo_mode='))
            setIsDemo(!user && demoCookie?.split('=')[1] === 'true')

            setLoading(false)
        }
        getUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })

        return () => subscription.unsubscribe()
    }, [supabase])

    // Keyboard and backdrop closure for mobile menu
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsMobileMenuOpen(false)
        }
        if (isMobileMenuOpen) {
            window.addEventListener('keydown', handleEscape)
            document.body.style.overflow = 'hidden'
        }
        return () => {
            window.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = 'unset'
        }
    }, [isMobileMenuOpen])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push("/")
        router.refresh()
    }

    // Hide App Navbar on public landing/auth pages to prevent overlap
    // Landing page has its own custom navbar
    const isPublicPage = pathname === "/" || pathname === "/login" || pathname === "/error"

    // If we're on the landing page, we usually hide the main app navbar
    if (isPublicPage && !isDemo) {
        return null
    }

    // Always hide on the actual landing page hero area to avoid double nav
    if (pathname === "/") return null

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

    const closeMenu = () => setIsMobileMenuOpen(false)

    return (
        <nav className="border-b bg-white shadow-sm sticky top-0 z-50">
            <div className="flex h-16 items-center px-4 md:px-8 max-w-screen-2xl mx-auto w-full">
                <Link href="/" className="mr-8 flex items-center gap-2 font-bold text-xl text-primary">
                    <Building2 className="h-6 w-6" />
                    <span>GymMitra</span>
                </Link>

                {/* Mobile Menu Toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden ml-auto"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    aria-label="Toggle mobile menu"
                    aria-expanded={isMobileMenuOpen}
                    aria-controls="mobile-menu"
                >
                    {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center space-x-4 lg:space-x-6 flex-1">
                    {(user || isDemo) && routes.map((route) => (
                        <Link
                            key={route.href}
                            href={route.href}
                            className={cn(
                                "text-sm font-medium transition-colors hover:text-primary",
                                route.active
                                    ? "text-primary font-semibold"
                                    : "text-muted-foreground"
                            )}
                        >
                            {route.label}
                        </Link>
                    ))}
                </div>

                <div className="hidden md:flex ml-auto items-center space-x-4">
                    {user || isDemo ? (
                        <div className="flex items-center gap-4">
                            <div className="hidden lg:flex flex-col items-end">
                                <span className="text-xs font-semibold text-slate-900">
                                    {user?.email || "showcase@gym-mitra.com"}
                                </span>
                                <span className="text-[10px] text-primary uppercase tracking-wider font-bold">
                                    {isDemo ? "Showcase Mode" : "Administrator"}
                                </span>
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
                            <Button variant="default" className="bg-primary hover:bg-primary-600">
                                Sign In
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            {/* Mobile Navigation Drawer */}
            <div className={`fixed inset-0 z-50 transition-all duration-300 md:hidden ${isMobileMenuOpen ? 'visible' : 'invisible'}`}>
                {/* Backdrop */}
                <div
                    className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'}`}
                    onClick={closeMenu}
                />

                {/* Drawer Content */}
                <div
                    id="mobile-menu"
                    className={`absolute right-0 top-0 h-full w-[280px] bg-white shadow-2xl transition-transform duration-300 transform ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
                >
                    <div className="flex flex-col h-full bg-drift-50/30">
                        <div className="p-6 border-b bg-white flex justify-between items-center">
                            <span className="font-bold text-xl text-primary">GymMitra</span>
                            <button
                                onClick={closeMenu}
                                className="p-2 rounded-full hover:bg-slate-100"
                                aria-label="Close menu"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {(user || isDemo) ? (
                                <>
                                    <div className="flex flex-col space-y-2 mb-4 pb-4 border-b">
                                        {routes.map((route) => (
                                            <Link
                                                key={route.href}
                                                href={route.href}
                                                onClick={closeMenu}
                                                className={cn(
                                                    "text-base font-medium p-3 rounded-lg transition-colors",
                                                    route.active
                                                        ? "bg-primary/5 text-primary font-bold"
                                                        : "text-muted-foreground hover:bg-slate-50"
                                                )}
                                            >
                                                {route.label}
                                            </Link>
                                        ))}
                                    </div>
                                    <div className="flex flex-col p-2 space-y-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-900">
                                                {user?.email || "showcase@gym-mitra.com"}
                                            </span>
                                            <span className="text-xs text-primary uppercase font-bold">
                                                {isDemo ? "Showcase Mode" : "Administrator"}
                                            </span>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleLogout}
                                            className="text-red-600 border-red-100 hover:bg-red-50 justify-start w-full"
                                        >
                                            <LogOut className="h-5 w-5 mr-2" /> Logout
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <Link href="/login" onClick={closeMenu} className="block mt-4">
                                    <Button variant="default" className="w-full bg-primary">
                                        Sign In
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    )
}
