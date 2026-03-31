import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthGym, checkRole } from '@/lib/auth'
import { guardRateLimit } from '@/lib/rate-limit'
import { createAdminClient } from '@/lib/supabase/admin'
import { encryptPassword } from '@/lib/crypto'
import { Resend } from 'resend'
import { StaffCredentialEmail } from '@/components/emails/StaffCredentialEmail'
import { getBaseUrl } from '@/lib/utils'
import React from 'react'
import { randomBytes } from 'crypto'

const staffSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address").toLowerCase(),
    phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits").optional(),
    role: z.enum(['STAFF', 'TRAINER', 'MANAGER', 'FRONT_DESK']),
})

// Roles a MANAGER is allowed to create — prevents MANAGER privilege escalation
const MANAGER_ALLOWED_ROLES = new Set(['STAFF', 'TRAINER', 'FRONT_DESK'])

export async function GET(request: NextRequest) {
    try {
        const auth = await getAuthGym()
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const roleCheck = checkRole(auth, ['OWNER', 'MANAGER'])
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
                isFirstLogin: true,
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

        const roleCheck = checkRole(auth, ['OWNER', 'MANAGER'])
        if (roleCheck) return roleCheck

        const rl = await guardRateLimit(10, `${auth.userId}:staff:post`) // Tighter limit — creates auth users
        if (rl) return rl

        const body = await request.json()
        const result = staffSchema.safeParse(body)

        if (!result.success) {
            return NextResponse.json({ error: 'Validation failed', details: result.error.format() }, { status: 400 })
        }
        const validatedData = result.data

        // Privilege escalation guard: a MANAGER cannot create another MANAGER
        if (auth.role === 'MANAGER' && !MANAGER_ALLOWED_ROLES.has(validatedData.role)) {
            return NextResponse.json(
                { error: 'Managers cannot create staff members with the MANAGER role. Only the gym owner can do this.' },
                { status: 403 }
            )
        }

        // Duplicate check within this gym
        const existingStaff = await prisma.staffMember.findFirst({
            where: { email: validatedData.email, gymId: auth.gym.id }
        })

        if (existingStaff) {
            return NextResponse.json({ error: 'A staff member with this email already exists in your gym' }, { status: 400 })
        }

        // Generate a temporary password (10-char hex = 80-bits entropy)
        const tempPwd = randomBytes(5).toString('hex')

        // Create the Supabase auth user directly (no email verification needed)
        // This lets staff log in immediately with the credentials we send them
        const supabaseAdmin = createAdminClient()
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: validatedData.email,
            password: tempPwd,
            email_confirm: true, // Skip email OTP — we're sending creds ourselves
        })

        if (authError) {
            console.error('[Staff POST] Failed to create Supabase user:', authError)
            // Handle "user already exists" separately
            if (authError.message?.includes('already been registered')) {
                return NextResponse.json(
                    { error: 'This email is already registered in the system. Ask the staff member to log in directly.' },
                    { status: 400 }
                )
            }
            return NextResponse.json({ error: 'Failed to create staff account. Please try again.' }, { status: 500 })
        }

        const supabaseUserId = authData.user.id

        // Create StaffMember record linked to the real Supabase UID
        let newStaff
        try {
            newStaff = await prisma.staffMember.create({
                data: {
                    ...validatedData,
                    gymId: auth.gym.id,
                    userId: supabaseUserId,
                    isActive: true,
                    isFirstLogin: true,
                    tempPassword: encryptPassword(tempPwd),
                }
            })
        } catch (dbError: any) {
            // DB write failed — clean up the orphaned Supabase auth user so the email
            // can be re-invited later (otherwise Supabase permanently claims the address).
            console.error('[Staff POST] DB create failed, cleaning up Supabase user:', dbError)
            try {
                await supabaseAdmin.auth.admin.deleteUser(supabaseUserId)
            } catch (cleanupErr) {
                console.error('[Staff POST] Failed to clean up orphaned Supabase user:', cleanupErr)
            }
            if (dbError.code === 'P2002') {
                return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
            }
            return NextResponse.json({ error: 'Failed to create staff member' }, { status: 500 })
        }

        // Send credential email
        const resendKey = process.env.RESEND_API_KEY
        if (resendKey) {
            try {
                const resend = new Resend(resendKey)
                await resend.emails.send({
                    from: `${auth.gym.name} <hello@mail.emitra.dev>`,
                    to: validatedData.email,
                    subject: `Your login credentials for ${auth.gym.name}`,
                    react: React.createElement(StaffCredentialEmail, {
                        gymName: auth.gym.name,
                        gymLogo: auth.gym.logoUrl || auth.gym.logo,
                        staffName: validatedData.name,
                        role: validatedData.role,
                        email: validatedData.email,
                        temporaryPassword: tempPwd,
                        loginUrl: `${getBaseUrl()}/login`,
                    }) as React.ReactElement
                })
                console.log(`[Staff POST] Credentials emailed to ${validatedData.email}`)
            } catch (err) {
                // Email failure is non-fatal — staff record is created
                console.error('[Staff POST] Failed to send credential email:', err)
            }
        }

        return NextResponse.json(
            { ...newStaff, tempPassword: undefined }, // Never return encrypted password
            { status: 201 }
        )
    } catch (error) {
        console.error('[Staff POST] Error:', error)
        return NextResponse.json({ error: 'Failed to create staff member' }, { status: 500 })
    }
}
