"use client"

import { useEffect } from "react"
import type { UseFormReturn } from "react-hook-form"

/**
 * Auto-fills state and city when a valid 6-digit pincode is entered.
 * Uses the free api.postalpincode.in API with debounce + abort controller.
 *
 * @param form - react-hook-form instance (must have pincode, state, city fields)
 * @param pincodeFieldName - field name for pincode (default: "pincode")
 */
export function usePincodeLookup(
    form: UseFormReturn<any>,
    pincodeFieldName: string = 'pincode'
) {
    const pincodeValue = form.watch(pincodeFieldName)

    useEffect(() => {
        const controller = new AbortController()

        const fetchPincodeDetails = async () => {
            if (pincodeValue && pincodeValue.length === 6) {
                try {
                    const res = await fetch(
                        `https://api.postalpincode.in/pincode/${pincodeValue}`,
                        { signal: controller.signal }
                    )
                    if (!res.ok) {
                        console.warn("Pincode API returned status:", res.status)
                        return
                    }
                    const data = await res.json()
                    if (
                        data?.[0]?.Status === 'Success' &&
                        Array.isArray(data[0]?.PostOffice) &&
                        data[0].PostOffice.length > 0
                    ) {
                        const postOffice = data[0].PostOffice[0]
                        form.setValue('state', postOffice.State, { shouldValidate: true })
                        form.setValue('city', postOffice.District, { shouldValidate: true })
                    }
                } catch (error: any) {
                    if (error.name === 'AbortError') return
                    console.warn("Pincode API failed:", error)
                }
            }
        }

        const timeoutId = setTimeout(fetchPincodeDetails, 500)

        return () => {
            clearTimeout(timeoutId)
            controller.abort()
        }
    }, [pincodeValue, form])
}
