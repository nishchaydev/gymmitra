import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { differenceInDays, addDays, isBefore, isAfter } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Returns the canonical app base URL.
 * Uses NEXT_PUBLIC_APP_URL env var (set to your custom domain) so
 * shared links always point to your domain, not gymmitra.vercel.app.
 */
export function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const prodUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.replace(/\/$/, "");
  const vUrl = process.env.VERCEL_URL?.replace(/\/$/, "");
  const isProd = process.env.NODE_ENV === "production";

  // 1. If we are in production and appUrl is localhost, we shouldn't use it
  if (isProd && appUrl?.includes("localhost")) {
    // Fall through
  } else if (appUrl) {
    return appUrl;
  }

  // 2. Vercel deployment detection - use provided production URL if available
  if (prodUrl) {
    return `https://${prodUrl.replace(/^https?:\/\//, "")}`;
  }

  // 3. Fallback to VERCEL_URL (usually for preview deployments)
  if (vUrl) {
    return `https://${vUrl.replace(/^https?:\/\//, "")}`;
  }

  if (process.env.NODE_ENV === "development") {
    return `http://localhost:${process.env.PORT || 3000}`;
  }

  // 4. Default fallback for this project
  return "https://gym.emitra.dev";
}

/**
 * Calculate member status dynamically based on expiry date and last check-in.
 * This is the single source of truth for member status.
 */
export function getMemberStatus(member: {
  expiryDate: Date | null;
  lastCheckIn: Date | null;
}): 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'INACTIVE' {
  const today = new Date();
  const sevenDaysFromNow = addDays(today, 7);
  
  if (!member.expiryDate) return 'INACTIVE';
  if (isBefore(member.expiryDate, today)) return 'EXPIRED';
  if (isBefore(member.expiryDate, sevenDaysFromNow) || isEqual(member.expiryDate, sevenDaysFromNow)) return 'EXPIRING_SOON';
  if (member.lastCheckIn && differenceInDays(today, member.lastCheckIn) > 30) return 'INACTIVE';
  return 'ACTIVE';
}

/**
 * Sync member statuses in the database with calculated status.
 * This should be run periodically to keep the status field accurate.
 */
export async function syncMemberStatuses(gymId: string) {
  // Import prisma here to avoid circular dependency issues
  const { prisma } = await import('./prisma');
   
  // Fetch members with their subscriptions and attendance
  const membersWithData = await prisma.member.findMany({
    where: { gymId },
    select: {
      id: true,
      status: true,
      subscriptions: {
        where: {
          status: 'ACTIVE'
        },
        orderBy: { endDate: 'desc' },
        take: 1,
        select: { endDate: true }
      },
      attendance: {
        orderBy: { date: 'desc' },
        take: 1,
        select: { date: true }
      }
    }
  });

  // Update each member's status based on calculated status
  for (const member of membersWithData) {
    // Get the active subscription's end date (expiry date)
    const expiryDate = member.subscriptions[0]?.endDate ?? null;
    // Get the last check-in date
    const lastCheckIn = member.attendance[0]?.date ?? null;
    
    // Calculate the status based on our business rules
    const calculatedStatus = getMemberStatus({
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      lastCheckIn: lastCheckIn ? new Date(lastCheckIn) : null
    });

    // Only update if the stored status has changed
    if (member.status !== calculatedStatus) {
      await prisma.member.update({
        where: { id: member.id },
        data: { status: calculatedStatus as any } // safe: values match MemberStatus enum; run `prisma generate` to fix types
      });
    }
  }
}

/**
 * Calculate days since a given date.
 * Returns null if date is invalid/unknown.
 * Returns 0 for future dates (never negative — callers expect non-negative).
 */
export function daysSince(date: Date | null | undefined): number | null {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  const diff = differenceInDays(new Date(), d);
  return Math.max(0, diff);
}

/**
 * Check if a date of birth matches today's month and day.
 * Single source of truth — replaces 3 duplicated checks across the dashboard.
 */
export function isBirthdayToday(dob: Date | string | null | undefined): boolean {
  if (!dob) return false;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return false;
  const today = new Date();
  return d.getDate() === today.getDate() && d.getMonth() === today.getMonth();
}

/**
 * Check if a birthday is upcoming within `withinDays` from now.
 * Used for "Upcoming Birthdays" widget.
 */
export function isBirthdayUpcoming(dob: Date | string | null | undefined, withinDays: number = 7): boolean {
  if (!dob) return false;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return false;
  const today = new Date();
  const thisYear = today.getFullYear();
  let nextBirthday = new Date(thisYear, d.getMonth(), d.getDate());
  if (nextBirthday < today) {
    nextBirthday = new Date(thisYear + 1, d.getMonth(), d.getDate());
  }
  const diff = differenceInDays(nextBirthday, today);
  return diff >= 0 && diff <= withinDays;
}

// Helper function for date equality checks
function isEqual(date1: Date, date2: Date): boolean {
  return date1.getTime() === date2.getTime();
}

/** App version — increment on each release for changelog tracking */
export const APP_VERSION = '1.0.0';

// ─── Leap Year & Date Safety (Enterprise) ─────────────────────

/**
 * Check if a year is a leap year.
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Safely parse a date string, handling Feb 29 on non-leap years
 * by rolling back to Feb 28. Prevents Invalid Date crashes.
 *
 * Use this for ALL user-provided dates (CSV imports, form inputs).
 */
export function safeParseDate(input: string | Date | null | undefined): Date | null {
  if (!input) return null;
  const d = new Date(input);
  if (isNaN(d.getTime())) {
    // Try manual parse for DD/MM/YYYY or DD-MM-YYYY format
    if (typeof input === 'string') {
      const parts = input.split(/[\/\-.]/);
      if (parts.length === 3) {
        const [day, month, year] = parts.map(Number);
        // Validate Feb 29 on non-leap year → roll to Feb 28
        if (month === 2 && day === 29 && !isLeapYear(year)) {
          return new Date(year, 1, 28); // Feb 28 fallback
        }
        const parsed = new Date(year, month - 1, day);
        return isNaN(parsed.getTime()) ? null : parsed;
      }
    }
    return null;
  }
  return d;
}

/**
 * Validate that a date range is logically correct:
 * - Start before end
 * - Dates are valid (no Invalid Date)
 * - Leap year safe
 * Returns an error string or null if valid.
 */
export function validateDateRange(
  start: Date | string | null,
  end: Date | string | null,
  labels: { start?: string; end?: string } = {}
): string | null {
  const startLabel = labels.start || 'Start date';
  const endLabel = labels.end || 'End date';
  
  const s = safeParseDate(start);
  const e = safeParseDate(end);
  
  if (start && !s) return `${startLabel} is invalid`;
  if (end && !e) return `${endLabel} is invalid`;
  if (s && e && s > e) return `${startLabel} must be before ${endLabel}`;
  
  return null;
}

