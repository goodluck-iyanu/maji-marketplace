import { createClient as createAdminClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ShoppingCart, Eye } from 'lucide-react'
import OrderFilters from './OrderFilters'
import { Pagination } from '../components/pagination'
import { getDateRange } from '@/lib/date-filters'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function AdminOrdersPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const params = await searchParams
  
  const page = parseInt(params.page || '1')
  const pageSize = 20
  const offset = (page - 1) * pageSize

  // Filters
  const search = params.search || ''
  const payment = params.payment || 'all'
  const delivery = params.delivery || 'all'
  const status = params.status || 'all'
  const date = params.date || 'all'
  const amount = params.amount || 'all'
  const fulfilment = params.fulfilment || 'all'
  const seller = params.seller || 'all'
  const tracking = params.tracking || 'all'
  const provider = params.provider || 'all'
  const sort = params.sort || 'newest'

  // Fetch all stores for the seller dropdown (we limit to 1000 for safety, could be debounced API in huge production)
  const { data: storeOptions } = await supabaseAdmin
    .from('stores')
    .select('id, name')
    .order('name')
    .limit(1000)

  let query = supabaseAdmin
    .from('orders')
    .select('*, stores!inner(id, name)', { count: 'exact' })

  // 1. Search Logic
  if (search) {
    // Supabase JS doesn't easily let us do cross-table ORs without using embedded views or manual string formatting correctly.
    // However, since we used !inner on stores, we can actually filter stores natively, but combining it in an OR with order fields is hard.
    // Instead, we will fetch matching store IDs first.
    const { data: matchedStores } = await supabaseAdmin
      .from('stores')
      .select('id')
      .ilike('name', `%${search}%`)
      .limit(500)
    
    const storeIds = matchedStores?.map(s => s.id) || []
    
    // We can query tracking inside jsonb using text search operator.
    const orClauses = [
      `payment_reference.ilike.%${search}%`,
      `customer_name.ilike.%${search}%`,
      `customer_email.ilike.%${search}%`,
      `customer_phone.ilike.%${search}%`,
      `logistics_tracking_id.ilike.%${search}%`,
      // `logistics_metadata->>theyutes_shipment_id.ilike.%${search}%` // PostgREST syntax for jsonb OR is tricky, let's omit the jsonb deep search in the main OR string for safety to prevent crashes, we already check logistics_tracking_id.
    ]

    if (storeIds.length > 0) {
      orClauses.push(`store_id.in.(${storeIds.join(',')})`)
    }
    
    query = query.or(orClauses.join(','))
  }

  // 2. Payment Status
  if (payment !== 'all') query = query.eq('payment_status', payment)

  // 3. Delivery Status (Logistics)
  if (delivery !== 'all') {
    if (delivery === 'awaiting_authorization') {
      query = query.or('logistics_status.eq.awaiting_authorization,logistics_status.is.null')
    } else {
      query = query.eq('logistics_status', delivery)
    }
  }

  // 4. Order Status (Fulfillment)
  if (status !== 'all') query = query.eq('fulfillment_status', status)

  // 5. Date Filter (Africa/Lagos)
  if (date !== 'all') {
    if (date === 'custom') {
      if (params.date_from) {
        query = query.gte('created_at', new Date(params.date_from + 'T00:00:00Z').toISOString())
      }
      if (params.date_to) {
        query = query.lte('created_at', new Date(params.date_to + 'T23:59:59.999Z').toISOString())
      }
    } else {
      const range = getDateRange(date)
      if (range) {
        query = query.gte('created_at', range.start).lte('created_at', range.end)
      }
    }
  }

  // 6. Amount Filter
  if (amount !== 'all') {
    if (amount === 'under_5k') query = query.lt('total_amount', 5000)
    else if (amount === '5k_20k') query = query.gte('total_amount', 5000).lte('total_amount', 20000)
    else if (amount === '20k_50k') query = query.gte('total_amount', 20000).lte('total_amount', 50000)
    else if (amount === '50k_plus') query = query.gte('total_amount', 50000)
    else if (amount === 'custom') {
      if (params.amount_min) query = query.gte('total_amount', Number(params.amount_min))
      if (params.amount_max) query = query.lte('total_amount', Number(params.amount_max))
    }
  }

  // 7. Fulfilment Method
  if (fulfilment !== 'all') query = query.eq('delivery_method', fulfilment)

  // 8. Seller Filter
  if (seller !== 'all') query = query.eq('store_id', seller)

  // 9. Tracking Status
  if (tracking !== 'all') {
    if (tracking === 'added') query = query.not('logistics_tracking_id', 'is', null)
    if (tracking === 'not_added') query = query.is('logistics_tracking_id', null)
    if (tracking === 'in_transit') query = query.eq('logistics_status', 'in_transit')
    if (tracking === 'delivered') query = query.eq('logistics_status', 'delivered')
  }

  // 10. Provider
  if (provider !== 'all') {
    if (provider === 'theyutes') query = query.ilike('logistics_provider', '%Theyutes%')
    if (provider === 'other') query = query.or('logistics_provider.not.ilike.%Theyutes%,logistics_provider.is.null')
  }

  // 11. Sorting
  switch (sort) {
    case 'newest':
      query = query.order('created_at', { ascending: false })
      break
    case 'oldest':
      query = query.order('created_at', { ascending: true })
      break
    case 'highest':
      query = query.order('total_amount', { ascending: false })
      break
    case 'lowest':
      query = query.order('total_amount', { ascending: true })
      break
    case 'updated':
      // Use created_at if updated_at is missing, but assume we want newest first generally
      query = query.order('created_at', { ascending: false }) 
      break
    default:
      query = query.order('created_at', { ascending: false })
  }

  // Execute pagination
  query = query.range(offset, offset + pageSize - 1)
  const { data: orders, count, error } = await query

  if (error) {
    console.error('Error fetching filtered orders:', error)
  }

  const totalPages = count ? Math.ceil(count / pageSize) : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Orders Control Center</h1>
        
        {/* New Advanced Filtering Component */}
        <OrderFilters storeOptions={storeOptions || []} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-500 font-medium">
            {count === 0 ? 'No orders found' : `Showing ${orders?.length || 0} of ${count} order${count === 1 ? '' : 's'}`}
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-900 font-medium">
              <tr>
                <th className="px-6 py-4">Order Ref</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Store</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders?.map((order: any) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                        <ShoppingCart className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-mono font-bold text-blue-600 hover:underline">
                          <Link href={`/hq/orders/${order.id}`}>
                            {order.payment_reference}
                          </Link>
                        </p>
                        {order.logistics_tracking_id && (
                          <p className="text-[10px] mt-1 text-gray-500 uppercase flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            {order.logistics_provider}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900 truncate max-w-[150px]">{order.customer_name || 'No Name'}</p>
                    <p className="text-xs text-gray-500 truncate max-w-[150px]">{order.customer_email || 'No Email'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/hq/sellers/${order.stores?.id}`} className="text-blue-600 hover:underline font-medium truncate max-w-[150px] block">
                      {order.stores?.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    ₦{Number(order.total_amount).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 space-y-1">
                    <div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {order.payment_status}
                      </span>
                    </div>
                    <div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        (!order.logistics_status || order.logistics_status === 'awaiting_authorization') ? 'bg-red-100 text-red-700' :
                        order.logistics_status === 'shipment_requested' ? 'bg-blue-100 text-blue-700' :
                        order.logistics_status === 'dispatched' ? 'bg-indigo-100 text-indigo-700' :
                        order.logistics_status === 'delivered' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {(!order.logistics_status || order.logistics_status === 'awaiting_authorization') ? 'Awaiting Auth' : order.logistics_status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs">
                    {new Date(order.created_at).toLocaleDateString('en-NG', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
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
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                        <ShoppingCart className="w-8 h-8" />
                      </div>
                      <p className="text-gray-900 font-medium text-lg">No orders found</p>
                      <p className="text-gray-500 max-w-sm">
                        Try changing or clearing your filters to see more results.
                      </p>
                      <Link href="/hq/orders" className="mt-2 text-blue-600 font-medium hover:underline">
                        Clear all filters
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="border-t border-gray-100 bg-white px-4 py-3">
            <Pagination totalPages={totalPages} currentPage={page} />
          </div>
        )}
      </div>
    </div>
  )
}





