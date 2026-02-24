"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Loader2, UserPlus, Trash2, Mail, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const staffSchema = z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email"),
    phone: z.string().optional(),
    role: z.enum(['STAFF', 'TRAINER']),
})

type StaffFormValues = z.infer<typeof staffSchema>

type StaffMember = {
    id: string
    name: string
    email: string
    phone: string | null
    role: 'STAFF' | 'TRAINER'
    isActive: boolean
    createdAt: string
}

export function StaffManagement() {
    const [staff, setStaff] = useState<StaffMember[]>([])
    const [loading, setLoading] = useState(true)
    const [isInviteOpen, setIsInviteOpen] = useState(false)
    const [inviting, setInviting] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [idToDelete, setIdToDelete] = useState<string | null>(null)

    const form = useForm<StaffFormValues>({
        resolver: zodResolver(staffSchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            role: "TRAINER",
        },
    })

    const fetchStaff = async () => {
        try {
            const res = await fetch("/api/staff")
            if (res.ok) {
                const data = await res.json()
                setStaff(data)
            } else {
                toast.error("Failed to load staff list")
            }
        } catch (error) {
            toast.error("Error fetching staff")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStaff()
    }, [])

    const onSubmitPopup = async (data: StaffFormValues) => {
        setInviting(true)
        try {
            const response = await fetch("/api/staff", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || "Failed to invite staff")
            }

            toast.success("Staff member invited! Ask them to register with this email.")
            setIsInviteOpen(false)
            form.reset()
            fetchStaff()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setInviting(false)
        }
    }

    const deleteStaff = async (id: string) => {
        setDeletingId(id)
        try {
            const response = await fetch(`/api/staff/${id}`, {
                method: "DELETE",
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || "Failed to remove staff")
            }

            toast.success("Staff member removed")
            fetchStaff()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setDeletingId(null)
            setIdToDelete(null)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Team Management</h3>
                    <p className="text-sm text-muted-foreground">
                        Invite staff members and manage their access roles.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-xs text-slate-400 font-medium sm:hidden block italic">
                        Scroll ↔
                    </div>
                    <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                        <DialogTrigger asChild>
                            <Button className="flex items-center gap-2">
                                <UserPlus className="h-4 w-4" />
                                Invite Staff
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Invite New Staff</DialogTitle>
                                <DialogDescription>
                                    Add a new staff member to your gym. They will be linked automatically when they register with this email.
                                </DialogDescription>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmitPopup)} className="space-y-4 pt-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Full Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Jane Doe" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email Address</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="jane@yourgym.com" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="phone"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Phone</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="+91..." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="role"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Assigned Role</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select a role" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="TRAINER">Personal Trainer</SelectItem>
                                                            <SelectItem value="STAFF">Desk Staff</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <Button type="submit" className="w-full mt-2" disabled={inviting}>
                                        {inviting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                                        Send Invitation
                                    </Button>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="border rounded-md overflow-x-auto">
                <div className="min-w-[600px] sm:min-w-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : staff.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                                            <Users className="h-8 w-8 mb-2 opacity-20" />
                                            <p>No staff members found.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                staff.map((member) => (
                                    <TableRow key={member.id}>
                                        <TableCell>
                                            <div className="font-medium">{member.name}</div>
                                            <div className="text-xs text-muted-foreground">{member.email}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={member.role === 'TRAINER' ? "default" : "secondary"}>
                                                {member.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {member.isActive ? (
                                                <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50">Active</Badge>
                                            ) : (
                                                <Badge variant="outline" className="border-amber-500 text-amber-600 bg-amber-50">Pending Invite</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setIdToDelete(member.id)}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                disabled={deletingId === member.id}
                                                aria-label={`Remove ${member.name}`}
                                            >
                                                {deletingId === member.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <AlertDialog open={!!idToDelete} onOpenChange={(open: boolean) => !open && setIdToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove the staff member from your gym. They will lose access to
                            the dashboard and all management features immediately.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={!!deletingId}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e: React.MouseEvent) => {
                                e.preventDefault()
                                if (idToDelete) deleteStaff(idToDelete)
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            disabled={!!deletingId}
                        >
                            {deletingId ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Remove Staff
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
