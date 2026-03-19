import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    const allCookies = cookieStore.getAll()
                    // Diagnostic: Check if PKCE code verifier exists
                    const hasVerifier = allCookies.some(c => c.name.includes('code-verifier'))
                    if (!hasVerifier && process.env.NODE_ENV === 'development') {
                        // console.debug('[Supabase Server] No PKCE verifier found in cookies')
                    }
                    return allCookies
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            // console.debug(`[Supabase Server] Setting cookie: ${name}`)
                            cookieStore.set(name, value, options)
                        })
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )
}
