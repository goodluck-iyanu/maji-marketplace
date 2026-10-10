import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { ProductCard } from './product-card'
import { CartButton } from './cart-button'
import { MajiLogo, MajiStorefrontBadge } from '@/components/brand/maji-brand'

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
    .select('*, product_images(image_url), product_options(*)')
    .eq('store_id', store.id)
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  const settings = (Array.isArray(store.store_settings) ? store.store_settings[0] : store.store_settings) || {}

  // Unified Maji brand CSS variables across all seller storefronts
  const themeStyles = {
    '--store-primary': '#111111',
    '--store-secondary': '#ffffff',
  } as React.CSSProperties

  // Helper to construct smart social URLs
  const formatSocialUrl = (platform: string, handle: string) => {
    const val = handle.trim()
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
    <div style={themeStyles} className="min-h-screen bg-[#FAF8F5] text-[#111111] font-sans flex flex-col">
      {/* Sticky Top Bar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200/80 py-3.5 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex justify-between items-center gap-4">
          <Link href={`/store/${storeSlug}`} className="flex items-center gap-2.5 group min-w-0">
            <span className="w-8 h-8 rounded-xl bg-[#FAF8F5] border border-[#F05A28]/20 flex items-center justify-center shrink-0">
              <MajiLogo variant="symbol-small" colorway="ember-orange" size={20} />
            </span>
            <span className="font-extrabold tracking-tight text-lg text-[#111111] group-hover:text-[#F05A28] transition-colors truncate">
              {store.name}
            </span>
          </Link>
          <CartButton primaryColor="#111111" secondaryColor="#ffffff" />
        </div>
      </header>

      {settings.banner_url && (
        <div className="w-full h-48 sm:h-64 bg-gray-200 relative overflow-hidden">
          <img src={settings.banner_url} alt={`${store.name} Banner`} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
      )}

      {/* Hero / Profile Section */}
      <section className="relative overflow-hidden border-b border-gray-200/70 bg-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[640px] h-[260px] rounded-full bg-[#F05A28]/8 blur-3xl"
        />
        <div className={`max-w-3xl mx-auto px-4 pb-10 text-center flex flex-col items-center relative z-10 ${settings.banner_url ? '-mt-12 sm:-mt-16' : 'pt-10 sm:pt-12'}`}>
          {settings.logo_url ? (
            <img
              src={settings.logo_url}
              alt={`${store.name} Logo`}
              className="h-24 w-24 sm:h-28 sm:w-28 object-cover rounded-3xl shadow-xl shadow-black/8 border-4 border-white mb-4 bg-white"
            />
          ) : (
            <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-3xl shadow-xl shadow-[#F05A28]/10 border-4 border-white mb-4 bg-[#FAF8F5] flex items-center justify-center">
              <span className="text-3xl sm:text-4xl text-[#F05A28] font-extrabold">{store.name.charAt(0).toUpperCase()}</span>
            </div>
          )}
          
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111111] mb-2.5">
            {store.name}
          </h1>
          
          {settings.about_text && (
            <p className="text-gray-600 leading-relaxed max-w-xl mx-auto text-sm sm:text-base mb-5 whitespace-pre-wrap">
              {settings.about_text}
            </p>
          )}

          {/* Social Links Pills */}
          {store.social_links && store.social_links.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 sm:gap-2.5 mb-3">
              {store.social_links.map((link: any) => (
                <a 
                  key={link.platform} 
                  href={formatSocialUrl(link.platform, link.url)} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="px-4 py-1.5 rounded-full border border-gray-200 bg-[#FAF8F5] text-[#111111] hover:bg-[#F05A28] hover:text-white hover:border-[#F05A28] transition-all text-xs sm:text-sm font-bold capitalize shadow-2xs"
                >
                  {link.platform}
                </a>
              ))}
            </div>
          )}
          
          {settings.address && (
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FAF8F5] border border-gray-200/80 text-xs sm:text-sm text-gray-600 mt-1 font-medium">
              <MapPin className="w-3.5 h-3.5 text-[#F05A28] shrink-0" />
              <span>{settings.address}</span>
            </div>
          )}
        </div>
      </section>

      <main className="max-w-6xl w-full mx-auto py-10 px-3 sm:py-14 sm:px-8 flex-1">
        <div className="flex items-center justify-between mb-6 px-1">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#111111] tracking-tight">Latest Products</h2>
            {products && products.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-white border border-gray-200 text-xs font-bold text-gray-600">
                {products.length}
              </span>
            )}
          </div>
        </div>
        
        {(!products || products.length === 0) ? (
          <div className="py-16 px-4 text-center bg-white rounded-3xl border border-gray-200/80 shadow-xs max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-[#FAF8F5] border border-[#F05A28]/20 flex items-center justify-center mx-auto mb-4">
              <MajiLogo variant="symbol" colorway="ember-duotone-light" size={38} animation="bounce" />
            </div>
            <h3 className="text-lg font-extrabold text-[#111111] mb-1">No products published yet</h3>
            <p className="text-sm text-gray-500">This store is setting up its catalog. Check back soon for new arrivals!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5">
            {products.map(product => (
              <ProductCard 
                key={product.id} 
                storeSlug={storeSlug} 
                product={product} 
                primaryColor="#111111"
                secondaryColor="#ffffff"
              />
            ))}
          </div>
        )}
      </main>

      <footer className="py-10 bg-white border-t border-gray-200/80 text-center text-sm text-gray-500 flex flex-col items-center gap-3">
        <p className="font-medium text-gray-600">© {new Date().getFullYear()} {store.name}. All rights reserved.</p>
        <Link href="/" className="inline-block hover:opacity-85 transition-opacity">
          <MajiStorefrontBadge height={34} />
        </Link>
      </footer>
    </div>
  )
}

