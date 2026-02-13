'use client'

import React, { useEffect, useRef } from 'react'
import QRCode from 'qrcode'

interface UpiQrCodeProps {
    value: string
    size?: number
}

export function UpiQrCode({ value, size = 150 }: UpiQrCodeProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        if (canvasRef.current && value) {
            QRCode.toCanvas(canvasRef.current, value, {
                width: size,
                margin: 0,
                color: {
                    dark: '#0f172a', // Slate 900
                    light: '#ffffff'
                }
            }, (error) => {
                if (error) console.error('QR Code generation error:', error)
            })
        }
    }, [value, size])

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="p-2 bg-white border rounded-lg shadow-sm">
                <canvas ref={canvasRef} />
            </div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Scan to Pay</span>
        </div>
    )
}
