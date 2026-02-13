'use client'

import React, { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { InvoiceTemplate } from './InvoiceTemplate'
import { Button } from '@/components/ui/button'
import { Printer, Download, Share2 } from 'lucide-react'
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
        // ... (existing code)
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

    return (
        <div className="space-y-6">
            <div className="flex justify-end gap-3 no-print">
                {invoice.shareToken && (
                    <Button variant="outline" size="sm" onClick={copyPublicLink} className="text-primary hover:text-primary">
                        <Share2 className="w-4 h-4 mr-2" /> Copy Public Link
                    </Button>
                )}
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
                            name: invoice.member?.name || 'Walk-in Customer',
                            phone: invoice.member?.phone || 'N/A',
                            address: invoice.member?.address || 'N/A',
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
