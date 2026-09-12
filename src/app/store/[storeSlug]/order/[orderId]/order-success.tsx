'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { useCart } from '../../cart-context'

export function OrderSuccess({ storeSlug }: { storeSlug: string }) {
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)
  const { clearCart } = useCart()

  useEffect(() => {
    // Clear the cart securely
    clearCart()
    localStorage.removeItem('maji_cart')

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
      <div className="h-24 w-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
        <CheckCircle2 className="h-12 w-12" />
      </div>
      
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
        Congratulations!
      </h1>
      <p className="text-lg text-gray-600 font-medium mb-8">
        Your order has been completed successfully.
      </p>

      <div className="flex items-center text-sm text-gray-500 bg-gray-50 px-6 py-3 rounded-full">
        <Loader2 className="h-4 w-4 animate-spin mr-3" />
        Returning to store in {countdown} seconds...
      </div>
    </div>
  )
}
