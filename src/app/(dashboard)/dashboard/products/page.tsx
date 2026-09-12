import { createClient } from '@/lib/supabase/server'
import { Plus, MoreVertical } from 'lucide-react'
import Link from 'next/link'
import { ProductActionsDropdown } from './actions-dropdown'

export default async function ProductsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('user_id', user!.id)
    .single()

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', store!.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Products</h1>
        <Link 
          href="/dashboard/products/new"
          className="bg-black text-white px-4 py-2 rounded-md font-medium hover:bg-gray-800 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        {(!products || products.length === 0) ? (
          <div className="text-center py-16">
            <h3 className="text-lg font-medium text-gray-900 mb-1">No products yet</h3>
            <p className="text-gray-500 mb-4">Start building your store by adding your first product.</p>
            <Link 
              href="/dashboard/products/new"
              className="text-black font-medium hover:underline"
            >
              Add your first product →
            </Link>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{product.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {product.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.is_digital ? 'Digital' : 'Physical'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₦{product.price.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right relative">
                    <ProductActionsDropdown productId={product.id} isPublished={product.is_published} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

