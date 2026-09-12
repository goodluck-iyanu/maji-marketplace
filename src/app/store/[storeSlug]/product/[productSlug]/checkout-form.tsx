'use client'

import { useState } from 'react'
import { processCheckout } from '../../checkout/actions'
import { Loader2 } from 'lucide-react'

export function CheckoutForm({ storeId, storeSlug, productId, primaryColor, secondaryColor }: { 
  storeId: string, 
  storeSlug: string, 
  productId: string, 
  primaryColor: string, 
  secondaryColor: string 
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    try {
      const res = await processCheckout(formData)
      if (res?.error) {
        setError(res.error)
        setLoading(false)
      }
      // If successful, the action will redirect, so no need to stop loading
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <form action={handleSubmit}>
      <input type="hidden" name="storeId" value={storeId} />
      <input type="hidden" name="storeSlug" value={storeSlug} />
      <input type="hidden" name="productId" value={productId} />
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-4 mb-4">
        <input 
          type="text" 
          name="name" 
          placeholder="Your Full Name" 
          required 
          className="w-full px-4 py-3 border border-opacity-20 bg-transparent rounded-md focus:outline-none focus:ring-2"
          style={{ borderColor: primaryColor }}
        />
        <input 
          type="email" 
          name="email" 
          placeholder="Your Email Address" 
          required 
          className="w-full px-4 py-3 border border-opacity-20 bg-transparent rounded-md focus:outline-none focus:ring-2"
          style={{ borderColor: primaryColor }}
        />
      </div>
      <button 
        type="submit" 
        disabled={loading}
        className="w-full py-4 rounded-md font-medium text-lg hover:opacity-90 transition-opacity flex justify-center items-center disabled:opacity-70"
        style={{ backgroundColor: primaryColor, color: secondaryColor }}
      >
        {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Buy Now'}
      </button>
    </form>
  )
}

