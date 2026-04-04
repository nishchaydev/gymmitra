import { attendanceRepository } from './repository'
import { checkInSchema, CheckInInput } from './validator'
import { recordAuditLog } from '@/lib/audit-logger'
import { formatInTimeZone } from 'date-fns-tz'

export class AttendanceService {
    async checkIn(gymId: string, timezone: string, data: CheckInInput, userId: string, ip: string) {
        const { memberId } = checkInSchema.parse(data)
        const now = new Date()

        let member = await attendanceRepository.findMemberById(memberId, gymId)
        let staffMember = null

        if (!member) {
            staffMember = await attendanceRepository.findStaffById(memberId, gymId)
        }

        if (!member && !staffMember) {
            throw new Error('Member or Staff not found in this gym. Please check the ID.')
        }

        if (member) {
            let effectiveStatus = member.status
            const latestSub = member.subscriptions?.[0]

            if (latestSub && latestSub.endDate < now) {
                effectiveStatus = 'EXPIRED'
            }

            if (!['ACTIVE', 'EXPIRING_SOON'].includes(effectiveStatus)) {
                throw new Error(`Check-in denied. Membership has expired or is inactive.`)
            }
        }

        if (member && (member as any).memberState === 'PAUSED') {
            throw new Error('Check-in denied. Membership is currently paused. Please contact the gym.')
        }

        if (staffMember && !staffMember.isActive) {
            throw new Error(`Check-in denied. Staff member is inactive.`)
        }

        let localDateString: string
        try {
            localDateString = formatInTimeZone(now, timezone || 'Asia/Kolkata', 'yyyy-MM-dd')
        } catch (tzError) {
            console.warn(`Invalid timezone [${timezone}] for gym ${gymId}:`, tzError)
            throw new Error(`Invalid timezone configuration: ${timezone}`)
        }

        let existingAttendance;
        if (member) {
            existingAttendance = await attendanceRepository.findExistingMemberAttendance(member.id, localDateString)
        } else if (staffMember) {
            existingAttendance = await attendanceRepository.findExistingStaffAttendance(staffMember.id, localDateString)
        }

        if (existingAttendance) {
            throw new Error(`${member ? 'Member' : 'Staff'} already checked in today`)
        }

        const createData: any = {
            gym: { connect: { id: gymId } },
            date: now,
            checkInTime: now,
            localDateString: localDateString
        }

        if (member) {
            createData.member = { connect: { id: member.id } }
        }
        if (staffMember) {
            createData.staff = { connect: { id: staffMember.id } }
        }

        const attendance = await attendanceRepository.createAttendance(createData)

        const userName = member ? member.name : staffMember ? staffMember.name : "Unknown"

        await recordAuditLog({
            gymId,
            actorId: userId,
            action: 'CHECKIN_MEMBER' as any,
            entityType: 'ATTENDANCE',
            entityId: attendance.id,
            ipAddress: ip,
            payload: { scannedId: memberId, name: userName, isStaff: !!staffMember, localDateString }
        }).catch(err => console.error('Audit Log failed for CHECKIN_MEMBER', err))

        return {
            ...attendance,
            member: member ? attendance.member : { name: `${attendance.staff?.name} (${attendance.staff?.role})`, phone: attendance.staff?.phone || "" }
        }
    }

    async getMemberAttendance(memberId: string, gymId: string, skip: number, take: number) {
        const member = await attendanceRepository.findMemberById(memberId, gymId)
        if (!member) {
            throw new Error('Member not found or access denied')
        }

        return attendanceRepository.getAttendanceByMemberId(memberId, gymId, skip, take)
    }

    async syncOffline(gymId: string, timezone: string, records: any[]) {
        if (records.length === 0) return []

        const memberIds = [...new Set(records.map(r => r.memberId))]
        const members = await attendanceRepository.findManyMembersByIds(memberIds as string[], gymId)
        const validMemberIds = new Set(members.map(m => m.id))

        let validTimezone = timezone || 'Asia/Kolkata'
        try {
            formatInTimeZone(new Date(), validTimezone, 'yyyy-MM-dd')
        } catch (e) {
            console.warn(`[Sync-Offline] Invalid timezone ${validTimezone} for gym ${gymId}, falling back to Asia/Kolkata`)
            validTimezone = 'Asia/Kolkata'
        }

        const syncedIds: string[] = []

        for (const record of records) {
            if (!validMemberIds.has(record.memberId)) continue

            try {
                const checkInTimeDate = new Date(record.checkInTime)
                if (isNaN(checkInTimeDate.getTime())) {
                    throw new Error(`Invalid date: ${record.checkInTime}`)
                }

                let localDateString: string
                try {
                    localDateString = formatInTimeZone(checkInTimeDate, validTimezone, 'yyyy-MM-dd')
                } catch (e) {
                    const match = record.checkInTime.match(/([+-])(\d{2}):(\d{2})$/)
                    if (match) {
                        const sign = match[1] === '+' ? 1 : -1
                        const hours = parseInt(match[2], 10)
                        const mins = parseInt(match[3], 10)
                        const offsetMins = sign * (hours * 60 + mins)
                        const localTime = new Date(checkInTimeDate.getTime() + offsetMins * 60000)
                        localDateString = localTime.toISOString().split('T')[0]
                    } else {
                        console.warn(`[Sync-Offline] Cannot determine local date for ${record.checkInTime}, fallback to UTC`)
                        localDateString = checkInTimeDate.toISOString().split('T')[0]
                    }
                }

                try {
                    await attendanceRepository.createAttendanceOptimistic({
                        memberId: record.memberId,
                        gymId,
                        localDateString,
                        checkInTime: record.checkInTime,
                        date: checkInTimeDate
                    })
                } catch (createErr: any) {
                    if (createErr.code === 'P2002') {
                        const existing = await attendanceRepository.findExistingMemberAttendance(record.memberId, localDateString)
                        if (existing) {
                            const existingTime = new Date(existing.checkInTime)
                            if (checkInTimeDate < existingTime) {
                                await attendanceRepository.updateAttendanceTime(existing.id, gymId, record.checkInTime, checkInTimeDate)
                            }
                        }
                    } else {
                        throw createErr
                    }
                }

                syncedIds.push(record.id)
            } catch (err) {
                console.error(`[Sync] Failed record ${record.id}:`, err instanceof Error ? err.message : String(err))
            }
        }

        return syncedIds
    }
}

export const attendanceService = new AttendanceService()
