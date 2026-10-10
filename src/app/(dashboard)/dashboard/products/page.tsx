import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { ProductActionsDropdown } from './actions-dropdown'
import { MajiLogo } from '@/components/brand/maji-brand'

export default async function ProductsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!store) {
    redirect('/onboarding')
  }

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', store.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#111111]">Products</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage physical and digital products in your storefront</p>
        </div>
        <Link 
          href="/dashboard/products/new"
          className="bg-[#111111] text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-[#F05A28] transition-all flex items-center shadow-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        {(!products || products.length === 0) ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 rounded-2xl bg-[#FAF8F5] border border-[#F05A28]/15 flex items-center justify-center mx-auto mb-4">
              <MajiLogo variant="symbol" colorway="ember-duotone-light" size={38} animation="bounce" />
            </div>
            <h3 className="text-lg font-extrabold text-[#111111] mb-1">No products yet</h3>
            <p className="text-gray-500 mb-6 text-sm">Start building your store by adding your first product.</p>
            <Link 
              href="/dashboard/products/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F05A28] text-white text-sm font-bold hover:bg-[#111111] transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Add your first product
            </Link>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-[#FAF8F5]">
                <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-bold text-[#111111]">{product.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${product.is_published ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70' : 'bg-gray-100 text-gray-700'}`}>
                      {product.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                    {product.is_digital ? 'Digital' : 'Physical'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-extrabold text-[#111111]">
                    ₦{Number(product.price || 0).toLocaleString()}
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


