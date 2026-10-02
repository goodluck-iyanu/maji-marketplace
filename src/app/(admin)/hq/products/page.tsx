import { createClient } from '@/lib/supabase/server'
import { Package, Search } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminProductsPage() {
  const supabase = await createClient()

  const { data: products, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      price,
      is_digital,
      stock,
      is_published,
      created_at,
      stores (name, slug)
    `)
    .order('created_at', { ascending: false })
    .limit(100) // simple limit for now

  if (error) console.error('Error fetching products:', error)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search products..." 
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-900 font-medium">
              <tr>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Store</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4 text-right">Price</th>
                <th className="px-6 py-4 text-center">Stock</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products?.map((product: any) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-orange-50 flex items-center justify-center text-orange-500 flex-shrink-0">
                        <Package className="w-5 h-5" />
                      </div>
                      <p className="font-medium text-gray-900 truncate max-w-[250px]">{product.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {product.stores?.name}
                  </td>
                  <td className="px-6 py-4">
                    {product.is_digital ? (
                      <span className="inline-flex px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">Digital</span>
                    ) : (
                      <span className="inline-flex px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">Physical</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">
                    ₦{Number(product.price).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {product.is_digital ? (
                      <span className="text-gray-400">&infin;</span>
                    ) : (
                      <span className={`font-medium ${product.stock > 0 ? 'text-gray-900' : 'text-red-500'}`}>
                        {product.stock}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      product.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {product.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                </tr>
              ))}
              {!products?.length && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
