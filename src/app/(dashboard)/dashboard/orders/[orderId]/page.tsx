import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package, User, Calendar, CreditCard, ExternalLink } from 'lucide-react'

export default async function OrderDetailsPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!store) redirect('/onboarding')

  // Fetch order items with their product details
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(
        *,
        products(name, product_images(image_url))
      )
    `)
    .eq('id', orderId)
    .eq('store_id', store.id)
    .single()

  if (!order || error) {
    console.error('Order fetch error:', error)
    notFound()
  }

  // Safely try to fetch variant info if the order_items table has variant_id column
  let enrichedItems = order.order_items || []
  if (enrichedItems.length > 0 && 'variant_id' in enrichedItems[0]) {
    const variantIds = enrichedItems.map((i: any) => i.variant_id).filter(Boolean)
    if (variantIds.length > 0) {
      const { data: variants } = await supabase
        .from('product_variants')
        .select('id, title, options')
        .in('id', variantIds)
      
      if (variants) {
        enrichedItems = enrichedItems.map((item: any) => ({
          ...item,
          variant: variants.find((v: any) => v.id === item.variant_id)
        }))
      }
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center">
        <Link href="/dashboard" className="text-gray-500 hover:text-black flex items-center transition-colors">
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Dashboard
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Order Details</h1>
          <p className="text-gray-500 mt-1">Order ID: <span className="font-mono text-xs text-gray-400">{order.id}</span></p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold shadow-sm ${
            order.payment_status === 'paid' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
          }`}>
            {order.payment_status.toUpperCase()}
          </span>
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-blue-100 text-blue-800 shadow-sm border border-blue-200">
            {order.fulfillment_status.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Details */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold flex items-center mb-6 text-gray-800">
            <User className="h-5 w-5 mr-2 text-gray-400" /> Customer Information
          </h2>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Full Name</p>
              <p className="font-semibold text-gray-900">{order.customer_name}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Email Address</p>
              <a href={`mailto:${order.customer_email}`} className="font-semibold text-blue-600 hover:underline flex items-center">
                {order.customer_email}
                <ExternalLink className="h-3 w-3 ml-1 opacity-50" />
              </a>
            </div>
            {order.customer_whatsapp && (
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">WhatsApp Number</p>
                <a href={`https://wa.me/${order.customer_whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-green-600 hover:underline flex items-center">
                  {order.customer_whatsapp}
                  <ExternalLink className="h-3 w-3 ml-1 opacity-50" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Order Info */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold flex items-center mb-6 text-gray-800">
            <Calendar className="h-5 w-5 mr-2 text-gray-400" /> Order Timeline
          </h2>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Date Ordered</p>
              <p className="font-semibold text-gray-900">
                {new Date(order.created_at).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <p className="text-sm text-gray-500 mt-0.5">{new Date(order.created_at).toLocaleTimeString()}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Payment Reference</p>
                <p className="font-mono font-medium text-gray-900 text-sm bg-white px-2 py-1 rounded border border-gray-200 mt-1 inline-block">
                  {order.payment_reference}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-gray-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Ordered Items */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-8">
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center text-gray-900">
            <Package className="h-5 w-5 mr-2 text-blue-500" /> Ordered Items ({enrichedItems.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white text-xs uppercase text-gray-400 font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Product Details</th>
                <th className="px-6 py-4 text-center">Unit Price</th>
                <th className="px-6 py-4 text-center">Quantity</th>
                <th className="px-6 py-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {enrichedItems.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 bg-gray-50 rounded-xl border border-gray-200 flex-shrink-0 overflow-hidden">
                        {item.products?.product_images?.[0]?.image_url ? (
                          <img src={item.products.product_images[0].image_url} alt="Product" className="h-full w-full object-cover" />
                        ) : (
                          <Package className="h-6 w-6 text-gray-300 m-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-base">{item.products?.name || 'Unknown Product'}</p>
                        
                        {item.variant ? (
                          <div className="mt-2 flex gap-2 flex-wrap">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-medium text-xs border border-blue-100">
                              Variant: {item.variant.title}
                            </span>
                            {item.variant.options && Object.entries(item.variant.options).map(([k, v]) => (
                              <span key={k} className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-600 font-medium text-xs border border-gray-200">
                                {k}: {v as string}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 mt-1">Standard Item</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-gray-600 font-medium text-center">
                    ₦{Number(item.price_at_purchase).toLocaleString()}
                  </td>
                  <td className="px-6 py-6 text-center">
                    <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 font-bold text-gray-900">
                      {item.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-6 text-gray-900 font-bold text-right text-lg">
                    ₦{(Number(item.price_at_purchase) * item.quantity).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t border-gray-200">
              <tr>
                <td colSpan={3} className="px-6 py-6 font-bold text-gray-600 text-right uppercase tracking-wider text-sm">
                  Total Order Amount:
                </td>
                <td className="px-6 py-6 font-black text-2xl text-gray-900 text-right">
                  ₦{Number(order.total_amount).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}

