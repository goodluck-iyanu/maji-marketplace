import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { ProductCard } from './product-card'
import { CartButton } from './cart-button'

export async function generateMetadata({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params
  const supabase = await createClient()

  const { data: store } = await supabase
    .from('stores')
    .select('name, store_settings(about_text)')
    .eq('slug', storeSlug)
    .eq('is_active', true)
    .single()

  if (!store) {
    return { title: 'Store Not Found - Maji' }
  }

  return {
    title: `${store.name} — Shop Online`,
    description: (Array.isArray(store.store_settings) ? store.store_settings[0] : store.store_settings)?.about_text || `Shop online at ${store.name}`,
    openGraph: {
      title: `${store.name} — Shop Online`,
      description: (Array.isArray(store.store_settings) ? store.store_settings[0] : store.store_settings)?.about_text || `Shop online at ${store.name}`,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/store/${storeSlug}`,
      siteName: store.name,
      images: [
        {
          url: `${process.env.NEXT_PUBLIC_APP_URL}/store/${storeSlug}/opengraph-image`,
          width: 1200,
          height: 630,
        }
      ],
      type: 'website',
    }
  }
}

export default async function StorePage({
  params,
}: {
  params: Promise<{ storeSlug: string }>
}) {
  const { storeSlug } = await params
  const supabase = await createClient()

  const { data: store } = await supabase
    .from('stores')
    .select('id, name, store_settings(*)')
    .eq('slug', storeSlug)
    .eq('is_active', true)
    .single()

  if (!store) {
    notFound()
  }

  const { data: products } = await supabase
    .from('products')
    .select('*, product_images(image_url)')
    .eq('store_id', store.id)
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  const settings = (Array.isArray(store.store_settings) ? store.store_settings[0] : store.store_settings) || {}

  // We inject basic CSS vars based on their settings
  const themeStyles = {
    '--store-primary': settings.primary_color || '#000000',
    '--store-secondary': settings.secondary_color || '#ffffff',
  } as React.CSSProperties

  return (
    <div style={themeStyles} className="min-h-screen bg-[var(--store-secondary)] text-[var(--store-primary)] font-sans">
      <header className="border-b border-opacity-10 py-6 px-4 sm:px-8 flex justify-between items-center max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold tracking-tight">
          {store.name}
        </h1>
        <nav>
          <CartButton 
            primaryColor={settings.primary_color || '#000000'} 
            secondaryColor={settings.secondary_color || '#ffffff'} 
          />
        </nav>
      </header>
      
      {settings.banner_url && (
        <div className="w-full h-64 bg-gray-200">
          <img src={settings.banner_url} alt={`${store.name} Banner`} className="w-full h-full object-cover" />
        </div>
      )}

      <main className="max-w-6xl mx-auto py-12 px-4 sm:px-8">
        {settings.about_text && (
          <div className="mb-12 max-w-2xl">
            <h2 className="text-xl font-semibold mb-2">About us</h2>
            <p className="text-opacity-80 leading-relaxed">{settings.about_text}</p>
          </div>
        )}

        <h2 className="text-xl font-semibold mb-6">Latest Products</h2>
        
        {(!products || products.length === 0) ? (
          <div className="py-12 text-center text-opacity-60">
            This store hasn't added any products yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map(product => (
              <ProductCard 
                key={product.id} 
                storeSlug={storeSlug} 
                product={product} 
                primaryColor={settings.primary_color || '#000000'}
                secondaryColor={settings.secondary_color || '#ffffff'}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="py-12 mt-12 border-t border-opacity-10 text-center text-sm text-opacity-60">
        <p>© {new Date().getFullYear()} {store.name}. All rights reserved.</p>
        <p className="mt-2 text-xs">Powered by Maji</p>
      </footer>
    </div>
  )
}

