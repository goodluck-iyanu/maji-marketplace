'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { dispatchTheyutesDelivery } from '@/lib/theyutes'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function dispatchDelivery(formData: FormData) {
  const orderId = formData.get('orderId') as string

  try {
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (error || !order) {
      throw new Error('Order not found.')
    }

    if (order.payment_status !== 'paid') {
      throw new Error('Cannot dispatch unpaid order.')
    }

    if (order.logistics_status && order.logistics_status !== 'awaiting_processing') {
      throw new Error('Order has already been dispatched.')
    }

    const quote = order.delivery_quote as any
    const quoteId = quote?.quoteId || quote?.id
    if (!quoteId) {
      throw new Error('No Theyutes quote ID attached to this order.')
    }

    // Call Theyutes Dispatch using the consolidated library
    const dispatchResult = await dispatchTheyutesDelivery(quoteId, order.payment_reference) as any

    const trackingNumber = dispatchResult?.tracking_number || dispatchResult?.id || dispatchResult?.trackingId || 'PENDING'
    const actualCost = dispatchResult?.cost || quote?.fee || 0
    const courier = dispatchResult?.courier || quote?.carrier || 'Theyutes'

    // Update order with actual cost and tracking
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        logistics_status: 'dispatched',
        logistics_tracking_id: trackingNumber,
        logistics_provider: courier,
        // If we want to record actual delivery cost later, we can add it to orders schema or just use delivery_quote value
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('Failed to update order after dispatch:', updateError)
      throw new Error('Dispatched to Theyutes, but failed to save status internally.')
    }

    await supabaseAdmin.from('notifications').insert({
      store_id: order.store_id,
      title: 'Delivery Dispatched',
      message: `Your order ${order.payment_reference} has been successfully dispatched to our logistics partner.`,
      type: 'info',
      link: `/dashboard/orders/${order.id}`
    })

    revalidatePath(`/hq/orders/${orderId}`)
    revalidatePath('/hq/orders')
    
  } catch (err: any) {
    console.error('Dispatch error:', err)
    // We shouldn't throw error in server actions if we want to handle gracefully, but Next.js error boundaries can catch it, or better yet return it.
    // For simplicity with form action without useActionState, we'll throw.
    throw err
  }
}
