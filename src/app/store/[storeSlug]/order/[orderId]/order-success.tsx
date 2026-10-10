'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { useCart } from '../../cart-context'
import { MajiLogo, MajiSpinner } from '@/components/brand/maji-brand'

export function OrderSuccess({ storeSlug, autoRedirectSeconds = 5 }: { storeSlug: string, autoRedirectSeconds?: number }) {
  const router = useRouter()
  const [countdown, setCountdown] = useState(autoRedirectSeconds)
  const { clearCart } = useCart()

  useEffect(() => {
    // Clear the cart securely
    clearCart()
    localStorage.removeItem('maji_cart')
    localStorage.removeItem(`maji_cart_${storeSlug}`)

    // Redirect countdown
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push(`/store/${storeSlug}`)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [storeSlug, router, clearCart])

  return (
    <div className="flex flex-col items-center justify-center py-8 animate-in fade-in zoom-in duration-500">
      <div className="relative mb-6">
        <div className="h-24 w-24 bg-[#FAF8F5] border border-[#F05A28]/20 rounded-3xl flex items-center justify-center shadow-md shadow-[#F05A28]/10">
          <MajiLogo variant="symbol" colorway="ember-orange" size={52} animation="bounce" />
        </div>
        <div className="absolute -bottom-1.5 -right-1.5 h-8 w-8 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-4 ring-white shadow-sm">
          <CheckCircle2 className="h-5 w-5" />
        </div>
      </div>
      
      <h1 className="text-3xl font-extrabold tracking-tight text-[#111111] mb-2">
        Order Confirmed!
      </h1>
      <p className="text-base text-gray-600 font-medium mb-8">
        Your payment has been received and your order is confirmed.
      </p>

      <div className="flex items-center gap-3 text-sm font-semibold text-gray-600 bg-[#FAF8F5] border border-gray-200/80 px-6 py-3 rounded-full">
        <MajiSpinner size={16} color="ember" />
        <span>Returning to store in {countdown} seconds...</span>
      </div>
    </div>
  )
}
