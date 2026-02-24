import { get, set } from 'idb-keyval';

const PENDING_ATTENDANCE_KEY = 'mitra_pending_attendance';

export type PendingAttendance = {
    id: string; // Temp ID
    memberId: string;
    date: Date;
    checkInTime: string; // HH:mm format
    timestamp: number; // For sorting
}

// Save a failed check-in to IndexedDB
export async function saveOfflineAttendance(record: Omit<PendingAttendance, 'id' | 'timestamp'>) {
    if (typeof window === 'undefined') return;
    try {
        const existing = await get<PendingAttendance[]>(PENDING_ATTENDANCE_KEY) || [];

        // Check for near-duplicate (same member, same check-in time)
        const isDuplicate = existing.some(e =>
            e.memberId === record.memberId && e.checkInTime === record.checkInTime
        );

        if (isDuplicate) {
            console.log("Duplicate offline attendance detected, skipping save");
            return null;
        }

        const newRecord: PendingAttendance = {
            ...record,
            id: `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            timestamp: Date.now()
        };

        await set(PENDING_ATTENDANCE_KEY, [...existing, newRecord]);
        return newRecord;
    } catch (error) {
        console.error("Failed to save offline attendance:", error);
        throw error;
    }
}

// Get all pending check-ins
export async function getPendingAttendance(): Promise<PendingAttendance[]> {
    try {
        return await get<PendingAttendance[]>(PENDING_ATTENDANCE_KEY) || [];
    } catch {
        return [];
    }
}

// Clear specific synced records
export async function removeSyncedAttendance(tempIds: string[]) {
    try {
        const existing = await get<PendingAttendance[]>(PENDING_ATTENDANCE_KEY) || [];
        const remaining = existing.filter(record => !tempIds.includes(record.id));
        await set(PENDING_ATTENDANCE_KEY, remaining);
    } catch (error) {
        console.error("Failed to clean up synced attendance:", error);
    }
}

// Background Sync Function - mostly a trigger for PwaSyncProvider
export async function syncOfflineAttendance() {
    if (typeof window === 'undefined' || !navigator.onLine) return { success: false, syncedCount: 0 };

    const pending = await getPendingAttendance();
    if (pending.length === 0) return { success: true, syncedCount: 0 };

    try {
        const response = await fetch('/api/attendance/sync-offline', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ records: pending })
        });

        if (response.ok) {
            const data = await response.json();
            const syncedIds = data.syncedIds || pending.map(p => p.id);
            await removeSyncedAttendance(syncedIds);
            return { success: true, syncedCount: syncedIds.length };
        }
        return { success: false, syncedCount: 0 };
    } catch (error) {
        console.error("Failed background sync:", error);
        return { success: false, syncedCount: 0 };
    }
}
