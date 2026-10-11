import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (
    process.env.NEXT_PUBLIC_APP_URL || 'https://maji.hoberg.com.ng'
  ).replace(/\/$/, '')

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
      images: [`${baseUrl}/brand/maji-og-banner-1200x630-light.png`],
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ]

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return staticRoutes
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey)

    const [storesResult, productsResult] = await Promise.all([
      supabase
        .from('stores')
        .select('id, slug, created_at, updated_at, store_settings(logo_url, banner_url)')
        .eq('is_active', true),
      supabase
        .from('products')
        .select(
          'slug, created_at, updated_at, store_id, stores(slug, is_active), product_images(image_url)'
        )
        .eq('is_published', true),
    ])

    const stores = storesResult.data || []
    const products = productsResult.data || []

    const activeStoreSlugById = new Map<string, string>()

    const storeUrls: MetadataRoute.Sitemap = stores
      .filter((store) => Boolean(store.slug))
      .map((store) => {
        activeStoreSlugById.set(store.id, store.slug)
        const settings = Array.isArray(store.store_settings)
          ? store.store_settings[0]
          : store.store_settings
        const images = [settings?.banner_url, settings?.logo_url].filter(
          (url): url is string => Boolean(url && url.startsWith('http'))
        )

        return {
          url: `${baseUrl}/store/${encodeURIComponent(store.slug)}`,
          lastModified: store.updated_at || store.created_at || new Date(),
          changeFrequency: 'daily' as const,
          priority: 0.9,
          ...(images.length > 0 ? { images } : {}),
        }
      })

    const productUrls: MetadataRoute.Sitemap = products
      .map((product) => {
        const joinedStore = Array.isArray(product.stores)
          ? product.stores[0]
          : product.stores
        const storeSlug =
          (joinedStore?.is_active !== false && joinedStore?.slug) ||
          activeStoreSlugById.get(product.store_id)

        if (!storeSlug || !product.slug) return null

        const rawImages = Array.isArray(product.product_images)
          ? product.product_images
          : []
        const images = rawImages
          .map((img: any) => img?.image_url)
          .filter((url): url is string => Boolean(url && url.startsWith('http')))

        return {
          url: `${baseUrl}/store/${encodeURIComponent(storeSlug)}/product/${encodeURIComponent(product.slug)}`,
          lastModified: product.updated_at || product.created_at || new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
          ...(images.length > 0 ? { images } : {}),
        }
      })
      .filter(Boolean) as MetadataRoute.Sitemap

    return [...staticRoutes, ...storeUrls, ...productUrls]
  } catch (err) {
    console.error('[Sitemap] Failed to fetch dynamic routes:', err)
    return staticRoutes
  }
}
