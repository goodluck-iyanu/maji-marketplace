import { createClient as createAdminClient } from '@supabase/supabase-js'
import { ShoppingCart, Eye, Filter } from 'lucide-react'
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
  searchParams: Promise<{ 
    q?: string; 
    page?: string;
    payment?: string;
    fulfillment?: string;
    logistics?: string;
    sort?: string;
  }>
}) {
  const params = await searchParams
  const q = params.q || ''
  const page = parseInt(params.page || '1', 10)
  const paymentFilter = params.payment || 'all'
  const fulfillmentFilter = params.fulfillment || 'all'
  const logisticsFilter = params.logistics || 'all'
  const sort = params.sort || 'newest'
  
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
      logistics_status,
      delivery_method,
      created_at,
      profiles (full_name, email),
      stores (id, name)
    `, { count: 'exact' })
  
  if (q) {
    // Basic search across reference, customer email, or store name
    // Supabase ilike on related tables requires a different syntax or view, 
    // but for simple cases we filter the top-level table. 
    // We'll filter on payment_reference for now as cross-table ORs are complex in PostgREST.
    query = query.ilike('payment_reference', `%${q}%`)
  }

  if (paymentFilter !== 'all') {
    query = query.eq('payment_status', paymentFilter)
  }
  if (fulfillmentFilter !== 'all') {
    query = query.eq('fulfillment_status', fulfillmentFilter)
  }
  if (logisticsFilter !== 'all') {
    if (logisticsFilter === 'awaiting_authorization') {
      // Awaiting authorization could be null or explicitly awaiting
      query = query.or('logistics_status.eq.awaiting_authorization,logistics_status.is.null')
    } else {
      query = query.eq('logistics_status', logisticsFilter)
    }
  }

  const { data: orders, count, error } = await query
    .order('created_at', { ascending: sort === 'newest' ? false : true })
    .range(offset, offset + pageSize - 1)

  if (error) {
    console.error('Error fetching orders:', error)
  }

  const totalPages = count ? Math.ceil(count / pageSize) : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Orders Control Center</h1>
          <SearchInput placeholder="Search order reference..." />
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600 font-medium">
            <Filter className="w-4 h-4" /> Filters:
          </div>
          
          <select 
            className="border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 py-1.5"
            defaultValue={paymentFilter}
          >
            <option value="all">All Payments</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>

          <select 
            className="border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 py-1.5"
            defaultValue={logisticsFilter}
          >
            <option value="all">All Deliveries</option>
            <option value="awaiting_authorization">Awaiting Authorization</option>
            <option value="shipment_requested">Shipment Requested</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
          </select>

          <select 
            className="border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 py-1.5 ml-auto"
            defaultValue={sort}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>

          {/* Simple client script to handle selects without React state */}
          <script dangerouslySetInnerHTML={{__html: `
            document.querySelectorAll('select').forEach(sel => {
              sel.addEventListener('change', (e) => {
                const urlParams = new URLSearchParams(window.location.search);
                const isPayment = e.target.options[0].value === 'all' && e.target.options[1].value === 'paid';
                const isLogistics = e.target.options[0].value === 'all' && e.target.options[1].value === 'awaiting_authorization';
                const isSort = e.target.options[0].value === 'newest';
                
                if (isPayment) urlParams.set('payment', e.target.value);
                else if (isLogistics) urlParams.set('logistics', e.target.value);
                else if (isSort) urlParams.set('sort', e.target.value);
                
                urlParams.set('page', '1');
                window.location.search = urlParams.toString();
              });
            });
          `}} />
        </div>
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
                <th className="px-6 py-4">Delivery State</th>
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
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      (!order.logistics_status || order.logistics_status === 'awaiting_authorization') ? 'bg-red-100 text-red-700' :
                      order.logistics_status === 'shipment_requested' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {(!order.logistics_status || order.logistics_status === 'awaiting_authorization') ? 'Awaiting Auth' : order.logistics_status.replace(/_/g, ' ')}
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

