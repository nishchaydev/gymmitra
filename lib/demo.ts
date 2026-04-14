import { cookies } from 'next/headers'

/**
 * Centrally determines if the application is in Demo/Showcase mode.
 * Checks both the environment flag, the 'mitra_demo_mode' cookie,
 * and the URL slug 'demo'.
 */
export async function getIsDemo(slug?: string): Promise<boolean> {
    const envDemoEnabled = process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED === 'true'
    if (!envDemoEnabled) return false

    // If slug is explicitly 'demo', we are in demo mode
    if (slug === 'demo') return true

    // If we have a non-demo slug, we are NOT in demo mode, regardless of the cookie
    if (slug && slug !== 'demo') return false

    // Root page or fallback: check the cookie
    const cookieStore = await cookies()
    return cookieStore.get('mitra_demo_mode')?.value === 'true'
}
