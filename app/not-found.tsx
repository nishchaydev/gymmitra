'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileQuestion, Home, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function NotFound() {
    const router = useRouter()

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-slate-50">
            <Card className="w-full max-w-md border-drift-200 shadow-xl overflow-hidden rounded-3xl">
                <div className="h-2 bg-primary" />
                <CardHeader className="text-center pt-10 pb-2">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 rotate-3">
                        <FileQuestion className="h-10 w-10 text-primary -rotate-3" />
                    </div>
                    <CardTitle className="text-3xl font-black tracking-tight text-slate-900 mb-2">404 - Page Not Found</CardTitle>
                    <CardDescription className="text-slate-500 font-medium px-4">
                        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6 pb-10">
                    <div className="flex flex-col gap-3">
                        <Button asChild className="w-full h-12 font-bold bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20">
                            <Link href="/">
                                <Home className="mr-2 h-5 w-5" /> Go to Homepage
                            </Link>
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => router.back()}
                            className="w-full h-12 font-bold text-slate-600 hover:bg-slate-100/80 rounded-xl"
                        >
                            <ArrowLeft className="mr-2 h-5 w-5" /> Go Back
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
