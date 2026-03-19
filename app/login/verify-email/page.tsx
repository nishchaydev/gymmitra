import Link from 'next/link'
import { Mail, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function VerifyEmailPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md shadow-lg border-2 border-primary/10">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <Mail className="h-8 w-8 text-primary animate-pulse" />
                    </div>
                    <div className="space-y-2">
                        <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">
                            Verification Pending
                        </CardTitle>
                        <CardDescription className="text-base text-gray-500">
                            We've sent a verification link to your email address. 
                            Please click the link in the email to activate your account.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="text-center pb-8">
                    <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700 border border-blue-100 mb-6">
                        <p className="font-semibold">Didn't receive the email?</p>
                        <p className="mt-1">
                            Check your spam folder or try logging in again to trigger a new link.
                        </p>
                    </div>
                    
                    <div className="space-y-4">
                        <Button asChild className="w-full h-11 text-base font-medium transition-all hover:scale-[1.02] active:scale-[0.98]">
                            <Link href="https://mail.google.com" target="_blank" rel="noopener noreferrer">
                                Open Gmail
                            </Link>
                        </Button>
                        
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-gray-400">Or</span>
                            </div>
                        </div>

                        <Button variant="outline" asChild className="w-full h-11 text-base font-medium">
                            <Link href="/login" className="flex items-center justify-center gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                Back to Login
                            </Link>
                        </Button>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col items-center justify-center space-y-2 border-t bg-gray-50/50 py-6 rounded-b-xl">
                    <p className="text-sm text-gray-500">
                        Already verified? <Link href="/login" className="font-semibold text-primary hover:underline transition-colors">Log in here</Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
