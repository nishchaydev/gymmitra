'use client'

import React, { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { InvoiceTemplate } from './InvoiceTemplate'
import { Button } from '@/components/ui/button'
import { Printer, Download, Share2, MessageCircle } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface InvoiceViewProps {
    invoice: any // Replace with proper type when Prisma generation succeeds
}

export function InvoiceView({ invoice }: InvoiceViewProps) {
    const componentRef = useRef<HTMLDivElement>(null)

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Invoice-${invoice.invoiceNumber}`,
    })

    const handleDownloadPDF = async () => {
        if (!componentRef.current) return

        try {
            // First pass to get dimensions
            const canvas = await html2canvas(componentRef.current, {
                scale: 2, // Higher scale for better quality
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            })

            const imgWidth = 210 // A4 width in mm
            const pageHeight = 297 // A4 height in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width
            let heightLeft = imgHeight
            let position = 0

            const doc = new jsPDF('p', 'mm', 'a4', true)

            // Add image to first page
            doc.addImage(
                canvas.toDataURL('image/png', 1.0),
                'PNG',
                0,
                position,
                imgWidth,
                imgHeight,
                '',
                'FAST'
            )
            heightLeft -= pageHeight

            // Add new pages if the content overflows
            while (heightLeft >= 0) {
                position = heightLeft - imgHeight
                doc.addPage()
                doc.addImage(
                    canvas.toDataURL('image/png', 1.0),
                    'PNG',
                    0,
                    position,
                    imgWidth,
                    imgHeight,
                    '',
                    'FAST'
                )
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

        let targetPhone = phone
        // Ensure phone starts with country code if provided, otherwise assume India (+91)
        if (targetPhone && !targetPhone.startsWith('+')) {
            targetPhone = `91${targetPhone}`
        }

        const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
        const invoiceUrl = invoice.shareToken ? `${baseUrl}/invoice/${invoice.shareToken}` : ''

        const sweetMessage = `Hi ${customerName}!\n\nThank you for choosing ${gymName} 🏋️‍♂️✨\n\nYour invoice for ₹${invoice.total} is ready.\n${invoiceUrl ? `You can view or download it here: ${invoiceUrl}\n\n` : ''}We look forward to seeing you reach your fitness goals!\nHave a great day! 💪`

        const encodedMessage = encodeURIComponent(sweetMessage)

        if (targetPhone) {
            window.open(`https://wa.me/${targetPhone}?text=${encodedMessage}`, '_blank')
        } else {
            // Fallback if no phone number
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
