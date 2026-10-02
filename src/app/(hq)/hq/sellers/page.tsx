import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Store, Eye, CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'
import { SearchInput } from '../components/search-input'
import { Pagination } from '../components/pagination'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function AdminSellersPage({
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
    .from('stores')
    .select(`
      id,
      name,
      slug,
      is_active,
      product_type,
      store_category,
      created_at,
      profiles (full_name, email)
    `, { count: 'exact' })
  
  if (q) {
    query = query.ilike('name', `%${q}%`)
  }

  const { data: stores, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (error) {
    console.error('Error fetching sellers:', error)
  }

  const totalPages = count ? Math.ceil(count / pageSize) : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Sellers & Stores</h1>
        <SearchInput placeholder="Search store name..." />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-900 font-medium">
              <tr>
                <th className="px-6 py-4">Store</th>
                <th className="px-6 py-4">Owner</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stores?.map((store: any) => (
                <tr key={store.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                        <Store className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 truncate">{store.name}</p>
                        <p className="text-xs text-gray-500 font-mono truncate">{store.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900 truncate max-w-[150px]">{store.profiles?.full_name || 'No Name'}</p>
                    <p className="text-xs text-gray-500 truncate max-w-[150px]">{store.profiles?.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-start gap-1">
                      <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600">
                        {store.product_type}
                      </span>
                      {store.store_category && (
                        <span className="text-xs font-medium text-gray-700">{store.store_category}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {store.is_active ? (
                      <span className="inline-flex items-center gap-1 text-green-600 font-medium text-xs">
                        <CheckCircle2 className="w-4 h-4" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-600 font-medium text-xs">
                        <XCircle className="w-4 h-4" /> Suspended
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs">
                    {new Date(store.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`/hq/sellers/${store.id}`}
                      className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
              {!stores?.length && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No stores found matching your criteria.
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
