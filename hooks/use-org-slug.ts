'use client'

import { usePathname } from 'next/navigation'

/**
 * Returns the gym slug from the current URL path.
 *
 * All protected dashboard routes follow the pattern /{slug}/...
 * This hook extracts and validates that first segment so callers
 * never have to duplicate the split/guard logic.
 *
 * Returns `null` when the path has no non-empty first segment
 * (e.g. during SSR hydration mismatches or unexpected routes).
 */
export function useOrgSlug(): string | null {
    const pathname = usePathname()
    const segments = pathname.split('/').filter(Boolean)
    const slug = segments[0] ?? null
    return slug || null
}
