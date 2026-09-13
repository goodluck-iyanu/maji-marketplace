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
    .select('id, name, store_settings(*), social_links(*)')
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

  // Helper to construct smart social URLs
  const formatSocialUrl = (platform: string, handle: string) => {
    let val = handle.trim()
    if (val.startsWith('http')) return val

    switch (platform.toLowerCase()) {
      case 'facebook': return `https://facebook.com/${val}`
      case 'twitter': return `https://twitter.com/${val.replace('@', '')}`
      case 'instagram': return `https://instagram.com/${val.replace('@', '')}`
      case 'tiktok': return `https://tiktok.com/@${val.replace('@', '')}`
      case 'whatsapp': return `https://wa.me/${val.replace(/[^0-9]/g, '')}`
      default: return val
    }
  }

  return (
    <div style={themeStyles} className="min-h-screen bg-[var(--store-secondary)] text-[var(--store-primary)] font-sans">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-50 bg-[var(--store-secondary)]/90 backdrop-blur-md border-b border-opacity-10 py-3 px-4 flex justify-between items-center">
        <Link href={`/store/${storeSlug}`} className="font-bold tracking-tight text-lg line-clamp-1">
          {store.name}
        </Link>
        <CartButton 
          primaryColor={settings.primary_color || '#000000'} 
          secondaryColor={settings.secondary_color || '#ffffff'} 
        />
      </div>

      {settings.banner_url && (
        <div className="w-full h-48 sm:h-64 bg-gray-200">
          <img src={settings.banner_url} alt={`${store.name} Banner`} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Hero / Profile Section */}
      <div className={`max-w-3xl mx-auto px-4 text-center flex flex-col items-center ${settings.banner_url ? '-mt-12 sm:-mt-16 relative z-10' : 'pt-10'}`}>
        {settings.logo_url ? (
          <img src={settings.logo_url} alt={`${store.name} Logo`} className="h-24 w-24 sm:h-32 sm:w-32 object-cover rounded-full shadow-lg border-4 border-[var(--store-secondary)] mb-4 bg-[var(--store-secondary)]" />
        ) : (
          <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full shadow-lg border-4 border-[var(--store-secondary)] mb-4 bg-gray-100 flex items-center justify-center">
            <span className="text-3xl text-gray-400 font-bold">{store.name.charAt(0)}</span>
          </div>
        )}
        
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
          {store.name}
        </h1>
        
        {settings.about_text && (
          <p className="text-opacity-80 leading-relaxed max-w-xl mx-auto text-sm sm:text-base mb-6 whitespace-pre-wrap">
            {settings.about_text}
          </p>
        )}

        {/* Social Links Pills */}
        {store.social_links && store.social_links.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-4">
            {store.social_links.map((link: any) => (
              <a 
                key={link.platform} 
                href={formatSocialUrl(link.platform, link.url)} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="px-4 py-2 rounded-full border border-opacity-20 hover:bg-[var(--store-primary)] hover:text-[var(--store-secondary)] transition-all text-xs sm:text-sm font-semibold capitalize"
              >
                {link.platform}
              </a>
            ))}
          </div>
        )}
        
        {settings.address && (
          <p className="text-xs sm:text-sm text-opacity-60 mt-2 font-medium">📍 {settings.address}</p>
        )}
      </div>

      <main className="max-w-6xl mx-auto py-10 px-3 sm:py-16 sm:px-8">
        <h2 className="text-lg sm:text-xl font-bold mb-6 px-1">Latest Products</h2>
        
        {(!products || products.length === 0) ? (
          <div className="py-12 text-center text-opacity-60">
            This store hasn't added any products yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
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

      <footer className="py-8 border-t border-opacity-10 text-center text-sm text-opacity-60">
        <p>© {new Date().getFullYear()} {store.name}. All rights reserved.</p>
        <p className="mt-2 text-xs opacity-50">Powered by Maji</p>
      </footer>
    </div>
  )
}

