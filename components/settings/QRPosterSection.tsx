"use client"

import { useState, useRef } from "react"
import { QrCode, Download, Copy, Check, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface QRPosterSectionProps {
    slug: string
    gymName: string
}

const BASE_URL = "https://gym.emitra.dev"

function QRCodeSVG({ value, size = 200 }: { value: string; size?: number }) {
    // Simple QR code using the Google Charts API (no extra package)
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&bgcolor=000000&color=FFFFFF&format=svg`
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={url}
            alt="Check-In QR Code"
            width={size}
            height={size}
            className="rounded-xl"
            style={{ imageRendering: "pixelated" }}
        />
    )
}

function QRCodeSVGLight({ value, size = 200 }: { value: string; size?: number }) {
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&bgcolor=FFFFFF&color=0EA5E9&format=svg`
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={url}
            alt="Check-In QR Code"
            width={size}
            height={size}
            className="rounded-xl"
            style={{ imageRendering: "pixelated" }}
        />
    )
}

export function QRPosterSection({ slug, gymName }: QRPosterSectionProps) {
    const [posterStyle, setPosterStyle] = useState<"dark" | "light">("dark")
    const [copied, setCopied] = useState(false)
    const printRef = useRef<HTMLDivElement>(null)

    const checkInUrl = `${BASE_URL}/${slug}/checkin`

    const handleCopy = async () => {
        await navigator.clipboard.writeText(checkInUrl)
        setCopied(true)
        toast.success("Check-in URL copied!")
        setTimeout(() => setCopied(false), 2000)
    }

    const handlePrint = () => {
        window.print()
    }

    return (
        <>
            {/* Print-specific styles injected globally */}
            <style>{`
                @media print {
                    body * { visibility: hidden !important; }
                    #qr-poster-print, #qr-poster-print * { visibility: visible !important; }
                    #qr-poster-print {
                        position: fixed !important;
                        inset: 0 !important;
                        width: 100vw !important;
                        height: 100vh !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                    }
                    @page { size: A3 portrait; margin: 0; }
                }
            `}</style>

            <div className="space-y-6">
                {/* URL Section */}
                <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-600">Your Check-In URL</p>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
                            <QrCode className="h-4 w-4 text-slate-400 shrink-0" />
                            <span className="text-sm text-slate-700 font-mono truncate">{checkInUrl}</span>
                        </div>
                        <Button variant="outline" size="icon" onClick={handleCopy} title="Copy URL">
                            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <Button variant="outline" size="icon" asChild title="Open check-in page">
                            <a href={checkInUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                            </a>
                        </Button>
                    </div>
                    <p className="text-xs text-slate-400">
                        Share this link or display the poster below at your gym reception.
                    </p>
                </div>

                {/* Style Toggle */}
                <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-600">Poster Style</p>
                    <div className="flex gap-2">
                        <Button
                            variant={posterStyle === "dark" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPosterStyle("dark")}
                        >
                            Dark (Recommended)
                        </Button>
                        <Button
                            variant={posterStyle === "light" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPosterStyle("light")}
                        >
                            Light & Clean
                        </Button>
                    </div>
                </div>

                {/* Poster Preview */}
                <div className="space-y-3">
                    <p className="text-sm font-medium text-slate-600">Preview</p>

                    {/* Visible preview (scaled down) */}
                    <div className="overflow-auto rounded-xl border border-slate-200 bg-slate-100 p-4 flex justify-center">
                        <div className="scale-75 origin-top">
                            <PosterContent
                                style={posterStyle}
                                gymName={gymName}
                                checkInUrl={checkInUrl}
                                slug={slug}
                                isPreview
                            />
                        </div>
                    </div>

                    {/* Hidden full-size for print */}
                    <div id="qr-poster-print" ref={printRef} className="hidden print:flex">
                        <PosterContent
                            style={posterStyle}
                            gymName={gymName}
                            checkInUrl={checkInUrl}
                            slug={slug}
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <Button onClick={handlePrint} className="gap-2">
                        <Download className="h-4 w-4" />
                        Print / Save as PDF
                    </Button>
                </div>

                <div className="rounded-lg bg-sky-50 border border-sky-100 p-4 text-sm text-sky-800 space-y-1">
                    <p className="font-semibold">💡 How to print your poster</p>
                    <ol className="list-decimal pl-4 space-y-0.5 text-sky-700">
                        <li>Click &quot;Print / Save as PDF&quot; above</li>
                        <li>Choose your printer, or select &quot;Save as PDF&quot;</li>
                        <li>Set paper size to A3 for best results</li>
                        <li>Laminate and display at reception for maximum impact</li>
                    </ol>
                </div>
            </div>
        </>
    )
}

function PosterContent({
    style,
    gymName,
    checkInUrl,
    slug,
    isPreview = false,
}: {
    style: "dark" | "light"
    gymName: string
    checkInUrl: string
    slug: string
    isPreview?: boolean
}) {
    const isDark = style === "dark"
    const qrSize = isPreview ? 160 : 300

    return (
        <div
            style={{
                width: isPreview ? "420px" : "794px",
                height: isPreview ? "594px" : "1123px", // A3 proportions
                background: isDark
                    ? "linear-gradient(160deg, #0a0a0f 0%, #0f172a 50%, #0a0a0f 100%)"
                    : "#FFFFFF",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
                padding: isPreview ? "32px 24px" : "60px 48px",
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Ambient glow for dark version */}
            {isDark && (
                <div style={{
                    position: "absolute",
                    inset: 0,
                    background: "radial-gradient(ellipse 60% 35% at 50% 0%, rgba(14,165,233,0.15) 0%, transparent 65%)",
                    pointerEvents: "none",
                }} />
            )}

            {/* Top: Brand + Headline */}
            <div style={{ textAlign: "center", zIndex: 1 }}>
                <p style={{
                    fontSize: isPreview ? "11px" : "18px",
                    fontWeight: 700,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "#0EA5E9",
                    marginBottom: isPreview ? "12px" : "24px",
                }}>
                    Powered by Gym Mitra
                </p>
                <h1 style={{
                    fontSize: isPreview ? "52px" : "110px",
                    fontWeight: 900,
                    letterSpacing: "-0.04em",
                    lineHeight: 1,
                    color: isDark ? "#FFFFFF" : "#0f172a",
                    textTransform: "uppercase",
                    margin: 0,
                }}>
                    CHECK IN
                </h1>
                <p style={{
                    fontSize: isPreview ? "14px" : "26px",
                    color: isDark ? "#64748b" : "#94a3b8",
                    fontWeight: 500,
                    marginTop: isPreview ? "6px" : "12px",
                }}>
                    Scan to check in with your phone
                </p>
            </div>

            {/* Middle: QR Code */}
            <div style={{
                zIndex: 1,
                background: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0"}`,
                borderRadius: isPreview ? "16px" : "32px",
                padding: isPreview ? "16px" : "32px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: isPreview ? "12px" : "24px",
            }}>
                {isDark
                    ? <QRCodeSVG value={checkInUrl} size={qrSize} />
                    : <QRCodeSVGLight value={checkInUrl} size={qrSize} />
                }
                <p style={{
                    fontSize: isPreview ? "13px" : "22px",
                    fontWeight: 700,
                    color: isDark ? "#94a3b8" : "#475569",
                }}>
                    {gymName}
                </p>
            </div>

            {/* Bottom: Motivational + URL */}
            <div style={{ textAlign: "center", zIndex: 1 }}>
                <p style={{
                    fontSize: isPreview ? "16px" : "32px",
                    fontWeight: 800,
                    color: isDark ? "#FFFFFF" : "#0f172a",
                    marginBottom: isPreview ? "6px" : "14px",
                }}>
                    Every visit counts 💪
                </p>
                <p style={{
                    fontSize: isPreview ? "9px" : "14px",
                    color: isDark ? "#334155" : "#cbd5e1",
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                }}>
                    {`gym.emitra.dev/${slug}/checkin`}
                </p>
            </div>
        </div>
    )
}
