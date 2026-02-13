"use client"

import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import type { ButtonProps } from "@/components/ui/button"

export function SubmitButton({ children, text = "Submit", loadingText = "Processing...", ...props }: ButtonProps & { text?: string, loadingText?: string }) {
    const { pending } = useFormStatus()

    return (
        <Button disabled={pending} type="submit" {...props}>
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {loadingText}
                </>
            ) : (
                children || text
            )}
        </Button>
    )
}
