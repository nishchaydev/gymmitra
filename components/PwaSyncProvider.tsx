"use client"

import * as React from 'react'
import { useEffect } from 'react'
import { getPendingAttendance, removeSyncedAttendance } from '@/lib/offlineSync'
import { toast } from 'sonner'

export function PwaSyncProvider() {
    const syncingRef = React.useRef(false);

    useEffect(() => {
        // Only run on client
        if (typeof window === 'undefined') return;

        // Register Service Worker Manually
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then((registration) => {
                    console.log('[PWA] Service Worker registered with scope:', registration.scope);
                })
                .catch((error) => {
                    console.error('[PWA] Service Worker registration failed:', error);
                });
        }

        const handleOnline = async () => {
            if (syncingRef.current) return;

            // We are back online. Let's try to sync any pending stored attendances.
            const pending = await getPendingAttendance();

            if (pending.length === 0) return;

            syncingRef.current = true;
            toast.info(`Syncing ${pending.length} offline check-ins...`, { id: 'sync-toast' });

            try {
                const response = await fetch('/api/attendance/sync-offline', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ records: pending })
                })

                if (response.ok) {
                    const data = await response.json()
                    const syncedIds = data.syncedIds || pending.map((p: any) => p.id)
                    await removeSyncedAttendance(syncedIds)
                    toast.success("Offline data synced successfully!", { id: 'sync-toast' })
                } else {
                    toast.error("Failed to sync offline data.", { id: 'sync-toast' })
                }
            } catch (error) {
                console.error("Sync error:", error)
                toast.error("Failed to connect for sync.", { id: 'sync-toast' })
            } finally {
                syncingRef.current = false;
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
