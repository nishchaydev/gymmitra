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
import { importProducts } from "../actions"
import Papa from "papaparse"
import * as XLSX from "xlsx"

export default function ProductImportPage() {
    const router = useRouter()
    const { slug } = useParams() as { slug: string }
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<any[]>([])
    const [isParsing, setIsParsing] = useState(false)
    const [isImporting, setIsImporting] = useState(false)
    const [result, setResult] = useState<{
        imported: number,
        skippedDuplicate: number,
        skippedInvalidData: number
    } | null>(null)

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
        const REQUIRED_HEADERS = ['name', 'category', 'price', 'stock']
        const missingHeaders = REQUIRED_HEADERS.filter(h => !headers.includes(h))

        if (missingHeaders.length > 0) {
            toast.error(`Missing required headers: ${missingHeaders.join(', ')}`)
            setPreview([])
            setIsParsing(false)
            return
        }

        if (data.length > 1000) {
            toast.error("Maximum 1000 rows allowed")
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
            const res = await importProducts(preview)
            if (res.error) {
                toast.error(res.error)
            } else {
                setResult({
                    imported: res.imported || 0,
                    skippedDuplicate: res.skippedDuplicate || 0,
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
                <Link href={`/${slug}/products`}>
                    <Button variant="ghost" size="icon">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold">Import Products</h1>
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
                        {['name', 'category', 'price', 'stock'].map(col => (
                            <span key={col} className="bg-white border border-amber-200 px-2 py-1 rounded">
                                {col}
                            </span>
                        ))}
                        <span className="bg-white border border-slate-200 px-2 py-1 rounded text-slate-500">
                            purchaseprice (optional)
                        </span>
                        <span className="bg-white border border-slate-200 px-2 py-1 rounded text-slate-500">
                            lowstockalert (optional)
                        </span>
                    </div>
                    <p className="mt-4 text-sm font-medium">Note: Category should be one of "PROTEIN", "SUPPLEMENT", "MERCHANDISE", or "OTHER" (or leave blank for OTHER).</p>
                </CardContent>
            </Card>

            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Step 1: Upload File</CardTitle>
                    <CardDescription>
                        Select your products list CSV or Excel file (max 1000 rows).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid w-full items-center gap-4">
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="product-file">Choose CSV or Excel File</Label>
                            <Input id="product-file" type="file" accept=".csv, .xlsx, .xls" onChange={handleFileChange} disabled={isImporting} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {preview.length > 0 && !result && (
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Step 2: Preview & Confirm</CardTitle>
                        <CardDescription>
                            Showing first 5 rows of {preview.length} products found.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto border rounded-md mb-6">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 border-b">
                                    <tr>
                                        <th className="px-4 py-2">Name</th>
                                        <th className="px-4 py-2">Category</th>
                                        <th className="px-4 py-2">Price</th>
                                        <th className="px-4 py-2">Stock</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {preview.slice(0, 5).map((row, i) => (
                                        <tr key={i} className="border-b last:border-0 font-medium">
                                            <td className="px-4 py-2">{row.name}</td>
                                            <td className="px-4 py-2">{row.category || "OTHER"}</td>
                                            <td className="px-4 py-2">₹{row.price}</td>
                                            <td className="px-4 py-2">{row.stock}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Button onClick={handleImport} disabled={isImporting} className="w-full h-12 text-lg">
                            {isImporting ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Importing {preview.length} products...
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
                    <CardContent>
                        <div className="space-y-2 text-sm text-blue-900">
                            <p><strong>{result.imported}</strong> products successfully imported.</p>
                            {result.skippedDuplicate > 0 && <p className="text-amber-700"><strong>{result.skippedDuplicate}</strong> skipped (duplicate name).</p>}
                            {result.skippedInvalidData > 0 && <p className="text-red-600"><strong>{result.skippedInvalidData}</strong> skipped (invalid data).</p>}
                        </div>
                        <Button className="mt-6" variant="outline" onClick={() => {
                            setResult(null);
                            setPreview([]);
                            setFile(null);
                            const input = document.getElementById('product-file') as HTMLInputElement;
                            if (input) input.value = '';
                        }}>Upload Another File</Button>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
