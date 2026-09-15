'use client'

import { useState, useActionState, useRef } from 'react'
import { ArrowLeft, ArrowRight, Smartphone, Laptop, Headphones, Battery, Watch, Gamepad2, Camera, Tv, Home, Wifi, Mouse, Cpu, Check, Upload, X, Loader2, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import { createGadgetProductAction } from '../actions'

const STEPS = [
  { id: 'type', label: 'Device Type' },
  { id: 'photos', label: 'Photos' },
  { id: 'specs', label: 'Specifications' },
  { id: 'basic', label: 'Price & Basic Info' },
  { id: 'options', label: 'Options' },
  { id: 'variants', label: 'Variants' },
  { id: 'review', label: 'Review' },
]

const GADGET_CATEGORIES = [
  { id: 'phones_tablets', label: 'Phones & Tablets', icon: Smartphone, subs: ['Smartphones', 'Feature Phones', 'Tablets', 'iPads', 'E-readers'] },
  { id: 'computers', label: 'Computers', icon: Laptop, subs: ['Laptops', 'Desktop Computers', 'MacBooks', 'Monitors', 'PC Components', 'Computer Accessories'] },
  { id: 'audio', label: 'Audio', icon: Headphones, subs: ['Earbuds', 'Headphones', 'Bluetooth Speakers', 'Soundbars', 'Microphones', 'Audio Equipment'] },
  { id: 'power', label: 'Power & Charging', icon: Battery, subs: ['Power Banks', 'Chargers', 'Charging Cables', 'Wireless Chargers', 'Adapters', 'Power Stations', 'UPS'] },
  { id: 'wearables', label: 'Wearables', icon: Watch, subs: ['Smartwatches', 'Smart Bands', 'Smart Rings', 'Smart Glasses', 'Fitness Trackers'] },
  { id: 'gaming', label: 'Gaming', icon: Gamepad2, subs: ['PlayStation', 'Xbox', 'Nintendo', 'Gaming Controllers', 'Gaming Headsets', 'Gaming Accessories', 'Gaming Devices'] },
  { id: 'cameras', label: 'Cameras & Photo', icon: Camera, subs: ['Digital Cameras', 'DSLR', 'Mirrorless Cameras', 'Action Cameras', 'Security Cameras', 'Lenses', 'Tripods', 'Camera Accessories'] },
  { id: 'tv', label: 'TV & Entertainment', icon: Tv, subs: ['Smart TVs', 'LED TVs', 'OLED/QLED TVs', 'Projectors', 'Streaming Devices', 'TV Accessories'] },
  { id: 'smart_home', label: 'Smart Home', icon: Home, subs: ['Smart Lights', 'Smart Plugs', 'Smart Speakers', 'Smart Cameras', 'Smart Doorbells', 'Smart Sensors', 'Other Smart Devices'] },
  { id: 'networking', label: 'Networking', icon: Wifi, subs: ['Wi-Fi Routers', 'MiFi', 'Modems', 'Wi-Fi Extenders', 'Network Switches', 'Network Accessories'] },
  { id: 'accessories', label: 'Phone & PC Accessories', icon: Mouse, subs: ['Phone Cases', 'Screen Protectors', 'Keyboards', 'Mouse', 'USB Hubs', 'Flash Drives', 'Memory Cards', 'Stands & Mounts', 'Cables', 'Other Accessories'] },
  { id: 'components', label: 'Electronic Equipment', icon: Cpu, subs: ['Batteries', 'Electronic Components', 'Repair Tools', 'Testing Equipment', 'Soldering Equipment', 'Other Electronic Equipment'] },
]

const compressImage = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new window.Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 1200
        const MAX_HEIGHT = 1200
        let width = img.width
        let height = img.height
        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT }
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        canvas.toBlob((blob) => {
          if (blob) resolve(new File([blob], file.name, { type: 'image/jpeg' }))
          else reject(new Error('Canvas to Blob failed'))
        }, 'image/jpeg', 0.8)
      }
      img.onerror = (e) => reject(e)
    }
    reader.onerror = (e) => reject(e)
  })
}

