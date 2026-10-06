'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function processRefund(formData: FormData) {
  const orderId = formData.get('orderId') as string
  const refundType = formData.get('refundType') as string // 'full' or 'partial'
  const amountStr = formData.get('amount') as string
  const reason = formData.get('reason') as string

  try {
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (error || !order) throw new Error('Order not found.')

    const amount = Number(amountStr)
    if (isNaN(amount) || amount <= 0) throw new Error('Invalid refund amount.')

    // In a real implementation:
    // 1. Call Paystack API to process refund: POST https://api.paystack.co/refund
    // 2. We must determine if the seller has been settled. 
    //    If so, Paystack might deduct from Maji or we must recover manually.
    // 3. Insert into financial_transactions
    
    const { error: txError } = await supabaseAdmin
      .from('financial_transactions')
      .insert({
        store_id: order.store_id,
        order_id: order.id,
        transaction_type: 'refund',
        amount: -amount,
        status: 'pending', // Awaiting Paystack webhook or confirmation
        description: `Refund: ${reason}`
      })

    if (txError) throw new Error('Failed to record refund transaction.')

    // Update order status if full refund
    if (refundType === 'full') {
      await supabaseAdmin.from('orders').update({ payment_status: 'refunded' }).eq('id', orderId)
    } else {
      await supabaseAdmin.from('orders').update({ payment_status: 'partially_refunded' }).eq('id', orderId)
    }

    revalidatePath(`/hq/orders/${orderId}`)
    
    return { success: true }
  } catch (err: any) {
    console.error('Refund error:', err)
    throw err
  }
}
