import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyTransaction } from '@/lib/paystack'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const reference = searchParams.get('reference')
  const storeSlug = searchParams.get('storeSlug') // if we passed it in state, but wait, we didn't. 
  // Wait, I can extract the store ID from the reference if the webhook hasn't processed it, 
  // but let's just find the order by reference.

  if (!reference) {
    return NextResponse.redirect(`${origin}/`)
  }

  const supabase = await createClient()

  // Find the order
  const { data: order } = await supabase
    .from('orders')
    .select('*, stores(slug)')
    .eq('payment_reference', reference)
    .single()

  if (!order) {
    return NextResponse.redirect(`${origin}/`)
  }

  // Optional: We can manually verify if the webhook was delayed.
  if (order.payment_status === 'pending') {
    try {
       const tx = await verifyTransaction(reference)
       if (tx.data.status === 'success') {
          // Use Admin client to bypass RLS and securely update the order status
          const supabaseAdmin = require('@supabase/supabase-js').createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          )
          
          await supabaseAdmin
            .from('orders')
            .update({ payment_status: 'paid' })
            .eq('payment_reference', reference)
       }
    } catch (e) {
       console.error(e)
    }
  }

  // Redirect to order confirmation page
  return NextResponse.redirect(`${origin}/store/${order.stores.slug}/order/${order.id}`)
}

