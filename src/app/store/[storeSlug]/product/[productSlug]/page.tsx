import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
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
    .select('id, name, store_settings(*)')
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
    '--store-primary': '#111111',
    '--store-secondary': '#ffffff',
  } as React.CSSProperties

  return (
    <div style={themeStyles} className="min-h-screen bg-[#FAF8F5] text-[#111111] font-sans flex flex-col">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200/80 py-3.5 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex justify-between items-center gap-4">
          <Link href={`/store/${storeSlug}`} className="flex items-center gap-2.5 group min-w-0">
            <span className="w-8 h-8 rounded-xl bg-[#FAF8F5] border border-[#F05A28]/20 flex items-center justify-center shrink-0">
              <MajiLogo variant="symbol-small" colorway="ember-orange" size={20} />
            </span>
            <span className="text-lg font-extrabold tracking-tight text-[#111111] group-hover:text-[#F05A28] transition-colors truncate">
              {store.name}
            </span>
          </Link>
          <nav>
            <CartButton primaryColor="#111111" secondaryColor="#ffffff" />
          </nav>
        </div>
      </header>

      <main className="max-w-6xl w-full mx-auto py-8 px-4 sm:px-8 flex-1">
        <Link href={`/store/${storeSlug}`} className="inline-flex items-center text-sm font-semibold text-gray-600 hover:text-[#111111] mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to {store.name}
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-12 bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-sm">
          {/* Product Image Carousel */}
          <ProductImageCarousel images={product.product_images || []} productName={product.name} />

          {/* Product Info */}
          <div className="flex flex-col">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111111] mb-4">{product.name}</h1>
            
            <div className="prose prose-sm text-gray-600 mb-8 whitespace-pre-wrap leading-relaxed">
              {product.description || "No description provided."}
            </div>

            {/* Smart Specifications Display */}
            {(product.brand || product.condition || (product.attributes && Object.keys(product.attributes).length > 0)) && (
              <div className="mb-8 p-6 rounded-2xl bg-[#FAF8F5] border border-gray-200/80">
                <h3 className="font-extrabold text-base text-[#111111] mb-4">Specifications</h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4 text-sm">
                  {product.sub_category && (
                    <div>
                      <dt className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Category</dt>
                      <dd className="font-semibold text-[#111111]">{product.sub_category}</dd>
                    </div>
                  )}
                  {product.brand && (
                    <div>
                      <dt className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Brand</dt>
                      <dd className="font-semibold text-[#111111]">{product.brand}</dd>
                    </div>
                  )}
                  {product.condition && (
                    <div>
                      <dt className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Condition</dt>
                      <dd className="font-semibold text-[#111111]">{product.condition}</dd>
                    </div>
                  )}
                  {product.attributes && Object.entries(product.attributes).map(([key, value]) => (
                    value ? (
                      <div key={key}>
                        <dt className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </dt>
                        <dd className="font-semibold text-[#111111]">{String(value)}</dd>
                      </div>
                    ) : null
                  ))}
                </dl>
              </div>
            )}

            <div className="pt-6 border-t border-gray-100 mt-auto">
              <AddToCartForm 
                product={product}
                primaryColor="#111111" 
                secondaryColor="#ffffff" 
              />
            </div>
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


