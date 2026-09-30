import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const reference = searchParams.get('reference')

  if (!reference) {
    return NextResponse.redirect(origin + '/')
  }

  const supabase = await createClient()

  const { data: order } = await supabase
    .from('orders')
    .select('id, payment_reference')
    .eq('payment_reference', reference)
    .single()

  if (!order) {
    return NextResponse.redirect(origin + '/')
  }

  // Let the Paystack webhook handle the actual database updates, email, and ledger entries.
  // The webhook is the single source of truth. We just redirect the user to the tracking page.
  return NextResponse.redirect(origin + '/track/' + reference)
}
