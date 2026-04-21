"use client"

import Link from "next/link"
import { useParams, usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useEffect, useMemo, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { Button } from "./ui/button"
import Image from "next/image"
import { LogOut } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"

interface NavbarProps {
    plan?: string;
    trialExpiresAt?: string | null;
    role?: string;
    isExpired?: boolean;
}

export function Navbar({ plan, trialExpiresAt, role, isExpired }: NavbarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const params = useParams()
    const queryClient = useQueryClient()
    const slug = params?.slug as string
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [isDemo, setIsDemo] = useState(false)

    const hoverTimers = useRef<Record<string, NodeJS.Timeout>>({})
    const supabase = useMemo(() => createClient(), [])

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)

            const demoCookie = document.cookie.split('; ').find(row => row.startsWith('mitra_demo_mode='))
            const cookieIsDemo = demoCookie?.split('=')[1] === 'true'
            
            // isDemo is only true if:
            // 1. We are NOT logged in as a real user
            // 2. AND (we are on the /demo slug OR we have the cookie and no slug)
            setIsDemo(!user && (slug === 'demo' || (cookieIsDemo && !slug)))

            setLoading(false)
        }
        getUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })

        return () => subscription.unsubscribe()
    }, [slug, supabase])



    const handleNavHover = (href: string) => {
        hoverTimers.current[href] = setTimeout(() => {
            router.prefetch(href)

            if (href.includes('/members')) {
              queryClient.prefetchQuery({
                queryKey: ['members', {
                  q: undefined,
                  status: undefined,
                  dobMonth: undefined,
                  birthday: undefined,
                  duration: undefined,
                  page: 1,
                  take: 10,
                  slug
                }],
                queryFn: () => fetch(`/api/members?page=1&take=10`)
                  .then(res => res.json()),
                staleTime: 5 * 60 * 1000,
              })
            }

            if (href.includes('/invoices')) {
              queryClient.prefetchQuery({
                queryKey: ['invoices', undefined, undefined, 1, 50, undefined, slug],
                queryFn: () => fetch(`/api/invoices?page=1&take=50`)
                  .then(res => res.json()),
                staleTime: 5 * 60 * 1000,
              })
            }

            if (href.includes('/products')) {
              queryClient.prefetchQuery({
                queryKey: ['products', ''],
                queryFn: () => fetch('/api/products').then(res => res.json()),
                staleTime: 5 * 60 * 1000,
              })
            }
        }, 150) // 150ms hover = intentional
    }

    const handleNavLeave = (href: string) => {
        clearTimeout(hoverTimers.current[href])
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push("/")
        router.refresh()
    }

    if (pathname === "/login") return null

    const isPublicPage = pathname === "/" || pathname === "/error"
    if (isPublicPage && !isDemo) return null

    const routes = [
        { href: `/${slug}/dashboard`, label: "Dashboard", active: pathname === `/${slug}/dashboard` },
        { href: `/${slug}/leads`, label: "Leads", active: pathname === `/${slug}/leads` || pathname.startsWith(`/${slug}/leads/`) },
        { href: `/${slug}/members`, label: "Members", active: pathname === `/${slug}/members` || pathname.startsWith(`/${slug}/members/`) },
        { href: `/${slug}/products`, label: "Products", active: pathname === `/${slug}/products` || pathname.startsWith(`/${slug}/products/`) },
        { href: `/${slug}/invoices`, label: "Invoices", active: pathname === `/${slug}/invoices` || pathname.startsWith(`/${slug}/invoices/`) },
        { href: `/${slug}/expenses`, label: "Expenses", active: pathname === `/${slug}/expenses` || pathname.startsWith(`/${slug}/expenses/`) },
        { href: `/${slug}/attendance`, label: "Attendance", active: pathname === `/${slug}/attendance` },
        { href: `/${slug}/settings`, label: "Settings", active: pathname === `/${slug}/settings` },
    ]



    // Calculate trial days left
    const trialDaysLeft = trialExpiresAt 
        ? Math.max(0, Math.ceil((new Date(trialExpiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

    return (
        <nav className="border-b bg-white shadow-sm border-drift-200 sticky top-0 z-50">
            <div className="flex h-16 items-center px-4 md:px-8 max-w-screen-2xl mx-auto w-full">
                <div className="flex items-center gap-3 mr-6 shrink-0">
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary-500 font-display">
                        <Image
                            src="/icon.png"
                            alt="GymMitra Logo"
                            width={28}
                            height={28}
                            className="rounded-md object-contain"
                        />
                        <span>GymMitra</span>
                    </Link>
                </div>

                <div className="hidden md:flex items-center space-x-4 lg:space-x-5 h-full">
                    {(user || isDemo) && routes.map((route) => (
                        <Link
                            key={route.href}
                            href={route.href}
                            onMouseEnter={() => handleNavHover(route.href)}
                            onMouseLeave={() => handleNavLeave(route.href)}
                            className={cn(
                                "text-sm font-medium transition-all duration-150 h-full flex items-center relative py-1 whitespace-nowrap",
                                route.active
                                    ? "text-primary-500 font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary-500 after:rounded-full"
                                    : "text-drift-500 hover:text-drift-900"
                            )}
                        >
                            {route.label}
                        </Link>
                    ))}
                </div>

                <div className="hidden md:flex ml-auto items-center space-x-4">
                    {loading ? (
                        <div className="h-10 w-24 bg-drift-100 animate-pulse rounded-md" />
                    ) : user || isDemo ? (
                        <div className="flex items-center gap-3">
                            <div className="hidden lg:flex flex-col items-end">
                                <span className="text-xs font-medium text-drift-500 max-w-[150px] truncate">
                                    {user?.email || "showcase@gym-mitra.com"}
                                </span>
                                <span className="text-[10px] text-primary-600 uppercase tracking-widest font-bold">
                                    {isDemo ? "Showcase" : (role || "Staff")}
                                </span>
                            </div>
                            {plan === 'TRIAL' && (
                                <span className={cn(
                                    "text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap",
                                    isExpired
                                        ? "bg-rose-50 text-rose-600 border border-rose-200"
                                        : "bg-amber-50 text-amber-600 border border-amber-200"
                                )}>
                                    {isExpired ? 'Trial Expired' : `Trial · ${trialDaysLeft}d left`}
                                </span>
                            )}
                            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-drift-500 hover:text-red-600 h-9 w-9">
                                <LogOut className="h-5 w-5" />
                            </Button>
                        </div>
                    ) : (
                        <Button asChild variant="default">
                            <Link href="/login">Sign In</Link>
                        </Button>
                    )}
                </div>
            </div>

        </nav>
    )
}
