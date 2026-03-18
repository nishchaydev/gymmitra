'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { toast } from 'sonner'
import Link from 'next/link'

export function TrialRequest() {
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)
    
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        
        // Simulate sending a request
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        toast.success("Trial request sent successfully!")
        setIsSubmitted(true)
        setIsLoading(false)
    }
    
    if (isSubmitted) {
         return (
             <Card className="w-full max-w-md mx-auto">
                 <CardHeader>
                     <CardTitle className="text-center">Request Received!</CardTitle>
                 </CardHeader>
                 <CardContent className="text-center">
                     <p className="text-muted-foreground mb-4">
                         Thank you for your interest. Our team will review your request and send a trial key to your email shortly.
                     </p>
                     <Button asChild className="w-full">
                         <Link href="/">Return to Home</Link>
                     </Button>
                 </CardContent>
             </Card>
         )
    }

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Request a Trial Key</CardTitle>
                <CardDescription>
                    Fill out the form below to request a 30-day trial for your gym.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" required placeholder="John Doe" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" required placeholder="john@example.com" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="gymName">Gym Name</Label>
                        <Input id="gymName" required placeholder="FitLife Gym" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number (Optional)</Label>
                        <Input id="phone" type="tel" placeholder="+91 99999 99999" />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Submitting..." : "Request Trial"}
                    </Button>
                    <div className="text-sm text-center text-muted-foreground w-full">
                        Already have a key? <Link href="/register" className="text-primary hover:underline">Register here</Link>
                    </div>
                </CardFooter>
            </form>
        </Card>
    )
}
