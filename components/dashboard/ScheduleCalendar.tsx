"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { startOfWeek, endOfWeek, eachDayOfInterval, format, addWeeks, subWeeks, isSameDay, addMinutes, parseISO } from "date-fns"
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { ChevronLeft, ChevronRight, CalendarPlus, Loader2, Clock, MapPin, Trash2, CheckCircle, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const sessionSchema = z.object({
    trainerId: z.string().min(1, "Trainer is required"),
    memberId: z.string().min(1, "Member is required"),
    date: z.string().min(1, "Date is required"),
    startTime: z.string().min(1, "Start time is required"),
    durationMinutes: z.string().min(1, "Duration is required"),
    notes: z.string().optional()
})

type SessionFormValues = z.infer<typeof sessionSchema>

type Session = {
    id: string
    trainerId: string
    memberId: string
    startTime: string
    endTime: string
    status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
    notes: string | null
    trainer: { name: string }
    member: { name: string }
}

export function ScheduleCalendar({ role, currentUserId }: { role?: string, currentUserId?: string }) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [sessions, setSessions] = useState<Session[]>([])
    const [loading, setLoading] = useState(true)

    // Data for dropdowns
    const [trainers, setTrainers] = useState<{ id: string, name: string }[]>([])
    const [members, setMembers] = useState<{ id: string, name: string }[]>([])

    const [isBookingOpen, setIsBookingOpen] = useState(false)
    const [booking, setBooking] = useState(false)

    const form = useForm<SessionFormValues>({
        resolver: zodResolver(sessionSchema),
        defaultValues: {
            date: format(new Date(), 'yyyy-MM-dd'),
            startTime: "09:00",
            durationMinutes: "60",
            notes: ""
        }
    })

    const fetchSchedule = async (date: Date) => {
        setLoading(true)
        try {
            const start = startOfWeek(date, { weekStartsOn: 1 })
            const end = endOfWeek(date, { weekStartsOn: 1 })

            // Note: In a real app we would pass ?start=...&end=... to limit payload size
            const res = await fetch(`/api/schedule?start=${start.toISOString()}&end=${end.toISOString()}`)
            if (res.ok) {
                const data = await res.json()
                setSessions(data)
            }
        } catch (error) {
            toast.error("Failed to load schedule")
        } finally {
            setLoading(false)
        }
    }

    const fetchDropdownData = async () => {
        try {
            const [staffRes, membersRes] = await Promise.all([
                fetch("/api/staff"),
                fetch("/api/members")
            ])

            if (staffRes.ok) {
                const staffData = await staffRes.json()
                // Only TR's who are active
                setTrainers(staffData.filter((s: any) => s.role === 'TRAINER' && s.isActive))
            }

            if (membersRes.ok) {
                const membersData = await membersRes.json()
                setMembers(membersData.items || membersData)
            }
        } catch (error) {
            console.error(error)
        }
    }

    useEffect(() => {
        fetchSchedule(currentDate)
        fetchDropdownData()
    }, [currentDate])

    const handlePreviousWeek = () => setCurrentDate(subWeeks(currentDate, 1))
    const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1))
    const handleToday = () => setCurrentDate(new Date())

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
    const daysInterval = eachDayOfInterval({ start: weekStart, end: weekEnd })

    const onSubmit = async (data: SessionFormValues) => {
        setBooking(true)
        try {
            // Combine date and time strings to actual ISO Date
            const startDateTime = new Date(`${data.date}T${data.startTime}:00`)
            const endDateTime = addMinutes(startDateTime, parseInt(data.durationMinutes))

            const response = await fetch("/api/schedule", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    trainerId: data.trainerId,
                    memberId: data.memberId,
                    startTime: startDateTime.toISOString(),
                    endTime: endDateTime.toISOString(),
                    notes: data.notes
                }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || "Failed to book session")
            }

            toast.success("Session booked successfully")
            setIsBookingOpen(false)
            form.reset()
            fetchSchedule(currentDate)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setBooking(false)
        }
    }

    const updateStatus = async (id: string, status: string) => {
        try {
            const response = await fetch(`/api/schedule/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status })
            })
            if (response.ok) {
                toast.success(`Session marked as ${status.toLowerCase()}`)
                fetchSchedule(currentDate)
            }
        } catch (e) {
            toast.error("Status update failed")
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'SCHEDULED': return 'bg-blue-100 text-blue-700 border-blue-200'
            case 'COMPLETED': return 'bg-green-100 text-green-700 border-green-200'
            case 'CANCELLED': return 'bg-slate-100 text-slate-500 border-slate-200'
            case 'NO_SHOW': return 'bg-amber-100 text-amber-700 border-amber-200'
            default: return 'bg-gray-100 text-gray-700 border-gray-200'
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border shadow-sm">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={handlePreviousWeek}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="font-semibold px-4 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-md whitespace-nowrap hidden sm:block">
                        {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
                    </div>
                    <Button variant="outline" size="icon" onClick={handleNextWeek}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" onClick={handleToday} className="ml-2">
                        Today
                    </Button>
                </div>

                <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
                    <DialogTrigger asChild>
                        <Button className="w-full sm:w-auto">
                            <CalendarPlus className="mr-2 h-4 w-4" />
                            Book Session
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Book PT Session</DialogTitle>
                            <DialogDescription>
                                Schedule a new session with a personal trainer.
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="trainerId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Trainer</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select Trainer..." />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {trainers.map(t => (
                                                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="memberId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Member</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select Member..." />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {members.map(m => (
                                                            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Date</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="startTime"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Start Time</FormLabel>
                                                <FormControl>
                                                    <Input type="time" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="durationMinutes"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Duration</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Duration" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="30">30 minutes</SelectItem>
                                                        <SelectItem value="45">45 minutes</SelectItem>
                                                        <SelectItem value="60">1 hour</SelectItem>
                                                        <SelectItem value="90">1.5 hours</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="notes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Notes (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="E.g. Focus on upper body..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full mt-2" disabled={booking}>
                                    {booking && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                    Confirm Booking
                                </Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-white dark:bg-slate-900 border rounded-xl shadow-sm overflow-x-auto">
                <div className="min-w-[800px]">
                    <div className="grid grid-cols-7 border-b bg-slate-50 dark:bg-slate-800/50 rounded-t-xl">
                        {daysInterval.map((day, i) => {
                            const isToday = isSameDay(day, new Date())
                            return (
                                <div key={i} className={`p-3 text-center border-r last:border-r-0 ${isToday ? 'bg-primary/5' : ''}`}>
                                    <div className={`text-xs font-semibold uppercase tracking-wider ${isToday ? 'text-primary' : 'text-slate-500'}`}>
                                        {format(day, 'EEE')}
                                    </div>
                                    <div className={`text-2xl font-black mt-0.5 ${isToday ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>
                                        {format(day, 'd')}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {loading ? (
                        <div className="h-64 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mr-3" />
                            <span className="text-muted-foreground font-medium">Loading schedule...</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-7 min-h-[400px] divide-x">
                            {daysInterval.map((day, diaIdx) => {
                                // Filter sessions for this column
                                const daySessions = sessions.filter(s => isSameDay(parseISO(s.startTime), day))

                                return (
                                    <div key={diaIdx} className="p-2 space-y-2 relative group min-h-[100px] hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                        {daySessions.map(session => (
                                            <div
                                                key={session.id}
                                                className={`p-2.5 rounded-lg border text-sm shadow-sm flex flex-col gap-1.5 transition-all hover:shadow-md cursor-pointer ${getStatusColor(session.status)}`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <span className="font-bold flex items-center gap-1.5">
                                                        <Clock className="w-3.5 h-3.5 opacity-70" />
                                                        {format(parseISO(session.startTime), 'h:mm a')}
                                                    </span>
                                                    {(role === 'OWNER' || session.status === 'SCHEDULED') && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); updateStatus(session.id, 'COMPLETED') }}
                                                            className="opacity-50 hover:opacity-100 transition-opacity"
                                                            title="Mark Completed"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="font-medium text-slate-900 border-l-2 border-current pl-2 mt-1 truncate" title={session.member.name}>
                                                    {session.member.name}
                                                </div>
                                                <div className="text-xs opacity-80 flex items-center gap-1 font-semibold truncate" title={session.trainer.name}>
                                                    By {session.trainer.name}
                                                </div>
                                            </div>
                                        ))}
                                        {daySessions.length === 0 && (
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">+ Slot</span>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
