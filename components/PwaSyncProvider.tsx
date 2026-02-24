"use client"

import { useEffect } from 'react'
import { getPendingAttendance, removeSyncedAttendance } from '@/lib/offlineSync'
import { toast } from 'sonner'

export function PwaSyncProvider() {
    useEffect(() => {
        // Only run on client
        if (typeof window === 'undefined') return;

        const handleOnline = async () => {
            // We are back online. Let's try to sync any pending stored attendances.
            const pending = await getPendingAttendance();

            if (pending.length === 0) return;

            toast.info(`Syncing ${pending.length} offline check-ins...`, { id: 'sync-toast' });

            try {
                // We'll batch them in a single endpoint or map over them
                const response = await fetch('/api/attendance/sync-offline', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ records: pending })
                })

                if (response.ok) {
                    const data = await response.json()
                    const syncedIds = data.syncedIds || pending.map(p => p.id)
                    await removeSyncedAttendance(syncedIds)
                    toast.success("Offline data synced successfully!", { id: 'sync-toast' })
                } else {
                    toast.error("Failed to sync offline data.", { id: 'sync-toast' })
                }
            } catch (error) {
                console.error("Sync error:", error)
                toast.error("Failed to connect for sync.", { id: 'sync-toast' })
            }
        }

        window.addEventListener('online', handleOnline)

        // Also run once on mount in case they started the app already online with pending data
        if (navigator.onLine) {
            handleOnline()
        }

        return () => window.removeEventListener('online', handleOnline)
    }, [])

    return null // Invisible utility component
}
