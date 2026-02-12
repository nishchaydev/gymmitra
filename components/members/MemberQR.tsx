"use client"

import { QRCodeSVG } from "qrcode.react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Share2 } from "lucide-react"

interface MemberQRProps {
    memberId: string
    memberName: string
}

export function MemberQR({ memberId, memberName }: MemberQRProps) {
    const downloadQR = () => {
        const svg = document.getElementById("member-qr") as HTMLElement
        const svgData = new XMLSerializer().serializeToString(svg)
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        const img = new Image()
        img.onload = () => {
            canvas.width = img.width
            canvas.height = img.height
            ctx?.drawImage(img, 0, 0)
            const pngFile = canvas.toDataURL("image/png")
            const downloadLink = document.createElement("a")
            downloadLink.download = `${memberName}-QR-Pass.png`
            downloadLink.href = `${pngFile}`
            downloadLink.click()
        }
        img.src = `data:image/svg+xml;base64,${btoa(svgData)}`
    }

    return (
        <Card className="text-center">
            <CardHeader>
                <CardTitle>Digital QR Pass</CardTitle>
                <CardDescription>Scan this code at the kiosk for quick check-in.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6">
                <div className="bg-white p-4 rounded-xl shadow-inner border">
                    <QRCodeSVG
                        id="member-qr"
                        value={memberId}
                        size={200}
                        level="H"
                        includeMargin={true}
                    />
                </div>
                <div className="flex gap-2 w-full">
                    <Button variant="outline" className="flex-1 gap-2" onClick={downloadQR}>
                        <Download className="h-4 w-4" />
                        Download
                    </Button>
                    <Button variant="outline" className="flex-1 gap-2">
                        <Share2 className="h-4 w-4" />
                        Share
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
