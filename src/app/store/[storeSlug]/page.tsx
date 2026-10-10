import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, ShieldCheck, Zap, Truck, BadgeCheck, Store } from 'lucide-react'
import { CartButton } from './cart-button'
import { StorefrontCatalog } from './storefront-catalog'
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
    .select('id, name, store_category, product_type, store_settings(*), social_links(*)')
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
    '--store-primary': '#F05A28',
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
      {/* Jumia / Temu / Alibaba Style Top Trust & Promo Bar */}
      <div className="bg-[#111111] text-white text-[11px] sm:text-xs font-semibold py-2 px-4 border-b border-white/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 overflow-x-auto no-scrollbar whitespace-nowrap">
          <div className="flex items-center gap-1.5 text-[#FF8559]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#F05A28] shrink-0" />
            <span>100% Maji Buyer Protection</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-gray-300">
            <Zap className="w-3.5 h-3.5 text-[#F05A28] shrink-0" />
            <span>Direct Official Store Pricing · Instant Paystack Checkout</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-300">
            <Truck className="w-3.5 h-3.5 text-[#F05A28] shrink-0" />
            <span>{store.product_type === 'digital' ? 'Instant Digital Delivery' : 'Tracked Delivery Available'}</span>
          </div>
        </div>
      </div>

      {/* Sticky Top Store Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200/80 py-3 px-4 sm:px-8 shadow-2xs">
        <div className="max-w-6xl mx-auto flex justify-between items-center gap-4">
          <Link href={`/store/${storeSlug}`} className="flex items-center gap-2.5 group min-w-0">
            <span className="w-8 h-8 rounded-xl bg-[#F05A28]/10 border border-[#F05A28]/25 flex items-center justify-center shrink-0">
              <MajiLogo variant="symbol-small" colorway="ember-orange" size={20} />
            </span>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-extrabold tracking-tight text-base sm:text-lg text-[#111111] group-hover:text-[#F05A28] transition-colors truncate">
                {store.name}
              </span>
              <BadgeCheck className="w-4 h-4 text-[#F05A28] shrink-0" />
            </div>
          </Link>
          <CartButton primaryColor="#F05A28" secondaryColor="#ffffff" />
        </div>
      </header>

      {/* Alibaba / Jumia Official Store Banner & Profile Card */}
      <section className="relative overflow-hidden border-b border-gray-200/80 bg-white">
        {settings.banner_url ? (
          <div className="w-full h-36 sm:h-52 bg-gray-900 relative overflow-hidden">
            <img src={settings.banner_url} alt={`${store.name} Banner`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/15 to-transparent" />
          </div>
        ) : (
          <div className="w-full h-24 sm:h-32 bg-gradient-to-r from-[#111111] via-[#26140d] to-[#F05A28] relative overflow-hidden">
            <div
              aria-hidden="true"
              className="absolute -right-10 -top-10 w-64 h-64 rounded-full bg-[#FF8559]/25 blur-2xl"
            />
          </div>
        )}

        <div className="max-w-6xl mx-auto px-4 sm:px-8 pb-6 relative z-10 -mt-10 sm:-mt-12">
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-md p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-4">
              {settings.logo_url ? (
                <img
                  src={settings.logo_url}
                  alt={`${store.name} Logo`}
                  className="h-16 w-16 sm:h-20 sm:w-20 object-cover rounded-2xl shadow-md border-2 border-white bg-white shrink-0"
                />
              ) : (
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl shadow-md border-2 border-white bg-gradient-to-br from-[#F05A28] to-[#FF8559] flex items-center justify-center shrink-0">
                  <span className="text-2xl sm:text-3xl text-white font-black">{store.name.charAt(0).toUpperCase()}</span>
                </div>
              )}

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#111111]">
                    {store.name}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F05A28]/10 text-[#F05A28] text-[11px] font-extrabold">
                    <Store className="w-3 h-3" />
                    Official Store
                  </span>
                  {store.store_category && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#FAF8F5] border border-gray-200 text-gray-600 text-[11px] font-bold">
                      {store.store_category}
                    </span>
                  )}
                </div>

                {settings.about_text && (
                  <p className="text-gray-600 text-xs sm:text-sm line-clamp-2 max-w-2xl mb-2">
                    {settings.about_text}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 font-medium">
                  {settings.address && (
                    <span className="inline-flex items-center gap-1 text-gray-600">
                      <MapPin className="w-3.5 h-3.5 text-[#F05A28] shrink-0" />
                      <span>{settings.address}</span>
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Verified Maji Merchant</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Social Links Pills */}
            {store.social_links && store.social_links.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 sm:justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                {store.social_links.map((link: any) => (
                  <a
                    key={link.platform}
                    href={formatSocialUrl(link.platform, link.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-gray-200 text-[#111111] hover:bg-[#F05A28] hover:text-white hover:border-[#F05A28] transition-all text-xs font-bold capitalize"
                  >
                    {link.platform}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <main className="max-w-6xl w-full mx-auto py-6 px-3 sm:py-8 sm:px-8 flex-1">
        <StorefrontCatalog storeSlug={storeSlug} products={products || []} />
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
