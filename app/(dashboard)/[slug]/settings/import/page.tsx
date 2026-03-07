"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { ChevronLeft, Upload, Loader2, Check, AlertCircle } from "lucide-react"
import Link from "next/link"
import { importMembers } from "../../members/actions"

// Helper to parse CSV (Basic implementation)
function parseCSV(text: string) {
    const lines = text.split(/\r?\n/).filter(line => line.trim())
    if (lines.length === 0) return []
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    return lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim())
        const obj: any = {}
        headers.forEach((header, i) => {
            obj[header] = values[i] || ""
        })
        return obj
    })
}

export default function MemberImportPage() {
    const router = useRouter()
    const { slug } = useParams() as { slug: string }
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<any[]>([])
    const [isParsing, setIsParsing] = useState(false)
    const [isImporting, setIsImporting] = useState(false)
    const [result, setResult] = useState<{
        imported: number,
        skippedDuplicate: number,
        skippedPlanNotFound: number,
        skippedInvalidData: number
    } | null>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return

        if (!selectedFile.name.endsWith('.csv')) {
            toast.error("Please upload a CSV file")
            return
        }

        setFile(selectedFile)
        setIsParsing(true)
        setResult(null)

        try {
            const text = await selectedFile.text()
            const data = parseCSV(text)
            if (data.length > 1000) {
                toast.error("Maximum 1000 rows allowed")
                setPreview([])
            } else {
                setPreview(data)
            }
        } catch (error) {
            toast.error("Failed to parse CSV")
        } finally {
            setIsParsing(false)
        }
    }

    const handleImport = async () => {
        if (!preview.length) return

        setIsImporting(true)
        try {
            const res = await importMembers(preview)
            if (res.error) {
                toast.error(res.error)
            } else {
                setResult({
                    imported: res.imported || 0,
                    skippedDuplicate: res.skippedDuplicate || 0,
                    skippedPlanNotFound: res.skippedPlanNotFound || 0,
                    skippedInvalidData: res.skippedInvalidData || 0
                })
                toast.success("Import completed")
            }
        } catch (error) {
            toast.error("Import failed")
        } finally {
            setIsImporting(false)
        }
    }

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-4xl">
            <div className="flex items-center gap-4 mb-8">
                <Link href={`/${slug}/settings`}>
                    <Button variant="ghost" size="icon">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold">Import Members</h1>
            </div>

            <Card className="mb-8 border-amber-200 bg-amber-50/30">
                <CardHeader>
                    <div className="flex items-center gap-2 text-amber-800">
                        <AlertCircle className="h-5 w-5" />
                        <CardTitle className="text-lg">IMPORTANT: CSV Format Requirement</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="text-amber-900">
                    <p className="mb-2">Your Excel/CSV file <strong>MUST</strong> have these exact column headers:</p>
                    <div className="flex flex-wrap gap-2 text-xs font-mono">
                        {['name', 'phone', 'email', 'joindate', 'planname', 'expirydate'].map(col => (
                            <span key={col} className="bg-white border border-amber-200 px-2 py-1 rounded">
                                {col}
                            </span>
                        ))}
                    </div>
                    <p className="mt-4 text-sm font-medium">Note: Rows with unknown plan names will be skipped to ensure data integrity.</p>
                </CardContent>
            </Card>

            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Step 1: Upload CSV</CardTitle>
                    <CardDescription>
                        Select your member list file (max 1000 rows).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid w-full items-center gap-4">
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="csv-file">Choose CSV File</Label>
                            <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} disabled={isImporting} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {preview.length > 0 && !result && (
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Step 2: Preview & Confirm</CardTitle>
                        <CardDescription>
                            Showing first 5 rows of {preview.length} members found.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto border rounded-md mb-6">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 border-b">
                                    <tr>
                                        <th className="px-4 py-2">Name</th>
                                        <th className="px-4 py-2">Phone</th>
                                        <th className="px-4 py-2">Email</th>
                                        <th className="px-4 py-2">Plan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {preview.slice(0, 5).map((row, i) => (
                                        <tr key={i} className="border-b last:border-0 font-medium">
                                            <td className="px-4 py-2">{row.name}</td>
                                            <td className="px-4 py-2">{row.phone}</td>
                                            <td className="px-4 py-2">{row.email || "-"}</td>
                                            <td className="px-4 py-2">{row.planname || "-"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Button onClick={handleImport} disabled={isImporting} className="w-full h-12 text-lg">
                            {isImporting ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Importing {preview.length} members...
                                </>
                            ) : (
                                <>
                                    <Check className="mr-2 h-5 w-5" />
                                    Confirm Import
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {result && (
                <Card className="border-blue-200 bg-blue-50/30">
                    <CardHeader>
                        <CardTitle className="text-blue-900 flex items-center">
                            <Check className="mr-2 h-6 w-6 text-green-600" />
                            Import Results
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-white border border-green-200 rounded-lg shadow-sm">
                                <span className="text-sm font-bold text-green-600 uppercase tracking-wider block mb-1">Imported</span>
                                <span className="text-3xl font-black text-slate-900">{result.imported}</span>
                            </div>
                            <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                                <span className="text-sm font-bold text-slate-500 uppercase tracking-wider block mb-1">Total Processed</span>
                                <span className="text-3xl font-black text-slate-900">{preview.length}</span>
                            </div>
                        </div>

                        <div className="space-y-2 mt-6">
                            {result.skippedDuplicate > 0 && (
                                <div className="text-amber-700 flex items-center bg-amber-50 p-3 rounded-md border border-amber-200 text-sm">
                                    <AlertCircle className="mr-2 h-4 w-4 text-amber-500" />
                                    {result.skippedDuplicate} members skipped (Phone number already exists).
                                </div>
                            )}
                            {result.skippedPlanNotFound > 0 && (
                                <div className="text-rose-700 flex items-center bg-rose-50 p-3 rounded-md border border-rose-200 text-sm">
                                    <AlertCircle className="mr-2 h-4 w-4 text-rose-500" />
                                    {result.skippedPlanNotFound} members skipped (Plan name not found in your gym).
                                </div>
                            )}
                            {result.skippedInvalidData > 0 && (
                                <div className="text-slate-500 flex items-center bg-slate-100 p-3 rounded-md border border-slate-200 text-sm">
                                    <AlertCircle className="mr-2 h-4 w-4 text-slate-400" />
                                    {result.skippedInvalidData} members skipped (Missing required name or phone).
                                </div>
                            )}
                        </div>

                        <div className="pt-6 flex gap-4">
                            <Link href={`/${slug}/members`}>
                                <Button className="bg-midnight hover:bg-midnight/90">Go to Member List</Button>
                            </Link>
                            <Button variant="outline" onClick={() => {
                                setResult(null)
                                setPreview([])
                                setFile(null)
                            }}>Import Another File</Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
