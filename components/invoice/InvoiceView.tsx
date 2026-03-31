'use client'

import React, { useRef, useState, useTransition } from 'react'
import { InvoiceTemplate } from './InvoiceTemplate'
import { Button } from '@/components/ui/button'
import { Printer, Download, Share2, MessageCircle, CreditCard, Loader2, CheckCircle2 } from 'lucide-react'
import { getInvoiceWhatsAppLink } from '@/lib/whatsapp'
import { getBaseUrl } from '@/lib/utils'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { recordInvoicePayment } from '@/app/(dashboard)/[slug]/invoices/actions'
import { toast } from 'sonner'

interface InvoiceViewProps {
    invoice: any
}


/**
 * Builds a standalone, self-contained print-ready HTML page for the invoice.
 *
 * Why NOT html2canvas / jsPDF:
 *   Tailwind v4 emits oklch() color functions in its stylesheet CSS variables.
 *   html2canvas evaluates computed styles and chokes on oklch with the error
 *   "unsupported color function lab". The browser's native PDF renderer has
 *   no such limitation, produces far better fidelity, and requires no extra deps.
 *
 * Strategy:
 *   Snapshot the rendered innerHTML of the invoice, embed it in a new window
 *   with a minimal CSS that re-defines all Tailwind color classes using safe
 *   hex/rgb values, override CSS custom properties at :root, then auto-trigger
 *   window.print(). The user's browser prints to PDF via the system dialog.
 */
/**
 * Strips script elements and all on* event attributes from a raw HTML string
 * to prevent XSS execution when the content is written to a new window via
 * document.write. DOMParser parses without executing scripts.
 */
function sanitizeForPrint(rawHtml: string): string {
    // Only runs in browser context — called from onClick handlers
    if (typeof window === 'undefined') return rawHtml
    const parser = new DOMParser()
    const doc = parser.parseFromString(`<body>${rawHtml}</body>`, 'text/html')
    // Remove all script elements
    doc.querySelectorAll('script').forEach(el => el.remove())
    // Remove dangerous embed elements
    doc.querySelectorAll('iframe, object, embed').forEach(el => el.remove())
    // Strip on* event handler attributes and javascript: URI schemes
    doc.querySelectorAll('*').forEach(el => {
        Array.from(el.attributes).forEach(attr => {
            if (attr.name.toLowerCase().startsWith('on')) {
                el.removeAttribute(attr.name)
            }
            // Strip javascript: URI from href, src, action, formaction etc.
            if (['href', 'src', 'action', 'formaction', 'data'].includes(attr.name.toLowerCase())) {
                if (/^\s*javascript\s*:/i.test(attr.value)) {
                    el.removeAttribute(attr.name)
                }
            }
        })
    })
    return doc.body.innerHTML
}

