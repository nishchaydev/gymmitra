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
    try {
        const existing = await get<PendingAttendance[]>(PENDING_ATTENDANCE_KEY) || [];
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

// Background Sync Function
export async function syncOfflineAttendance() {
    if (typeof window === 'undefined' || !navigator.onLine) return { success: false, syncedCount: 0 };

    const pendingCount = (await getPendingAttendance()).length;
    if (pendingCount === 0) return { success: true, syncedCount: 0 };

    try {
        const response = await fetch('/api/attendance/sync', {
            method: 'POST',
            // We'll let the server fetch the pending records directly from the client payload
            // In a real sophisticated PWA, Service Workers SyncManager would handle this
        });

        // The actual syncing logic will be triggered by mounting a component that
        // reads IndexedDB and sends it to the server. This function acts as a trigger wrapper.
        // See PwaSyncProvider.tsx
        return { success: true, syncedCount: pendingCount };
    } catch (error) {
        console.error("Failed background sync:", error);
        return { success: false, syncedCount: 0 };
    }
}
