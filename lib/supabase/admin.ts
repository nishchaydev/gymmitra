import { createClient } from '@supabase/supabase-js'

/**
 * Supabase Admin client using the Service Role Key.
 * Use ONLY on the server (API routes, server actions).
 * Never expose to the client — this key bypasses RLS entirely.
 *
 * Used for operations that require admin privileges:
 * - Creating Supabase auth users (staff invite)
 * - Deleting users
 */
export function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars')
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
}
