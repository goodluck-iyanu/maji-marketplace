'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Minus, ShoppingCart } from 'lucide-react'
import { useCart } from './cart-context'

export function ProductCard({ storeSlug, product, primaryColor, secondaryColor }: any) {
  const [qty, setQty] = useState(1)
  const [isHovered, setIsHovered] = useState(false)
  const { addToCart } = useCart()

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addToCart(product, qty)
  }

  const descSnippet = product.description 
    ? (product.description.length > 60 ? product.description.substring(0, 60) + '...' : product.description)
    : 'No description'

  return (
    <div 
      className="group flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden transform hover:-translate-y-1 relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/store/${storeSlug}/product/${product.slug}`} className="block relative aspect-square bg-gray-50 overflow-hidden">
        {product.product_images && product.product_images.length > 0 ? (
          <img src={product.product_images[0].image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 group-hover:scale-105 transition-transform duration-300">
             <ShoppingCart className="h-10 w-10 opacity-20 mb-2" />
          </div>
        )}
      </Link>

      <div className="p-5 flex flex-col flex-1">
        <Link href={`/store/${storeSlug}/product/${product.slug}`} className="block">
          <h3 className="font-semibold text-lg text-gray-900 truncate">{product.name}</h3>
          <p className="font-bold text-[var(--store-primary)] mt-1">₦{product.price.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-2 h-10">{descSnippet}</p>
        </Link>

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          <div className="flex items-center bg-gray-100 rounded-full">
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQty(Math.max(1, qty - 1))}} 
              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-black"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-6 text-center text-sm font-medium text-gray-900">{qty}</span>
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQty(qty + 1)}} 
              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-black"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          
          <button 
            onClick={handleAddToCart}
            style={{ backgroundColor: primaryColor, color: secondaryColor }}
            className="px-4 py-2 rounded-full font-medium text-sm hover:opacity-90 transition-opacity"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  )
}
