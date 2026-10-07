'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { sendDeliveryUpdateEmail } from '@/lib/email'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function saveManualTracking(formData: FormData) {
  const orderId = formData.get('orderId') as string
  const shipmentId = formData.get('shipmentId') as string
  const trackingId = formData.get('trackingId') as string
  const trackingUrl = formData.get('trackingUrl') as string
  const carrier = formData.get('carrier') as string
  const eta = formData.get('eta') as string

  try {
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('*, stores(id, name)')
      .eq('id', orderId)
      .single()

    if (error || !order) {
      throw new Error('Order not found.')
    }

    if (order.payment_status !== 'paid') {
      throw new Error('Cannot add tracking to unpaid order.')
    }

    const currentMetadata = order.logistics_metadata || {}
    const isNew = !currentMetadata.tracking_added_at

    const metadata = {
      ...currentMetadata,
      theyutes_shipment_id: shipmentId || null,
      theyutes_tracking_url: trackingUrl || null,
      tracking_added_at: currentMetadata.tracking_added_at || new Date().toISOString(),
      tracking_updated_at: new Date().toISOString()
    }

    // Always keep it dispatched if it was dispatched, or bump it to dispatched if it was awaiting.
    // We do not downgrade statuses via this form.
    let newStatus = order.logistics_status
    if (!newStatus || newStatus === 'awaiting_processing' || newStatus === 'awaiting_authorization') {
      newStatus = 'dispatched'
    }

    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        logistics_provider: carrier || 'Theyutes',
        logistics_tracking_id: trackingId || null,
        logistics_estimated_delivery: eta || null,
        logistics_metadata: metadata,
        logistics_status: newStatus
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('Failed to update order tracking:', updateError)
      throw new Error('Failed to save tracking information.')
    }

    // Notify seller
    if (isNew) {
      const store = order.stores as any
      await supabaseAdmin.from('notifications').insert({
        store_id: order.store_id,
        title: 'Delivery Booked',
        message: `Your order ${order.payment_reference} has been booked for delivery with ${carrier || 'Theyutes'}. Tracking ID: ${trackingId || 'N/A'}. Pickup Address: ${store?.pickup_address || 'Your saved pickup address'}.`,
        type: 'info',
        link: `/dashboard/orders/${order.id}`
      })

      // Send email to buyer
      if (order.customer_email) {
        await sendDeliveryUpdateEmail({
          customerName: order.customer_name,
          customerEmail: order.customer_email,
          orderReference: order.payment_reference,
          trackingId: trackingId || '',
          carrier: carrier || 'Theyutes'
        })
      }
    }

    revalidatePath(`/hq/orders/${orderId}`)
    revalidatePath('/hq/orders')
    
  } catch (err: any) {
    console.error('Save tracking error:', err)
    throw err
  }
}
