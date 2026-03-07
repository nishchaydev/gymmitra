'use client'

import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle2, Loader2, Info } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { signup } from './actions'

// 1. Zod Schema for strong client-side validation
const signupSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Must contain at least one uppercase letter")
        .regex(/[a-z]/, "Must contain at least one lowercase letter")
        .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string(),
    license_key: z.string().min(5, "Registration code is required")
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
})

type SignupFormValues = z.infer<typeof signupSchema>

export function ClientRegistrationForm() {
    const [serverError, setServerError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isValid, touchedFields }
    } = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
        mode: "onChange",
        defaultValues: {
            email: '',
            password: '',
            confirmPassword: '',
            license_key: ''
        }
    })

    const password = watch("password", "")

    // Calculate password strength
    const getStrengthLabel = (pw: string) => {
        if (!pw) return { label: "", color: "bg-gray-200", width: "0%" }
        let score = 0
        if (pw.length >= 8) score++
        if (/[A-Z]/.test(pw)) score++
        if (/[0-9]/.test(pw)) score++
        if (/[^A-Za-z0-9]/.test(pw)) score++

        if (score === 0) return { label: "Very Weak", color: "bg-red-500", width: "25%" }
        if (score === 1 || score === 2) return { label: "Weak", color: "bg-orange-500", width: "50%" }
        if (score === 3) return { label: "Good", color: "bg-yellow-500", width: "75%" }
        return { label: "Strong", color: "bg-green-500", width: "100%" }
    }

    const strength = getStrengthLabel(password)

    const onSubmit = async (data: SignupFormValues) => {
        setIsSubmitting(true)
        setServerError(null)

        try {
            const formData = new FormData()
            formData.append('email', data.email)
            formData.append('password', data.password)
            formData.append('license_key', data.license_key)

            await signup(formData)
        } catch (err: any) {
            // Next.js redirect() throws a 'NEXT_REDIRECT' error. 
            // We should catch it and do nothing to allow the redirect to happen.
            if (err.message === 'NEXT_REDIRECT') {
                return;
            }
            console.error('Registration Error:', err)
            setServerError(err.message || "An unexpected error occurred.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
            {serverError && (
                <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Registration Failed</AlertTitle>
                    <AlertDescription>{serverError}</AlertDescription>
                </Alert>
            )}

            <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <div className="relative">
                    <Input
                        id="register-email"
                        type="email"
                        placeholder="m@example.com"
                        className={errors.email ? "border-red-500 pr-10" : (touchedFields.email && !errors.email ? "border-green-500 pr-10" : "")}
                        {...register("email")}
                    />
                    {touchedFields.email && !errors.email && <CheckCircle2 className="absolute right-3 top-2.5 h-4 w-4 text-green-500" />}
                </div>
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="register-password">Password</Label>
                <Input
                    id="register-password"
                    type="password"
                    className={errors.password ? "border-red-500" : ""}
                    {...register("password")}
                />

                {password && (
                    <div className="space-y-1 mt-1">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">Strength:</span>
                            <span className={`font-medium ${strength.color.replace('bg-', 'text-')}`}>{strength.label}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full ${strength.color} transition-all duration-300`} style={{ width: strength.width }}></div>
                        </div>
                    </div>
                )}

                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                    id="confirm-password"
                    type="password"
                    className={errors.confirmPassword ? "border-red-500" : ""}
                    {...register("confirmPassword")}
                />
                {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="license-key">Registration Code (Required)</Label>
                <Input
                    id="license-key"
                    type="text"
                    placeholder="Ex: GRO-AB12-CD34"
                    className={errors.license_key ? "border-red-500" : "font-mono uppercase"}
                    {...register("license_key")}
                />
                {errors.license_key ? (
                    <p className="text-xs text-red-500">{errors.license_key.message}</p>
                ) : (
                    <div className="text-xs flex items-center gap-1.5 text-muted-foreground bg-slate-50 p-2 rounded-md mt-1 border border-slate-100">
                        <Info className="h-3.5 w-3.5 text-slate-400" />
                        Plan applied based on code.
                    </div>
                )}
            </div>

            <Button type="submit" className="w-full mt-6" disabled={isSubmitting || !isValid}>
                {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating your account...
                    </>
                ) : (
                    "Complete Registration"
                )}
            </Button>

            <p className="text-xs text-center text-muted-foreground mt-2">
                By clicking &quot;Complete Registration&quot;, you confirm you are an authorized gym administrator.
            </p>
        </form>
    )
}
