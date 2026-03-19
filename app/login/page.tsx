import { login, signup, demoLogin } from './actions'
import { Button } from "@/components/ui/button"
import { SubmitButton } from "@/components/auth/SubmitButton"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import Image from "next/image"
import { AlertCircle, Building2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default async function LoginPage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const searchParams = await props.searchParams

    const getErrorMessage = (msg: string | string[] | undefined) => {
        if (!msg) return null
        const message = Array.isArray(msg) ? msg[0] : msg
        if (message.includes("security purposes")) {
            return "Too many attempts. Please wait a minute before trying again."
        }
        return message
    }

    const errorMessage = getErrorMessage(searchParams.message)

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="bg-primary/10 p-2.5 rounded-full">
                            <Image
                                src="/icon.png"
                                alt="GymMitra Logo"
                                width={32}
                                height={32}
                                className="rounded-lg object-contain"
                            />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
                    <CardDescription>
                        Login to your GymMitra account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {errorMessage && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>
                                {errorMessage}
                            </AlertDescription>
                        </Alert>
                    )}
                    <form className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" required placeholder="m@example.com" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" name="password" type="password" required />
                        </div>
                        <div className="flex justify-end">
                            <a href="/forgot-password" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                                Forgot Password?
                            </a>
                        </div>
                        <SubmitButton formAction={login} className="w-full" text="Log in" loadingText="Logging in..." />
                    </form>
                    
                    <div className="mt-6 text-center text-sm">
                        <p className="text-center text-sm text-drift-500 font-medium">
                            Don&apos;t have an account?{" "}
                            <Link href="/start-trial" className="font-medium text-primary hover:underline transition-colors">
                                Start 30-day free trial
                            </Link>
                        </p>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4 border-t p-4">
                    <form className="w-full">
                        <Button variant="outline" className="w-full border-dashed border-primary/50 hover:bg-primary/5" formAction={demoLogin}>
                            Try Demo Access (One Click)
                        </Button>
                    </form>
                    <div className="flex items-center justify-center gap-4 text-center text-xs text-muted-foreground">
                        <span>&copy; {new Date().getFullYear()} GymMitra</span>
                        <span className="h-3 w-px bg-slate-200 dark:bg-slate-700" />
                        <div className="flex items-center gap-1.5 font-bold text-slate-400 dark:text-slate-300">
                            <Building2 className="h-3 w-3" />
                            <span>Powered by eMitra Technologies</span>
                        </div>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
