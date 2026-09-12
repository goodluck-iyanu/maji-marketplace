'use client'

import { useCart } from './cart-context'
import { X, Minus, Plus, ShoppingBag, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { processCheckout } from './checkout/actions'

export function CartSidebar({ storeId, storeSlug, primaryColor, secondaryColor }: any) {
  const { items, isCartOpen, setIsCartOpen, updateQty, removeFromCart, totalAmount } = useCart()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isCartOpen) return null

  const handleCheckout = async (formData: FormData) => {
    setLoading(true)
    setError(null)
    
    // Convert cart items to the format the server expects
    const cartData = items.map(item => ({ id: item.id, qty: item.qty }))
    formData.append('cart', JSON.stringify(cartData))
    formData.append('storeId', storeId)
    formData.append('storeSlug', storeSlug)
    
    try {
      const res = await processCheckout(formData)
      if (res?.error) {
        setError(res.error)
        setLoading(false)
      }
    } catch (err: any) {
      setError(err.message || 'Checkout failed')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={() => setIsCartOpen(false)}
      ></div>

      {/* Sidebar */}
      <div className="relative w-full max-w-md bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-xl font-bold flex items-center">
            <ShoppingBag className="mr-2 h-5 w-5" /> Your Cart
          </h2>
          <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <ShoppingBag className="h-16 w-16 mb-4 opacity-20" />
              <p>Your cart is empty.</p>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="mt-4 px-6 py-2 rounded-full border border-gray-300 font-medium hover:bg-gray-50"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map(item => (
                <div key={item.id} className="flex gap-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingBag className="w-full h-full p-6 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 line-clamp-2">{item.name}</h3>
                    <p className="text-[var(--store-primary)] font-bold mt-1">₦{item.price.toLocaleString()}</p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-gray-200 rounded-md">
                        <button onClick={() => updateQty(item.id, item.qty - 1)} className="p-1 px-2 hover:bg-gray-100"><Minus className="h-3 w-3"/></button>
                        <span className="px-2 text-sm font-medium">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, item.qty + 1)} className="p-1 px-2 hover:bg-gray-100"><Plus className="h-3 w-3"/></button>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-sm text-red-500 hover:underline">Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-gray-100 p-4 bg-gray-50">
            <div className="flex justify-between items-center mb-4 text-lg font-bold">
              <span>Total</span>
              <span>₦{totalAmount.toLocaleString()}</span>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
                {error}
              </div>
            )}

            <form action={handleCheckout} className="space-y-3">
              <input 
                type="text" 
                name="name" 
                placeholder="Your Full Name" 
                required 
                className="w-full px-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              />
              <input 
                type="email" 
                name="email" 
                placeholder="Your Email Address" 
                required 
                className="w-full px-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              />
              
              <button 
                type="submit" 
                disabled={loading}
                style={{ backgroundColor: primaryColor, color: secondaryColor }}
                className="w-full py-4 rounded-md font-medium text-lg hover:opacity-90 transition-opacity flex justify-center items-center disabled:opacity-70 mt-2"
              >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Checkout'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