function buildPrintDocument(invoiceNumber: string, bodyHtml: string, forDownload: boolean): string {
    const banner = forDownload
        ? `<div id="pdf-banner">📄 <strong>To save as PDF:</strong> In the print dialog, set Destination → <strong>Save as PDF</strong>, then click Save.</div>`
        : ''

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data: blob: https:;" />
  <title>Invoice-${invoiceNumber}</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    html, body {
      margin: 0; padding: 0; background: #fff;
      font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    * { box-sizing: border-box; }

    /* Override Tailwind v4 CSS custom properties with safe hex values */
    :root {
      --primary: #2563eb;
      --primary-foreground: #ffffff;
      --color-blue-500: #3b82f6;
      --color-blue-600: #2563eb;
      --color-emerald-500: #10b981;
      --color-emerald-600: #059669;
      --color-slate-50:  #f8fafc;
      --color-slate-100: #f1f5f9;
      --color-slate-200: #e2e8f0;
      --color-slate-300: #cbd5e1;
      --color-slate-400: #94a3b8;
      --color-slate-500: #64748b;
      --color-slate-600: #475569;
      --color-slate-700: #334155;
      --color-slate-900: #0f172a;
      --color-white: #ffffff;
    }

    /* Hide buttons and non-printable UI */
    .no-print, button, [data-print-hide] { display: none !important; }

    /* ---- Tailwind utility re-declarations (hex only) ---- */
    .text-primary  { color: #2563eb; }
    .text-blue-600 { color: #2563eb; }
    .text-emerald-600 { color: #059669; }
    .text-slate-900 { color: #0f172a; }
    .text-slate-500 { color: #64748b; }
    .text-slate-400 { color: #94a3b8; }
    .text-slate-200 { color: #e2e8f0; }
    .bg-white    { background-color: #ffffff; }
    .bg-slate-50 { background-color: #f8fafc; }
    .border-slate-100 { border-color: #f1f5f9; }
    .border-slate-200 { border-color: #e2e8f0; }
    .border-slate-900 { border-color: #0f172a; }

    /* Layout */
    .flex { display: flex; }
    .flex-col { flex-direction: column; }
    .sm\:flex-row { flex-direction: row; }
    .grid { display: grid; }
    .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
    .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .sm\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .justify-between { justify-content: space-between; }
    .sm\:justify-between { justify-content: space-between; }
    .items-start  { align-items: flex-start; }
    .items-center { align-items: center; }
    .items-end    { align-items: flex-end; }
    .sm\:items-end { align-items: flex-end; }
    .gap-2  { gap: 0.5rem; }
    .gap-3  { gap: 0.75rem; }
    .gap-4  { gap: 1rem; }
    .gap-8  { gap: 2rem; }
    .gap-12 { gap: 3rem; }
    .sm\:gap-12 { gap: 3rem; }
    .space-y-1 > * + * { margin-top: 0.25rem; }
    .space-y-3 > * + * { margin-top: 0.75rem; }
    .space-y-4 > * + * { margin-top: 1rem; }
    .space-y-6 > * + * { margin-top: 1.5rem; }
    .ml-auto { margin-left: auto; }
    .mx-auto { margin-left: auto; margin-right: auto; }
    .mb-4  { margin-bottom: 1rem; }
    .sm\:mb-4 { margin-bottom: 1rem; }
    .mb-8  { margin-bottom: 2rem; }
    .mb-12 { margin-bottom: 3rem; }
    .mt-20 { margin-top: 5rem; }
    .pb-2  { padding-bottom: 0.5rem; }
    .pt-3  { padding-top: 0.75rem; }
    .pt-8  { padding-top: 2rem; }
    .py-2  { padding-top: 0.5rem; padding-bottom: 0.5rem; }
    .py-4  { padding-top: 1rem;  padding-bottom: 1rem;  }
    .px-4  { padding-left: 1rem; padding-right: 1rem; }
    .p-4   { padding: 1rem; }
    .p-8   { padding: 2rem; }
    .sm\:p-8 { padding: 2rem; }

    /* Sizing */
    .w-3  { width: 0.75rem; }  .h-3  { height: 0.75rem; }
    .w-4  { width: 1rem; }     .h-4  { height: 1rem; }
    .w-5  { width: 1.25rem; }  .h-5  { height: 1.25rem; }
    .w-8  { width: 2rem; }     .h-8  { height: 2rem; }
    .w-10 { width: 2.5rem;  }  .h-10 { height: 2.5rem;  }
    .w-24 { width: 6rem; }     .h-12 { height: 3rem; }
    .w-full { width: 100%; }
    .sm\:w-auto { width: auto; }
    .w-\[300px\] { width: 300px; }
    .sm\:w-\[300px\] { width: 300px; }
    .max-w-\[200px\] { max-width: 200px; }
    .max-w-\[300px\] { max-width: 300px; }
    .max-w-\[800px\] { max-width: 800px; }
    .min-w-\[600px\] { min-width: 600px; }
    .sm\:min-w-0 { min-width: 0; }

    /* Typography */
    .text-\[10px\] { font-size: 10px; }
    .text-xs  { font-size: 0.75rem; }
    .text-sm  { font-size: 0.875rem; }
    .text-base { font-size: 1rem; }
    .text-lg  { font-size: 1.125rem; }
    .sm\:text-lg { font-size: 1.125rem; }
    .text-xl { font-size: 1.25rem; }
    .sm\:text-xl { font-size: 1.25rem; }
    .text-2xl { font-size: 1.5rem; }
    .sm\:text-2xl { font-size: 1.5rem; }
    .text-3xl { font-size: 1.875rem; }
    .sm\:text-3xl { font-size: 1.875rem; }
    .text-4xl { font-size: 2.25rem; }
    .sm\:text-4xl { font-size: 2.25rem; }
    .font-medium { font-weight: 500; }
    .font-bold   { font-weight: 700; }
    .font-black  { font-weight: 900; }
    .italic      { font-style: italic; }
    .not-italic  { font-style: normal; }
    .uppercase   { text-transform: uppercase; }
    .tracking-tighter  { letter-spacing: -0.05em; }
    .tracking-widest   { letter-spacing: 0.1em; }
    .tracking-\[0\.2em\] { letter-spacing: 0.2em; }
    .leading-relaxed   { line-height: 1.625; }
    .text-left { text-align: left; }
    .text-right  { text-align: right; }
    .sm\:text-right { text-align: right; }
    .text-center { text-align: center; }
    .underline   { text-decoration: underline; }
    .underline-offset-8 { text-underline-offset: 8px; }
    .opacity-30  { opacity: 0.3; }
    .opacity-50  { opacity: 0.5; }
    .break-words { overflow-wrap: break-word; }
    .break-all { word-break: break-all; }
    .sm\:break-normal { word-break: normal; overflow-wrap: normal; }
    .whitespace-nowrap { white-space: nowrap; }

    /* Visibility / Display */
    .hidden { display: none !important; }
    .sm\:hidden { display: none !important; }
    .block { display: block !important; }
    .sm\:block { display: block !important; }

    /* Borders */
    .border     { border: 1px solid #e2e8f0; }
    .border-b   { border-bottom: 1px solid #e2e8f0; }
    .border-t   { border-top: 1px solid #e2e8f0; }
    .border-y   { border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; }
    .border-t-2 { border-top: 2px solid #0f172a; }
    .divide-y > * + *           { border-top: 1px solid #f1f5f9; }
    .divide-slate-100 > * + *   { border-top-color: #f1f5f9; }

    /* Table */
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 0; }

    /* SVG icons */
    svg { display: inline-block; vertical-align: middle; flex-shrink: 0; }

    /* No content clipping on print */
    #invoice-template { page-break-inside: avoid; break-inside: avoid; }

    /* Add forced width resets to avoid page edge clipping on specific elements */
    @media print {
      * { box-sizing: border-box !important; }
      body { margin: 0 !important; padding: 0 !important; }
      
      #invoice-template {
        width: 100% !important;
        max-width: 100% !important;
        padding: 20px !important;
        overflow: visible !important;
        margin: 0 !important;
        box-shadow: none !important;
        border: none !important;
      }
      
      /* Ensure Payment Info and Totals columns don't stretch off the page */
      .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
      .sm\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
      
      .flex.justify-between {
        display: flex !important;
        justify-content: space-between !important;
        width: 100% !important;
        padding-right: 0 !important;
      }

      /* Banner (only visible before print dialog) */
      #pdf-banner { display: none !important; }
    }

    /* Banner (only visible before print dialog) */
    #pdf-banner {
      background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px;
      padding: 12px 16px; margin-bottom: 16px; font-size: 13px; color: #1e40af;
      display: flex; align-items: center; gap: 8px;
    }
  </style>
</head>
<body>
  ${banner}
  ${bodyHtml}
  <script>
    window.addEventListener('load', function () {
      setTimeout(function () { window.print(); }, 400);
    });
  </script>
</body>
</html>`
}

export function InvoiceView({ invoice }: InvoiceViewProps) {
    const componentRef = useRef<HTMLDivElement>(null)
    const [isPending, startTransition] = useTransition()
    const [isPaymentOpen, setIsPaymentOpen] = useState(false)
    const [isMarkPaidOpen, setIsMarkPaidOpen] = useState(false)
    const [additionalAmount, setAdditionalAmount] = useState<number | ''>('')

    const openInvoicePrintWindow = (forDownload: boolean) => {
        if (!componentRef.current) return
        const rawHtml = componentRef.current.innerHTML
        const bodyHtml = sanitizeForPrint(rawHtml)
        const win = window.open('', '_blank', 'width=900,height=800')
        if (!win) {
            import('sonner').then(({ toast }) =>
                toast.error('Pop-up blocked. Please allow pop-ups for this site.')
            )
            return
        }
        win.document.write(buildPrintDocument(invoice.invoiceNumber, bodyHtml, forDownload))
        win.document.close()
        win.focus()
    }

    const handlePrint = () => openInvoicePrintWindow(false)
    const handleDownloadPDF = () => openInvoicePrintWindow(true)

    const copyPublicLink = () => {
        if (!invoice.shareToken) {
            import('sonner').then(({ toast }) =>
                toast.error('Public link not available for this invoice')
            )
            return
        }
        const url = `${getBaseUrl()}/${invoice.gym?.slug || 'gym'}/invoice/${invoice.shareToken}`
        navigator.clipboard.writeText(url).then(() => {
            import('sonner').then(({ toast }) => toast.success('Public link copied to clipboard!'))
        }).catch((err) => {
            console.error('Clipboard copy failed:', err)
            import('sonner').then(({ toast }) => toast.error('Failed to copy link.'))
        })
    }

    const shareOnWhatsApp = () => {
        const phone = invoice.member?.phone || invoice.walkInPhone || ''
        const memberName = invoice.member?.name || invoice.walkInName || 'Customer'
        const gymName = invoice.gym?.businessName || invoice.gym?.name
        const amount = Number(invoice.total)
        const shareToken = invoice.shareToken || ''
        const gymSlug = invoice.gym?.slug || 'gym'

        const whatsappLink = getInvoiceWhatsAppLink(
            phone,
            memberName,
            gymName,
            amount,
            shareToken,
            gymSlug,
            invoice.gym?.waInvoiceMsg
        )

        if (whatsappLink && whatsappLink !== '#') {
            window.open(whatsappLink, '_blank')
        } else {
            toast.error('Check if phone and invoice link are available.')
        }
    }

    const handleRecordPayment = () => {
        if (!additionalAmount || Number(additionalAmount) <= 0) {
            toast.error("Please enter a valid amount")
            return
        }

        startTransition(async () => {
            const res = await recordInvoicePayment({
                invoiceId: invoice.id,
                additionalAmount: Number(additionalAmount)
            })

            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success("Payment recorded successfully")
                setIsPaymentOpen(false)
                setAdditionalAmount('')
            }
        })
    }

    const handleMarkAsPaid = () => {
        startTransition(async () => {
            const res = await recordInvoicePayment({
                invoiceId: invoice.id,
                additionalAmount: Number(invoice.balanceDue)
            })

            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success("Invoice marked as fully paid!")
                setIsMarkPaidOpen(false)
            }
        })
    }

    return (
        <div className="space-y-6 w-full max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-end gap-3 no-print mb-6">
                {(invoice.paymentStatus === 'PENDING' || invoice.paymentStatus === 'PARTIAL') && invoice.balanceDue > 0 && !invoice.id.startsWith('demo-') && (
                    <>
                        {/* Mark as Paid - one click */}
                        <Dialog open={isMarkPaidOpen} onOpenChange={setIsMarkPaidOpen}>
                            <DialogTrigger asChild>
                                <Button variant="default" size="sm" className="bg-primary hover:bg-primary/90">
                                    <CheckCircle2 className="w-4 h-4 mr-2" /> Mark as Paid
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Mark Invoice as Fully Paid?</DialogTitle>
                                    <DialogDescription>
                                        This will record a payment of <span className="font-bold text-slate-900">₹{Number(invoice.balanceDue).toLocaleString('en-IN')}</span> (full remaining balance) and mark the invoice as PAID.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="flex gap-3 pt-4">
                                    <Button variant="outline" className="flex-1" onClick={() => setIsMarkPaidOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleMarkAsPaid}
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                                        disabled={isPending}
                                    >
                                        {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                        Confirm
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>

                        {/* Record Partial Payment */}
                        <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                            <DialogTrigger asChild>
                                <Button variant="default" size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                                    <CreditCard className="w-4 h-4 mr-2" /> Record Payment
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Record Payment</DialogTitle>
                                    <DialogDescription>
                                        Enter the amount received from the member.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-slate-500">Balance Due</span>
                                            <span className="text-sm font-bold text-rose-600">₹{Number(invoice.balanceDue).toLocaleString('en-IN')}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="amount">Amount Received (₹)</Label>
                                        <Input
                                            id="amount"
                                            type="number"
                                            placeholder="0.00"
                                            value={additionalAmount}
                                            onChange={(e) => setAdditionalAmount(e.target.value ? Number(e.target.value) : '')}
                                            max={Number(invoice.balanceDue)}
                                            className="font-bold text-lg"
                                        />
                                    </div>
                                    <Button
                                        onClick={handleRecordPayment}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                                        disabled={isPending || !additionalAmount || Number(additionalAmount) <= 0}
                                    >
                                        {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                        Confirm Payment
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </>
                )}
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
                <Button variant="default" size="sm" onClick={handlePrint} className="bg-drift-900 hover:bg-drift-800 text-white">
                    <Printer className="w-4 h-4 mr-2" /> Print Invoice
                </Button>
            </div>

            <div className="bg-white sm:bg-slate-50 p-0 sm:p-4 md:p-8 rounded-none sm:rounded-xl overflow-x-auto flex justify-center border-0 sm:border-2 sm:border-dashed sm:border-drift-200">
                <div ref={componentRef}>
                    <InvoiceTemplate
                        invoiceNumber={invoice.invoiceNumber}
                        date={new Date(invoice.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                        })}
                        paymentMethod={invoice.paymentMethod}
                        gymInfo={{
                            name: invoice.gym?.businessName || invoice.gym?.name,
                            address: invoice.gym?.address || 'N/A',
                            phone: invoice.gym?.phone || 'N/A',
                            email: invoice.gym?.email || 'N/A',
                            upiId: invoice.gym?.upiId,
                            termsAndConditions: invoice.gym?.termsAndConditions,
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
                            total: Number(item.amount),
                        }))}
                        subtotal={Number(invoice.subtotal)}
                        taxPercentage={Number(invoice.taxPercentage || 0)}
                        taxAmount={Number(invoice.taxAmount || 0)}
                        discount={Number(invoice.discount || 0)}
                        total={Number(invoice.total)}
                        amountPaid={Number(invoice.amountPaid || 0)}
                        balanceDue={Number(invoice.balanceDue || 0)}
                        paymentStatus={invoice.paymentStatus}
                    />
                </div>
            </div>
        </div>
    )
}
