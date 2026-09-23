'use client'

import { useState, useActionState, useEffect, useRef } from 'react'
import { changePickupAddressAction } from './actions'
import { Loader2, MapPin } from 'lucide-react'

export function AddressForm() {
  const [state, formAction, isPending] = useActionState(changePickupAddressAction, null)
  const formRef = useRef<HTMLFormElement>(null)

  // OpenStreetMap Autocomplete State
  const [addressQuery, setAddressQuery] = useState('')
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  
  useEffect(() => {
    if (addressQuery.length < 3) {
      setAddressSuggestions([])
      return
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true)
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addressQuery)}&format=json&countrycodes=ng&limit=5`, {
          headers: { 'Accept-Language': 'en' }
        })
        const data = await response.json()
        setAddressSuggestions(data)
      } catch (error) {
        console.error('Error fetching addresses:', error)
      } finally {
        setIsSearching(false)
      }
    }, 600)

    return () => clearTimeout(delayDebounceFn)
  }, [addressQuery])

  useEffect(() => {
    if (state?.success) {
      setAddressQuery('')
      if (formRef.current) formRef.current.reset()
      alert('Your pickup address has been updated successfully.')
    }
  }, [state])

  return (
    <form action={formAction} ref={formRef} className="space-y-6">
      {state?.error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100">
          {state.error}
        </div>
      )}

      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">New Pickup Address</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MapPin className="h-5 w-5 text-gray-400" />
          </div>
          <input 
            type="text" 
            name="newAddress" 
            value={addressQuery}
            onChange={(e) => {
              setAddressQuery(e.target.value)
              setShowSuggestions(true)
            }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Type your new address..." 
            required 
            autoComplete="off"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" 
          />
        </div>
        {showSuggestions && addressSuggestions.length > 0 && (
          <ul className="absolute z-50 w-full bg-white border border-gray-200 shadow-lg rounded-lg mt-1 max-h-60 overflow-auto">
            {addressSuggestions.map((suggestion, index) => (
              <li 
                key={index} 
                className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 border-b border-gray-50 last:border-0"
                onClick={() => {
                  setAddressQuery(suggestion.display_name)
                  setShowSuggestions(false)
                }}
              >
                {suggestion.display_name}
              </li>
            ))}
          </ul>
        )}
        {showSuggestions && isSearching && addressQuery.length >= 3 && addressSuggestions.length === 0 && (
           <div className="absolute z-50 w-full bg-white border border-gray-200 shadow-lg rounded-lg mt-1 px-4 py-3 text-sm text-gray-500">
             Searching...
           </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Why do you want to change it?</label>
        <textarea 
          name="reason" 
          rows={3}
          placeholder="E.g. I moved to a new shop location"
          required 
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none" 
        ></textarea>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Verify Account Phone Number</label>
        <p className="text-xs text-gray-500 mb-2">For security, please enter the phone number you registered this store with.</p>
        <input 
          type="tel" 
          name="verifyPhone" 
          placeholder="+234 800 000 0000"
          required 
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" 
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-black text-white rounded-lg px-4 py-3 font-medium disabled:opacity-50 hover:bg-gray-800 transition-colors flex justify-center items-center"
      >
        {isPending ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Updating Address...
          </>
        ) : (
          'Verify and Update Address'
        )}
      </button>
    </form>
  )
}

