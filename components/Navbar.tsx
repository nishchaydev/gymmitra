"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function Navbar() {
    const pathname = usePathname()

    // Hide App Navbar on public landing/auth pages
    if (pathname === "/" || pathname === "/login") {
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
        <nav className="border-b bg-white shadow-sm">
            <div className="flex h-16 items-center px-4 md:px-8">
                <Link href="/" className="mr-8 flex items-center gap-2 font-bold text-xl">
                    GymMitra
                </Link>
                <div className="flex items-center space-x-4 lg:space-x-6">
                    {routes.map((route) => (
                        <Link
                            key={route.href}
                            href={route.href}
                            className={cn(
                                "text-sm font-medium transition-colors hover:text-primary",
                                route.active
                                    ? "text-black dark:text-white"
                                    : "text-muted-foreground"
                            )}
                        >
                            {route.label}
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
    )
}
