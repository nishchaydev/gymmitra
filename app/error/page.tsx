import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AlertCircle } from "lucide-react"

export default function ErrorPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md border-red-200">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <AlertCircle className="h-10 w-10 text-red-500" />
                    </div>
                    <CardTitle className="text-xl font-bold text-red-700">Authentication Error</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground">
                    <p>Sorry, something went wrong during the authentication process.</p>
                    <p className="text-sm mt-2">Please check your credentials and try again.</p>
                </CardContent>
                <CardFooter className="justify-center">
                    <Link href="/login">
                        <Button variant="secondary">Back to Login</Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    )
}