export default function GadgetsProductBuilder({ productType }: { productType: string | null }) {
  const [currentStep, setCurrentStep] = useState(0)
  
  // State
  const [category, setCategory] = useState('')
  const [subCategory, setSubCategory] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  
  const [brand, setBrand] = useState('')
  const [condition, setCondition] = useState('New')
  const [attributes, setAttributes] = useState<Record<string, string>>({})
  
  const [hasOptions, setHasOptions] = useState<boolean | null>(null)
  const [sizes, setSizes] = useState<string[]>([])
  const [colors, setColors] = useState<string[]>([])
  const [customSize, setCustomSize] = useState('')
  const [customColor, setCustomColor] = useState('')
  
  const [basePrice, setBasePrice] = useState('')
  const [baseStock, setBaseStock] = useState('')
  const [variants, setVariants] = useState<any[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [state, formAction, isPending] = useActionState(createGadgetProductAction, null)
  const [isCompressing, setIsCompressing] = useState(false)
  const isLoading = isPending || isCompressing

  const handleNext = () => setCurrentStep(c => Math.min(c + 1, STEPS.length - 1))
  const handleBack = () => setCurrentStep(c => Math.max(c - 1, 0))

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setPhotos(prev => [...prev, ...newFiles].slice(0, 5))
    }
  }

  const handleAttributeChange = (key: string, value: string) => {
    setAttributes(prev => ({ ...prev, [key]: value }))
  }

  const generateVariants = () => {
    let newVariants: any[] = []
    if (colors.length === 0 && sizes.length === 0) {
      // no variants
    } else if (colors.length > 0 && sizes.length === 0) {
      colors.forEach(c => newVariants.push({ title: c, options: { Color: c }, price: basePrice, stock: baseStock, sku: '' }))
    } else if (sizes.length > 0 && colors.length === 0) {
      sizes.forEach(s => newVariants.push({ title: s, options: { Size: s }, price: basePrice, stock: baseStock, sku: '' }))
    } else {
      colors.forEach(c => {
        sizes.forEach(s => {
          newVariants.push({ title: `${c} / ${s}`, options: { Color: c, Size: s }, price: basePrice, stock: baseStock, sku: '' })
        })
      })
    }
    setVariants(newVariants)
  }

  const activeCategory = GADGET_CATEGORIES.find(c => c.id === category)

  const renderDynamicSpecs = () => {
    if (subCategory === 'Smartphones') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1">Model</label><input type="text" value={attributes.Model || ''} onChange={e => handleAttributeChange('Model', e.target.value)} className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Storage</label><input type="text" value={attributes.Storage || ''} onChange={e => handleAttributeChange('Storage', e.target.value)} placeholder="e.g. 256GB" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">RAM</label><input type="text" value={attributes.RAM || ''} onChange={e => handleAttributeChange('RAM', e.target.value)} placeholder="e.g. 8GB" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Network</label><input type="text" value={attributes.Network || ''} onChange={e => handleAttributeChange('Network', e.target.value)} placeholder="e.g. 5G" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">SIM</label><input type="text" value={attributes.SIM || ''} onChange={e => handleAttributeChange('SIM', e.target.value)} placeholder="e.g. Dual SIM" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Color</label><input type="text" value={attributes.Color || ''} onChange={e => handleAttributeChange('Color', e.target.value)} className="w-full border rounded-md px-3 py-2" /></div>
        </div>
      )
    }
    if (subCategory === 'Power Banks') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1">Model</label><input type="text" value={attributes.Model || ''} onChange={e => handleAttributeChange('Model', e.target.value)} className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Capacity</label><input type="text" value={attributes.Capacity || ''} onChange={e => handleAttributeChange('Capacity', e.target.value)} placeholder="e.g. 20000mAh" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Output</label><input type="text" value={attributes.Output || ''} onChange={e => handleAttributeChange('Output', e.target.value)} placeholder="e.g. 22.5W" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Ports</label><input type="text" value={attributes.Ports || ''} onChange={e => handleAttributeChange('Ports', e.target.value)} placeholder="e.g. 2 USB-A, 1 USB-C" className="w-full border rounded-md px-3 py-2" /></div>
        </div>
      )
    }
    if (subCategory === 'Earbuds') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1">Model</label><input type="text" value={attributes.Model || ''} onChange={e => handleAttributeChange('Model', e.target.value)} className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Connection</label><input type="text" value={attributes.Connection || ''} onChange={e => handleAttributeChange('Connection', e.target.value)} placeholder="e.g. Bluetooth 5.3" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Battery Life</label><input type="text" value={attributes.BatteryLife || ''} onChange={e => handleAttributeChange('BatteryLife', e.target.value)} placeholder="e.g. 24 hours" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">ANC</label><input type="text" value={attributes.ANC || ''} onChange={e => handleAttributeChange('ANC', e.target.value)} placeholder="e.g. Yes" className="w-full border rounded-md px-3 py-2" /></div>
        </div>
      )
    }
    if (subCategory === 'Smartwatches') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1">Model</label><input type="text" value={attributes.Model || ''} onChange={e => handleAttributeChange('Model', e.target.value)} className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Compatibility</label><input type="text" value={attributes.Compatibility || ''} onChange={e => handleAttributeChange('Compatibility', e.target.value)} placeholder="e.g. iOS / Android" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">GPS</label><input type="text" value={attributes.GPS || ''} onChange={e => handleAttributeChange('GPS', e.target.value)} placeholder="e.g. Built-in" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Battery Life</label><input type="text" value={attributes.BatteryLife || ''} onChange={e => handleAttributeChange('BatteryLife', e.target.value)} className="w-full border rounded-md px-3 py-2" /></div>
        </div>
      )
    }
    if (subCategory === 'Laptops' || subCategory === 'MacBooks') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1">Model</label><input type="text" value={attributes.Model || ''} onChange={e => handleAttributeChange('Model', e.target.value)} className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Processor</label><input type="text" value={attributes.Processor || ''} onChange={e => handleAttributeChange('Processor', e.target.value)} placeholder="e.g. Intel Core i7" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">RAM</label><input type="text" value={attributes.RAM || ''} onChange={e => handleAttributeChange('RAM', e.target.value)} placeholder="e.g. 16GB" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Storage</label><input type="text" value={attributes.Storage || ''} onChange={e => handleAttributeChange('Storage', e.target.value)} placeholder="e.g. 512GB SSD" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Screen Size</label><input type="text" value={attributes.ScreenSize || ''} onChange={e => handleAttributeChange('ScreenSize', e.target.value)} placeholder="e.g. 15.6 inch" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Graphics</label><input type="text" value={attributes.Graphics || ''} onChange={e => handleAttributeChange('Graphics', e.target.value)} className="w-full border rounded-md px-3 py-2" /></div>
        </div>
      )
    }
    // Generic fallback for others
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label className="block text-sm font-medium mb-1">Model</label><input type="text" value={attributes.Model || ''} onChange={e => handleAttributeChange('Model', e.target.value)} className="w-full border rounded-md px-3 py-2" /></div>
        <div><label className="block text-sm font-medium mb-1">Color</label><input type="text" value={attributes.Color || ''} onChange={e => handleAttributeChange('Color', e.target.value)} className="w-full border rounded-md px-3 py-2" /></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/products" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Add Gadget or Electronics</h1>
      </div>

      <div className="flex justify-between mb-8 overflow-x-auto pb-4 hide-scrollbar">
        {STEPS.map((step, idx) => (
          <div key={step.id} className="flex flex-col items-center min-w-[100px] opacity-100">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold mb-2 transition-colors ${
              idx === currentStep ? 'bg-black text-white' : idx < currentStep ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'
            }`}>
              {idx < currentStep ? <Check className="h-5 w-5" /> : idx + 1}
            </div>
            <span className={`text-xs font-medium text-center ${idx === currentStep ? 'text-black' : 'text-gray-400'}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {state?.error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 font-medium animate-in fade-in">
          {state.error}
        </div>
      )}

      <form action={async (formData) => {
        setIsCompressing(true)
        try {
          const compressedFormData = new FormData()
          for (const [key, value] of formData.entries()) {
            if (key !== 'photos') {
              compressedFormData.append(key, value)
            }
          }
          for (const file of photos) {
            try {
              const compressed = await compressImage(file)
              compressedFormData.append('photos', compressed)
            } catch (e) {
              compressedFormData.append('photos', file) 
            }
          }
          formAction(compressedFormData)
        } finally {
          setIsCompressing(false)
        }
      }}>
        <input type="hidden" name="subCategory" value={subCategory} />
        <input type="hidden" name="brand" value={brand} />
        <input type="hidden" name="condition" value={condition} />
        <input type="hidden" name="attributesJson" value={JSON.stringify(attributes)} />
        <input type="hidden" name="hasOptions" value={hasOptions ? 'true' : 'false'} />
        <input type="hidden" name="optionsDef" value={JSON.stringify({ sizes, colors })} />
        <input type="hidden" name="variantsJson" value={JSON.stringify(variants)} />

        {/* STEP 0: TYPE */}
        <div className={currentStep === 0 ? 'block animate-in fade-in' : 'hidden'}>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-6">Select Gadget Category</h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
              {GADGET_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => { setCategory(cat.id); setSubCategory('') }}
                  className={`flex flex-col items-center justify-center p-6 border-2 rounded-xl transition-all ${
                    category === cat.id ? 'border-black bg-gray-50' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <cat.icon className={`h-8 w-8 mb-3 ${category === cat.id ? 'text-black' : 'text-gray-400'}`} />
                  <span className="font-medium text-sm text-center">{cat.label}</span>
                </button>
              ))}
            </div>

            {activeCategory && (
              <div className="animate-in slide-in-from-top-4">
                <h3 className="font-semibold mb-4 border-t pt-6">Select Sub-category for {activeCategory.label}</h3>
                <div className="flex flex-wrap gap-3">
                  {activeCategory.subs.map(sub => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setSubCategory(sub)}
                      className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                        subCategory === sub ? 'bg-black text-white border-black' : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="mt-10 flex justify-end">
              <button type="button" disabled={!subCategory} onClick={handleNext} className="bg-black text-white px-8 py-3 rounded-xl font-bold disabled:opacity-50 flex items-center">
                Next <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* STEP 1: PHOTOS */}
        <div className={currentStep === 1 ? 'block animate-in fade-in' : 'hidden'}>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-2">Upload Device Photos</h2>
            <p className="text-gray-500 mb-6">Upload up to 5 clear photos of the {subCategory}. Show the actual condition if it's used.</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {photos.map((file, idx) => (
                <div key={idx} className="relative aspect-square bg-gray-50 rounded-xl overflow-hidden border">
                  <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="Preview" />
                  <button type="button" onClick={() => setPhotos(p => p.filter((_, i) => i !== idx))} className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full text-red-600 hover:bg-white shadow-sm">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              
              {photos.length < 5 && (
                <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-gray-400 transition-colors">
                  <Upload className="h-8 w-8 mb-2" />
                  <span className="font-medium">Upload</span>
                  <span className="text-xs mt-1 text-gray-400">{5 - photos.length} remaining</span>
                </button>
              )}
            </div>
            
            <input type="file" name="photos" accept="image/jpeg, image/png, image/webp" multiple className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} />

            <div className="flex justify-between">
              <button type="button" onClick={handleBack} className="px-8 py-3 border rounded-xl font-medium text-gray-700 hover:bg-gray-50">Back</button>
              <button type="button" disabled={photos.length === 0} onClick={handleNext} className="bg-black text-white px-8 py-3 rounded-xl font-bold disabled:opacity-50">Next Step</button>
            </div>
          </div>
        </div>

        {/* STEP 2: SPECS */}
        <div className={currentStep === 2 ? 'block animate-in fade-in' : 'hidden'}>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-6">Device Specifications</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900">Brand / Manufacturer</label>
                <input type="text" value={brand} onChange={e => setBrand(e.target.value)} placeholder="e.g. Apple, Samsung, Sony" className="w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900">Condition</label>
                <select value={condition} onChange={e => setCondition(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2">
                  <option value="New">Brand New (Sealed)</option>
                  <option value="Open Box">Open Box / Like New</option>
                  <option value="Used - Excellent">Used - Excellent</option>
                  <option value="Used - Good">Used - Good</option>
                  <option value="Used - Fair">Used - Fair (Visible scratches)</option>
                  <option value="Refurbished">Refurbished</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900">Warranty</label>
                <input type="text" value={attributes.Warranty || ''} onChange={e => handleAttributeChange('Warranty', e.target.value)} placeholder="e.g. 1 Year Manufacturer, None" className="w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>
            </div>

            <h3 className="font-semibold text-lg mb-4 border-t border-gray-100 pt-6">Specific Features for {subCategory}</h3>
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 mb-8">
              {renderDynamicSpecs()}
            </div>

            <div className="flex justify-between">
              <button type="button" onClick={handleBack} className="px-8 py-3 border rounded-xl font-medium text-gray-700 hover:bg-gray-50">Back</button>
              <button type="button" disabled={!brand} onClick={handleNext} className="bg-black text-white px-8 py-3 rounded-xl font-bold disabled:opacity-50">Next Step</button>
            </div>
          </div>
        </div>

        {/* STEP 3: BASIC INFO */}
        <div className={currentStep === 3 ? 'block animate-in fade-in' : 'hidden'}>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-6">Price & Details</h2>

            <div className="space-y-6 mb-8">
              <div>
                <label className="block font-medium text-gray-900 mb-1">Product Title</label>
                <input type="text" name="name" value={name} onChange={e => setName(e.target.value)} placeholder={`e.g. ${brand} ${attributes.Model || subCategory}`} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none" required />
              </div>
              
              <div>
                <label className="block font-medium text-gray-900 mb-1">Description</label>
                <textarea name="description" value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Describe the device, any defects if used, what's in the box..." className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none" required />
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block font-medium text-gray-900 mb-1">Price (₦)</label>
                  <input type="number" name="price" value={basePrice} onChange={e => setBasePrice(e.target.value)} placeholder="0.00" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none" required={!hasOptions} />
                </div>
                <div>
                  <label className="block font-medium text-gray-900 mb-1">Stock</label>
                  <input type="number" name="stock" value={baseStock} onChange={e => setBaseStock(e.target.value)} placeholder="0" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none" required={!hasOptions} />
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button type="button" onClick={handleBack} className="px-8 py-3 border rounded-xl font-medium text-gray-700 hover:bg-gray-50">Back</button>
              <button type="button" disabled={!name || !description || (!hasOptions && (!basePrice || !baseStock))} onClick={handleNext} className="bg-black text-white px-8 py-3 rounded-xl font-bold disabled:opacity-50">Next Step</button>
            </div>
          </div>
        </div>

        {/* STEP 4: OPTIONS */}
        <div className={currentStep === 4 ? 'block animate-in fade-in' : 'hidden'}>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-2">Options & Variants (Optional)</h2>
            <p className="text-gray-500 mb-6">Does this device come in different colors or storage sizes that affect price/stock?</p>

            <div className="flex gap-4 mb-8">
              <button type="button" onClick={() => setHasOptions(false)} className={`flex-1 py-4 border-2 rounded-xl font-bold transition-all ${hasOptions === false ? 'border-black bg-gray-50 ring-2 ring-black ring-opacity-20' : 'border-gray-200 hover:border-gray-300'}`}>No, it's just one item</button>
              <button type="button" onClick={() => setHasOptions(true)} className={`flex-1 py-4 border-2 rounded-xl font-bold transition-all ${hasOptions === true ? 'border-black bg-gray-50 ring-2 ring-black ring-opacity-20' : 'border-gray-200 hover:border-gray-300'}`}>Yes, add variants</button>
            </div>

            {hasOptions && (
              <div className="space-y-6 mb-8 border-t pt-6 animate-in fade-in">
                <div>
                  <label className="block font-medium mb-2">Storage Sizes (e.g., 128GB, 256GB)</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {sizes.map(s => (
                      <span key={s} className="bg-black text-white px-3 py-1 rounded-full text-sm flex items-center">{s} <button type="button" onClick={() => setSizes(sizes.filter(x => x !== s))} className="ml-2 hover:text-gray-300"><X className="h-3 w-3" /></button></span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" value={customSize} onChange={e => setCustomSize(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (customSize && !sizes.includes(customSize)) { setSizes([...sizes, customSize]); setCustomSize('') } } }} placeholder="Add size..." className="border rounded-lg px-3 py-2 flex-1" />
                    <button type="button" onClick={() => { if (customSize && !sizes.includes(customSize)) { setSizes([...sizes, customSize]); setCustomSize('') } }} className="bg-gray-100 px-4 py-2 rounded-lg font-medium hover:bg-gray-200">Add</button>
                  </div>
                </div>

                <div>
                  <label className="block font-medium mb-2">Colors</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {colors.map(c => (
                      <span key={c} className="bg-black text-white px-3 py-1 rounded-full text-sm flex items-center">{c} <button type="button" onClick={() => setColors(colors.filter(x => x !== c))} className="ml-2 hover:text-gray-300"><X className="h-3 w-3" /></button></span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" value={customColor} onChange={e => setCustomColor(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (customColor && !colors.includes(customColor)) { setColors([...colors, customColor]); setCustomColor('') } } }} placeholder="Add color..." className="border rounded-lg px-3 py-2 flex-1" />
                    <button type="button" onClick={() => { if (customColor && !colors.includes(customColor)) { setColors([...colors, customColor]); setCustomColor('') } }} className="bg-gray-100 px-4 py-2 rounded-lg font-medium hover:bg-gray-200">Add</button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <button type="button" onClick={handleBack} className="px-8 py-3 border rounded-xl font-medium text-gray-700 hover:bg-gray-50">Back</button>
              <button type="button" disabled={hasOptions === null} onClick={() => { if (hasOptions) { generateVariants(); handleNext() } else { setCurrentStep(STEPS.length - 1) } }} className="bg-black text-white px-8 py-3 rounded-xl font-bold disabled:opacity-50">Next Step</button>
            </div>
          </div>
        </div>

        {/* STEP 5: VARIANTS (if hasOptions) */}
        {hasOptions && (
          <div className={currentStep === 5 ? 'block animate-in fade-in' : 'hidden'}>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Inventory & Pricing</h2>
                <button type="button" onClick={generateVariants} className="text-sm text-blue-600 hover:underline">Regenerate Variants</button>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl mb-6 flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Apply Price to All</label>
                  <input type="number" value={basePrice} onChange={e => setBasePrice(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Price" />
                </div>
                <button type="button" onClick={() => {
                  const v = [...variants]
                  v.forEach(va => va.price = basePrice)
                  setVariants(v)
                }} className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium">Apply</button>
                
                <div className="flex-1 ml-4">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Apply Stock to All</label>
                  <input type="number" value={baseStock} onChange={e => setBaseStock(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Stock" />
                </div>
                <button type="button" onClick={() => {
                  const v = [...variants]
                  v.forEach(va => va.stock = baseStock)
                  setVariants(v)
                }} className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium">Apply</button>
              </div>

              <div className="space-y-3 mb-8 max-h-[400px] overflow-y-auto pr-2">
                {variants.map((v, i) => (
                  <div key={i} className="flex items-center gap-4 bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                    <div className="font-bold w-1/3 truncate">{v.title}</div>
                    <div className="flex-1 relative">
                      <span className="absolute left-3 top-2.5 text-gray-400">₦</span>
                      <input type="number" value={v.price} onChange={e => {
                        const newV = [...variants]
                        newV[i].price = e.target.value
                        setVariants(newV)
                      }} className="w-full border rounded-lg pl-8 pr-3 py-2" placeholder="Price" />
                    </div>
                    <div className="w-24">
                      <input type="number" value={v.stock} onChange={e => {
                        const newV = [...variants]
                        newV[i].stock = e.target.value
                        setVariants(newV)
                      }} className="w-full border rounded-lg px-3 py-2" placeholder="Stock" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between">
                <button type="button" onClick={handleBack} className="px-8 py-3 border rounded-xl font-medium text-gray-700 hover:bg-gray-50">Back</button>
                <button type="button" disabled={variants.some(v => !v.price || !v.stock)} onClick={handleNext} className="bg-black text-white px-8 py-3 rounded-xl font-bold disabled:opacity-50">Review Product</button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: REVIEW */}
        <div className={currentStep === STEPS.length - 1 ? 'block animate-in fade-in' : 'hidden'}>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Ready to Publish</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">Your {subCategory} is ready to go live on your store. Review the details below and hit publish.</p>
            
            <div className="bg-gray-50 rounded-xl p-6 text-left mb-8">
              <div className="font-bold text-lg mb-1">{name}</div>
              <div className="text-gray-500 text-sm mb-4">{brand} • {condition}</div>
              <div className="flex justify-between text-sm font-medium py-3 border-t border-gray-200">
                <span className="text-gray-500">Price</span>
                <span>{hasOptions ? 'Varies by variant' : `₦${basePrice}`}</span>
              </div>
              <div className="flex justify-between text-sm font-medium py-3 border-t border-gray-200">
                <span className="text-gray-500">Stock</span>
                <span>{hasOptions ? `${variants.length} variants` : `${baseStock} units`}</span>
              </div>
            </div>

            <div className="flex justify-between gap-4">
              <button type="button" disabled={isLoading} onClick={handleBack} className="flex-1 py-4 border rounded-xl font-medium text-gray-700 hover:bg-gray-50">Back to Edit</button>
              <button type="submit" disabled={isLoading} className="flex-[2] bg-black text-white py-4 rounded-xl font-bold text-lg disabled:opacity-70 flex items-center justify-center">
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : null}
                {isLoading ? 'Publishing...' : 'Publish Product'}
              </button>
            </div>
          </div>
        </div>

      </form>
    </div>
  )
}
