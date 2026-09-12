import { CartProvider } from './cart-context'
import { FloatingCart } from './floating-cart'
import { createClient } from '@/lib/supabase/server'

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ storeSlug: string }>
}) {
  const { storeSlug } = await params
  const supabase = await createClient()

  // We need to fetch basic store settings to color the CartSidebar
  const { data: store } = await supabase
    .from('stores')
    .select('id, store_settings(primary_color, secondary_color)')
    .eq('slug', storeSlug)
    .single()

  const primaryColor = (Array.isArray(store?.store_settings) ? store?.store_settings[0] : store?.store_settings)?.primary_color || '#000000'
  const secondaryColor = (Array.isArray(store?.store_settings) ? store?.store_settings[0] : store?.store_settings)?.secondary_color || '#ffffff'

  return (
    <CartProvider>
    <CartProvider storeSlug={storeSlug}>
      {children}
      {store && (
        <FloatingCart primaryColor={primaryColor} secondaryColor={secondaryColor} storeSlug={storeSlug} />
      )}
    </CartProvider>
  )
}


