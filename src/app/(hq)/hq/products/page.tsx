import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Package, Eye } from 'lucide-react'
import Link from 'next/link'
import { SearchInput } from '../components/search-input'
import { Pagination } from '../components/pagination'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const params = await searchParams
  const q = params.q || ''
  const page = parseInt(params.page || '1', 10)
  const pageSize = 20
  const offset = (page - 1) * pageSize

  let query = supabaseAdmin
    .from('products')
    .select(`
      id,
      name,
      price,
      is_published,
      is_digital,
      created_at,
      stores (id, name)
    `, { count: 'exact' })
  
  if (q) {
    query = query.ilike('name', `%${q}%`)
  }

  const { data: products, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (error) {
    console.error('Error fetching products:', error)
  }

  const totalPages = count ? Math.ceil(count / pageSize) : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <SearchInput placeholder="Search product name..." />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-900 font-medium">
              <tr>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Store</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products?.map((product: any) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
                        <Package className="w-5 h-5" />
                      </div>
                      <p className="font-bold text-gray-900 truncate max-w-[200px]">{product.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/hq/sellers/${product.stores?.id}`} className="text-blue-600 hover:underline font-medium truncate block max-w-[150px]">
                      {product.stores?.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600">
                      {product.is_digital ? 'Digital' : 'Physical'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    ₦{Number(product.price).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    {product.is_published ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`/hq/products/${product.id}`}
                      className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
              {!products?.length && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No products found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination totalPages={totalPages} currentPage={page} />
      </div>
    </div>
  )
}
