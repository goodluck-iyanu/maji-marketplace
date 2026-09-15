import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { EditProductForm } from './edit-form'

export default async function EditProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: store } = await supabase
    .from('stores')
    .select('id, product_type')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!store) redirect('/dashboard')

  const { data: product } = await supabase
    .from('products')
    .select(`
      *,
      product_variants(*),
      product_options(*)
    `)
    .eq('id', productId)
    .eq('store_id', store.id)
    .single()

  if (!product) notFound()

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center mb-6">
        <Link href="/dashboard/products" className="text-gray-500 hover:text-black mr-4 flex items-center transition-colors">
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Edit Product: {product.name}</h1>
      </div>

      <EditProductForm product={product} productType={store.product_type} />
    </div>
  )
}

