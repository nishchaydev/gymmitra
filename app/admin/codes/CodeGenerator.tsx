'use client'

import { useState } from 'react'
import { generateTrialCode, revokeCode } from './actions'
import { SaaSPlan } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Copy, Plus, XCircle } from 'lucide-react'

type CodeData = {
    id: string
    code: string
    plan: SaaSPlan
    maxUses: number
    usedCount: number
    expiresAt: Date | null
    isActive: boolean
    createdAt: Date
    gyms: { id: string, name: string, slug: string | null }[]
}

export default function CodeGenerator({ initialCodes }: { initialCodes: CodeData[] }) {
    const [codes, setCodes] = useState<CodeData[]>(initialCodes)
    const [isGenerating, setIsGenerating] = useState(false)
    const [plan, setPlan] = useState<SaaSPlan>('MAIN_PLAN')
    const [maxUses, setMaxUses] = useState(1)

    const handleGenerate = async () => {
        setIsGenerating(true)
        try {
            const result = await generateTrialCode({ plan, maxUses })
            
            if (result.success) {
                toast.success(`Generated code: ${result.code.code}`)
                // Refresh list
                window.location.reload()
            }
        } catch (error) {
            toast.error('Failed to generate code')
            console.error(error)
        } finally {
            setIsGenerating(false)
        }
    }

    const handleRevoke = async (id: string) => {
        try {
            const res = await revokeCode(id)
            if (res.success) {
                toast.success('Code revoked successfully')
                setCodes(codes.map(c => c.id === id ? { ...c, isActive: false } : c))
            }
        } catch (error) {
            toast.error('Failed to revoke code')
        }
    }

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code)
        toast.info('Code copied to clipboard')
    }

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Generate New Code</CardTitle>
                    <CardDescription>Create a new registration key</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="space-y-2 flex-grow">
                            <Label>Plan Type</Label>
                            <Select value={plan} onValueChange={(val) => setPlan(val as SaaSPlan)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select plan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TRIAL">Trial Plan (30 Days)</SelectItem>
                                    <SelectItem value="MAIN_PLAN">Main Plan (Premium)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 flex-grow">
                            <Label>Max Uses</Label>
                            <Input 
                                type="number" 
                                min={1} 
                                value={maxUses} 
                                onChange={(e) => setMaxUses(parseInt(e.target.value) || 1)} 
                            />
                        </div>
                        <Button onClick={handleGenerate} disabled={isGenerating} className="w-full md:w-auto">
                            <Plus className="w-4 h-4 mr-2" />
                            {isGenerating ? 'Generating...' : 'Generate Code'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Codes</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Uses</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {codes.map((code) => (
                                <TableRow key={code.id}>
                                    <TableCell className="font-mono font-medium">
                                        <div className="flex items-center gap-2">
                                            {code.code}
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyCode(code.code)}>
                                                <Copy className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={code.plan === 'MAIN_PLAN' ? 'default' : 'secondary'}>
                                            {code.plan.replace('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {code.usedCount} / {code.maxUses}
                                        {code.gyms.length > 0 && (
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {code.gyms.map(g => g.name).join(', ')}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {code.isActive && code.usedCount < code.maxUses ? (
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                                        ) : !code.isActive ? (
                                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Revoked</Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">Exhausted</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {new Date(code.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {code.isActive && (
                                            <Button variant="ghost" size="sm" onClick={() => handleRevoke(code.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                                <XCircle className="w-4 h-4 mr-1" /> Revoke
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {codes.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No codes generated yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
