import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyTransaction } from '@/lib/paystack'
import { processOrderFulfillment } from '@/lib/order-fulfillment'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const reference = searchParams.get('reference')

  if (!reference) {
    return NextResponse.redirect(origin + '/')
  }

  const supabase = await createClient()

  // Find the order
  const { data: order } = await supabase
    .from('orders')
    .select('id, payment_status, stores(slug)')
    .eq('payment_reference', reference)
    .single()

  if (!order) {
    return NextResponse.redirect(origin + '/')
  }

  // Verify and complete order fulfillment synchronously so the buyer gets their email immediately!
  try {
    const tx = await verifyTransaction(reference)
    if (tx?.data?.status === 'success') {
      const fees = (tx.data.fees || 0) / 100
      await processOrderFulfillment({
        reference,
        actualPaystackFee: fees,
      })
    }
  } catch (e) {
    console.error('[Checkout Verify] Verification error:', e)
  }

  // Redirect to original store order confirmation page
  const slug = (order.stores as any)?.slug || 'store'
  return NextResponse.redirect(origin + '/store/' + slug + '/order/' + order.id)
}
