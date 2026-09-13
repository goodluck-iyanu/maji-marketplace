import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NewProductForm from './new-product-form'

export default async function NewProductPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: store } = await supabase
    .from('stores')
    .select('product_type')
    .eq('user_id', user.id)
    .single()

  if (!store) {
    redirect('/onboarding')
  }

  return <NewProductForm productType={store.product_type} />
}
