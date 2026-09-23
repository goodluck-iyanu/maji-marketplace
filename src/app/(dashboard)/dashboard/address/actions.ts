'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function changePickupAddressAction(prevState: any, formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const newAddress = formData.get('newAddress') as string
  const reason = formData.get('reason') as string
  const verifyPhone = formData.get('verifyPhone') as string

  if (!newAddress || !reason || !verifyPhone) {
    return { error: 'All fields are required.' }
  }

  const { data: store } = await supabase
    .from('stores')
    .select('id, pickup_phone, pickup_address, product_type')
    .eq('user_id', user.id)
    .single()

  if (!store || store.product_type !== 'physical') {
    return { error: 'Store not found or not eligible.' }
  }

  // Security check: verify the phone number matches
  const storedPhoneNumbers = store.pickup_phone ? store.pickup_phone.replace(/[^0-9]/g, '') : ''
  const inputPhoneNumbers = verifyPhone.replace(/[^0-9]/g, '')
  
  // Also fallback if they used +234 etc and want to match exactly, or just exact string match.
  // It's safer to just do a direct string match or strip spaces.
  if (verifyPhone.trim() !== store.pickup_phone?.trim() && storedPhoneNumbers !== inputPhoneNumbers) {
    return { error: 'The phone number provided does not match the one registered with your account.' }
  }

  // Insert change record
  const { error: logError } = await supabase
    .from('pickup_address_changes')
    .insert({
      store_id: store.id,
      old_address: store.pickup_address,
      new_address: newAddress,
      reason: reason,
      verified_phone: verifyPhone,
      status: 'changed'
    })

  if (logError) {
    console.error('Error logging address change:', logError)
    // We can proceed even if logging fails, but ideally it works.
  }

  // Update store
  const { error: updateError } = await supabase
    .from('stores')
    .update({ pickup_address: newAddress })
    .eq('id', store.id)

  if (updateError) {
    return { error: 'Failed to update address.' }
  }

  revalidatePath('/dashboard/address')
  return { success: true }
}
