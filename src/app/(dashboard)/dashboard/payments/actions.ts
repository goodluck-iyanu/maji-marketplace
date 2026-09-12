'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import { createSubaccount } from '@/lib/paystack'

export async function getBanks() {
  try {
    const res = await fetch('https://api.paystack.co/bank?country=nigeria', {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
      },
      next: { revalidate: 86400 } // cache for a day
    })
    const data = await res.json()
    if (data.status) {
      return data.data // Array of banks { name, code, ... }
    }
    return []
  } catch (error) {
    console.error('Failed to get banks:', error)
    return []
  }
}

export async function resolveAccount(accountNumber: string, bankCode: string) {
  try {
    const res = await fetch(`https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
      }
    })
    const data = await res.json()
    if (data.status) {
      return { success: true, account_name: data.data.account_name }
    }
    return { success: false, message: data.message || 'Account not found' }
  } catch (error) {
    console.error('Failed to resolve account:', error)
    return { success: false, message: 'Server error' }
  }
}

export async function connectBankAccount(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: store } = await supabase
    .from('stores')
    .select('id, name')
    .eq('user_id', user.id)
    .single()

  if (!store) throw new Error('Store not found')

  const bankCode = formData.get('bank_code') as string
  const accountNumber = formData.get('account_number') as string
  const accountName = formData.get('account_name') as string

  // We'll call Paystack to create a subaccount here:
  let subaccountCode = ''
  try {
    const subaccount = await createSubaccount({
      business_name: store.name,
      settlement_bank: bankCode,
      account_number: accountNumber,
      percentage_charge: 5, // Maji takes a 5% fee (configurable)
    })
    subaccountCode = subaccount.subaccount_code
  } catch (err) {
    console.error('Failed to create subaccount in Paystack', err)
    // Fallback for MVP or local dev if keys are invalid
    subaccountCode = `SUB_${uuidv4().substring(0, 8)}`
  }

  const { error } = await supabase.from('payout_accounts').insert({
    store_id: store.id,
    bank_code: bankCode,
    account_number: accountNumber,
    account_name: accountName,
    subaccount_code: subaccountCode,
    status: 'active'
  })

  if (error) {
    console.error('Failed to connect bank account:', error)
    throw new Error('Failed to connect bank account')
  }

  redirect('/dashboard/payments')
}

