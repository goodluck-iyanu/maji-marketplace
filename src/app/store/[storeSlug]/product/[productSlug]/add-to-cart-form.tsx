'use client'

import { useState, useMemo } from 'react'
import { ShoppingBag } from 'lucide-react'
import { useCart } from '../../cart-context'

export function AddToCartForm({ product, primaryColor, secondaryColor }: any) {
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

  const currentPrice = matchedVariant ? matchedVariant.price : product.price
  const inStock = matchedVariant ? matchedVariant.stock > 0 : product.stock > 0

  return (
    <div className="space-y-6">
      
      {/* Dynamic Price Display */}
      <p className="text-2xl font-semibold mb-6">?{Number(currentPrice).toLocaleString()}</p>

      {/* Option Selectors */}
      {hasVariants && product.product_options?.map((opt: any) => (
        <div key={opt.id} className="space-y-2">
          <label className="font-medium text-sm">{opt.name}</label>
          <div className="flex flex-wrap gap-2">
            {opt.values.map((val: string) => (
              <button
                key={val}
                type="button"
                onClick={() => handleOptionChange(opt.name, val)}
                className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
                  selectedOptions[opt.name] === val 
                    ? 'ring-2 border-transparent' 
                    : 'hover:border-gray-400'
                }`}
                style={selectedOptions[opt.name] === val ? { borderColor: primaryColor, backgroundColor: primaryColor, color: secondaryColor } : {}}
              >
                {val}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-4 pt-4 border-t border-opacity-10">
        <label className="font-medium text-sm">Quantity</label>
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
        onClick={() => addToCart(matchedVariant || product, qty)}
        disabled={!inStock}
        className="w-full py-4 rounded-md font-medium text-lg transition-opacity flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: primaryColor, color: secondaryColor }}
      >
        <ShoppingBag className="h-5 w-5 mr-2" />
        {inStock ? 'Add to Cart' : 'Out of Stock'}
      </button>
    </div>
  )
}
