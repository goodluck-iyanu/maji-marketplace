import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck, Truck, BadgeCheck, Zap } from 'lucide-react'
import { AddToCartForm } from './add-to-cart-form'
import { CartButton } from '../../cart-button'
import { ProductImageCarousel } from './product-image-carousel'
import { MajiLogo, MajiStorefrontBadge } from '@/components/brand/maji-brand'

export async function generateMetadata({ params }: { params: Promise<{ storeSlug: string, productSlug: string }> }) {
  const { storeSlug, productSlug } = await params
  const supabase = await createClient()

  const { data: store } = await supabase
    .from('stores')
    .select('id, name')
    .eq('slug', storeSlug)
    .eq('is_active', true)
    .single()

  if (!store) return { title: 'Not Found' }

  const { data: product } = await supabase
    .from('products')
    .select('name, description, price')
    .eq('store_id', store.id)
    .eq('slug', productSlug)
    .eq('is_published', true)
    .single()

  if (!product) return { title: 'Not Found' }

  return {
    title: `${product.name} - ${store.name}`,
    description: product.description || `Buy ${product.name} from ${store.name}`,
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ storeSlug: string, productSlug: string }>
}) {
  const { storeSlug, productSlug } = await params
  const supabase = await createClient()

  const { data: store } = await supabase
    .from('stores')
    .select('id, name, product_type, store_settings(*)')
    .eq('slug', storeSlug)
    .eq('is_active', true)
    .single()

  if (!store) notFound()

  const { data: product } = await supabase
    .from('products')
    .select(`
      *,
      product_images(id, image_url, display_order),
      product_options(*),
      product_variants(*)
    `)
    .eq('store_id', store.id)
    .eq('slug', productSlug)
    .eq('is_published', true)
    .single()

  if (!product) notFound()

  const themeStyles = {
    '--store-primary': '#F05A28',
    '--store-secondary': '#ffffff',
  } as React.CSSProperties

  return (
    <div style={themeStyles} className="min-h-screen bg-[#FAF8F5] text-[#111111] font-sans flex flex-col">
      {/* Top Marketplace Trust Bar */}
      <div className="bg-[#111111] text-white text-[11px] sm:text-xs font-semibold py-2 px-4 border-b border-white/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 overflow-x-auto no-scrollbar whitespace-nowrap">
          <div className="flex items-center gap-1.5 text-[#FF8559]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#F05A28] shrink-0" />
            <span>100% Maji Buyer Protection</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-gray-300">
            <Zap className="w-3.5 h-3.5 text-[#F05A28] shrink-0" />
            <span>Verified Official Store · Instant Secure Checkout</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-300">
            <Truck className="w-3.5 h-3.5 text-[#F05A28] shrink-0" />
            <span>{product.is_digital ? 'Instant Digital Access' : 'Tracked Delivery Available'}</span>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200/80 py-3 px-4 sm:px-8 shadow-2xs">
        <div className="max-w-6xl mx-auto flex justify-between items-center gap-4">
          <Link href={`/store/${storeSlug}`} className="flex items-center gap-2.5 group min-w-0">
            <span className="w-8 h-8 rounded-xl bg-[#F05A28]/10 border border-[#F05A28]/25 flex items-center justify-center shrink-0">
              <MajiLogo variant="symbol-small" colorway="ember-orange" size={20} />
            </span>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-base sm:text-lg font-extrabold tracking-tight text-[#111111] group-hover:text-[#F05A28] transition-colors truncate">
                {store.name}
              </span>
              <BadgeCheck className="w-4 h-4 text-[#F05A28] shrink-0" />
            </div>
          </Link>
          <nav>
            <CartButton primaryColor="#F05A28" secondaryColor="#ffffff" />
          </nav>
        </div>
      </header>

      <main className="max-w-6xl w-full mx-auto py-6 sm:py-8 px-4 sm:px-8 flex-1">
        <Link href={`/store/${storeSlug}`} className="inline-flex items-center text-sm font-bold text-gray-600 hover:text-[#F05A28] mb-5 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to {store.name}
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 bg-white p-5 sm:p-8 rounded-3xl border border-gray-200/90 shadow-sm">
          {/* Product Image Carousel */}
          <ProductImageCarousel images={product.product_images || []} productName={product.name} />

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F05A28]/10 text-[#F05A28] text-[11px] font-extrabold">
                <BadgeCheck className="w-3.5 h-3.5" />
                Official {store.name} Listing
              </span>
              {product.condition && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#FAF8F5] border border-gray-200 text-gray-700 text-[11px] font-bold">
                  {product.condition}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111111] mb-4">{product.name}</h1>

            {/* Add to Cart & Flash Deal Price Box at Top of Right Column (Jumia / Temu / Alibaba Style) */}
            <div className="mb-6">
              <AddToCartForm
                product={product}
                primaryColor="#F05A28"
                secondaryColor="#ffffff"
              />
            </div>

            {/* Jumia / Alibaba Style Buyer Protection & Delivery Guarantees */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6 p-3.5 rounded-2xl bg-[#FAF8F5] border border-gray-200/80 text-xs">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#F05A28] shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-[#111111]">Buyer Protection</p>
                  <p className="text-gray-500">Secure payment via Paystack</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Truck className="w-4 h-4 text-[#F05A28] shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-[#111111]">
                    {product.is_digital ? 'Instant Access' : 'Fast Fulfillment'}
                  </p>
                  <p className="text-gray-500">
                    {product.is_digital ? 'Delivered immediately after payment' : 'Live courier quotes at checkout'}
                  </p>
                </div>
              </div>
            </div>

            {/* Product Description */}
            <div className="pt-5 border-t border-gray-100 mb-6">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-gray-500 mb-2">Product Details</h3>
              <div className="prose prose-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {product.description || 'No description provided.'}
              </div>
            </div>

            {/* Smart Specifications Display */}
            {(product.brand || product.condition || (product.attributes && Object.keys(product.attributes).length > 0)) && (
              <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-gray-200/80">
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-[#111111] mb-3.5">Specifications</h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5 text-sm">
                  {product.sub_category && (
                    <div>
                      <dt className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-0.5">Category</dt>
                      <dd className="font-bold text-[#111111]">{product.sub_category}</dd>
                    </div>
                  )}
                  {product.brand && (
                    <div>
                      <dt className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-0.5">Brand</dt>
                      <dd className="font-bold text-[#111111]">{product.brand}</dd>
                    </div>
                  )}
                  {product.condition && (
                    <div>
                      <dt className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-0.5">Condition</dt>
                      <dd className="font-bold text-[#111111]">{product.condition}</dd>
                    </div>
                  )}
                  {product.attributes && Object.entries(product.attributes).map(([key, value]) => (
                    value ? (
                      <div key={key}>
                        <dt className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-0.5">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </dt>
                        <dd className="font-bold text-[#111111]">{String(value)}</dd>
                      </div>
                    ) : null
                  ))}
                </dl>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="py-10 bg-white border-t border-gray-200/80 text-center text-sm text-gray-500 flex flex-col items-center gap-3 mt-12">
        <p className="font-medium text-gray-600">© {new Date().getFullYear()} {store.name}. All rights reserved.</p>
        <Link href="/" className="inline-block hover:opacity-85 transition-opacity">
          <MajiStorefrontBadge height={34} />
        </Link>
      </footer>
    </div>
  )
}
