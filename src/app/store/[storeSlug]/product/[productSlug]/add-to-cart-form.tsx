'use client'

import { useState, useMemo } from 'react'
import { ShoppingCart, Zap, CheckCircle2, Flame } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useCart } from '../../cart-context'

export function AddToCartForm({ product }: any) {
  const [qty, setQty] = useState(1)
  const { addToCart } = useCart()
  const params = useParams()
  const router = useRouter()
  const storeSlug = params.storeSlug as string

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
      return Object.entries(selectedOptions).every(([k, val]) => v.options?.[k] === val)
    })
  }, [hasVariants, selectedOptions, product.product_variants])

  const basePrice = matchedVariant ? matchedVariant.price : product.price
  const hasDiscount = Boolean(product.discount_percent && product.discount_percent > 0)
  const currentPrice = hasDiscount
    ? basePrice * (1 - product.discount_percent / 100)
    : basePrice

  const originalPrice = basePrice
  const savedAmount = Math.max(0, Math.round(originalPrice - currentPrice))
  const stockCount = matchedVariant ? matchedVariant.stock : product.stock
  const inStock = product.is_digital ? true : stockCount > 0
  const isLowStock = !product.is_digital && stockCount > 0 && stockCount <= 10

  const buildCartItem = () =>
    matchedVariant
      ? {
          ...matchedVariant,
          parent_name: product.name,
          image_url: product.product_images?.[0]?.image_url,
        }
      : product

  const handleAdd = () => {
    addToCart(buildCartItem(), qty)
  }

  const handleBuyNow = () => {
    addToCart(buildCartItem(), qty)
    router.push(`/store/${storeSlug}/cart`)
  }

  return (
    <div className="space-y-5">
      {/* Jumia / Temu / Alibaba Style Price & Flash Deal Box */}
      {hasDiscount ? (
        <div className="rounded-2xl overflow-hidden border border-[#F05A28]/30 shadow-xs">
          <div className="bg-gradient-to-r from-[#F05A28] to-[#FF8559] px-4 py-2 text-white flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider">
              <Zap className="w-4 h-4 fill-white" />
              <span>Flash Deal Offer</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-black/25 text-white text-[11px] font-extrabold">
              -{product.discount_percent}% OFF
            </span>
          </div>
          <div className="bg-[#FAF8F5] p-4 flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <div className="flex items-baseline gap-2.5 flex-wrap">
                <span className="text-3xl sm:text-4xl font-black text-[#F05A28] tracking-tight">
                  ₦{Math.round(Number(currentPrice)).toLocaleString()}
                </span>
                <span className="text-sm sm:text-base text-gray-400 line-through font-semibold">
                  ₦{Math.round(Number(originalPrice)).toLocaleString()}
                </span>
              </div>
              {savedAmount > 0 && (
                <p className="text-xs font-extrabold text-emerald-700 mt-1">
                  You save ₦{savedAmount.toLocaleString()} on this item
                </p>
              )}
            </div>
            {isLowStock ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F05A28]/15 text-[#F05A28] text-xs font-extrabold">
                <Flame className="w-3.5 h-3.5 fill-current" />
                Only {stockCount} left!
              </span>
            ) : inStock ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                In Stock
              </span>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-gray-200/90 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5">Store Price</p>
            <p className="text-3xl sm:text-4xl font-black text-[#F05A28] tracking-tight">
              ₦{Math.round(Number(currentPrice)).toLocaleString()}
            </p>
          </div>
          {isLowStock ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#F05A28]/15 text-[#F05A28] text-xs font-extrabold">
              <Flame className="w-3.5 h-3.5 fill-current" />
              Only {stockCount} left!
            </span>
          ) : inStock ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              In Stock
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold">
              Out of Stock
            </span>
          )}
        </div>
      )}

      {/* Option Selectors */}
      {hasVariants && product.product_options?.map((opt: any) => (
        <div key={opt.id} className="space-y-2">
          <label className="font-extrabold text-xs uppercase tracking-wider text-gray-600">
            Select {opt.name}: <span className="text-[#111111]">{selectedOptions[opt.name]}</span>
          </label>
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
                      ? 'bg-[#F05A28]/10 text-[#F05A28] border-[#F05A28] ring-2 ring-[#F05A28]/25 shadow-2xs'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-[#F05A28]'
                  }`}
                >
                  {val}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {/* Quantity Selector */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <label className="font-bold text-sm text-[#111111]">Quantity</label>
        <div className="flex items-center border border-gray-200 rounded-xl bg-[#FAF8F5] overflow-hidden">
          <button
            type="button"
            onClick={() => setQty(Math.max(1, qty - 1))}
            className="px-4 py-2 hover:bg-gray-200/70 text-[#111111] font-extrabold transition-colors"
          >
            -
          </button>
          <span className="px-4 py-2 font-extrabold text-[#111111] border-x border-gray-200 min-w-[3rem] text-center">
            {qty}
          </span>
          <button
            type="button"
            onClick={() => setQty(qty + 1)}
            className="px-4 py-2 bg-[#F05A28]/10 hover:bg-[#F05A28] text-[#F05A28] hover:text-white font-extrabold transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {/* Jumia / Temu / Alibaba Dual Action CTA Row (Orange Default Add to Cart + Instant Buy Now) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <button
          type="button"
          onClick={handleAdd}
          disabled={!inStock}
          className="w-full py-4 px-5 rounded-xl bg-[#F05A28] hover:bg-[#d94d1e] active:scale-[0.99] text-white font-extrabold text-base sm:text-lg transition-all flex justify-center items-center gap-2 shadow-lg shadow-[#F05A28]/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShoppingCart className="h-5 w-5 shrink-0" />
          <span>{inStock ? 'Add to Cart' : 'Out of Stock'}</span>
        </button>

        {inStock && (
          <button
            type="button"
            onClick={handleBuyNow}
            className="w-full py-4 px-5 rounded-xl bg-[#111111] hover:bg-black/85 active:scale-[0.99] text-white font-extrabold text-base sm:text-lg transition-all flex justify-center items-center gap-2 shadow-md"
          >
            <Zap className="h-5 w-5 text-[#F05A28] fill-[#F05A28] shrink-0" />
            <span>Buy Now</span>
          </button>
        )}
      </div>
    </div>
  )
}
