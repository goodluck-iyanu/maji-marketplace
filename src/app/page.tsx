import { createClient } from '@/lib/supabase/server'
import {
  MajiMarketplaceHome,
  type MarketplaceProductItem,
  type MarketplaceStoreItem,
} from '@/components/home/maji-marketplace-home'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createClient()

  // Read-only queries for active stores, published products, and current auth state
  const [authResult, storesResult, productsResult] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('stores')
      .select(
        'id, name, slug, store_category, product_type, is_active, created_at, store_settings(logo_url, banner_url, about_text, address)'
      )
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('products')
      .select(
        'id, name, slug, description, price, discount_percent, stock, is_digital, sub_category, brand, condition, has_variants, store_id, created_at, product_images(image_url, display_order)'
      )
      .eq('is_published', true)
      .order('created_at', { ascending: false }),
  ])

  const isAuthenticated = Boolean(authResult.data?.user)
  const rawStores = storesResult.data || []
  const rawProducts = productsResult.data || []

  // Map active stores by ID
  const storeMap = new Map<
    string,
    {
      id: string
      name: string
      slug: string
      store_category: string | null
      product_type: string | null
      logo_url: string | null
      banner_url: string | null
      about_text: string | null
      address: string | null
    }
  >()

  for (const s of rawStores) {
    const settings = Array.isArray(s.store_settings)
      ? s.store_settings[0]
      : s.store_settings
    storeMap.set(s.id, {
      id: s.id,
      name: (s.name || 'Maji Store').trim(),
      slug: s.slug,
      store_category: s.store_category || null,
      product_type: s.product_type || 'physical',
      logo_url: settings?.logo_url || null,
      banner_url: settings?.banner_url || null,
      about_text: settings?.about_text || null,
      address: settings?.address || null,
    })
  }

  // Build verified published products list belonging to active stores
  const products: MarketplaceProductItem[] = []
  const storeProductCounts = new Map<string, number>()
  const storePreviewImages = new Map<string, string[]>()

  for (const p of rawProducts) {
    const parentStore = storeMap.get(p.store_id)
    if (!parentStore) continue

    const images = Array.isArray(p.product_images) ? [...p.product_images] : []
    images.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
    const primaryImage = images[0]?.image_url || null

    storeProductCounts.set(
      parentStore.id,
      (storeProductCounts.get(parentStore.id) || 0) + 1
    )

    if (primaryImage) {
      const existingPreviews = storePreviewImages.get(parentStore.id) || []
      if (existingPreviews.length < 3) {
        existingPreviews.push(primaryImage)
        storePreviewImages.set(parentStore.id, existingPreviews)
      }
    }

    products.push({
      id: p.id,
      name: (p.name || 'Product').trim(),
      slug: p.slug,
      description: p.description || null,
      price: Number(p.price) || 0,
      discount_percent: p.discount_percent ? Number(p.discount_percent) : null,
      stock: typeof p.stock === 'number' ? p.stock : null,
      is_digital: Boolean(p.is_digital),
      sub_category: p.sub_category || null,
      brand: p.brand || null,
      condition: p.condition || null,
      has_variants: Boolean(p.has_variants),
      image_url: primaryImage,
      store: {
        id: parentStore.id,
        name: parentStore.name,
        slug: parentStore.slug,
        store_category: parentStore.store_category,
        product_type: parentStore.product_type,
        logo_url: parentStore.logo_url,
      },
    })
  }

  // Sort stores so stores with published products or logos appear first
  const stores: MarketplaceStoreItem[] = Array.from(storeMap.values())
    .map((s) => ({
      ...s,
      productCount: storeProductCounts.get(s.id) || 0,
      previewImages: storePreviewImages.get(s.id) || [],
    }))
    .sort((a, b) => {
      if (b.productCount !== a.productCount) return b.productCount - a.productCount
      if (b.logo_url && !a.logo_url) return 1
      if (a.logo_url && !b.logo_url) return -1
      return 0
    })

  const baseUrl = (
    process.env.NEXT_PUBLIC_APP_URL || 'https://maji.hoberg.com.ng'
  ).replace(/\/$/, '')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${baseUrl}/#website`,
        url: baseUrl,
        name: 'Maji Marketplace',
        description:
          'Launch your Nigerian online storefront in minutes with automated Paystack payouts and live delivery quotes — or buy directly from independent Nigerian stores.',
        inLanguage: 'en-NG',
        publisher: {
          '@id': `${baseUrl}/#organization`,
        },
      },
      {
        '@type': 'Organization',
        '@id': `${baseUrl}/#organization`,
        name: 'Maji Marketplace',
        legalName: 'Hoberg Digital',
        url: baseUrl,
        logo: {
          '@type': 'ImageObject',
          url: `${baseUrl}/icon-512.png`,
          width: 512,
          height: 512,
        },
        contactPoint: {
          '@type': 'ContactPoint',
          email: 'support.hoberg@gmail.com',
          contactType: 'customer support',
          areaServed: 'NG',
          availableLanguage: ['English'],
        },
      },
      {
        '@type': 'ItemList',
        name: 'Active Nigerian Storefronts on Maji',
        numberOfItems: stores.length,
        itemListElement: stores.slice(0, 20).map((s, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: s.name,
          url: `${baseUrl}/store/${s.slug}`,
        })),
      },
      {
        '@type': 'ItemList',
        name: 'Published Products on Maji Marketplace',
        numberOfItems: products.length,
        itemListElement: products.slice(0, 24).map((p, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          item: {
            '@type': 'Product',
            name: p.name,
            description: p.description || `${p.name} sold by ${p.store.name} on Maji`,
            url: `${baseUrl}/store/${p.store.slug}/product/${p.slug}`,
            ...(p.image_url ? { image: p.image_url } : {}),
            brand: {
              '@type': 'Brand',
              name: p.brand || p.store.name,
            },
            offers: {
              '@type': 'Offer',
              priceCurrency: 'NGN',
              price: p.discount_percent
                ? Math.round(p.price * (1 - p.discount_percent / 100))
                : p.price,
              availability:
                p.is_digital || (p.stock ?? 1) > 0
                  ? 'https://schema.org/InStock'
                  : 'https://schema.org/OutOfStock',
              url: `${baseUrl}/store/${p.store.slug}/product/${p.slug}`,
              seller: {
                '@type': 'Organization',
                name: p.store.name,
              },
            },
          },
        })),
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MajiMarketplaceHome
        stores={stores}
        products={products}
        isAuthenticated={isAuthenticated}
      />
    </>
  )
}
