import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthGym, checkRole } from '@/lib/auth'
import { guardRateLimit } from '@/lib/rate-limit'
import { Resend } from 'resend'
import { StaffInviteEmail } from '@/components/emails/StaffInviteEmail'
import React from 'react'

const staffSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address").toLowerCase(),
    phone: z.string().regex(/^\+?[\d\s-]{10,}$/, "Invalid phone format").optional(),
    role: z.enum(['STAFF', 'TRAINER']),
})

export async function GET(request: NextRequest) {
    try {
        const auth = await getAuthGym()
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const roleCheck = checkRole(auth, ['OWNER', 'ADMIN'])
        if (roleCheck) return roleCheck

        const rl = await guardRateLimit(50, `${auth.userId}:staff:get`)
        if (rl) return rl

        const staffMembers = await prisma.staffMember.findMany({
            where: { gymId: auth.gym.id },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                isActive: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(staffMembers)
    } catch (error) {
        console.error('[Staff GET] Error:', error)
        return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const auth = await getAuthGym()
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const roleCheck = checkRole(auth, ['OWNER', 'ADMIN'])
        if (roleCheck) return roleCheck

        const rl = await guardRateLimit(50, `${auth.userId}:staff:post`)
        if (rl) return rl

        const body = await request.json()
        const result = staffSchema.safeParse(body)

        if (!result.success) {
            return NextResponse.json({ error: 'Validation failed', details: result.error.format() }, { status: 400 })
        }
        const validatedData = result.data

        const existingStaff = await prisma.staffMember.findFirst({
            where: { email: validatedData.email, gymId: auth.gym.id }
        })

        if (existingStaff) {
            return NextResponse.json({ error: 'A staff member with this email already exists in your gym' }, { status: 400 })
        }

        const newStaff = await prisma.staffMember.create({
            data: {
                ...validatedData,
                gymId: auth.gym.id,
                userId: `pending_${crypto.randomUUID()}`,
                isActive: false
            }
        })

        // Send email invitation if Resend is configured
        const resendKey = process.env.RESEND_API_KEY
        if (resendKey) {
            try {
                const resend = new Resend(resendKey)
                const signupUrl = 'https://gymmitra.com/login?tab=signup' // adjust if needed

                await resend.emails.send({
                    from: `${auth.gym.name} <hello@mail.emitra.dev>`,
                    to: validatedData.email,
                    subject: `Invitation to join ${auth.gym.name}`,
                    react: React.createElement(StaffInviteEmail, {
                        gymName: auth.gym.name,
                        gymLogo: auth.gym.logoUrl || auth.gym.logo,
                        staffName: validatedData.name,
                        role: validatedData.role,
                        signupUrl: signupUrl
                    }) as React.ReactElement
                })
            } catch (err) {
                console.error('[Staff POST] Failed to send invite email:', err)
                // We don't fail the request if the email fails
            }
        }

        return NextResponse.json(newStaff, { status: 201 })
    } catch (error) {
        if ((error as any).code === 'P2002') {
            return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
        }
        console.error('[Staff POST] Error:', error)
        return NextResponse.json({ error: 'Failed to create staff member' }, { status: 500 })
    }
}
