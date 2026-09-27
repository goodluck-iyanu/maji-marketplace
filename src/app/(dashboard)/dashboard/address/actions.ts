'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function changePickupAddressAction(prevState: any, formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const newAddress = formData.get('pickupAddress') as string
  const reason = formData.get('reason') as string
  const verifyPhone = formData.get('verifyPhone') as string
  const pickupHouseNumber = String(formData.get('pickupHouseNumber') ?? '').trim()
  const pickupArea = String(formData.get('pickupArea') ?? '').trim()
  const pickupLga = String(formData.get('pickupLga') ?? '').trim()
  const pickupCity = String(formData.get('pickupCity') ?? '').trim()
  const pickupState = String(formData.get('pickupState') ?? '').trim()
  const pickupCountry = String(formData.get('pickupCountry') ?? '')
  const pickupLandmark = String(formData.get('pickupLandmark') ?? '').trim()
  const pickupContactName = `${formData.get('pickupFirstName') ?? ''} ${formData.get('pickupLastName') ?? ''}`.trim()
  const pickupPhone = String(formData.get('pickupPhone') ?? '').trim()
  const pickupEmail = String(formData.get('pickupEmail') ?? '').trim()
  const pickupLat = Number(formData.get('pickupLat'))
  const pickupLng = Number(formData.get('pickupLng'))
  const locationConfirmed = formData.get('pickupLocationConfirmed') === 'true'

  if (
    !newAddress?.trim() ||
    !reason?.trim() ||
    !verifyPhone?.trim() ||
    !pickupHouseNumber ||
    !pickupArea ||
    !pickupLga ||
    !pickupCity ||
    pickupState !== 'Lagos' ||
    pickupCountry !== 'NG' ||
    !pickupLandmark ||
    !pickupContactName ||
    !pickupPhone ||
    !locationConfirmed ||
    !Number.isFinite(pickupLat) ||
    !Number.isFinite(pickupLng) ||
    pickupLat < -90 ||
    pickupLat > 90 ||
    pickupLng < -180 ||
    pickupLng > 180
  ) {
    return { error: 'Complete all pickup details and confirm the exact Lagos map location.' }
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
    })

  if (logError) {
    console.error('Error logging address change:', logError)
    return { error: 'Could not record this pickup address change.' }
  }

  const { error: updateError } = await supabase
    .from('stores')
    .update({
      pickup_address: newAddress,
      pickup_house_number: pickupHouseNumber,
      pickup_area: pickupArea,
      pickup_lga: pickupLga,
      pickup_city: pickupCity,
      pickup_state: pickupState,
      pickup_country: pickupCountry,
      pickup_landmark: pickupLandmark,
      pickup_lat: pickupLat,
      pickup_lng: pickupLng,
      pickup_contact_name: pickupContactName,
      pickup_phone: pickupPhone,
      pickup_email: pickupEmail,
      pickup_is_residential: formData.get('pickupIsResidentialVal') === 'true',
    })
    .eq('id', store.id)

  if (updateError) {
    return { error: 'Failed to update address.' }
  }

  revalidatePath('/dashboard/address')
  return { success: true }
}
