import { login, signup } from './actions'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dumbbell } from "lucide-react"

export default function LoginPage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    const defaultTab = searchParams.view === 'register' ? 'register' : 'login'

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
                                <Button formAction={login} className="w-full">Log in</Button>
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
                                <Button formAction={signup} variant="secondary" className="w-full">Sign up</Button>
                                <p className="text-xs text-center text-muted-foreground mt-2">
                                    By clicking sign up, you verify that you are an authorized gym administrator.
                                </p>
                            </form>
                        </TabsContent>
                    </Tabs>
                </CardContent>
                <CardFooter className="flex justify-center border-t p-4 text-xs text-muted-foreground">
                    &copy; 2026 Gym Mitra ERP. All rights reserved.
                </CardFooter>
            </Card>
        </div>
    )
}
