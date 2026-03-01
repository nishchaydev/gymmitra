import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Middleware handles:
 * 1. Supabase Session refreshing
 * 2. Route protection (Auth & Demo mode)
 * 3. Onboarding status enforcement (Cookie-based for Edge compatibility)
 */
export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const isDemoMode = request.cookies.get('mitra_demo_mode')?.value === 'true'
    const isOnboarded = request.cookies.get('gym_onboarded')?.value === 'true'
    const { pathname } = request.nextUrl

    // 1. PUBLIC ROUTES & STATIC ASSETS EXEMPTION
    const isPublicRoute =
        pathname === '/' ||
        pathname.startsWith('/login') ||
        pathname.startsWith('/auth') ||
        pathname.startsWith('/error') ||
        pathname.startsWith('/invoice/') || // Public invoice sharing
        pathname.startsWith('/api/webhooks') // External webhooks handle their own auth

    if (isPublicRoute) {
        // If user is logged in, but tries to access login page or landing page, redirect to dashboard
        if (user && (pathname.startsWith('/login') || pathname === '/')) {
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }
        return supabaseResponse
    }

    // 2. AUTHENTICATION ENFORCEMENT
    if (!user && !isDemoMode) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('returnTo', pathname)
        return NextResponse.redirect(url)
    }

    // 3. ONBOARDING ENFORCEMENT
    const isProtectedRoute =
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/members') ||
        pathname.startsWith('/invoices') ||
        pathname.startsWith('/products') ||
        pathname.startsWith('/attendance') ||
        pathname.startsWith('/settings') ||
        (pathname.startsWith('/api') && !pathname.startsWith('/api/contact') && !pathname.startsWith('/api/auth'))

    if (user && !isDemoMode && isProtectedRoute && !isOnboarded) {
        const url = request.nextUrl.clone()
        url.pathname = '/onboarding'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
