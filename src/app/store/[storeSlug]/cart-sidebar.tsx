'use client'

import { useCart } from './cart-context'
import { X, Minus, Plus, ShoppingBag } from 'lucide-react'
import { useState } from 'react'
import { processCheckout } from './checkout/actions'
import { MajiLogo, MajiSpinner } from '@/components/brand/maji-brand'

export function CartSidebar({ storeId, storeSlug }: any) {
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
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartOpen(false)}
      ></div>

      {/* Sidebar */}
      <div className="relative w-full max-w-md bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-xl font-extrabold text-[#111111] flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-[#F05A28]" /> Your Cart
          </h2>
          <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-[#111111]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <div className="w-16 h-16 rounded-2xl bg-[#FAF8F5] border border-[#F05A28]/20 flex items-center justify-center mb-4">
                <MajiLogo variant="symbol" colorway="ember-duotone-light" size={38} animation="rocker" />
              </div>
              <p className="font-semibold text-[#111111]">Your cart is empty.</p>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="mt-4 px-6 py-2.5 rounded-full bg-[#111111] text-white text-sm font-bold hover:bg-[#F05A28] transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map(item => (
                <div key={item.id} className="flex gap-4">
                  <div className="w-20 h-20 bg-[#FAF8F5] rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingBag className="w-full h-full p-6 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-[#111111] line-clamp-2">{item.name || 'Product Variant'}</h3>
                    <p className="text-[#111111] font-extrabold mt-1">₦{item.price.toLocaleString()}</p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-gray-200 rounded-lg bg-[#FAF8F5]">
                        <button onClick={() => updateQty(item.id, item.qty - 1)} className="p-1 px-2 hover:bg-gray-200/70 rounded-l-lg"><Minus className="h-3 w-3"/></button>
                        <span className="px-2.5 text-sm font-bold text-[#111111]">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, item.qty + 1)} className="p-1 px-2 hover:bg-gray-200/70 rounded-r-lg"><Plus className="h-3 w-3"/></button>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-sm font-semibold text-red-500 hover:underline">Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-gray-100 p-4 bg-[#FAF8F5]">
            <div className="flex justify-between items-center mb-4 text-lg font-extrabold text-[#111111]">
              <span>Total</span>
              <span>₦{totalAmount.toLocaleString()}</span>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                {error}
              </div>
            )}

            <form action={handleCheckout} className="space-y-3">
              <input 
                type="text" 
                name="name" 
                placeholder="Your Full Name" 
                required 
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F05A28]"
              />
              <input 
                type="email" 
                name="email" 
                placeholder="Your Email Address" 
                required 
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F05A28]"
              />
              
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 rounded-xl bg-[#111111] text-white font-bold text-lg hover:bg-[#F05A28] transition-colors flex justify-center items-center gap-2 disabled:opacity-70 mt-2 shadow-sm"
              >
                {loading ? <MajiSpinner size={20} color="white" /> : 'Checkout'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

