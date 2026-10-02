'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  
  const { data: adminRole } = await supabaseAdmin
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .single()
    
  if (!adminRole) throw new Error('Unauthorized')
  return user.id
}

export async function approvePayoutChange(requestId: string) {
  const adminId = await verifyAdmin()

  // 1. Get the request
  const { data: request, error: fetchErr } = await supabaseAdmin
    .from('payout_change_requests')
    .select('*')
    .eq('id', requestId)
    .single()

  if (fetchErr || !request) throw new Error('Request not found.')
  if (request.status !== 'pending') throw new Error('Request already resolved.')

  // 2. Fetch current active account data to store in audit trail
  const { data: currentAccount } = await supabaseAdmin
    .from('payout_accounts')
    .select('*')
    .eq('store_id', request.store_id)
    .single()

  // 3. Update the request with approval and audit data
  const { error: updateReqErr } = await supabaseAdmin
    .from('payout_change_requests')
    .update({
      status: 'approved',
      resolved_at: new Date().toISOString(),
      resolved_by: adminId,
      previous_account_data: currentAccount || null
    })
    .eq('id', requestId)

  if (updateReqErr) throw new Error('Failed to update request status: ' + updateReqErr.message)

  // 4. Upsert the new account data into payout_accounts
  const { error: upsertErr } = await supabaseAdmin
    .from('payout_accounts')
    .upsert({
      store_id: request.store_id,
      bank_code: request.new_bank_code,
      account_number: request.new_account_number,
      account_name: request.new_account_name,
      subaccount_code: 'pending_subaccount_creation', // Usually Paystack subaccount would be created here
      status: 'active'
    }, { onConflict: 'store_id' })

  if (upsertErr) throw new Error('Failed to update active payout account: ' + upsertErr.message)

  revalidatePath('/hq/payouts')
}

export async function rejectPayoutChange(requestId: string) {
  const adminId = await verifyAdmin()

  const { data: request, error: fetchErr } = await supabaseAdmin
    .from('payout_change_requests')
    .select('*')
    .eq('id', requestId)
    .single()

  if (fetchErr || !request) throw new Error('Request not found.')
  if (request.status !== 'pending') throw new Error('Request already resolved.')

  const { error: updateReqErr } = await supabaseAdmin
    .from('payout_change_requests')
    .update({
      status: 'rejected',
      resolved_at: new Date().toISOString(),
      resolved_by: adminId
    })
    .eq('id', requestId)

  if (updateReqErr) throw new Error('Failed to reject request: ' + updateReqErr.message)

  revalidatePath('/hq/payouts')
}

export async function initiatePayout(storeId: string, amount: number, description: string) {
  const adminId = await verifyAdmin()
  
  // Verify amount > 0
  if (amount <= 0) throw new Error('Amount must be greater than zero')

  // Prevent over-payout by calculating current pending balance
  const { data: transactions } = await supabaseAdmin
    .from('financial_transactions')
    .select('amount, transaction_type')
    .eq('store_id', storeId)
    
  let earned = 0
  let paid = 0
  
  if (transactions) {
    transactions.forEach(t => {
      if (t.transaction_type === 'product_sale') earned += Number(t.amount)
      else if (t.transaction_type === 'payout' && (t.status === 'completed' || t.status === 'pending')) {
        paid += Math.abs(Number(t.amount))
      }
    })
  }
  
  const pendingBalance = earned - paid
  
  if (amount > pendingBalance) {
    throw new Error(`Cannot initiate payout. Requested ₦${amount} exceeds pending balance of ₦${pendingBalance}.`)
  }

  // Insert a pending payout transaction
  // Note: Payouts are DEBITS to the store's balance, so we store it as a negative amount for consistency
  const { error: insertErr } = await supabaseAdmin
    .from('financial_transactions')
    .insert({
      store_id: storeId,
      transaction_type: 'payout',
      amount: -Math.abs(amount),
      status: 'pending',
      description: description || 'Manual payout initiated by Admin'
    })

  if (insertErr) throw new Error('Failed to initiate payout: ' + insertErr.message)

  revalidatePath('/hq/payouts')
  revalidatePath(`/hq/payouts/${storeId}`)
}

export async function completePayout(transactionId: string) {
  const adminId = await verifyAdmin()

  const { error } = await supabaseAdmin
    .from('financial_transactions')
    .update({ status: 'completed' })
    .eq('id', transactionId)
    .eq('transaction_type', 'payout')

  if (error) throw new Error('Failed to complete payout: ' + error.message)
  
  revalidatePath('/hq/payouts')
}
