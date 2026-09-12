'use client'

import { useCart } from '../cart-context'
import { Minus, Plus, ShoppingBag, Loader2, ArrowLeft, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { processCheckout } from '../checkout/actions'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function CartPage() {
  const params = useParams()
  const storeSlug = params.storeSlug as string
  const { items, updateQty, removeFromCart, totalAmount } = useCart()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCheckout = async (formData: FormData) => {
    setLoading(true)
    setError(null)
    
    const cartData = items.map(item => ({ id: item.id, qty: item.qty }))
    formData.append('cart', JSON.stringify(cartData))
    formData.append('storeSlug', storeSlug)
    
    try {
      const res = await processCheckout(formData)
      if (res?.error) {
        setError(res.error)
        setLoading(false)
      } else if (res?.url) {
        window.location.href = res.url // Redirect client-side for better reliability
      } else {
        setError("An unexpected error occurred. Please try again.")
        setLoading(false)
      }
    } catch (err: any) {
      setError(err.message || 'Checkout failed')
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <ShoppingBag className="h-24 w-24 mb-6 text-gray-200" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
        <p className="text-gray-500 mb-8 text-center max-w-md">Looks like you haven't added anything to your cart yet.</p>
        <Link 
          href={`/store/${storeSlug}`}
          className="px-8 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center">
          <Link href={`/store/${storeSlug}`} className="text-gray-500 hover:text-black flex items-center font-medium">
            <ArrowLeft className="h-5 w-5 mr-2" /> Back to Store
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Cart Items */}
          <div className="md:col-span-7 space-y-4">
            {items.map(item => (
              <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-200 flex gap-4 shadow-sm">
                <div className="w-24 h-24 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingBag className="w-full h-full p-6 text-gray-300" />
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <h3 className="font-semibold text-gray-900 line-clamp-2">{item.name}</h3>
                    <p className="text-gray-900 font-bold mt-1">₦{item.price.toLocaleString()}</p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border border-gray-200 rounded-md bg-gray-50">
                      <button type="button" onClick={() => updateQty(item.id, item.qty - 1)} className="p-1 px-3 hover:bg-gray-200 transition-colors"><Minus className="h-4 w-4"/></button>
                      <span className="px-3 text-sm font-semibold">{item.qty}</span>
                      <button type="button" onClick={() => updateQty(item.id, item.qty + 1)} className="p-1 px-3 hover:bg-gray-200 transition-colors"><Plus className="h-4 w-4"/></button>
                    </div>
                    <button type="button" onClick={() => removeFromCart(item.id)} className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors">Remove</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Checkout Form */}
          <div className="md:col-span-5">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm sticky top-24">
              <h2 className="text-xl font-bold mb-6">Payment Summary</h2>
              
              <div className="flex justify-between items-center mb-6 text-lg">
                <span className="text-gray-600">Total Amount</span>
                <span className="font-bold text-2xl text-gray-900">₦{totalAmount.toLocaleString()}</span>
              </div>
              
              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form action={handleCheckout} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    placeholder="Enter your full name" 
                    required 
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-gray-50 focus:bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    name="email" 
                    placeholder="Enter your email" 
                    required 
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-gray-50 focus:bg-white transition-colors"
                  />
                </div>
                
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-4 bg-black text-white rounded-lg font-bold text-lg hover:bg-gray-800 transition-colors flex justify-center items-center disabled:opacity-70 mt-4 shadow-md"
                >
                  {loading ? <Loader2 className="animate-spin h-6 w-6" /> : 'Pay Now'}
                </button>
              </form>
              
              <p className="text-xs text-center text-gray-500 mt-6 flex items-center justify-center">
                 Secured by Paystack
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

