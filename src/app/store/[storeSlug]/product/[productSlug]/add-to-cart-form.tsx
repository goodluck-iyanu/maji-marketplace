'use client'

import { useState, useMemo } from 'react'
import { ShoppingBag } from 'lucide-react'
import { useCart } from '../../cart-context'

export function AddToCartForm({ product }: any) {
  const [qty, setQty] = useState(1)
  const { addToCart } = useCart()

  // State for selected options, e.g., { "Size": "M", "Color": "Black" }
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})

  const hasVariants = product.has_variants && product.product_variants?.length > 0
  
  // Initialize default options
  useMemo(() => {
    if (hasVariants && Object.keys(selectedOptions).length === 0) {
      const firstVariant = product.product_variants[0]
      if (firstVariant?.options) {
        setSelectedOptions(firstVariant.options)
      }
    }
  }, [hasVariants, product.product_variants, selectedOptions])

  const handleOptionChange = (optionName: string, value: string) => {
    setSelectedOptions(prev => ({ ...prev, [optionName]: value }))
  }

  // Find the matched variant
  const matchedVariant = useMemo(() => {
    if (!hasVariants) return null
    return product.product_variants?.find((v: any) => {
      // check if all selected options match this variant's options
      return Object.entries(selectedOptions).every(([k, val]) => v.options?.[k] === val)
    })
  }, [hasVariants, selectedOptions, product.product_variants])

  const basePrice = matchedVariant ? matchedVariant.price : product.price
  const hasDiscount = Boolean(product.discount_percent && product.discount_percent > 0)
  const currentPrice = hasDiscount 
    ? (basePrice * (1 - (product.discount_percent / 100))) 
    : basePrice

  const originalPrice = basePrice
  const inStock = matchedVariant ? matchedVariant.stock > 0 : product.stock > 0

  return (
    <div className="space-y-6">
      
      {/* Dynamic Price Display */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <p className="text-3xl font-extrabold text-[#111111]">₦{Number(currentPrice).toLocaleString()}</p>
          {hasDiscount && (
            <span className="px-2.5 py-0.5 rounded-full bg-[#F05A28] text-white text-xs font-extrabold">
              -{product.discount_percent}%
            </span>
          )}
        </div>
        {hasDiscount && (
          <p className="text-sm text-gray-400 line-through mt-1">
            ₦{Number(originalPrice).toLocaleString()}
          </p>
        )}
      </div>

      {/* Option Selectors */}
      {hasVariants && product.product_options?.map((opt: any) => (
        <div key={opt.id} className="space-y-2">
          <label className="font-bold text-sm text-[#111111]">{opt.name}</label>
          <div className="flex flex-wrap gap-2">
            {opt.values.map((val: string) => {
              const isSelected = selectedOptions[opt.name] === val
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleOptionChange(opt.name, val)}
                  className={`px-4 py-2 border rounded-xl text-sm font-bold transition-all ${
                    isSelected 
                      ? 'bg-[#111111] text-white border-[#111111] ring-2 ring-[#F05A28]/30 shadow-xs' 
                      : 'bg-[#FAF8F5] text-gray-700 border-gray-200 hover:border-[#F05A28]'
                  }`}
                >
                  {val}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
        <label className="font-bold text-sm text-[#111111]">Quantity</label>
        <div className="flex items-center border border-gray-200 rounded-xl bg-[#FAF8F5] overflow-hidden">
          <button 
            type="button"
            onClick={() => setQty(Math.max(1, qty - 1))}
            className="px-4 py-2 hover:bg-gray-200/70 text-[#111111] font-bold transition-colors"
          >-</button>
          <span className="px-4 py-2 font-extrabold text-[#111111] border-x border-gray-200 min-w-[3rem] text-center">{qty}</span>
          <button 
            type="button"
            onClick={() => setQty(qty + 1)}
            className="px-4 py-2 hover:bg-gray-200/70 text-[#111111] font-bold transition-colors"
          >+</button>
        </div>
      </div>

      <button 
        onClick={() => {
          const itemToAdd = matchedVariant 
            ? { 
                ...matchedVariant, 
                parent_name: product.name,
                image_url: product.product_images?.[0]?.image_url 
              } 
            : product;
          addToCart(itemToAdd, qty)
        }}
        disabled={!inStock}
        className="w-full py-4 rounded-xl bg-[#111111] text-white font-bold text-lg hover:bg-[#F05A28] transition-all flex justify-center items-center shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ShoppingBag className="h-5 w-5 mr-2" />
        {inStock ? 'Add to Cart' : 'Out of Stock'}
      </button>
    </div>
  )
}
