'use client'

import { useState, useActionState, useEffect, useRef } from 'react'
import { Store, Package, Box, ArrowRight, Loader2, Shirt, Smartphone, ShoppingBasket, Sparkles, Heart, Home, Car, Gem, Dumbbell, Book, Baby, Dog, Wrench, Leaf, Gamepad2, Briefcase, Palette, MoreHorizontal, Camera, Video, Users, Hash, PlaySquare, Send, MessageCircle, MapPin, Search } from 'lucide-react'
import { createStoreAction } from './actions'

type Step = 'product_type' | 'store_name_logo' | 'store_category' | 'pickup_details' | 'social_links' | 'creating'

const PHYSICAL_CATEGORIES = [
  { id: 'fashion', name: 'Fashion & Clothing', icon: Shirt },
  { id: 'electronics', name: 'Electronics & Gadgets', icon: Smartphone },
  { id: 'food', name: 'Food & Groceries', icon: ShoppingBasket },
  { id: 'beauty', name: 'Beauty & Personal Care', icon: Sparkles },
  { id: 'health', name: 'Health & Wellness', icon: Heart },
  { id: 'home', name: 'Home & Furniture', icon: Home },
  { id: 'automotive', name: 'Automotive', icon: Car },
  { id: 'jewelry', name: 'Jewelry & Accessories', icon: Gem },
  { id: 'sports', name: 'Sports & Fitness', icon: Dumbbell },
  { id: 'books', name: 'Books & Stationery', icon: Book },
  { id: 'baby', name: 'Baby, Kids & Toys', icon: Baby },
  { id: 'pets', name: 'Pets & Pet Supplies', icon: Dog },
  { id: 'tools', name: 'Tools & Hardware', icon: Wrench },
  { id: 'agriculture', name: 'Agriculture & Garden', icon: Leaf },
  { id: 'gaming', name: 'Gaming', icon: Gamepad2 },
  { id: 'office', name: 'Office & Business Supplies', icon: Briefcase },
  { id: 'arts', name: 'Arts, Crafts & Collectibles', icon: Palette },
  { id: 'other', name: 'Other', icon: MoreHorizontal },
]

const DIGITAL_CATEGORIES = [
  { id: 'ebooks', name: 'Ebooks & Documents', icon: Book },
  { id: 'templates', name: 'Templates & Productivity', icon: Briefcase },
  { id: 'graphics', name: 'Graphics & Design', icon: Palette },
  { id: 'photography', name: 'Photography & Presets', icon: Camera },
  { id: 'audio', name: 'Music & Audio', icon: PlaySquare },
  { id: 'video', name: 'Video & Motion', icon: Video },
  { id: 'software', name: 'Software & Digital Tools', icon: Smartphone },
  { id: 'courses', name: 'Courses & Learning', icon: Users },
  { id: 'fonts', name: 'Fonts & Typography', icon: Hash },
  { id: '3d', name: '3D & Game Assets', icon: Gamepad2 },
  { id: 'memberships', name: 'Memberships & Digital Access', icon: Home },
  { id: 'other_digital', name: 'Other', icon: MoreHorizontal },
]

const LAGOS_LGAS = [
  'Agege', 'Ajeromi-Ifelodun', 'Alimosho', 'Amuwo-Odofin', 'Apapa',
  'Badagry', 'Epe', 'Eti-Osa', 'Ibeju-Lekki', 'Ifako-Ijaiye',
  'Ikeja', 'Ikorodu', 'Kosofe', 'Lagos Island', 'Lagos Mainland',
  'Mushin', 'Ojo', 'Oshodi-Isolo', 'Shomolu', 'Surulere'
]

