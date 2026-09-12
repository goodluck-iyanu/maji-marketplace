import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AddToCartForm } from './add-to-cart-form'
import { CartButton } from '../../cart-button'
import { ProductImageCarousel } from './product-image-carousel'

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
    .select('*, product_images(image_url)')
    .eq('store_id', store.id)
    .eq('slug', productSlug)
    .eq('is_published', true)
    .single()

  if (!product) notFound()

  const settings = (Array.isArray(store.store_settings) ? store.store_settings[0] : store.store_settings) || {}
  const themeStyles = {
    '--store-primary': settings.primary_color || '#000000',
    '--store-secondary': settings.secondary_color || '#ffffff',
  } as React.CSSProperties

  return (
    <div style={themeStyles} className="min-h-screen bg-[var(--store-secondary)] text-[var(--store-primary)] font-sans">
      <header className="border-b border-opacity-10 py-4 px-4 sm:px-8 flex justify-between items-center max-w-6xl mx-auto">
        <Link href={`/store/${storeSlug}`} className="text-xl font-bold tracking-tight hover:opacity-80">
          {store.name}
        </Link>
        <nav>
          <CartButton 
            primaryColor={settings.primary_color || '#000000'} 
            secondaryColor={settings.secondary_color || '#ffffff'} 
          />
        </nav>
      </header>

      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-8">
        <Link href={`/store/${storeSlug}`} className="inline-flex items-center text-sm mb-8 opacity-70 hover:opacity-100">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to store
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Product Image Carousel */}
          <ProductImageCarousel images={product.product_images || []} productName={product.name} />

          {/* Product Info */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-4">{product.name}</h1>
            <p className="text-2xl font-semibold mb-6">₦{product.price.toLocaleString()}</p>
            
            <div className="prose prose-sm text-current opacity-80 mb-8 whitespace-pre-wrap">
              {product.description || "No description provided."}
            </div>

            <div className="pt-8 border-t border-opacity-10">
              <AddToCartForm 
                product={product}
                primaryColor={settings.primary_color || '#000000'} 
                secondaryColor={settings.secondary_color || '#ffffff'} 
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}


