'use client'

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CheckCircle2, XCircle, MoreVertical, ExternalLink, Calendar, MapPin } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

interface Gym {
    id: string
    name: string
    slug: string
    ownerName: string
    email: string
    phone: string
    city: string
    saasPlan: string
    planTier: string
    trialExpiresAt: string | null
    onboardingStep: number
    isVerified: boolean
    createdAt: string
    _count: { members: number }
}

interface Props {
    gyms: Gym[]
    onUpdate: () => void
}

export default function GymManagementTable({ gyms, onUpdate }: Props) {
    const [isUpdating, setIsUpdating] = useState<string | null>(null)

    const handleVerify = async (id: string) => {
        setIsUpdating(id)
        try {
            const res = await fetch('/api/admin/gyms', {
                method: 'PATCH',
                body: JSON.stringify({ id, isVerified: true })
            })
            if (res.ok) {
                toast.success('Gym verified successfully')
                onUpdate()
            } else {
                toast.error('Failed to verify gym')
            }
        } catch {
            toast.error('Network error')
        } finally {
            setIsUpdating(null)
        }
    }

    const getOnboardingStatus = (step: number) => {
        if (step >= 5) return { label: 'Finished', color: 'bg-green-100 text-green-700' }
        if (step === 0) return { label: 'New Signup', color: 'bg-slate-100 text-slate-700' }
        return { label: `Step ${step}/5`, color: 'bg-orange-100 text-orange-700' }
    }

    return (
        <div className="rounded-md border bg-white">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50">
                        <TableHead>Gym Details</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Plan & Status</TableHead>
                        <TableHead>Onboarding</TableHead>
                        <TableHead>Members</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {gyms.map((gym) => (
                        <TableRow key={gym.id} className="hover:bg-slate-50 transition-colors">
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-slate-900 flex items-center gap-1">
                                        {gym.name}
                                        {gym.isVerified && <CheckCircle2 className="w-3 h-3 text-blue-500 fill-blue-50" />}
                                    </span>
                                    <span className="text-xs text-slate-500">{gym.ownerName || 'No Owner Name'}</span>
                                    <span className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase">{gym.slug}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-1 text-slate-600 text-sm">
                                    <MapPin className="w-3 h-3" />
                                    {gym.city || 'Unknown'}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-[10px] h-4">
                                            {gym.saasPlan}
                                        </Badge>
                                        <Badge className={`text-[10px] h-4 ${gym.planTier === 'PRO' ? 'bg-indigo-500' : 'bg-slate-500'}`}>
                                            {gym.planTier}
                                        </Badge>
                                    </div>
                                    {gym.trialExpiresAt && (
                                        <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                            <Calendar className="w-3 h-3" />
                                            Exp: {format(new Date(gym.trialExpiresAt), 'MMM dd, yyyy')}
                                        </div>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge className={`text-[10px] font-medium border-0 ${getOnboardingStatus(gym.onboardingStep).color}`}>
                                    {getOnboardingStatus(gym.onboardingStep).label}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-1 font-medium text-slate-700">
                                    {gym._count.members}
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    {!gym.isVerified && (
                                        <Button 
                                            size="sm" 
                                            variant="secondary" 
                                            className="h-7 text-xs px-2"
                                            onClick={() => handleVerify(gym.id)}
                                            disabled={isUpdating === gym.id}
                                        >
                                            Verify
                                        </Button>
                                    )}
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button size="icon" variant="ghost" className="h-7 w-7" asChild>
                                                    <a href={`/${gym.slug}/dashboard`} target="_blank">
                                                        <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>View Dashboard</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
