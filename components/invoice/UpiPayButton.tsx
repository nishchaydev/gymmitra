'use client'

interface UpiPayButtonProps {
    upiId: string
    gymName: string
    amount: number
    invoiceNumber: string
}

export function UpiPayButton({ upiId, gymName, amount, invoiceNumber }: UpiPayButtonProps) {
    // UPI deep link spec: https://www.npci.org.in/PDF/npci/upi/circular-and-notification/Circular-2.0.pdf
    const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(gymName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Invoice ${invoiceNumber}`)}`

    return (
        <a
            href={upiLink}
            className="flex items-center justify-center gap-3 w-full rounded-xl px-6 py-4 font-bold text-white text-lg transition-all duration-200 active:scale-95"
            style={{
                background: "linear-gradient(135deg, #6B21A8 0%, #7C3AED 100%)",
                boxShadow: "0 4px 24px rgba(124,58,237,0.35)",
            }}
        >
            {/* UPI logo SVG inline — no external dependency */}
            <svg width="32" height="20" viewBox="0 0 82 52" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M41 0L82 52H0L41 0Z" fill="white" opacity="0.15" />
                <text x="5" y="38" fontFamily="Arial" fontWeight="800" fontSize="28" fill="white">UPI</text>
            </svg>
            Pay ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </a>
    )
}
