"use client"

import { useState, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { ChevronLeft, Upload, Loader2, Check, AlertCircle, Download } from "lucide-react"
import Link from "next/link"
import { importMembers } from "../../members/actions"
import Papa from "papaparse"
import * as XLSX from "xlsx"

/**
 * Client-side phone normalizer — mirrors the server-side logic
 * so validation preview matches actual import behaviour.
 */
function normalizePhone(raw: string): string | null {
    let digits = raw.replace(/[^\d]/g, '')
    if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2)
    if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1)
    return digits.length === 10 ? digits : null
}

type ValidationResult = {
    readyRows: any[]
    issues: { row: any; reason: string }[]
    dupCount: number
    invalidCount: number
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
        skippedInvalidData: number,
        failedRows: { row: any; reason: string }[]
    } | null>(null)

    // Client-side validation preview
    const validation = useMemo<ValidationResult | null>(() => {
        if (!preview.length) return null

        const readyRows: any[] = []
        const issues: { row: any; reason: string }[] = []
        let dupCount = 0
        let invalidCount = 0
        const seenPhones = new Set<string>()

        for (const row of preview) {
            const name = String(row.name || "").trim()
            const rawPhone = String(row.phone || "").trim()

            if (!name) {
                invalidCount++
                issues.push({ row, reason: "Missing name" })
                continue
            }

            const phone = normalizePhone(rawPhone)
            if (!phone) {
                invalidCount++
                issues.push({ row, reason: `Invalid phone: "${rawPhone}"` })
                continue
            }

            if (seenPhones.has(phone)) {
                dupCount++
                issues.push({ row, reason: `Duplicate phone in file: ${phone}` })
                continue
            }

            seenPhones.add(phone)
            readyRows.push(row)
        }

        return { readyRows, issues, dupCount, invalidCount }
    }, [preview])

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return

        const isCSV = selectedFile.name.endsWith('.csv')
        const isExcel = selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')

        if (!isCSV && !isExcel) {
            toast.error("Please upload a CSV or Excel file (.csv, .xlsx, .xls)")
            return
        }

        setFile(selectedFile)
        setPreview([])
        setIsParsing(true)
        setResult(null)

        try {
            if (isCSV) {
                Papa.parse(selectedFile, {
                    header: true,
                    skipEmptyLines: true,
                    transformHeader: (header) => header.trim().toLowerCase(),
                    complete: function (results) {
                        processParsedData(results.data, results.meta.fields || [])
                    },
                    error: function (error: any) {
                        toast.error("Failed to parse CSV: " + error.message)
                        setIsParsing(false)
                    }
                })
            } else {
                const reader = new FileReader()
                reader.onload = (evt) => {
                    const bstr = evt.target?.result
                    const wb = XLSX.read(bstr, { type: 'binary' })
                    const wsname = wb.SheetNames[0]
                    const ws = wb.Sheets[wsname]
                    const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[]

                    if (data.length === 0) {
                        toast.error("Excel file is empty")
                        setIsParsing(false)
                        return
                    }

                    const rawHeaders = data[0] as string[]
                    const headers = rawHeaders.map(h => String(h || "").trim().toLowerCase())
                    const rows = data.slice(1)
                        .filter((row: any[]) => row && row.length > 0 && row.some(cell => cell !== undefined && cell !== null && String(cell).trim() !== ""))
                        .map((row: any[]) => {
                            const obj: any = {}
                            headers.forEach((header, index) => {
                                obj[header] = row[index]
                            })
                            return obj
                        })

                    processParsedData(rows, headers)
                }
                reader.onerror = () => {
                    toast.error("Failed to read Excel file")
                    setIsParsing(false)
                }
                reader.readAsBinaryString(selectedFile)
            }
        } catch (err) {
            toast.error("Parsing failed")
            setIsParsing(false)
        }
    }

    const processParsedData = (data: any[], headers: string[]) => {
        const REQUIRED_HEADERS = ['name', 'phone', 'email', 'joindate', 'planname', 'expirydate']
        const missingHeaders = REQUIRED_HEADERS.filter(h => !headers.includes(h))

        if (missingHeaders.length > 0) {
            toast.error(`Missing required headers: ${missingHeaders.join(', ')}`)
            setPreview([])
            setIsParsing(false)
            return
        }

        if (data.length > 1000) {
            toast.error("Maximum 1000 rows allowed per import")
            setPreview([])
        } else {
            setPreview(data)
        }
        setIsParsing(false)
    }

    const handleImport = async () => {
        if (!preview.length) return

        setIsImporting(true)
        try {
            const res = await importMembers(preview)
            if (res.error) {
                toast.error(res.error)
            }
            // Always set result — even with partial error we have counts
            setResult({
                imported: res.imported || 0,
                skippedDuplicate: res.skippedDuplicate || 0,
                skippedPlanNotFound: res.skippedPlanNotFound || 0,
                skippedInvalidData: res.skippedInvalidData || 0,
                failedRows: res.failedRows || []
            })
            if ((res.imported || 0) > 0) {
                toast.success(`${res.imported} members imported successfully!`)
            }
        } catch (error) {
            toast.error("Import failed — please try again")
        } finally {
            setIsImporting(false)
        }
    }

    const downloadFailedCSV = () => {
        if (!result?.failedRows?.length) return

        const csvRows = result.failedRows.map(f => ({
            name: f.row.name || '',
            phone: f.row.phone || '',
            email: f.row.email || '',
            planname: f.row.planname || '',
            joindate: f.row.joindate || '',
            expirydate: f.row.expirydate || '',
            reason: f.reason
        }))

        const csv = Papa.unparse(csvRows)
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `failed-import-rows-${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    const totalSkipped = result
        ? result.skippedDuplicate + result.skippedPlanNotFound + result.skippedInvalidData
        : 0

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
                        <CardTitle className="text-lg">IMPORTANT: CSV/Excel Format Requirement</CardTitle>
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
                    <p className="mt-3 text-sm"><strong>Optional columns:</strong></p>
                    <div className="flex flex-wrap gap-2 text-xs font-mono mt-1">
                        {['city', 'dob'].map(col => (
                            <span key={col} className="bg-white border border-green-200 px-2 py-1 rounded text-green-800">
                                {col}
                            </span>
                        ))}
                    </div>
                    <p className="mt-4 text-sm font-medium">Phone formats accepted: 9876543210, +91 98765 43210, 098-7654-3210</p>
                </CardContent>
            </Card>

            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Step 1: Upload File</CardTitle>
                    <CardDescription>
                        Select your member list CSV or Excel file (max 1000 rows).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid w-full items-center gap-4">
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="member-file">Choose CSV or Excel File</Label>
                            <Input id="member-file" type="file" accept=".csv, .xlsx, .xls" onChange={handleFileChange} disabled={isImporting} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* VALIDATION PREVIEW */}
            {validation && !result && (
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Step 2: Validation Preview</CardTitle>
                        <CardDescription>
                            {preview.length} rows parsed from file
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Summary badges */}
                        <div className="flex flex-wrap gap-3 mb-6">
                            <div className="flex items-center gap-2 bg-green-50 border border-green-200 px-4 py-2 rounded-lg">
                                <Check className="h-4 w-4 text-green-600" />
                                <span className="font-bold text-green-800">{validation.readyRows.length}</span>
                                <span className="text-green-700 text-sm">rows ready</span>
                            </div>
                            {validation.issues.length > 0 && (
                                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2 rounded-lg">
                                    <AlertCircle className="h-4 w-4 text-amber-600" />
                                    <span className="font-bold text-amber-800">{validation.issues.length}</span>
                                    <span className="text-amber-700 text-sm">will be skipped</span>
                                </div>
                            )}
                        </div>

                        {/* Issue breakdown */}
                        {validation.issues.length > 0 && (
                            <div className="mb-6 space-y-1">
                                {validation.invalidCount > 0 && (
                                    <p className="text-sm text-slate-600">• {validation.invalidCount} rows with invalid/missing name or phone</p>
                                )}
                                {validation.dupCount > 0 && (
                                    <p className="text-sm text-slate-600">• {validation.dupCount} duplicate phone numbers within file</p>
                                )}
                                <p className="text-xs text-slate-400 mt-2">Note: Duplicate/plan checks against your database happen during import.</p>
                            </div>
                        )}

                        {/* Preview table */}
                        <div className="overflow-x-auto border rounded-md mb-6">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 border-b">
                                    <tr>
                                        <th className="px-4 py-2">Name</th>
                                        <th className="px-4 py-2">Phone</th>
                                        <th className="px-4 py-2">Email</th>
                                        <th className="px-4 py-2">City</th>
                                        <th className="px-4 py-2">Plan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {preview.slice(0, 5).map((row, i) => (
                                        <tr key={i} className="border-b last:border-0 font-medium">
                                            <td className="px-4 py-2">{row.name}</td>
                                            <td className="px-4 py-2">{row.phone}</td>
                                            <td className="px-4 py-2">{row.email || "-"}</td>
                                            <td className="px-4 py-2">{row.city || "-"}</td>
                                            <td className="px-4 py-2">{row.planname || "-"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {preview.length > 5 && (
                                <div className="text-center py-2 text-xs text-slate-400 bg-slate-50 border-t">
                                    ...and {preview.length - 5} more rows
                                </div>
                            )}
                        </div>

                        <Button onClick={handleImport} disabled={isImporting || validation.readyRows.length === 0} className="w-full h-12 text-lg">
                            {isImporting ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Importing {preview.length} members...
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-5 w-5" />
                                    Import {validation.readyRows.length} Members
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* IMPORT RESULTS */}
            {result && (
                <Card className="border-blue-200 bg-blue-50/30">
                    <CardHeader>
                        <CardTitle className="text-blue-900 flex items-center">
                            <Check className="mr-2 h-6 w-6 text-green-600" />
                            Import Complete
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Big numbers */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-white border border-green-200 rounded-lg shadow-sm">
                                <span className="text-sm font-bold text-green-600 uppercase tracking-wider block mb-1">Imported</span>
                                <span className="text-3xl font-black text-slate-900">{result.imported}</span>
                            </div>
                            <div className="p-4 bg-white border border-amber-200 rounded-lg shadow-sm">
                                <span className="text-sm font-bold text-amber-600 uppercase tracking-wider block mb-1">Skipped</span>
                                <span className="text-3xl font-black text-slate-900">{totalSkipped}</span>
                            </div>
                            <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                                <span className="text-sm font-bold text-slate-500 uppercase tracking-wider block mb-1">Total Rows</span>
                                <span className="text-3xl font-black text-slate-900">{preview.length}</span>
                            </div>
                        </div>

                        {/* Skip reason breakdown */}
                        <div className="space-y-2 mt-6">
                            {result.skippedDuplicate > 0 && (
                                <div className="text-amber-700 flex items-center bg-amber-50 p-3 rounded-md border border-amber-200 text-sm">
                                    <AlertCircle className="mr-2 h-4 w-4 text-amber-500 flex-shrink-0" />
                                    {result.skippedDuplicate} skipped — Phone number already exists
                                </div>
                            )}
                            {result.skippedPlanNotFound > 0 && (
                                <div className="text-rose-700 flex items-center bg-rose-50 p-3 rounded-md border border-rose-200 text-sm">
                                    <AlertCircle className="mr-2 h-4 w-4 text-rose-500 flex-shrink-0" />
                                    {result.skippedPlanNotFound} skipped — Plan name not found in your gym
                                </div>
                            )}
                            {result.skippedInvalidData > 0 && (
                                <div className="text-slate-600 flex items-center bg-slate-100 p-3 rounded-md border border-slate-200 text-sm">
                                    <AlertCircle className="mr-2 h-4 w-4 text-slate-400 flex-shrink-0" />
                                    {result.skippedInvalidData} skipped — Invalid data (bad phone, missing name, or DB error)
                                </div>
                            )}
                        </div>

                        {/* Download failed CSV */}
                        {result.failedRows && result.failedRows.length > 0 && (
                            <div className="pt-2">
                                <Button variant="outline" onClick={downloadFailedCSV} className="gap-2">
                                    <Download className="h-4 w-4" />
                                    Download {result.failedRows.length} Failed Rows (CSV)
                                </Button>
                            </div>
                        )}

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
