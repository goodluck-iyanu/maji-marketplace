'use client'

import { useState, useEffect, useRef } from 'react'
import { NG_STATES, NG_STATES_CITIES } from '@/lib/ng-cities'
import { MapPin, Loader2, Search } from 'lucide-react'

export interface TerminalAddressData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  state: string;
  city: string;
  line1: string;
  zip: string;
  lat: string;
  lng: string;
  isResidential: boolean;
  landmark: string;
}

interface TerminalAddressFormProps {
  type: 'pickup' | 'delivery';
  defaultValues?: Partial<TerminalAddressData>;
  onChange?: (data: TerminalAddressData) => void;
}

export default function TerminalAddressForm({ type, defaultValues, onChange }: TerminalAddressFormProps) {
  const [firstName, setFirstName] = useState(defaultValues?.firstName || '')
  const [lastName, setLastName] = useState(defaultValues?.lastName || '')
  const [phone, setPhone] = useState(defaultValues?.phone || '')
  const [email, setEmail] = useState(defaultValues?.email || '')
  
  const [selectedState, setSelectedState] = useState(defaultValues?.state || '')
  const [selectedCity, setSelectedCity] = useState(defaultValues?.city || '')
  const [zip, setZip] = useState(defaultValues?.zip || '')
  const [isResidential, setIsResidential] = useState(defaultValues?.isResidential ?? true)
  const [landmark, setLandmark] = useState(defaultValues?.landmark || '')

  // Map & Autocomplete state
  const [addressQuery, setAddressQuery] = useState(defaultValues?.line1 || '')
  const [lat, setLat] = useState<string>(defaultValues?.lat || '')
  const [lng, setLng] = useState<string>(defaultValues?.lng || '')
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Notify parent of changes (if controlled)
  useEffect(() => {
    if (onChange) {
      onChange({
        firstName, lastName, phone, email, state: selectedState, city: selectedCity,
        line1: addressQuery, zip, lat, lng, isResidential, landmark
      })
    }
  }, [firstName, lastName, phone, email, selectedState, selectedCity, addressQuery, zip, lat, lng, isResidential, landmark, onChange])

  // Click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // OpenStreetMap Autocomplete
  useEffect(() => {
    if (addressQuery.length < 4 || !showSuggestions) {
      setAddressSuggestions([])
      return
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true)
      try {
        // We append the selected state/city to narrow down the OSM search
        let query = addressQuery
        if (selectedCity && !query.toLowerCase().includes(selectedCity.toLowerCase())) {
           query += `, ${selectedCity}`
        }
        if (selectedState && !query.toLowerCase().includes(selectedState.toLowerCase())) {
           query += `, ${selectedState}`
        }
        
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&countrycodes=ng&limit=5`, {
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
  }, [addressQuery, showSuggestions, selectedState, selectedCity])

  const handleSelectSuggestion = (suggestion: any) => {
    setAddressQuery(suggestion.display_name)
    setLat(suggestion.lat)
    setLng(suggestion.lon)
    setShowSuggestions(false)
  }

  const isPickup = type === 'pickup'
  const prefix = isPickup ? 'pickup' : 'delivery'

  return (
    <div className="space-y-4">
      {/* Hidden inputs to pass data via FormData easily */}
      <input type="hidden" name={`${prefix}State`} value={selectedState} />
      <input type="hidden" name={`${prefix}City`} value={selectedCity} />
      <input type="hidden" name={`${prefix}Lat`} value={lat} />
      <input type="hidden" name={`${prefix}Lng`} value={lng} />
      
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">
        {isPickup ? 'Pickup Contact & Location' : 'Delivery Contact & Location'}
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
          <input 
            type="text" 
            name={`${prefix}FirstName`} 
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required 
            placeholder="e.g. John"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-gray-50 focus:bg-white transition-colors" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
          <input 
            type="text" 
            name={`${prefix}LastName`}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)} 
            required 
            placeholder="e.g. Doe"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-gray-50 focus:bg-white transition-colors" 
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <input 
            type="tel" 
            name={`${prefix}Phone`} 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required 
            placeholder="08012345678"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-gray-50 focus:bg-white transition-colors" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input 
            type="email" 
            name={`${prefix}Email`}
            value={email}
            onChange={(e) => setEmail(e.target.value)} 
            required 
            placeholder="john@example.com"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-gray-50 focus:bg-white transition-colors" 
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
          <select 
            required 
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-gray-50 focus:bg-white transition-colors"
            value={selectedState}
            onChange={(e) => { 
              setSelectedState(e.target.value); 
              setSelectedCity('');
              setLat('');
              setLng('');
            }}
          >
            <option value="">Select state</option>
            {NG_STATES.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City / Area <span className="text-red-500">*</span></label>
          <select 
            required
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-gray-50 focus:bg-white transition-colors"
            value={selectedCity}
            onChange={(e) => {
              setSelectedCity(e.target.value);
              setLat('');
              setLng('');
            }}
            disabled={!selectedState}
          >
            <option value="">{selectedState ? 'Select city' : 'Select state first'}</option>
            {(NG_STATES_CITIES[selectedState] ?? []).map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="relative" ref={wrapperRef}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Full Street Address <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input 
            type="text" 
            name={`${prefix}Address`} 
            value={addressQuery}
            onChange={(e) => {
              setAddressQuery(e.target.value)
              setShowSuggestions(true)
              // Reset precise lat/lng if they type something new to force a re-selection
              if (lat || lng) {
                setLat('')
                setLng('')
              }
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search for your street or building..." 
            required 
            autoComplete="off"
            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${lat && lng ? 'border-green-500 focus:ring-green-500 bg-green-50' : 'border-gray-200 focus:ring-black bg-gray-50 focus:bg-white'}`}
          />
          <Search className="w-5 h-5 absolute left-3 top-3.5 text-gray-400" />
        </div>
        
        {lat && lng && (
          <p className="text-xs text-green-600 mt-1 flex items-center gap-1 font-medium">
            <MapPin className="w-3 h-3" /> Exact map location captured
          </p>
        )}
        {!lat && !lng && addressQuery.length > 3 && !showSuggestions && (
          <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
             Please select an exact location from the dropdown to ensure accurate delivery.
          </p>
        )}

        {showSuggestions && addressSuggestions.length > 0 && (
          <ul className="absolute z-50 w-full bg-white border border-gray-200 shadow-xl rounded-lg mt-1 max-h-60 overflow-auto">
            {addressSuggestions.map((suggestion, index) => (
              <li 
                key={index} 
                className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 border-b border-gray-50 last:border-0 flex gap-2 items-start"
                onClick={() => handleSelectSuggestion(suggestion)}
              >
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <span>{suggestion.display_name}</span>
              </li>
            ))}
          </ul>
        )}
        
        {showSuggestions && isSearching && addressQuery.length >= 4 && addressSuggestions.length === 0 && (
           <div className="absolute z-50 w-full bg-white border border-gray-200 shadow-xl rounded-lg mt-1 px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
             <Loader2 className="w-4 h-4 animate-spin" /> Searching map data...
           </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nearest Landmark (Optional)</label>
          <input 
            type="text" 
            name={`${prefix}Landmark`} 
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
            placeholder="e.g. Beside GTBank" 
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-gray-50 focus:bg-white transition-colors" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ZIP / Postal Code</label>
          <input 
            type="text" 
            name={`${prefix}Zip`}
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            placeholder="e.g. 100001" 
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-gray-50 focus:bg-white transition-colors" 
          />
        </div>
      </div>

      <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
        <input 
          type="checkbox" 
          name={`${prefix}IsResidential`}
          checked={isResidential}
          onChange={(e) => setIsResidential(e.target.checked)}
          className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
        />
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900">This is a residential address</span>
          <span className="text-xs text-gray-500">Some carriers need to know if this is a home or business.</span>
        </div>
        {/* Pass boolean as string for FormData easily */}
        <input type="hidden" name={`${prefix}IsResidentialVal`} value={isResidential ? 'true' : 'false'} />
      </label>
    </div>
  )
}
