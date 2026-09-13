'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Minus, ShoppingCart } from 'lucide-react'
import { useCart } from './cart-context'

export function ProductCard({ storeSlug, product, primaryColor, secondaryColor }: any) {
  const { items, addToCart, removeFromCart, updateQty } = useCart()

  // Check if product is already in cart
  const cartItem = items.find(item => item.id === product.id)
  const inCartQty = cartItem ? cartItem.qty : 0

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addToCart(product, 1) // Add 1
  }

  const handleIncrease = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    updateQty(product.id, inCartQty + 1, product.name)
  }

  const handleDecrease = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (inCartQty === 1) {
      removeFromCart(product.id, product.name)
    } else {
      updateQty(product.id, inCartQty - 1, product.name)
    }
  }

  // Calculate original price if a discount exists
  const hasDiscount = product.discount_percent && product.discount_percent > 0
  const originalPrice = hasDiscount 
    ? (product.price / (1 - (product.discount_percent / 100))) 
    : product.price

  return (
    <div className="flex flex-col bg-white rounded-md overflow-hidden relative border border-gray-100 hover:shadow-lg transition-shadow">
      
      {/* Discount Badge */}
      {hasDiscount && (
        <div className="absolute top-2 right-2 z-10 bg-orange-100 text-orange-600 font-bold text-xs sm:text-sm px-2 py-1 rounded">
          -{product.discount_percent}%
        </div>
      )}

      <Link href={`/store/${storeSlug}/product/${product.slug}`} className="block relative aspect-square bg-gray-50 overflow-hidden group">
        {product.product_images && product.product_images.length > 0 ? (
          <img 
            src={product.product_images[0].image_url} 
            alt={product.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
             <ShoppingCart className="h-10 w-10 opacity-20 mb-2" />
          </div>
        )}
      </Link>

      <div className="p-3 sm:p-4 flex flex-col flex-1">
        <Link href={`/store/${storeSlug}/product/${product.slug}`} className="block flex-1">
          <h3 className="text-sm sm:text-base text-gray-800 line-clamp-2 leading-snug mb-2">{product.name}</h3>
          
          <div className="mb-3">
            <p className="font-extrabold text-lg sm:text-xl text-gray-900 leading-none">
              ₦{Math.round(product.price).toLocaleString()}
            </p>
            {hasDiscount && (
              <p className="text-xs sm:text-sm text-gray-400 line-through mt-1">
                ₦{Math.round(originalPrice).toLocaleString()}
              </p>
            )}
          </div>
        </Link>

        <div className="mt-auto">
          {inCartQty > 0 ? (
            <div className="flex items-center justify-between gap-3">
              <button 
                onClick={handleDecrease}
                style={{ backgroundColor: primaryColor, color: secondaryColor }}
                className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-md font-bold text-xl shrink-0"
              >
                <Minus className="w-5 h-5" />
              </button>
              
              <span className="font-bold text-lg text-gray-900 text-center flex-1">
                {inCartQty}
              </span>
              
              <button 
                onClick={handleIncrease}
                style={{ backgroundColor: primaryColor, color: secondaryColor }}
                className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-md font-bold text-xl shrink-0"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleAddToCart}
              style={{ backgroundColor: primaryColor, color: secondaryColor }}
              className="w-full py-2.5 sm:py-3 rounded-md font-semibold text-sm sm:text-base hover:opacity-90 transition-opacity flex items-center justify-center"
            >
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
