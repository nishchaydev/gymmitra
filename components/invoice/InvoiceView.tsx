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
        const element = componentRef.current
        if (!element) return

        const canvas = await html2canvas(element, {
            scale: 2,
            logging: false,
            useCORS: true
        })
        const data = canvas.toDataURL('image/png')

        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        })

        const imgProps = pdf.getImageProperties(data)
        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width

        pdf.addImage(data, 'PNG', 0, 0, pdfWidth, pdfHeight)
        pdf.save(`Invoice-${invoice.invoiceNumber}.pdf`)
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-end gap-3 no-print">
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
