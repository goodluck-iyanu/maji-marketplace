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

  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('slug', storeSlug)
    .single()

  return (
    <CartProvider storeSlug={storeSlug}>
      {children}
      {store && (
        <FloatingCart primaryColor="#111111" secondaryColor="#ffffff" storeSlug={storeSlug} />
      )}
    </CartProvider>
  )
}



