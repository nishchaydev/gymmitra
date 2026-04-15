"use client"

import { useEffect, type ReactNode } from "react"

// Import phantom-ui SSR CSS to prevent content flash
import "@aejkatappaja/phantom-ui/ssr.css"

/**
 * Drop-in replacement for boneyard-js Skeleton.
 * Uses phantom-ui Web Component under the hood.
 *
 * API: <Skeleton name="members" loading={true}>{children}</Skeleton>
 *
 * When loading=true, phantom-ui measures child DOM elements and overlays
 * animated shimmer blocks at the exact same positions. When loading=false,
 * content is shown normally.
 */
export function Skeleton({
    children,
    loading,
    name,
}: {
    children: ReactNode
    loading: boolean
    name?: string
}) {
    // Register the Web Component once on mount (client-only)
    useEffect(() => {
        import("@aejkatappaja/phantom-ui")
    }, [])

    return (
        <phantom-ui
            loading={loading || undefined}
            animation="shimmer"
            aria-label={name ? `Loading ${name}` : undefined}
            style={{ display: "contents" }}
        >
            {children}
        </phantom-ui>
    )
}
