'use client'

import { useState, useMemo } from 'react'
import { Search, Flame, SlidersHorizontal, Sparkles, X, PackageCheck } from 'lucide-react'
import { ProductCard } from './product-card'
import { MajiLogo } from '@/components/brand/maji-brand'

interface StorefrontCatalogProps {
  storeSlug: string
  products: any[]
}

export function StorefrontCatalog({ storeSlug, products }: StorefrontCatalogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [onlyDeals, setOnlyDeals] = useState(false)
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'discount'>('newest')

  // Extract unique categories / brands from products
  const categories = useMemo(() => {
    const set = new Set<string>()
    products.forEach((p) => {
      if (p.sub_category && typeof p.sub_category === 'string') {
        set.add(p.sub_category.trim())
      } else if (p.brand && typeof p.brand === 'string') {
        set.add(p.brand.trim())
      }
    })
    return Array.from(set).slice(0, 8)
  }, [products])

  const dealsCount = useMemo(
    () => products.filter((p) => Number(p.discount_percent) > 0).length,
    [products]
  )

  const filteredProducts = useMemo(() => {
    let list = [...products]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.sub_category?.toLowerCase().includes(q)
      )
    }

    if (activeCategory !== 'all') {
      list = list.filter(
        (p) => p.sub_category === activeCategory || p.brand === activeCategory
      )
    }

    if (onlyDeals) {
      list = list.filter((p) => Number(p.discount_percent) > 0)
    }

    list.sort((a, b) => {
      const priceA = a.discount_percent > 0 ? a.price * (1 - a.discount_percent / 100) : a.price
      const priceB = b.discount_percent > 0 ? b.price * (1 - b.discount_percent / 100) : b.price

      if (sortBy === 'price-asc') return priceA - priceB
      if (sortBy === 'price-desc') return priceB - priceA
      if (sortBy === 'discount') return (Number(b.discount_percent) || 0) - (Number(a.discount_percent) || 0)
      return 0
    })

    return list
  }, [products, searchQuery, activeCategory, onlyDeals, sortBy])

  if (!products || products.length === 0) {
    return (
      <div className="py-16 px-4 text-center bg-white rounded-3xl border border-gray-200/80 shadow-xs max-w-lg mx-auto my-6">
        <div className="w-16 h-16 rounded-2xl bg-[#FAF8F5] border border-[#F05A28]/20 flex items-center justify-center mx-auto mb-4">
          <MajiLogo variant="symbol" colorway="ember-duotone-light" size={38} animation="bounce" />
        </div>
        <h3 className="text-lg font-extrabold text-[#111111] mb-1">No products published yet</h3>
        <p className="text-sm text-gray-500">This store is setting up its catalog. Check back soon for new arrivals!</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Jumia / Temu / Alibaba Style Search & Filter Control Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-3 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between">
          {/* Search Input with Orange Search Button */}
          <div className="relative flex-1 flex items-center">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, brands, or categories in this store..."
              className="w-full pl-10 pr-24 py-2.5 bg-[#FAF8F5] border border-gray-200 rounded-xl text-sm text-[#111111] placeholder:text-gray-400 focus:outline-none focus:border-[#F05A28] focus:ring-2 focus:ring-[#F05A28]/20 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-20 p-1 text-gray-400 hover:text-[#111111]"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              className="absolute right-1.5 px-3.5 py-1.5 rounded-lg bg-[#F05A28] hover:bg-[#d94d1e] text-white text-xs font-extrabold transition-colors shadow-2xs"
            >
              Search
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 pl-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#F05A28]" />
              <span className="hidden sm:inline">Sort:</span>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#FAF8F5] border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-[#111111] focus:outline-none focus:border-[#F05A28] cursor-pointer"
            >
              <option value="newest">Recommended</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              {dealsCount > 0 && <option value="discount">Biggest Discount</option>}
            </select>
          </div>
        </div>

        {/* Filter Pills Row (All Items, Flash Deals, Categories) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
          <button
            type="button"
            onClick={() => {
              setActiveCategory('all')
              setOnlyDeals(false)
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeCategory === 'all' && !onlyDeals
                ? 'bg-[#F05A28] text-white shadow-xs shadow-[#F05A28]/25'
                : 'bg-[#FAF8F5] text-gray-700 border border-gray-200 hover:border-[#F05A28]/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            All Items ({products.length})
          </button>

          {dealsCount > 0 && (
            <button
              type="button"
              onClick={() => setOnlyDeals(!onlyDeals)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                onlyDeals
                  ? 'bg-gradient-to-r from-[#F05A28] to-[#FF8559] text-white shadow-xs shadow-[#F05A28]/30'
                  : 'bg-[#F05A28]/10 text-[#F05A28] border border-[#F05A28]/25 hover:bg-[#F05A28]/15'
              }`}
            >
              <Flame className="w-3.5 h-3.5 fill-current" />
              Flash Deals ({dealsCount})
            </button>
          )}

          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(activeCategory === cat ? 'all' : cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? 'bg-[#F05A28] text-white shadow-xs shadow-[#F05A28]/25'
                  : 'bg-[#FAF8F5] text-gray-700 border border-gray-200 hover:border-[#F05A28]/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Flash Deals Strip Header if deals exist and user is browsing all */}
      {dealsCount > 0 && !onlyDeals && !searchQuery && activeCategory === 'all' && (
        <div className="bg-gradient-to-r from-[#F05A28] via-[#f36838] to-[#FF8559] rounded-2xl p-3.5 sm:px-5 text-white flex items-center justify-between gap-3 shadow-sm shadow-[#F05A28]/15">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              <Flame className="w-4 h-4 text-white fill-white" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-tight">Super Store Deals</span>
                <span className="hidden sm:inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/25">
                  Limited Offer
                </span>
              </div>
              <p className="text-xs text-white/90">Save big on {dealsCount} discounted {dealsCount === 1 ? 'item' : 'items'} in this store</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOnlyDeals(true)}
            className="px-3.5 py-1.5 rounded-xl bg-white text-[#F05A28] font-extrabold text-xs hover:bg-[#FAF8F5] transition-colors shrink-0 shadow-2xs"
          >
            View Deals →
          </button>
        </div>
      )}

      {/* Results Count Bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <PackageCheck className="w-4 h-4 text-[#F05A28]" />
          <h2 className="text-sm sm:text-base font-extrabold text-[#111111]">
            {onlyDeals ? 'Flash Deals' : activeCategory !== 'all' ? activeCategory : 'Store Catalog'}
          </h2>
          <span className="text-xs font-bold text-gray-500">
            ({filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'})
          </span>
        </div>

        {(searchQuery || activeCategory !== 'all' || onlyDeals) && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('')
              setActiveCategory('all')
              setOnlyDeals(false)
            }}
            className="text-xs font-bold text-[#F05A28] hover:underline"
          >
            Reset filters
          </button>
        )}
      </div>

      {/* Product Grid — 2 columns on mobile (like Jumia/Temu/Alibaba), up to 5 on desktop */}
      {filteredProducts.length === 0 ? (
        <div className="py-12 px-4 text-center bg-white rounded-2xl border border-gray-200/80">
          <p className="font-bold text-[#111111] mb-1">No matching products found</p>
          <p className="text-xs text-gray-500 mb-4">Try clearing your search or switching category filters.</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('')
              setActiveCategory('all')
              setOnlyDeals(false)
            }}
            className="px-5 py-2 rounded-xl bg-[#F05A28] text-white text-xs font-extrabold hover:bg-[#d94d1e] transition-colors"
          >
            Show All Products
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              storeSlug={storeSlug}
              product={product}
              primaryColor="#F05A28"
              secondaryColor="#ffffff"
            />
          ))}
        </div>
      )}
    </div>
  )
}
