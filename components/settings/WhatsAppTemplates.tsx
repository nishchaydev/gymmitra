import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

import { UseFormReturn, FieldValues, Path } from "react-hook-form"

interface WhatsAppFormValues {
    waWelcomeMsg?: string | null
    waInvoiceMsg?: string | null
    waRenewalMsg?: string | null
    waOverdueMsg?: string | null
}

export function WhatsAppTemplates<T extends FieldValues & WhatsAppFormValues>({ form, onSubmit, saving }: { 
    form: UseFormReturn<T>, 
    onSubmit: (data: T) => void, 
    saving: boolean 
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>WhatsApp Templates</CardTitle>
                <CardDescription>
                    Customize the default messages sent to your members via WhatsApp. Leave blank to use the system defaults.
                    <br />
                    <strong>Available Variables:</strong> <code className="bg-muted px-1 rounded">{'{name}'}</code> <code className="bg-muted px-1 rounded">{'{gymName}'}</code> <code className="bg-muted px-1 rounded">{'{amount}'}</code> <code className="bg-muted px-1 rounded">{'{daysLeft}'}</code> <code className="bg-muted px-1 rounded">{'{url}'}</code>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name={"waWelcomeMsg" as Path<T>}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Welcome Message Template</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Hi {name}, welcome to {gymName}! Aapka invoice: {url}"
                                            className="min-h-[100px]"
                                            {...field}
                                            value={field.value || ''}
                                        />
                                    </FormControl>
                                    <FormDescription>Sent when a new member is added. Available: {`{name}, {gymName}, {url}`}</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name={"waInvoiceMsg" as Path<T>}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Invoice Share Template</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Hi {name}, payment of Rs.{amount} target. Invoice: {url}"
                                            className="min-h-[100px]"
                                            {...field}
                                            value={field.value || ''}
                                        />
                                    </FormControl>
                                    <FormDescription>Sent when directly sharing an invoice receipt. Available: {`{name}, {amount}, {gymName}, {url}`}</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name={"waRenewalMsg" as Path<T>}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Renewal Reminder Template</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Hi {name}, your pass expires in {daysLeft} days!"
                                            className="min-h-[100px]"
                                            {...field}
                                            value={field.value || ''}
                                        />
                                    </FormControl>
                                    <FormDescription>Sent from intelligence tab for expiry. Available: {`{name}, {daysLeft}, {gymName}`}</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name={"waOverdueMsg" as Path<T>}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Payment Overdue Template</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Hi {name}, your balance is {amount}. Please clear."
                                            className="min-h-[100px]"
                                            {...field}
                                            value={field.value || ''}
                                        />
                                    </FormControl>
                                    <FormDescription>Sent from intelligence tab for pending payments. Available: {`{name}, {amount}, {gymName}`}</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Templates
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
