'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function syncPaystackVerification(storeId: string) {
  try {
    const { data: payoutAccount } = await supabaseAdmin
      .from('payout_accounts')
      .select('*')
      .eq('store_id', storeId)
      .single()

    if (!payoutAccount || !payoutAccount.subaccount_code) {
      return { error: 'No active Paystack subaccount found.' }
    }

    // Call Paystack
    const response = await fetch(`https://api.paystack.co/subaccount/${payoutAccount.subaccount_code}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    })

    const data = await response.json()
    if (!data.status) {
      return { error: 'Failed to fetch subaccount from Paystack.' }
    }

    // Determine verification status
    // A Paystack subaccount is ready for settlement if its active is true, but for rigorous "verified", we just assume active = verified for Maji V1, 
    // unless Paystack has an explicit is_verified or settlement_status field in data.data.
    const isVerified = data.data.active

    if (isVerified) {
      await supabaseAdmin
        .from('payout_accounts')
        .update({ status: 'verified' })
        .eq('id', payoutAccount.id)
      
      await supabaseAdmin.from('notifications').insert({
        store_id: storeId,
        title: 'Payout Account Verified',
        message: 'Your Paystack payout account has been approved. You are now ready to receive seller payouts through Maji.',
        type: 'success',
        link: '/dashboard/payments'
      })
      
      revalidatePath('/hq/payouts')
      revalidatePath('/dashboard/payments')
      return { message: 'Subaccount is verified and active.' }
    } else {
      await supabaseAdmin
        .from('payout_accounts')
        .update({ status: 'pending_verification' })
        .eq('id', payoutAccount.id)
      
      revalidatePath('/hq/payouts')
      revalidatePath('/dashboard/payments')
      return { message: 'Subaccount is not yet fully active on Paystack.' }
    }
  } catch (err: any) {
    return { error: err.message || 'Verification sync failed.' }
  }
}
