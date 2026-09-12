'use client'

import { useState } from 'react'
import { Loader2, ShoppingBag } from 'lucide-react'
import { useCart } from '../../cart-context'

export function AddToCartForm({ product, primaryColor, secondaryColor }: any) {
  const [qty, setQty] = useState(1)
  const { addToCart } = useCart()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <label className="font-medium text-gray-700">Quantity</label>
        <div className="flex items-center border border-gray-300 rounded-md">
          <button 
            type="button"
            onClick={() => setQty(Math.max(1, qty - 1))}
            className="px-4 py-2 hover:bg-gray-50 text-gray-600"
          >-</button>
          <span className="px-4 py-2 font-medium border-x border-gray-300 min-w-[3rem] text-center">{qty}</span>
          <button 
            type="button"
            onClick={() => setQty(qty + 1)}
            className="px-4 py-2 hover:bg-gray-50 text-gray-600"
          >+</button>
        </div>
      </div>

      <button 
        onClick={() => addToCart(product, qty)}
        className="w-full py-4 rounded-md font-medium text-lg hover:opacity-90 transition-opacity flex justify-center items-center"
        style={{ backgroundColor: primaryColor, color: secondaryColor }}
      >
        <ShoppingBag className="h-5 w-5 mr-2" />
        Add to Cart
      </button>
    </div>
  )
}

