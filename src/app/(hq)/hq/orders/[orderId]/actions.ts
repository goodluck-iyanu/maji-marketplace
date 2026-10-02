'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function authorizeDelivery(formData: FormData) {
  const orderId = formData.get('orderId') as string
  if (!orderId) throw new Error('Order ID is required')

  // 1. Verify admin (implicit via supabaseAdmin, but in a real app check auth context here)
  
  // Fetch order details to verify constraints
  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select(`
      payment_status,
      logistics_status,
      delivery_address,
      store_id,
      stores (
        pickup_address,
        pickup_city,
        pickup_state,
        pickup_phone
      )
    `)
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    throw new Error('Failed to fetch order details')
  }

  // 2. Verify order is paid
  if (order.payment_status !== 'paid') {
    throw new Error('Order is not fully paid. Cannot authorize delivery.')
  }

  // 3. Verify valid seller pickup info exists
  const store = order.stores as any
  if (!store?.pickup_address || !store?.pickup_city || !store?.pickup_state) {
    throw new Error('Seller has incomplete pickup information. Delivery cannot be authorized.')
  }

  // 4. Verify buyer delivery info exists
  if (!order.delivery_address) {
    throw new Error('Buyer delivery information is missing.')
  }

  // 5. Verify delivery quote if required
  // TODO: Add delivery quote validation here if FEZ quotes are cached in the DB

  // 6. Prevent duplicate shipment creation
  if (order.logistics_status && order.logistics_status !== 'awaiting_authorization') {
    throw new Error('This order has already been authorized or shipped.')
  }

  // --- FEZ API PLACEHOLDER ---
  // 7. Call the FEZ API from the Maji server
  // 8. Create the FEZ shipment
  // 9. Save the FEZ shipment/reference ID
  // 10. Save the FEZ tracking information if provided
  // ---------------------------
  
  // 11. Change the Maji delivery status
  const { error: updateError } = await supabaseAdmin
    .from('orders')
    .update({ 
      logistics_status: 'shipment_requested',
      // logistics_provider: 'FEZ',
      // logistics_tracking_id: 'FEZ-MOCK-ID'
    })
    .eq('id', orderId)

  if (updateError) {
    throw new Error('Failed to update delivery status')
  }

  // 12. Show updated state
  revalidatePath(`/hq/orders/${orderId}`)
  revalidatePath(`/hq/orders`)
}
