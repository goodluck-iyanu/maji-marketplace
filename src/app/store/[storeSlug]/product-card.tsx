'use client'

import Link from 'next/link'
import { Plus, Minus, ShoppingCart, Zap, Flame, CheckCircle2 } from 'lucide-react'
import { useCart } from './cart-context'

const colorMap: Record<string, string> = {
  wine: '#722F37',
  ash: '#B2BEB5',
  nude: '#E3BC9A',
  mustard: '#FFDB58',
  olive: '#808000',
  navy: '#000080',
  cream: '#FFFDD0',
  champagne: '#F7E7CE',
  'sky blue': '#87CEEB',
}

export function ProductCard({ storeSlug, product }: any) {
  const { items, addToCart, removeFromCart, updateQty } = useCart()

  // Check if product is already in cart
  const cartItem = items.find(item => item.id === product.id)
  const inCartQty = cartItem ? cartItem.qty : 0

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (product.has_variants) {
      window.location.href = `/store/${storeSlug}/product/${product.slug}`
    } else {
      addToCart(product, 1)
    }
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

  // Calculate current and original price based on discount
  const hasDiscount = Boolean(product.discount_percent && product.discount_percent > 0)
  const currentPrice = hasDiscount
    ? product.price * (1 - product.discount_percent / 100)
    : product.price
  const originalPrice = product.price
  const savedAmount = Math.max(0, Math.round(originalPrice - currentPrice))

  // Stock status
  const stockCount = typeof product.stock === 'number' ? product.stock : null
  const isLowStock = !product.is_digital && stockCount !== null && stockCount > 0 && stockCount <= 10
  const isOutOfStock = !product.is_digital && stockCount !== null && stockCount <= 0

  // Extract color options
  const colorOption = product.product_options?.find((opt: any) => opt.name.toLowerCase() === 'color')
  const colors = colorOption?.values || []

  // Generate a smart specs summary string (e.g. "Apple • New • 256GB")
  const specParts: string[] = []
  if (product.brand) specParts.push(product.brand)
  if (product.condition) specParts.push(product.condition)

  if (product.attributes) {
    Object.entries(product.attributes).slice(0, 2).forEach(([key, val]) => {
      if (val && typeof val === 'string' && val.length < 20) {
        specParts.push(key === 'RAM' ? `${val} RAM` : val)
      }
    })
  }
  const specsSummary = specParts.slice(0, 3).join(' • ')

  return (
    <div className="flex flex-col bg-white rounded-2xl overflow-hidden relative border border-gray-200/90 shadow-2xs hover:shadow-xl hover:border-[#F05A28]/40 hover:-translate-y-0.5 transition-all duration-200 group">
      {/* Jumia / Temu Style Top-Left Flash Deal Tag */}
      {hasDiscount && (
        <div className="absolute top-0 left-0 z-10 bg-gradient-to-r from-[#F05A28] to-[#FF8559] text-white font-extrabold text-[11px] px-2.5 py-1 rounded-br-xl shadow-xs flex items-center gap-0.5">
          <Zap className="w-3 h-3 fill-white" />
          <span>-{product.discount_percent}%</span>
        </div>
      )}

      {/* Low Stock / Digital Tag Top-Right */}
      {isLowStock ? (
        <div className="absolute top-2 right-2 z-10 bg-black/75 backdrop-blur-xs text-[#FF8559] font-extrabold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
          <Flame className="w-2.5 h-2.5 fill-current" />
          <span>{stockCount} left</span>
        </div>
      ) : product.is_digital ? (
        <div className="absolute top-2 right-2 z-10 bg-[#111111]/80 backdrop-blur-xs text-white font-bold text-[10px] px-2 py-0.5 rounded-full">
          Digital
        </div>
      ) : null}

      <Link
        href={`/store/${storeSlug}/product/${product.slug}`}
        className="block relative aspect-square bg-[#FAF8F5] overflow-hidden"
      >
        {product.product_images && product.product_images.length > 0 ? (
          <img
            src={product.product_images[0].image_url}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
            <ShoppingCart className="h-10 w-10 opacity-20 mb-2" />
          </div>
        )}

        {/* Color circles overlay */}
        {colors.length > 0 && (
          <div className="absolute bottom-2 left-2 flex flex-wrap gap-1 bg-white/85 backdrop-blur-xs px-1.5 py-1 rounded-full shadow-2xs">
            {colors.slice(0, 5).map((color: string, idx: number) => {
              const hex = colorMap[color.toLowerCase()] || color.toLowerCase().replace(' ', '')
              return (
                <div
                  key={idx}
                  title={color}
                  className="w-3.5 h-3.5 rounded-full border border-gray-300"
                  style={{ backgroundColor: hex }}
                />
              )
            })}
            {colors.length > 5 && (
              <div className="w-3.5 h-3.5 rounded-full bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-700">
                +
              </div>
            )}
          </div>
        )}
      </Link>

      <div className="p-2.5 sm:p-3.5 flex flex-col flex-1">
        <Link href={`/store/${storeSlug}/product/${product.slug}`} className="block flex-1">
          {/* Title */}
          <h3 className="text-xs sm:text-sm font-bold text-[#111111] group-hover:text-[#F05A28] transition-colors line-clamp-2 leading-snug min-h-[2.25rem] mb-1">
            {product.name}
          </h3>

          {/* Specs or micro-badge */}
          {specsSummary ? (
            <p className="text-[11px] font-medium text-gray-500 line-clamp-1 mb-2">
              {specsSummary}
            </p>
          ) : (
            <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 mb-2">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>Verified Listing</span>
            </div>
          )}

          {/* Temu / Jumia / Alibaba Price Block */}
          <div className="mb-2.5">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="font-black text-base sm:text-lg text-[#F05A28] leading-none tracking-tight">
                ₦{Math.round(currentPrice).toLocaleString()}
              </span>
              {hasDiscount && (
                <span className="text-[11px] text-gray-400 line-through font-medium">
                  ₦{Math.round(originalPrice).toLocaleString()}
                </span>
              )}
            </div>
            {hasDiscount && savedAmount > 0 && (
              <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-[#F05A28]/10 text-[#F05A28] text-[10px] font-extrabold">
                Save ₦{savedAmount.toLocaleString()}
              </span>
            )}
          </div>
        </Link>

        {/* Default Orange Action Button (Jumia / Temu / Alibaba Style) */}
        <div className="mt-auto pt-1">
          {inCartQty > 0 && !product.has_variants ? (
            <div className="flex items-center justify-between gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-[#F05A28]/30">
              <button
                type="button"
                onClick={handleDecrease}
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-[#111111] hover:border-[#F05A28] hover:text-[#F05A28] transition-colors font-bold shrink-0"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <span className="font-extrabold text-sm text-[#111111] text-center flex-1">
                {inCartQty}
              </span>

              <button
                type="button"
                onClick={handleIncrease}
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg bg-[#F05A28] text-white hover:bg-[#d94d1e] transition-colors font-bold shrink-0 shadow-2xs"
                aria-label="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="w-full py-2 sm:py-2.5 px-3 rounded-xl bg-[#F05A28] hover:bg-[#d94d1e] active:scale-[0.98] text-white font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-[#F05A28]/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>
                {isOutOfStock
                  ? 'Out of Stock'
                  : product.has_variants
                    ? 'Select Options'
                    : 'Add to Cart'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
