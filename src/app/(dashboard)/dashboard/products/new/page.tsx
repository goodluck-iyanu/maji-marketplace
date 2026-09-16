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
    .select('product_type, store_category')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!store) {
    redirect('/onboarding')
  }

  if (store.store_category === 'fashion') {
    // Dynamic import to keep this page light for non-fashion sellers
    const FashionProductBuilder = (await import('./fashion-builder')).default
    return <FashionProductBuilder productType={store.product_type} />
  }

  if (store.store_category === 'food') {
    const FoodProductBuilder = (await import('./food-builder')).default
    return <FoodProductBuilder productType={store.product_type} />
  }

  if (store.store_category === 'beauty') {
    const BeautyProductBuilder = (await import('./beauty-builder')).default
    return <BeautyProductBuilder productType={store.product_type} />
  }

  if (store.store_category === 'electronics') {
    const GadgetsProductBuilder = (await import('./gadgets-builder')).default
    return <GadgetsProductBuilder productType={store.product_type} />
  }

  if (store.store_category === 'health') {
    const HealthProductBuilder = (await import('./health-builder')).default
    return <HealthProductBuilder productType={store.product_type} />
  }

  if (store.store_category === 'home') {
    const HomeProductBuilder = (await import('./home-builder')).default
    return <HomeProductBuilder productType={store.product_type} />
  }

  if (store.store_category === 'jewelry') {
    const JewelryProductBuilder = (await import('./jewelry-builder')).default
    return <JewelryProductBuilder productType={store.product_type} />
  }

  return <NewProductForm productType={store.product_type} />
}


