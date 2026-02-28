'use client'

import React, { useRef } from 'react'
import { InvoiceTemplate } from './InvoiceTemplate'
import { Button } from '@/components/ui/button'
import { Printer, Download, Share2, MessageCircle } from 'lucide-react'

interface InvoiceViewProps {
    invoice: any
}

/**
 * Returns the canonical app base URL.
 * Uses NEXT_PUBLIC_APP_URL env var (set to your custom domain) so
 * shared links always point to your domain, not gymmitra.vercel.app.
 */
function getBaseUrl(): string {
    if (typeof window === 'undefined') return ''
    return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || window.location.origin
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
function buildPrintDocument(invoiceNumber: string, bodyHtml: string, forDownload: boolean): string {
    const banner = forDownload
        ? `<div id="pdf-banner">📄 <strong>To save as PDF:</strong> In the print dialog, set Destination → <strong>Save as PDF</strong>, then click Save.</div>`
        : ''

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
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
    .grid { display: grid; }
    .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
    .justify-between { justify-content: space-between; }
    .items-start  { align-items: flex-start; }
    .items-center { align-items: center; }
    .items-end    { align-items: flex-end; }
    .gap-2  { gap: 0.5rem; }
    .gap-3  { gap: 0.75rem; }
    .gap-12 { gap: 3rem; }
    .space-y-1 > * + * { margin-top: 0.25rem; }
    .space-y-3 > * + * { margin-top: 0.75rem; }
    .space-y-4 > * + * { margin-top: 1rem; }
    .space-y-6 > * + * { margin-top: 1.5rem; }
    .ml-auto { margin-left: auto; }
    .mb-4  { margin-bottom: 1rem; }
    .mb-12 { margin-bottom: 3rem; }
    .mt-20 { margin-top: 5rem; }
    .pb-2  { padding-bottom: 0.5rem; }
    .pt-8  { padding-top: 2rem; }
    .py-2  { padding-top: 0.5rem; padding-bottom: 0.5rem; }
    .py-4  { padding-top: 1rem;  padding-bottom: 1rem;  }
    .px-4  { padding-left: 1rem; padding-right: 1rem; }
    .p-8   { padding: 2rem; }

    /* Sizing */
    .w-3  { width: 0.75rem; }  .h-3  { height: 0.75rem; }
    .w-5  { width: 1.25rem; }  .h-5  { height: 1.25rem; }
    .w-10 { width: 2.5rem;  }  .h-10 { height: 2.5rem;  }
    .w-24 { width: 6rem; }     .h-12 { height: 3rem; }
    .w-\[300px\] { width: 300px; }
    .max-w-\[200px\] { max-width: 200px; }
    .max-w-\[300px\] { max-width: 300px; }

    /* Typography */
    .text-\[10px\] { font-size: 10px; }
    .text-xs  { font-size: 0.75rem; }
    .text-sm  { font-size: 0.875rem; }
    .text-lg  { font-size: 1.125rem; }
    .text-2xl { font-size: 1.5rem; }
    .text-3xl { font-size: 1.875rem; }
    .text-4xl { font-size: 2.25rem; }
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
    .text-right  { text-align: right; }
    .text-center { text-align: center; }
    .underline   { text-decoration: underline; }
    .underline-offset-8 { text-underline-offset: 8px; }
    .opacity-30  { opacity: 0.3; }
    .opacity-50  { opacity: 0.5; }

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

    /* Banner (only visible before print dialog) */
    #pdf-banner {
      background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px;
      padding: 12px 16px; margin-bottom: 16px; font-size: 13px; color: #1e40af;
      display: flex; align-items: center; gap: 8px;
    }
    @media print { #pdf-banner { display: none !important; } }
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

    const openInvoicePrintWindow = (forDownload: boolean) => {
        if (!componentRef.current) return
        const bodyHtml = componentRef.current.innerHTML
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
        const url = `${getBaseUrl()}/invoice/${invoice.shareToken}`
        navigator.clipboard.writeText(url)
        import('sonner').then(({ toast }) => toast.success('Public link copied to clipboard!'))
    }

    const shareOnWhatsApp = () => {
        const gymName = invoice.gym.businessName || invoice.gym.name
        const customerName = invoice.member?.name || invoice.walkInName || 'Customer'
        const phone = invoice.member?.phone || invoice.walkInPhone || ''

        // Strip all non-digits, then remove leading 0 (e.g. 06261854014 → 6261854014)
        let targetPhone = phone.replace(/\D/g, '')
        if (targetPhone.startsWith('0')) {
            targetPhone = targetPhone.slice(1)
        }
        // If 10 digits, add India country code; if already has country code, use as-is
        if (targetPhone.length === 10) {
            targetPhone = `91${targetPhone}`
        }

        const invoiceUrl = invoice.shareToken
            ? `${getBaseUrl()}/invoice/${invoice.shareToken}`
            : ''

        const formattedTotal = Number(invoice.total).toLocaleString('en-IN', {
            style: 'currency',
            currency: 'INR',
        })

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
            <div className="flex justify-end gap-3 no-print flex-wrap">
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
                <Button variant="default" size="sm" onClick={handlePrint}>
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
                            year: 'numeric',
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
                            total: Number(item.amount),
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
