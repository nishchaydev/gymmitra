import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export class AttendanceRepository {
    async findMemberById(id: string, gymId: string) {
        return prisma.member.findFirst({
            where: { id, gymId },
            include: {
                subscriptions: {
                    where: { deletedAt: null },
                    orderBy: { endDate: 'desc' },
                    take: 1
                }
            }
        })
    }

    async findStaffById(id: string, gymId: string) {
        return prisma.staffMember.findFirst({
            where: { id, gymId }
        })
    }

    async findExistingMemberAttendance(memberId: string, localDateString: string) {
        return prisma.attendance.findUnique({
            where: {
                memberId_localDateString: {
                    memberId,
                    localDateString
                }
            }
        })
    }

    async findExistingStaffAttendance(staffId: string, localDateString: string) {
        return prisma.attendance.findFirst({
            where: {
                staffId,
                localDateString
            }
        })
    }

    async createAttendance(data: any) {
        return prisma.attendance.create({
            data,
            select: {
                id: true,
                memberId: true,
                staffId: true,
                gymId: true,
                date: true,
                checkInTime: true,
                localDateString: true,
                member: {
                    select: {
                        name: true,
                        phone: true
                    }
                },
                staff: {
                    select: {
                        name: true,
                        phone: true,
                        role: true
                    }
                }
            }
        })
    }

    async getAttendanceByMemberId(memberId: string, gymId: string, skip: number, take: number) {
        return prisma.attendance.findMany({
            where: { memberId, gymId },
            orderBy: { date: 'desc' },
            skip,
            take
        })
    }

    async findManyMembersByIds(memberIds: string[], gymId: string) {
        return prisma.member.findMany({
            where: {
                id: { in: memberIds },
                gymId
            },
            select: { id: true }
        })
    }

    async createAttendanceOptimistic(data: any) {
        return prisma.attendance.create({ data })
    }

    async updateAttendanceTime(id: string, gymId: string, checkInTime: string, date: Date) {
        return prisma.attendance.update({
            where: { id, gymId },
            data: { checkInTime, date }
        })
    }
}

export const attendanceRepository = new AttendanceRepository()
