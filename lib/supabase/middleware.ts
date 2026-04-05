import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Middleware handles:
 * 1. Supabase Session refreshing
 * 2. Route protection (Auth & Demo mode)
 * 3. Onboarding status enforcement (Cookie-based for Edge compatibility)
 */
export async function updateSession(request: NextRequest, mergedHeaders?: Headers) {
    let supabaseResponse = NextResponse.next({
        request: {
            headers: mergedHeaders || request.headers,
        },
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
                        request: {
                            headers: mergedHeaders || request.headers,
                        },
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

    const demoFeatureEnabled = process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED === 'true'
    const isDemoMode = demoFeatureEnabled && request.cookies.get('mitra_demo_mode')?.value === 'true'
    const isOnboarded = request.cookies.get('gym_onboarded')?.value === 'true'
    const { pathname } = request.nextUrl

    // 0. INTERCEPT SUPABASE AUTH CODES
    // When Supabase can't use our redirectTo (not whitelisted), it falls back to Site URL
    // with ?code=... param. Catch that and route it to our callback handler.
    const authCode = request.nextUrl.searchParams.get('code')
    if (authCode && !pathname.startsWith('/auth/callback')) {
        const url = request.nextUrl.clone()
        url.pathname = '/auth/callback'
        // CRITICAL: Propagate headers (containing set-cookie) from supabaseResponse
        // to the redirect response to avoid losing the PKCE verifier cookie.
        return NextResponse.redirect(url, {
            headers: supabaseResponse.headers
        })
    }

    // 1. PUBLIC ROUTES & STATIC ASSETS EXEMPTION
    const isPublicRoute =
        pathname === '/' ||
        pathname.startsWith('/login') ||
        pathname.startsWith('/auth') ||
        pathname.startsWith('/error') ||
        pathname.startsWith('/forgot-password') ||
        pathname.startsWith('/reset-password') ||
        pathname.startsWith('/onboarding') || // Explicitly public to prevent redirect loops
        pathname.startsWith('/register') || // Allow registration flow
        pathname.startsWith('/start-trial') || // Public trial signup page
        pathname.startsWith('/invoice/') || // Public invoice sharing
        pathname === '/manifest.webmanifest' || // PWA manifest
        pathname === '/api/csp-report' || // CSP Violation Reporting
        pathname.startsWith('/privacy') || // Legal pages
        pathname.startsWith('/terms') || // Legal pages
        pathname.startsWith('/api/webhooks') // External webhooks handle their own auth

    if (isPublicRoute) {
        // If user is logged in, but tries to access login page or landing page, redirect to dashboard
        if (user && (pathname.startsWith('/login') || pathname === '/')) {


            const url = request.nextUrl.clone()
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }

        if (isDemoMode) {
            supabaseResponse.headers.set('x-demo-mode', 'true');
        }

        return supabaseResponse
    }

    // 1. SUPABASE AUTH & SESSION REFRESH (ALREADY DONE ABOVE)

    // 1b. ADMIN ROUTE PROTECTION — block non-admin users
    if (pathname.startsWith('/admin')) {
        const adminEmails = (process.env.ADMIN_EMAIL || '').split(',').map(e => e.trim()).filter(Boolean)
        if (!user || !adminEmails.includes(user.email ?? '')) {
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            return NextResponse.redirect(url)
        }
    }

    // 2. AUTHENTICATION ENFORCEMENT
    if (!user && !isDemoMode) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('returnTo', pathname)
        return NextResponse.redirect(url)
    }

    // 2b. EMAIL VERIFICATION ENFORCEMENT
    // If user is logged in but email isn't verified, restrict access to app routes.
    if (user && !user.email_confirmed_at && !isPublicRoute && !pathname.includes('/verify-email')) {
        const url = request.nextUrl.clone()
        url.pathname = '/login/verify-email'
        return NextResponse.redirect(url)
    }

    // 3. TRIAL & ACCESS ENFORCEMENT
    const protectedPaths = ['dashboard', 'members', 'invoices', 'products', 'attendance', 'settings', 'leads', 'staff']
    const isProtectedRoute = 
        protectedPaths.some(p => pathname.startsWith(`/${p}`)) ||
        pathname.match(new RegExp(`^/[^/]+/(?:${protectedPaths.join('|')})`)) !== null ||
        (pathname.startsWith('/api') && !pathname.startsWith('/api/contact') && !pathname.startsWith('/api/auth') && !pathname.startsWith('/api/csp-report') && !pathname.startsWith('/api/webhooks'))

    if (user && !isDemoMode && isProtectedRoute) {
        // Extract slug from path if present (/[slug]/...)
        const slugMatch = pathname.match(/^\/([^/]+)/)
        const currentSlug = slugMatch ? slugMatch[1] : null

        // Fetch gym profile — first try as owner, then as staff member
        let gym: { saasPlan: string; trialExpiresAt: string | null; onboardingStep: number; isVerified: boolean } | null = null

        const { data: ownerGym } = await supabase
            .from('GymProfile')
            .select('saasPlan, trialExpiresAt, onboardingStep, isVerified')
            .eq('userId', user.id)
            .single()

        if (ownerGym) {
            gym = ownerGym
        } else {
            // User might be a staff member — find their gym via StaffMember
            const { data: staffMember } = await supabase
                .from('StaffMember')
                .select('gymId')
                .eq('userId', user.id)
                .single()

            if (staffMember?.gymId) {
                const { data: staffGym } = await supabase
                    .from('GymProfile')
                    .select('saasPlan, trialExpiresAt, onboardingStep, isVerified')
                    .eq('id', staffMember.gymId)
                    .single()

                if (staffGym) {
                    gym = staffGym
                }
            }
        }

        if (gym) {
            // A. ONBOARDING ENFORCEMENT (owners only — staff can't onboard)
            if (!gym.isVerified && gym.onboardingStep < 2 && !pathname.includes('/onboarding')) {
                // Only redirect to onboarding if this is the owner's account
                if (ownerGym) {
                    const url = request.nextUrl.clone()
                    url.pathname = '/onboarding'
                    return NextResponse.redirect(url)
                }
            }

            // B. TRIAL ENFORCEMENT — enforced for both owners AND staff
            const now = new Date()
            const isTrial = gym.saasPlan === 'TRIAL'
            const isExpired = gym.trialExpiresAt && new Date(gym.trialExpiresAt) < now

            // Redirect to trial-expired if appropriate
            // BUT exempt billing/settings, dashboard, and trial-expired page itself
            const isExempt = pathname.includes('/settings/billing') || 
                             pathname.includes('/trial-expired') ||
                             pathname.includes('/onboarding')

            if (isTrial && isExpired && !isExempt && currentSlug && !['dashboard', 'login', 'auth', 'register', 'onboarding'].includes(currentSlug)) {
                const url = request.nextUrl.clone()
                url.pathname = `/${currentSlug}/trial-expired`
                return NextResponse.redirect(url)
            }
        }
    }


    if (isDemoMode) {
        // Pass the demo mode flag down to the layouts/pages that cannot use cookies() statically
        supabaseResponse.headers.set('x-demo-mode', 'true');
    }

    return supabaseResponse
}