export function OnboardingWizard() {
  const [step, setStep] = useState<Step>('product_type')
  const [productType, setProductType] = useState<'physical' | 'digital' | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  
  // Form State
  const [storeName, setStoreName] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [storeCategory, setStoreCategory] = useState('')
  
  // Pickup address state
  const [pickupFirstName, setPickupFirstName] = useState('')
  const [pickupLastName, setPickupLastName] = useState('')
  const [pickupPhone, setPickupPhone] = useState('')
  const [pickupEmail, setPickupEmail] = useState('')
  const [pickupHouseNumber, setPickupHouseNumber] = useState('')
  const [pickupArea, setPickupArea] = useState('')
  const [pickupLga, setPickupLga] = useState('')
  const [pickupAddress, setPickupAddress] = useState('')
  const [pickupLandmark, setPickupLandmark] = useState('')
  const [pickupLat, setPickupLat] = useState('')
  const [pickupLng, setPickupLng] = useState('')
  const [pickupIsResidential, setPickupIsResidential] = useState(true)
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  // Click outside to close address suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // OSM address autocomplete
  useEffect(() => {
    if (pickupAddress.length < 4 || !showSuggestions) {
      setAddressSuggestions([])
      return
    }
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true)
      try {
        let query = pickupAddress
        if (pickupLga && !query.toLowerCase().includes(pickupLga.toLowerCase())) query += `, ${pickupLga}`
        if (!query.toLowerCase().includes('lagos')) query += ', Lagos'
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
  }, [pickupAddress, showSuggestions, pickupLga])

  const handleSelectSuggestion = (suggestion: any) => {
    setPickupAddress(suggestion.display_name)
    setPickupLat(suggestion.lat)
    setPickupLng(suggestion.lon)
    setShowSuggestions(false)
  }

  const [socials, setSocials] = useState({
    instagram: '',
    tiktok: '',
    facebook: '',
    x: '',
    youtube: '',
    whatsapp: '',
    linkedin: '',
    telegram: ''
  })
  
  // UI State for socials
  const [activeSocial, setActiveSocial] = useState<string | null>(null)
  const [acknowledgedName, setAcknowledgedName] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new window.Image()
        img.src = event.target?.result as string
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const MAX_WIDTH = 800
          let width = img.width, height = img.height
          if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH } } 
          else { if (height > MAX_WIDTH) { width *= MAX_WIDTH / height; height = MAX_WIDTH } }
          canvas.width = width; canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)
          canvas.toBlob((blob) => {
            if (blob) resolve(new File([blob], file.name, { type: 'image/jpeg' }))
            else reject(new Error('Failed'))
          }, 'image/jpeg', 0.8)
        }
      }
      reader.onerror = error => reject(error)
    })
  }

  const [state, formAction, isServerPending] = useActionState(createStoreAction, null)
  const isPending = isServerPending || isCompressing

  const handleAction = async (formData: FormData) => {
    setIsCompressing(true)
    try {
      const logo = formData.get('logo') as File | null
      if (logo && logo.size > 0) {
        try {
          const compressed = await compressImage(logo)
          formData.set('logo', compressed)
        } catch (err) {
          console.error(err)
        }
      }
      formAction(formData)
    } finally {
      setIsCompressing(false)
    }
  }

  useEffect(() => {
    if (state?.error) {
      setStep('social_links') 
    }
  }, [state])

  const handleNextToName = () => {
    if (productType) setStep('store_name_logo')
  }

  const handleNextToCategory = () => {
    if (storeName.trim() && acknowledgedName) {
      setStep('store_category')
    }
  }

  const handleNextToSocials = () => {
    if (storeCategory) {
      if (productType === 'physical') {
        setStep('pickup_details')
      } else {
        setStep('social_links')
      }
    }
  }


  const renderProgress = () => {
    if (step === 'product_type' || step === 'creating') return null
    
    let currentStepNum = 1
    const totalSteps = productType === 'physical' ? 4 : 3
    let msg = ''

    if (step === 'store_name_logo') {
      currentStepNum = 1
      msg = 'Let\'s get your store started.'
    } else if (step === 'store_category') {
      currentStepNum = 2
      msg = 'Great - one important choice done.'
    } else if (step === 'pickup_details') {
      currentStepNum = 3
      msg = 'Where should we pick up your orders?'
    } else if (step === 'social_links') {
      currentStepNum = productType === 'physical' ? 4 : 3
      msg = 'You\'re almost there.'
    }

    return (
      <div className="mb-8 text-center">
        <div className="text-sm font-semibold text-gray-500 mb-1">
          Step {currentStepNum} of {totalSteps}
        </div>
        <div className="text-sm text-gray-400">{msg}</div>
        <div className="w-full bg-gray-200 h-2 rounded-full mt-3 overflow-hidden">
          <div 
            className="bg-black h-full transition-all duration-300"
            style={{ width: `${(currentStepNum / totalSteps) * 100}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <form action={handleAction} className="w-full max-w-2xl mx-auto">
      {renderProgress()}

      <div className={step === 'product_type' ? 'block' : 'hidden'}>
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 bg-black text-white rounded-full flex items-center justify-center mb-4">
            <Store className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">What are you selling?</h2>
          <p className="mt-2 text-sm text-gray-500">This helps us tailor your experience.</p>
          
          <div className="space-y-4 mt-8">
            <button
              type="button"
              onClick={() => {
                if (productType !== 'physical') setStoreCategory('')
                setProductType('physical')
              }}
              className={`w-full flex items-center p-4 border rounded-lg transition-colors ${
                productType === 'physical' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Box className="h-6 w-6 mr-4 text-gray-700" />
              <div className="text-left">
                <div className="font-medium text-gray-900">Physical Products</div>
                <div className="text-sm text-gray-500">Clothing, electronics, crafts, etc.</div>
              </div>
            </button>
            
            <button
              type="button"
              onClick={() => {
                if (productType !== 'digital') setStoreCategory('')
                setProductType('digital')
              }}
              className={`w-full flex items-center p-4 border rounded-lg transition-colors ${
                productType === 'digital' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Package className="h-6 w-6 mr-4 text-gray-700" />
              <div className="text-left">
                <div className="font-medium text-gray-900">Digital Products</div>
                <div className="text-sm text-gray-500">E-books, courses, software, etc.</div>
              </div>
            </button>

            {/* Hidden input to store productType so it submits */}
            <input type="hidden" name="productType" value={productType || ''} />

            <button
              type="button"
              onClick={handleNextToName}
              disabled={!productType}
              className="w-full mt-6 bg-black text-white rounded-md px-4 py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors flex items-center justify-center"
            >
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className={step === 'store_name_logo' ? 'block text-center' : 'hidden'}>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">Let’s set up your store</h2>
        <p className="text-gray-500 mb-8">First, give your store a name. You can add your logo now or later.</p>
        
        <div className="space-y-6 text-left">
          <div>
            <label htmlFor="store-name" className="block text-sm font-medium text-gray-900 mb-1">
              Store Name <span className="text-red-500">*</span>
            </label>
            <input
              id="store-name"
              name="storeName"
              type="text"
              required={step === 'store_name_logo'}
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="e.g. Jane Fashion"
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-shadow"
            />
            <div className="mt-3 flex items-start">
              <input 
                type="checkbox" 
                id="ack-name" 
                checked={acknowledgedName}
                onChange={(e) => setAcknowledgedName(e.target.checked)}
                className="mt-1 h-4 w-4 text-black focus:ring-black border-gray-300 rounded" 
              />
              <label htmlFor="ack-name" className="ml-2 text-sm text-gray-600">
                I understand that I must choose carefully — my store name cannot be changed later.
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Logo <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <input 
              type="file"
              name="logo" 
              accept="image/*"
              onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm" 
            />
            <p className="text-xs text-gray-500 mt-2">You can always skip for now and upload a logo later from your dashboard.</p>
          </div>

          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={() => setStep('product_type')}
              className="w-1/3 py-3 px-4 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleNextToCategory}
              disabled={!storeName.trim() || !acknowledgedName}
              className="w-2/3 bg-black text-white rounded-md px-4 py-3 font-medium disabled:opacity-50 hover:bg-gray-800 transition-colors flex items-center justify-center"
            >
              Continue
            </button>
          </div>
        </div>
      </div>

      <div className={step === 'store_category' ? 'block text-center' : 'hidden'}>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">What category best describes your store?</h2>
        <p className="text-gray-500 mb-8">Choose the category that best describes what your store sells. You can choose specific categories for individual products later.</p>
        
        <input type="hidden" name="storeCategory" value={storeCategory} />

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-left mb-8 max-h-[60vh] overflow-y-auto p-1">
          {(productType === 'digital' ? DIGITAL_CATEGORIES : PHYSICAL_CATEGORIES).map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setStoreCategory(cat.id)}
              className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${
                storeCategory === cat.id 
                  ? 'border-black bg-gray-50 ring-2 ring-black ring-opacity-20' 
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <cat.icon className={`h-8 w-8 mb-3 ${storeCategory === cat.id ? 'text-black' : 'text-gray-500'}`} strokeWidth={1.5} />
              <span className="text-sm font-medium text-center text-gray-900 leading-tight">{cat.name}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setStep('store_name_logo')}
            className="w-1/3 py-3 px-4 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleNextToSocials}
            disabled={!storeCategory}
            className="w-2/3 bg-black text-white rounded-md px-4 py-3 font-medium disabled:opacity-50 hover:bg-gray-800 transition-colors flex items-center justify-center"
          >
            Continue
          </button>
        </div>
      </div>

      <div className={step === 'pickup_details' ? 'block text-center' : 'hidden'}>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">Set up your pickup address</h2>
        <p className="text-gray-500 mb-6">This is where logistics riders will come to pick up orders. Lagos only for now.</p>
        
        {/* Hidden inputs for server action */}
        <input type="hidden" name="pickupState" value="Lagos" />
        <input type="hidden" name="pickupCity" value={pickupLga || 'Lagos'} />
        <input type="hidden" name="pickupCountry" value="NG" />
        <input type="hidden" name="pickupLat" value={pickupLat} />
        <input type="hidden" name="pickupLng" value={pickupLng} />
        <input type="hidden" name="pickupIsResidentialVal" value={pickupIsResidential ? 'true' : 'false'} />
        <input type="hidden" name="pickupLocationConfirmed" value={pickupLat && pickupLng ? 'true' : 'false'} />

        <div className="text-left max-w-xl mx-auto space-y-4 mb-8">
          {/* Contact Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name <span className="text-red-500">*</span></label>
              <input type="text" name="pickupFirstName" value={pickupFirstName} onChange={(e) => setPickupFirstName(e.target.value)} required placeholder="e.g. John" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name <span className="text-red-500">*</span></label>
              <input type="text" name="pickupLastName" value={pickupLastName} onChange={(e) => setPickupLastName(e.target.value)} required placeholder="e.g. Doe" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none" />
            </div>
          </div>

          {/* Phone + Email */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
              <input type="tel" name="pickupPhone" value={pickupPhone} onChange={(e) => setPickupPhone(e.target.value)} required placeholder="08012345678" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" name="pickupEmail" value={pickupEmail} onChange={(e) => setPickupEmail(e.target.value)} placeholder="you@email.com" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none" />
            </div>
          </div>

          {/* LGA + House/Building */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">LGA (Local Government) <span className="text-red-500">*</span></label>
              <select name="pickupLga" value={pickupLga} onChange={(e) => setPickupLga(e.target.value)} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none bg-white">
                <option value="">Select LGA</option>
                {LAGOS_LGAS.map(lga => (
                  <option key={lga} value={lga}>{lga}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">House / Building No. <span className="text-red-500">*</span></label>
              <input type="text" name="pickupHouseNumber" value={pickupHouseNumber} onChange={(e) => setPickupHouseNumber(e.target.value)} required placeholder="e.g. 12A" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none" />
            </div>
          </div>

          {/* Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Area / Neighbourhood <span className="text-red-500">*</span></label>
            <input type="text" name="pickupArea" value={pickupArea} onChange={(e) => setPickupArea(e.target.value)} required placeholder="e.g. Victoria Island, Lekki Phase 1" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none" />
          </div>

          {/* Street Address with Autocomplete */}
          <div className="relative" ref={wrapperRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Street Address <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                type="text"
                name="pickupAddress"
                value={pickupAddress}
                onChange={(e) => {
                  setPickupAddress(e.target.value)
                  setShowSuggestions(true)
                  if (pickupLat || pickupLng) { setPickupLat(''); setPickupLng('') }
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search for your street or building..."
                required
                autoComplete="off"
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${pickupLat && pickupLng ? 'border-green-500 focus:ring-green-500 bg-green-50' : 'border-gray-300 focus:ring-black'}`}
              />
              <Search className="w-5 h-5 absolute left-3 top-3.5 text-gray-400" />
            </div>

            {pickupLat && pickupLng && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1 font-medium">
                <MapPin className="w-3 h-3" /> Exact map location captured ✓
              </p>
            )}
            {!pickupLat && !pickupLng && pickupAddress.length > 3 && !showSuggestions && (
              <p className="text-xs text-yellow-600 mt-1">⚠ Please select from the dropdown to confirm your exact location.</p>
            )}

            {showSuggestions && addressSuggestions.length > 0 && (
              <ul className="absolute z-50 w-full bg-white border border-gray-200 shadow-xl rounded-lg mt-1 max-h-60 overflow-auto">
                {addressSuggestions.map((suggestion, index) => (
                  <li key={index} className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 border-b border-gray-50 last:border-0 flex gap-2 items-start" onClick={() => handleSelectSuggestion(suggestion)}>
                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span>{suggestion.display_name}</span>
                  </li>
                ))}
              </ul>
            )}

            {showSuggestions && isSearching && pickupAddress.length >= 4 && addressSuggestions.length === 0 && (
              <div className="absolute z-50 w-full bg-white border border-gray-200 shadow-xl rounded-lg mt-1 px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Searching map data...
              </div>
            )}
          </div>

          {/* Landmark */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nearest Bus Stop / Landmark <span className="text-red-500">*</span></label>
            <input type="text" name="pickupLandmark" value={pickupLandmark} onChange={(e) => setPickupLandmark(e.target.value)} required placeholder="e.g. Beside GTBank, Opp. Chicken Republic" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none" />
          </div>

          {/* Residential checkbox */}
          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
            <input type="checkbox" checked={pickupIsResidential} onChange={(e) => setPickupIsResidential(e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black" />
            <span className="text-sm font-medium text-gray-900">This is a residential address</span>
          </label>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setStep('store_category')}
            className="w-1/3 py-3 px-4 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => {
              if (pickupFirstName && pickupLastName && pickupPhone && pickupHouseNumber && pickupArea && pickupLga && pickupAddress && pickupLandmark && pickupLat && pickupLng) {
                setStep('social_links')
              }
            }}
            disabled={!pickupFirstName || !pickupLastName || !pickupPhone || !pickupHouseNumber || !pickupArea || !pickupLga || !pickupAddress || !pickupLandmark || !pickupLat || !pickupLng}
            className="w-2/3 bg-black text-white rounded-md px-4 py-3 font-medium disabled:opacity-50 hover:bg-gray-800 transition-colors flex items-center justify-center"
          >
            Continue
          </button>
        </div>
      </div>

      <div className={step === 'social_links' && !isPending ? 'block text-center' : 'hidden'}>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">Connect your social pages</h2>
        <p className="text-gray-500 mb-8">Help customers find your business online. You can skip this and add them later.</p>
        
        {state?.error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-md border border-red-100">
            {state.error}
          </div>
        )}
        
        <div className="grid grid-cols-4 sm:grid-cols-4 gap-4 mb-8">
          {[
            { id: 'instagram', icon: Camera, label: 'Instagram' },
            { id: 'tiktok', icon: Video, label: 'TikTok' },
            { id: 'facebook', icon: Users, label: 'Facebook' },
            { id: 'x', icon: Hash, label: 'X (Twitter)' },
            { id: 'youtube', icon: PlaySquare, label: 'YouTube' },
            { id: 'whatsapp', icon: MessageCircle, label: 'WhatsApp' },
            { id: 'linkedin', icon: Briefcase, label: 'LinkedIn' },
            { id: 'telegram', icon: Send, label: 'Telegram' },
          ].map((social) => (
            <button
              key={social.id}
              type="button"
              onClick={() => setActiveSocial(social.id)}
              className={`flex flex-col items-center justify-center p-3 border rounded-xl transition-all ${
                socials[social.id as keyof typeof socials] || activeSocial === social.id
                  ? 'border-black bg-gray-50' 
                  : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
              }`}
            >
              <social.icon className={`h-6 w-6 mb-2 ${socials[social.id as keyof typeof socials] ? 'text-black' : 'text-gray-500'}`} strokeWidth={1.5} />
              <span className="text-xs font-medium text-gray-700 truncate w-full">{social.label}</span>
            </button>
          ))}
        </div>

        {activeSocial && (
          <div className="mb-8 p-4 bg-gray-50 border border-gray-200 rounded-xl text-left animate-in fade-in slide-in-from-top-4">
            <label className="block text-sm font-medium text-gray-900 mb-1 capitalize">
              {activeSocial} Username or Link
            </label>
            <div className="flex">
              <input
                type="text"
                placeholder={`e.g. ${activeSocial === 'whatsapp' ? '+2349012345678' : 'yourstore'}`}
                value={socials[activeSocial as keyof typeof socials]}
                onChange={(e) => setSocials({ ...socials, [activeSocial]: e.target.value })}
                className="flex-1 min-w-0 block w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
              />
              <button
                type="button"
                onClick={() => setActiveSocial(null)}
                className="ml-3 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium bg-white hover:bg-gray-100"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Hidden inputs to pass social data to formAction */}
        {Object.entries(socials).map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}

        <div className="flex gap-3">
          <button
            type="button"
            disabled={isPending}
            onClick={() => setStep(productType === 'physical' ? 'store_category' : 'store_name_logo')}
            className="w-1/3 py-3 px-4 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="w-2/3 bg-black text-white rounded-md px-4 py-3 font-medium hover:bg-gray-800 transition-colors flex items-center justify-center disabled:opacity-70"
          >
            {isPending ? 'Creating...' : Object.values(socials).some(Boolean) ? 'Finish & Create' : 'Skip & Create'}
          </button>
        </div>
      </div>

      <div className={isPending ? 'block text-center py-12' : 'hidden'}>
        <div className="mx-auto h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">You're almost done! 🎉</h2>
        <p className="text-gray-500 text-lg">We're creating your store now.</p>
      </div>
    </form>
  )
}
