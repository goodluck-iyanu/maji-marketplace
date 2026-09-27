'use client'

import { useActionState } from 'react'
import { changePickupAddressAction } from './actions'
import { Loader2 } from 'lucide-react'
import TerminalAddressForm from '@/components/TerminalAddressForm'

interface PickupDetails {
  pickup_address: string | null
  pickup_house_number: string | null
  pickup_area: string | null
  pickup_lga: string | null
  pickup_city: string | null
  pickup_state: string | null
  pickup_lat: number | null
  pickup_lng: number | null
  pickup_landmark: string | null
  pickup_contact_name: string | null
  pickup_phone: string | null
  pickup_email: string | null
  pickup_is_residential: boolean | null
}

export function AddressForm({ store }: { store: PickupDetails }) {
  const [state, formAction, isPending] = useActionState(changePickupAddressAction, null)
  const [firstName, ...lastNameParts] = (store.pickup_contact_name ?? '').split(' ')

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="p-4 bg-green-50 text-green-700 rounded-lg border border-green-100">
          Pickup location updated.
        </div>
      )}

      <TerminalAddressForm
        type="pickup"
        defaultValues={{
          firstName,
          lastName: lastNameParts.join(' '),
          phone: store.pickup_phone ?? '',
          email: store.pickup_email ?? '',
          state: store.pickup_state ?? '',
          city: store.pickup_city ?? '',
          line1: store.pickup_address ?? '',
          houseNumber: store.pickup_house_number ?? '',
          area: store.pickup_area ?? '',
          lga: store.pickup_lga ?? '',
          landmark: store.pickup_landmark ?? '',
          lat: store.pickup_lat == null ? '' : String(store.pickup_lat),
          lng: store.pickup_lng == null ? '' : String(store.pickup_lng),
          isResidential: store.pickup_is_residential ?? false,
        }}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Why are you changing the pickup location?</label>
        <textarea
          name="reason"
          rows={3}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Verify Current Pickup Phone Number</label>
        <p className="text-xs text-gray-500 mb-2">Enter the phone number currently registered to this store.</p>
        <input
          type="tel"
          name="verifyPhone"
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-black text-white rounded-lg px-4 py-3 font-medium disabled:opacity-50 hover:bg-gray-800 transition-colors flex justify-center items-center"
      >
        {isPending ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Updating Pickup Location...</> : 'Verify and Update Pickup Location'}
      </button>
    </form>
  )
}
