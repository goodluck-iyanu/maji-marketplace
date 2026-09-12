import { createClient } from '@/lib/supabase/server'
import { Package, ShoppingCart, DollarSign } from 'lucide-react'

export default async function DashboardOverview() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: store } = await supabase
    .from('stores')
    .select('id, name')
    .eq('user_id', user!.id)
    .single()

  // Get quick stats
  const { count: productCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', store!.id)

  const { data: allOrders } = await supabase
    .from('orders')
    .select('*, order_items(*, products(name))')
    .eq('store_id', store!.id)
    .order('created_at', { ascending: false })

  const orders = allOrders || []
  
  // Calculate revenue from paid orders only
  const totalRevenue = orders
    .filter(order => order.payment_status === 'paid')
    .reduce((sum, order) => sum + Number(order.total_amount), 0)

  // Get total unique paid orders for count (optional, but requested orders stat)
  const paidOrderCount = orders.filter(order => order.payment_status === 'paid').length

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">
        Welcome back, {store!.name}
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center transition-transform hover:scale-105 duration-300">
          <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mr-4">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Products</p>
            <p className="text-2xl font-semibold text-gray-900">{productCount || 0}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center transition-transform hover:scale-105 duration-300">
          <div className="h-12 w-12 bg-green-50 text-green-600 rounded-lg flex items-center justify-center mr-4">
            <ShoppingCart className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Paid Orders</p>
            <p className="text-2xl font-semibold text-gray-900">{paidOrderCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center transition-transform hover:scale-105 duration-300">
          <div className="h-12 w-12 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center mr-4">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Revenue</p>
            <p className="text-2xl font-semibold text-gray-900">₦{totalRevenue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mt-8">
         <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
           <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
         </div>
         
         {orders.length === 0 ? (
           <div className="text-center py-16 text-gray-500 flex flex-col items-center">
             <ShoppingCart className="h-12 w-12 text-gray-200 mb-4" />
             <p className="text-lg font-medium text-gray-900">No orders yet</p>
             <p>When customers buy your products, they will appear here.</p>
           </div>
         ) : (
           <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
               <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
                 <tr>
                   <th className="px-6 py-4 font-semibold">Customer</th>
                   <th className="px-6 py-4 font-semibold">Items</th>
                   <th className="px-6 py-4 font-semibold">Amount</th>
                   <th className="px-6 py-4 font-semibold">Date & Time</th>
                   <th className="px-6 py-4 font-semibold">Status</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {orders.map((order: any) => (
                   <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                     <td className="px-6 py-4">
                       <p className="font-semibold text-gray-900">{order.customer_name}</p>
                       <p className="text-gray-500">{order.customer_email}</p>
                     </td>
                     <td className="px-6 py-4">
                       <ul className="list-disc list-inside text-gray-600 space-y-1">
                         {order.order_items?.map((item: any) => (
                           <li key={item.id} className="truncate max-w-[200px]">
                             <span className="font-medium">{item.quantity}x</span> {item.products?.name}
                           </li>
                         ))}
                       </ul>
                     </td>
                     <td className="px-6 py-4 font-bold text-gray-900">
                       ₦{Number(order.total_amount).toLocaleString()}
                     </td>
                     <td className="px-6 py-4 text-gray-600">
                       <p>{new Date(order.created_at).toLocaleDateString()}</p>
                       <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleTimeString()}</p>
                     </td>
                     <td className="px-6 py-4">
                       {order.payment_status === 'paid' ? (
                         <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                           Paid
                         </span>
                       ) : (
                         <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                           Pending
                         </span>
                       )}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         )}
      </div>
    </div>
  )
}

