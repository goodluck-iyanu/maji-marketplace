'use client'

import { useState, useEffect, useRef } from 'react'
import { NG_STATES, NG_STATES_CITIES } from '@/lib/ng-cities'
import { MapPin, Search, Check } from 'lucide-react'
import { MajiSpinner } from '@/components/brand/maji-brand'

export interface TerminalAddressData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  state: string;
  city: string;
  line1: string;
  houseNumber: string;
  area: string;
  lga: string;
  country: 'NG';
  zip: string;
  lat: string;
  lng: string;
  locationConfirmed: boolean;
  isResidential: boolean;
  landmark: string;
}

interface MapboxFeature {
  place_name: string
  center: [number, number] // [lng, lat]
}

function isMapboxFeature(value: unknown): value is MapboxFeature {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return typeof candidate.place_name === 'string' &&
    Array.isArray(candidate.center) &&
    candidate.center.length === 2 &&
    typeof candidate.center[0] === 'number' &&
    typeof candidate.center[1] === 'number'
}

interface TerminalAddressFormProps {
  type: 'pickup' | 'delivery';
  defaultValues?: Partial<TerminalAddressData>;
  onChange?: (data: TerminalAddressData) => void;
  hideContactInfo?: boolean;
}

export default function TerminalAddressForm({ type, defaultValues, onChange, hideContactInfo = false }: TerminalAddressFormProps) {
  const [firstName, setFirstName] = useState(defaultValues?.firstName || '')
  const [lastName, setLastName] = useState(defaultValues?.lastName || '')
  const [phone, setPhone] = useState(defaultValues?.phone || '')
  const [email, setEmail] = useState(defaultValues?.email || '')
  
  const [selectedState, setSelectedState] = useState(defaultValues?.state || '')
  const [selectedCity, setSelectedCity] = useState(defaultValues?.city || '')
  const [houseNumber, setHouseNumber] = useState(defaultValues?.houseNumber || '')
  const [area, setArea] = useState(defaultValues?.area || '')
  const [lga, setLga] = useState(defaultValues?.lga || '')
  const [zip, setZip] = useState(defaultValues?.zip || '')
  const [isResidential, setIsResidential] = useState(defaultValues?.isResidential ?? true)
  const [landmark, setLandmark] = useState(defaultValues?.landmark || '')

  // Map & Autocomplete state
  const [addressQuery, setAddressQuery] = useState(defaultValues?.line1 || '')
  const [lat, setLat] = useState<string>(defaultValues?.lat || '')
  const [lng, setLng] = useState<string>(defaultValues?.lng || '')
  const [locationConfirmed, setLocationConfirmed] = useState(false)
  const [addressSuggestions, setAddressSuggestions] = useState<MapboxFeature[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Notify parent of changes (if controlled)
  useEffect(() => {
    if (onChange) {
      onChange({
        firstName, lastName, phone, email, state: selectedState, city: selectedCity,
        line1: addressQuery, houseNumber, area, lga, country: 'NG', zip, lat, lng,
        locationConfirmed, isResidential, landmark
      })
    }
  }, [firstName, lastName, phone, email, selectedState, selectedCity, addressQuery, houseNumber, area, lga, zip, lat, lng, locationConfirmed, isResidential, landmark, onChange])

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

  // Mapbox Autocomplete
  useEffect(() => {
    if (addressQuery.length < 4 || !showSuggestions) {
      return
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true)
      try {
        const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
        if (!token) {
          console.warn('NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN is missing')
          setAddressSuggestions([])
          return
        }

        let query = addressQuery
        if (selectedCity && !query.toLowerCase().includes(selectedCity.toLowerCase())) {
           query += `, ${selectedCity}`
        }
        if (selectedState && !query.toLowerCase().includes(selectedState.toLowerCase())) {
           query += `, ${selectedState}`
        }
        
        // Use Mapbox Geocoding API
        // bbox roughly for Nigeria/Lagos (Lagos: 3.0,6.3,3.5,6.7) - we can just rely on proximity to Lagos and country=ng
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&country=ng&proximity=3.3792,6.5244&autocomplete=true&limit=5`
        
        const response = await fetch(url)
        if (!response.ok) throw new Error(`Location search failed (${response.status}).`)
        const data: any = await response.json()
        
        setAddressSuggestions(Array.isArray(data.features) ? data.features.filter(isMapboxFeature) : [])
      } catch (error) {
        console.error('Error fetching addresses:', error)
      } finally {
        setIsSearching(false)
      }
    }, 600)

    return () => clearTimeout(delayDebounceFn)
  }, [addressQuery, showSuggestions, selectedState, selectedCity])

  const handleSelectSuggestion = (suggestion: MapboxFeature) => {
    setAddressQuery(suggestion.place_name)
    setLat(String(suggestion.center[1]))
    setLng(String(suggestion.center[0]))
    setLocationConfirmed(true)
    setAddressSuggestions([])
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
      <input type="hidden" name={`${prefix}Country`} value="NG" />
      <input type="hidden" name={`${prefix}LocationConfirmed`} value={locationConfirmed ? 'true' : 'false'} />
      
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">
        {isPickup ? 'Pickup Contact & Location' : 'Delivery Contact & Location'}
      </h3>

      {!hideContactInfo && (
        <>
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
                placeholder="john@example.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-gray-50 focus:bg-white transition-colors" 
              />
            </div>
          </div>
        </>
      )}

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
              setLocationConfirmed(false)
              setAddressSuggestions([])
            }}
          >
            <option value="">Select state</option>
            {['Lagos', 'Ogun'].map(state => (
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
              setLocationConfirmed(false)
              setAddressSuggestions([])
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">House / Building Number <span className="text-red-500">*</span></label>
          <input
            type="text"
            name={`${prefix}HouseNumber`}
            value={houseNumber}
            onChange={(event) => setHouseNumber(event.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-gray-50 focus:bg-white transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Area / Neighbourhood <span className="text-red-500">*</span></label>
          <input
            type="text"
            name={`${prefix}Area`}
            value={area}
            onChange={(event) => setArea(event.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-gray-50 focus:bg-white transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">LGA <span className="text-red-500">*</span></label>
          <input
            type="text"
            name={`${prefix}Lga`}
            value={lga}
            onChange={(event) => setLga(event.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-gray-50 focus:bg-white transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
          <input
            type="text"
            value="Nigeria (NG)"
            readOnly
            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-100 text-gray-600"
          />
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
              setAddressSuggestions([])
              setShowSuggestions(true)
              if (lat || lng) {
                setLat('')
                setLng('')
              }
              setLocationConfirmed(false)
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
          <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="relative">
              {process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ? (
                <img
                  alt="Selected delivery location map"
                  src={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+22c55e(${lng},${lat})/${lng},${lat},15/600x200@2x?access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`}
                  className="w-full h-48 rounded-lg border border-green-200 shadow-sm object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-48 rounded-lg border border-green-200 shadow-sm bg-gray-50 flex items-center justify-center text-gray-500 text-sm">
                  Map preview unavailable
                </div>
              )}
              <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-green-200 shadow-sm flex items-center gap-1.5 animate-pulse">
                <MapPin className="w-4 h-4 text-green-600" />
                <span className="text-xs font-semibold text-green-700">Location Pinned</span>
              </div>
            </div>
            {locationConfirmed && (
              <p className="text-xs text-green-700 flex items-center gap-1 font-medium bg-green-50 p-2 rounded border border-green-100">
                <Check className="w-4 h-4" /> Coordinates mapped successfully: {lat}, {lng}
              </p>
            )}
          </div>
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
                <span>{suggestion.place_name}</span>
              </li>
            ))}
          </ul>
        )}
        
        {showSuggestions && !isSearching && addressQuery.length >= 4 && addressSuggestions.length === 0 && (
          <div className="absolute z-50 w-full bg-white border border-gray-200 shadow-xl rounded-lg mt-1 px-4 py-3 text-sm text-red-500 flex flex-col gap-1">
            <span>No map results found.</span>
            <span className="text-gray-500 text-xs">Tip: Only type the name of your street (e.g., "Awolowo Way") or a major landmark. Do not include your house number here.</span>
          </div>
        )}

        {showSuggestions && isSearching && addressQuery.length >= 4 && addressSuggestions.length === 0 && (
           <div className="absolute z-50 w-full bg-white border border-gray-200 shadow-xl rounded-lg mt-1 px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
             <MajiSpinner size={16} color="ember" /> Searching map data...
           </div>
        )}
        
        <p className="text-xs text-gray-500 mt-2">
          Tip: Only type the name of your street or a nearby major landmark. Do not include your house number in this box.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bus Stop / Nearby Landmark <span className="text-red-500">*</span></label>
          <input 
            type="text" 
            name={`${prefix}Landmark`} 
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
            required
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
