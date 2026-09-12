import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey)

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const { data: stores } = await supabase
    .from('stores')
    .select('slug, updated_at')
    .eq('is_active', true)

  const { data: products } = await supabase
    .from('products')
    .select('slug, updated_at, stores(slug)')
    .eq('is_published', true)

  const storeUrls = (stores || []).map((store) => ({
    url: `${baseUrl}/store/${store.slug}`,
    lastModified: store.updated_at,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  const productUrls = (products || []).filter(p => p.stores).map((product) => ({
    // @ts-ignore
    url: `${baseUrl}/store/${product.stores.slug}/product/${product.slug}`,
    lastModified: product.updated_at,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    ...storeUrls,
    ...productUrls,
  ]
}

