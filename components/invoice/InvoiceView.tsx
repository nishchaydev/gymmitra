'use client'

import React, { useRef } from 'react'
import { InvoiceTemplate } from './InvoiceTemplate'
import { Button } from '@/components/ui/button'
import { Printer, Download, Share2, MessageCircle } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface InvoiceViewProps {
    invoice: any // Replace with proper type when Prisma generation succeeds
}

/**
 * Recursively strip oklch/lab/lch CSS color values from an element's inline styles
 * and computed styles, replacing them with safe hex equivalents.
 * html2canvas cannot parse modern CSS color functions like oklch() or lab().
 */
function stripUnsupportedColors(el: HTMLElement) {
    const UNSUPPORTED = /\b(oklch|lab|lch|oklab)\s*\(/gi
    const FALLBACK = '#000000'

    el.querySelectorAll('*').forEach((node) => {
        if (!(node instanceof HTMLElement)) return
        const style = node.getAttribute('style') || ''
        if (UNSUPPORTED.test(style)) {
            node.setAttribute('style', style.replace(UNSUPPORTED, `${FALLBACK} /*`))
        }
        // Also scrub computed inline colors that html2canvas reads
        const computed = window.getComputedStyle(node)
        const colorProps = ['color', 'backgroundColor', 'borderColor', 'outlineColor'] as const
        colorProps.forEach((prop) => {
            const val = computed[prop]
            if (val && UNSUPPORTED.test(val)) {
                // @ts-ignore
                node.style[prop] = FALLBACK
            }
        })
    })
}

export function InvoiceView({ invoice }: InvoiceViewProps) {
    const componentRef = useRef<HTMLDivElement>(null)

    /** Print: inject minimal @media print CSS so no content gets cut */
    const handlePrint = () => {
        if (!componentRef.current) return
        const content = componentRef.current.innerHTML
        const printWindow = window.open('', '_blank', 'width=900,height=700')
        if (!printWindow) return
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Invoice-${invoice.invoiceNumber}</title>
                <style>
                    @page { size: A4; margin: 10mm; }
                    body { margin: 0; font-family: sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    * { box-sizing: border-box; }
                    table { width: 100%; border-collapse: collapse; }
                    .no-print { display: none !important; }
                </style>
            </head>
            <body>${content}</body>
            </html>
        `)
        printWindow.document.close()
        printWindow.focus()
        setTimeout(() => {
            printWindow.print()
            printWindow.close()
        }, 500)
    }

    const handleDownloadPDF = async () => {
        if (!componentRef.current) return

        try {
            // Clone element off-screen so we don't mutate the live DOM
            const original = componentRef.current
            const clone = original.cloneNode(true) as HTMLElement
            clone.style.position = 'fixed'
            clone.style.top = '-9999px'
            clone.style.left = '-9999px'
            clone.style.width = original.offsetWidth + 'px'
            clone.style.background = '#ffffff'
            document.body.appendChild(clone)

            // Remove oklch/lab that html2canvas cannot parse
            stripUnsupportedColors(clone)

            const canvas = await html2canvas(clone, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: false,
                backgroundColor: '#ffffff'
            })

            document.body.removeChild(clone)

            // Cache the base64 data URL so encoding runs only once
            const cachedDataUrl = canvas.toDataURL('image/png', 1.0)

            const imgWidth = 210 // A4 width in mm
            const pageHeight = 297 // A4 height in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width
            let heightLeft = imgHeight
            let position = 0

            const doc = new jsPDF('p', 'mm', 'a4', true)

            doc.addImage(cachedDataUrl, 'PNG', 0, position, imgWidth, imgHeight, '', 'FAST')
            heightLeft -= pageHeight

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight
                doc.addPage()
                doc.addImage(cachedDataUrl, 'PNG', 0, position, imgWidth, imgHeight, '', 'FAST')
                heightLeft -= pageHeight
            }

            doc.save(`Invoice-${invoice.invoiceNumber}.pdf`)
        } catch (error) {
            console.error('Error generating PDF:', error)
            import('sonner').then(({ toast }) => toast.error('Failed to generate PDF'))
        }
    }

    const copyPublicLink = () => {
        if (!invoice.shareToken) {
            import('sonner').then(({ toast }) => toast.error('Public link not available for this invoice'))
            return
        }
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
        const url = `${baseUrl}/invoice/${invoice.shareToken}`
        navigator.clipboard.writeText(url)
        import('sonner').then(({ toast }) => toast.success('Public link copied to clipboard!'))
    }

    const shareOnWhatsApp = () => {
        const gymName = invoice.gym.businessName || invoice.gym.name
        const customerName = invoice.member?.name || invoice.walkInName || 'Customer'
        const phone = invoice.member?.phone || invoice.walkInPhone || ''

        // Only prepend +91 for valid 10-digit local Indian numbers
        let targetPhone = phone.replace(/\s/g, '')
        if (/^\d{10}$/.test(targetPhone)) {
            targetPhone = `91${targetPhone}`
        } else if (targetPhone.startsWith('+')) {
            targetPhone = targetPhone.slice(1) // remove '+' for wa.me URL
        }

        const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
        const invoiceUrl = invoice.shareToken ? `${baseUrl}/invoice/${invoice.shareToken}` : ''

        // Format total as INR currency
        const formattedTotal = Number(invoice.total).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })

        const sweetMessage = `Hi ${customerName}!\n\nThank you for choosing ${gymName} 🏋️‍♂️✨\n\nYour invoice for ${formattedTotal} is ready.\n${invoiceUrl ? `You can view or download it here: ${invoiceUrl}\n\n` : ''}We look forward to seeing you reach your fitness goals!\nHave a great day! 💪`

        const encodedMessage = encodeURIComponent(sweetMessage)

        if (targetPhone) {
            window.open(`https://wa.me/${targetPhone}?text=${encodedMessage}`, '_blank')
        } else {
            window.open(`https://wa.me/?text=${encodedMessage}`, '_blank')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-end gap-3 no-print">
                {invoice.shareToken && (
                    <Button variant="outline" size="sm" onClick={copyPublicLink} className="text-primary hover:text-primary">
                        <Share2 className="w-4 h-4 mr-2" /> Copy Public Link
                    </Button>
                )}
                <Button variant="outline" size="sm" onClick={shareOnWhatsApp} className="text-[#25D366] hover:text-[#25D366] border-[#25D366]/30 hover:bg-[#25D366]/10">
                    <MessageCircle className="w-4 h-4 mr-2" /> Share via WhatsApp
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                    <Download className="w-4 h-4 mr-2" /> Download PDF
                </Button>
                <Button variant="default" size="sm" onClick={() => handlePrint()}>
                    <Printer className="w-4 h-4 mr-2" /> Print Invoice
                </Button>
            </div>

            <div className="bg-slate-50 p-8 rounded-xl overflow-auto flex justify-center border-2 border-dashed border-slate-200">
                <div ref={componentRef}>
                    <InvoiceTemplate
                        invoiceNumber={invoice.invoiceNumber}
                        date={new Date(invoice.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                        })}
                        paymentMethod={invoice.paymentMethod}
                        gymInfo={{
                            name: invoice.gym.businessName || invoice.gym.name,
                            address: invoice.gym.address || 'N/A',
                            phone: invoice.gym.phone || 'N/A',
                            email: invoice.gym.email || 'N/A',
                            upiId: invoice.gym.upiId,
                            termsAndConditions: invoice.gym.termsAndConditions,
                        }}
                        memberInfo={{
                            name: invoice.member?.name || invoice.walkInName || 'Walk-in Customer',
                            phone: invoice.member?.phone || invoice.walkInPhone || 'N/A',
                            address: invoice.member?.address || invoice.walkInAddress || 'N/A',
                        }}
                        items={invoice.items.map((item: any) => ({
                            description: item.description,
                            quantity: item.quantity,
                            unitPrice: Number(item.unitPrice),
                            total: Number(item.amount)
                        }))}
                        subtotal={Number(invoice.subtotal)}
                        discount={Number(invoice.discount || 0)}
                        total={Number(invoice.total)}
                    />
                </div>
            </div>
        </div>
    )
}
