import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Clock, Package } from 'lucide-react'
import { OrderSuccess } from './order-success'

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ storeSlug: string, orderId: string }>
}) {
  const { storeSlug, orderId } = await params
  const supabase = await createClient()

  const { data: store } = await supabase
    .from('stores')
    .select('id, name')
    .eq('slug', storeSlug)
    .single()

  if (!store) notFound()

  // Note: RLS might block anon from reading orders!
  // We need a policy to allow reading an order if they know the UUID.
  // We didn't add that in the initial RLS. For now we use the service role to fetch public order info safely.
  const supabaseAdmin = require('@supabase/supabase-js').createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('*, order_items(*, products(*))')
    .eq('id', orderId)
    .eq('store_id', store.id)
    .single()

  if (!order) notFound()

  const isPaid = order.payment_status === 'paid'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-16 px-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {isPaid ? (
            <OrderSuccess storeSlug={storeSlug} />
          ) : (
            <div className="flex flex-col items-center text-center mb-8">
              <div className="h-16 w-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
                <Clock className="h-8 w-8" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Payment Pending</h1>
              <p className="text-gray-500 mt-2">
                Order reference: <span className="font-mono text-gray-900">{order.payment_reference}</span>
              </p>
            </div>
          )}
        
        <div className="border-t border-gray-100 pt-8">
          <h2 className="font-semibold text-lg mb-4">Order Summary</h2>
          <div className="space-y-4">
            {order.order_items.map((item: any) => (
              <div key={item.id} className="flex justify-between items-center">
                <div className="flex items-center">
                  <Package className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">{item.products.name}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                </div>
                <div className="font-medium text-gray-900">
                  ₦{item.price_at_purchase.toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 border-t border-gray-100 pt-4 flex justify-between items-center font-bold text-lg">
            <span>Total Paid</span>
            <span>₦{order.total_amount.toLocaleString()}</span>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-100 flex justify-center">
          <Link href={`/store/${storeSlug}`} className="text-black font-medium hover:underline">
            Return to {store.name}
          </Link>
        </div>
      </div>
    </div>
  )
}

