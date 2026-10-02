import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ShoppingCart, Eye } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminOrdersPage() {
  const supabase = await createClient()

  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id,
      payment_reference,
      customer_name,
      total_amount,
      payment_status,
      fulfillment_status,
      created_at,
      stores (name)
    `)
    .order('created_at', { ascending: false })
    .limit(100) // Simple limit for MVP

  if (error) console.error('Error fetching orders:', error)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-900 font-medium">
              <tr>
                <th className="px-6 py-4">Order Ref</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Store</th>
                <th className="px-6 py-4 text-right">Total</th>
                <th className="px-6 py-4 text-center">Payment</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders?.map((order: any) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-500">
                        <ShoppingCart className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 font-mono text-xs">{order.payment_reference}</p>
                        <p className="text-[10px] text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {order.customer_name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {order.stores?.name}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900">
                    ₦{Number(order.total_amount).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 
                      order.payment_status === 'failed' ? 'bg-red-100 text-red-700' : 
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {order.payment_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-gray-100 text-gray-700">
                      {order.fulfillment_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/hq/orders/${order.id}`} className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-indigo-600 transition-colors">
                      <Eye className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
              {!orders?.length && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No orders found.
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
