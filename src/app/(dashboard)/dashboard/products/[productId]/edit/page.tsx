import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { editProductAction } from '../../actions'
import { SubmitButton } from '../../new/submit-button'

export default async function EditProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!store) redirect('/dashboard')

  const { data: product } = await supabase
    .from('products')
    .select('*')
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

      <form action={editProductAction} className="space-y-6">
        <input type="hidden" name="productId" value={product.id} />
        
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-6 space-y-6">
            
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-blue-800 text-sm">
              <strong>Note:</strong> To change images, please delete this product and create a new one. Image editing is coming soon!
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Product Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                defaultValue={product.name}
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-black transition-shadow"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                id="description"
                rows={4}
                defaultValue={product.description || ''}
                className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-black transition-shadow"
              ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Price (₦)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                    ₦
                  </span>
                  <input
                    type="number"
                    name="price"
                    id="price"
                    min="0"
                    step="0.01"
                    defaultValue={product.price}
                    required
                    className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-black transition-shadow"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Type
                </label>
                <div className="flex items-center space-x-4 mt-2">
                  <label className="flex items-center">
                    <input type="radio" name="is_digital" value="false" defaultChecked={!product.is_digital} className="h-4 w-4 text-black focus:ring-black border-gray-300" />
                    <span className="ml-2 text-sm text-gray-700">Physical (Ships)</span>
                  </label>
                  <label className="flex items-center">
                    <input type="radio" name="is_digital" value="true" defaultChecked={product.is_digital} className="h-4 w-4 text-black focus:ring-black border-gray-300" />
                    <span className="ml-2 text-sm text-gray-700">Digital (Download)</span>
                  </label>
                </div>
              </div>
            </div>

          </div>
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
            <Link 
              href="/dashboard/products"
              className="px-6 py-2 border border-gray-200 text-gray-700 rounded-md font-medium hover:bg-gray-100 transition-colors mr-3"
            >
              Cancel
            </Link>
            <SubmitButton label="Save Changes" />
          </div>
        </div>
      </form>
    </div>
  )
}

