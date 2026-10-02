import { createClient as createAdminClient } from '@supabase/supabase-js'
import { ShoppingCart, Eye } from 'lucide-react'
import Link from 'next/link'
import { SearchInput } from '../components/search-input'
import { Pagination } from '../components/pagination'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function AdminOrdersPage({
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
    .from('orders')
    .select(`
      id,
      payment_reference,
      total_amount,
      payment_status,
      fulfillment_status,
      delivery_method,
      created_at,
      profiles (full_name, email),
      stores (id, name)
    `, { count: 'exact' })
  
  if (q) {
    query = query.or(`payment_reference.ilike.%${q}%,customer_name.ilike.%${q}%`)
  }

  const { data: orders, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (error) {
    console.error('Error fetching orders:', error)
  }

  const totalPages = count ? Math.ceil(count / pageSize) : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <SearchInput placeholder="Search order reference..." />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-900 font-medium">
              <tr>
                <th className="px-6 py-4">Order Ref</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Store</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Fulfillment</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders?.map((order: any) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                        <ShoppingCart className="w-5 h-5" />
                      </div>
                      <p className="font-mono font-bold text-blue-600 hover:underline">
                        <Link href={`/hq/orders/${order.id}`}>
                          {order.payment_reference}
                        </Link>
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900 truncate max-w-[150px]">{order.profiles?.full_name || 'No Name'}</p>
                    <p className="text-xs text-gray-500 truncate max-w-[150px]">{order.profiles?.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/hq/sellers/${order.stores?.id}`} className="text-blue-600 hover:underline font-medium truncate max-w-[150px] block">
                      {order.stores?.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    ₦{Number(order.total_amount).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {order.payment_status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600">
                      {(order.fulfillment_status || 'pending').replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`/hq/orders/${order.id}`}
                      className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
              {!orders?.length && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No orders found matching your criteria.
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
