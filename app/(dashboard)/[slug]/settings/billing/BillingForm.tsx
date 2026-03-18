"use client";

import { useState } from "react";
import { activateSubscription } from "@/app/actions/subscription";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Loader2, Key } from "lucide-react";

export function BillingForm() {
    const [code, setCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<{ type: "success" | "error" | null; message: string }>({ type: null, message: "" });

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!code.trim()) return;

        setIsLoading(true);
        setStatus({ type: null, message: "" });

        try {
            const result = await activateSubscription(code);
            if (result.success) {
                setStatus({
                    type: "success",
                    message: "Subscription successfully activated! Your account is now fully unlocked.",
                });
                setCode("");
            } else {
                setStatus({
                    type: "error",
                    message: result.error || "Failed to activate subscription.",
                });
            }
        } catch (error) {
            setStatus({
                type: "error",
                message: "An unexpected error occurred. Please try again or contact support.",
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card className="border-t-4 border-t-amber-500">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-amber-500" />
                    <CardTitle>Activate or Renew Subscription</CardTitle>
                </div>
                <CardDescription>
                    Enter your Registration Code or License Key provided by Emitra to activate or renew your PRO features.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="code">Activation Code</Label>
                        <Input
                            id="code"
                            placeholder="e.g. PRO-ABCD-1234-WXYZ"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            disabled={isLoading}
                            className="font-mono uppercase tracking-wider h-12 text-lg"
                        />
                    </div>
                    {status.type === "error" && (
                        <div 
                            role="alert" 
                            aria-atomic="true"
                            className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md"
                        >
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            <p>{status.message}</p>
                        </div>
                    )}
                    {status.type === "success" && (
                        <div 
                            role="alert" 
                            aria-atomic="true"
                            className="flex items-start gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-md border border-green-200"
                        >
                            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                            <p>{status.message}</p>
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    <Button 
                        type="submit" 
                        disabled={isLoading || !code.trim()} 
                        className="w-full sm:w-auto"
                        size="lg"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Activating...
                            </>
                        ) : (
                            "Activate License"
                        )}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
