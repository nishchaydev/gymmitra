import { login, signup, demoLogin } from './actions'
import { Button } from "@/components/ui/button"
import { SubmitButton } from "@/components/auth/SubmitButton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dumbbell, AlertCircle, Building2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default async function LoginPage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const searchParams = await props.searchParams
    const defaultTab = searchParams.view === 'register' ? 'register' : 'login'

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
                        <div className="bg-primary/10 p-3 rounded-full">
                            <Dumbbell className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
                    <CardDescription>
                        Login to your Gym Mitra ERP account
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
                    <Tabs defaultValue={defaultTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="login">Login</TabsTrigger>
                            <TabsTrigger value="register">Register</TabsTrigger>
                        </TabsList>
                        <TabsContent value="login">
                            <form className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" name="email" type="email" required placeholder="m@example.com" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input id="password" name="password" type="password" required />
                                </div>
                                <SubmitButton formAction={login} className="w-full" text="Log in" loadingText="Logging in..." />
                            </form>
                        </TabsContent>
                        <TabsContent value="register">
                            <form className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="register-email">Email</Label>
                                    <Input id="register-email" name="email" type="email" required placeholder="m@example.com" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="register-password">Password</Label>
                                    <Input id="register-password" name="password" type="password" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="license-key">License Key (Required)</Label>
                                    <Input id="license-key" name="license_key" type="text" required placeholder="Enter your purchase code" />
                                </div>
                                <SubmitButton formAction={signup} variant="secondary" className="w-full" text="Sign up" loadingText="Creating account..." />
                                <p className="text-xs text-center text-muted-foreground mt-2">
                                    By clicking sign up, you verify that you are an authorized gym administrator.
                                </p>
                            </form>
                        </TabsContent>
                    </Tabs>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4 border-t p-4">
                    <form className="w-full">
                        <Button variant="outline" className="w-full border-dashed border-primary/50 hover:bg-primary/5" formAction={demoLogin}>
                            Try Demo Access (One Click)
                        </Button>
                    </form>
                    <div className="flex items-center justify-center gap-4 text-center text-xs text-muted-foreground">
                        <span>&copy; {new Date().getFullYear()} Gym Mitra ERP</span>
                        <span className="h-3 w-px bg-slate-200" />
                        <div className="flex items-center gap-1.5 font-bold text-slate-400">
                            <Building2 className="h-3 w-3" />
                            <span>Powered by eMitra Technologies</span>
                        </div>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
