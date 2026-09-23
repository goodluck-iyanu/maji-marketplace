'use client'

import { useState, useActionState, useRef } from 'react'
import { useDraftAutoSave } from '../hooks/useDraftAutoSave'
import { ArrowLeft, Check, Upload, X, Loader2, PlusCircle, Trash2, Dumbbell, Activity, Heart, Target, Droplet, Bike, Map, Shirt, Flag, Trophy, Briefcase, Gift, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { createSportsProductAction } from '../actions'

const STEPS = [
  { id: 'type', label: 'Sports Category' },
  { id: 'photos', label: 'Photos' },
  { id: 'specs', label: 'Details' },
  { id: 'basic', label: 'Basic Info' },
  { id: 'options', label: 'Options' },
  { id: 'variants', label: 'Variants' },
  { id: 'review', label: 'Review' },
]

const SPORTS_CATEGORIES = [
  { id: 'gym', label: 'Gym & Strength Equipment', icon: Dumbbell, subs: ['Dumbbells', 'Barbells', 'Weight Plates', 'Kettlebells', 'Weight Benches', 'Squat Racks', 'Power Racks', 'Weight Machines', 'Cable Machines', 'Smith Machines', 'Resistance Bands', 'Pull-Up Bars', 'Dip Stations', 'Weight Vests', 'Gym Equipment Sets'] },
  { id: 'cardio', label: 'Cardio Equipment', icon: Activity, subs: ['Treadmills', 'Exercise Bikes', 'Spin Bikes', 'Elliptical Trainers', 'Rowing Machines', 'Stair Climbers', 'Step Machines', 'Mini Steppers', 'Cardio Equipment Accessories'] },
  { id: 'yoga', label: 'Yoga & Pilates', icon: Heart, subs: ['Yoga Mats', 'Pilates Mats', 'Yoga Blocks', 'Yoga Straps', 'Yoga Wheels', 'Pilates Rings', 'Foam Rollers', 'Yoga Bolsters', 'Meditation Cushions', 'Yoga & Pilates Sets'] },
  { id: 'fitness_accessories', label: 'Fitness Accessories', icon: Target, subs: ['Skipping Ropes', 'Exercise Mats', 'Resistance Bands', 'Ab Rollers', 'Hand Grippers', 'Ankle Weights', 'Wrist Weights', 'Exercise Balls', 'Balance Boards', 'Agility Ladders', 'Cones', 'Parallettes'] },
  { id: 'boxing', label: 'Boxing & Martial Arts', icon: Target, subs: ['Boxing Gloves', 'MMA Gloves', 'Punching Bags', 'Speed Bags', 'Boxing Pads', 'Hand Wraps', 'Head Guards', 'Shin Guards', 'Mouth Guards', 'Kick Shields', 'Martial Arts Uniforms', 'Training Equipment'] },
  { id: 'football', label: 'Football & Soccer', icon: Target, subs: ['Footballs', 'Football Boots', 'Goalkeeper Gloves', 'Shin Guards', 'Football Jerseys', 'Football Shorts', 'Training Bibs', 'Goals', 'Nets', 'Training Cones', 'Football Accessories'] },
  { id: 'basketball', label: 'Basketball', icon: Target, subs: ['Basketballs', 'Basketball Hoops', 'Basketball Nets', 'Backboards', 'Basketball Shoes', 'Basketball Jerseys', 'Basketball Shorts', 'Training Equipment', 'Basketball Accessories'] },
  { id: 'tennis', label: 'Tennis', icon: Target, subs: ['Tennis Rackets', 'Tennis Balls', 'Tennis Nets', 'Tennis Bags', 'Tennis Shoes', 'Tennis Clothing', 'Grip Tape', 'Racket Accessories'] },
  { id: 'badminton', label: 'Badminton', icon: Target, subs: ['Badminton Rackets', 'Shuttlecocks', 'Badminton Nets', 'Badminton Shoes', 'Badminton Bags', 'Grip Tape', 'Badminton Accessories'] },
  { id: 'volleyball', label: 'Volleyball', icon: Target, subs: ['Volleyballs', 'Volleyball Nets', 'Volleyball Shoes', 'Volleyball Jerseys', 'Knee Pads', 'Volleyball Accessories'] },
  { id: 'cricket', label: 'Cricket', icon: Target, subs: ['Cricket Bats', 'Cricket Balls', 'Cricket Gloves', 'Cricket Helmets', 'Cricket Pads', 'Cricket Wickets', 'Cricket Bags', 'Cricket Clothing'] },
  { id: 'table_tennis', label: 'Table Tennis', icon: Target, subs: ['Table Tennis Tables', 'Table Tennis Paddles', 'Table Tennis Balls', 'Table Tennis Nets', 'Table Tennis Accessories'] },
  { id: 'swimming', label: 'Swimming & Water Sports', icon: Droplet, subs: ['Swimwear', 'Swimming Goggles', 'Swim Caps', 'Kickboards', 'Pull Buoys', 'Swimming Fins', 'Swimming Equipment', 'Water Sports Accessories'] },
  { id: 'cycling', label: 'Cycling', icon: Bike, subs: ['Bicycles', 'Mountain Bikes', 'Road Bikes', 'BMX Bikes', 'Electric Bikes', 'Cycling Helmets', 'Cycling Gloves', 'Cycling Jerseys', 'Cycling Shoes', 'Bike Locks', 'Bike Pumps', 'Bike Lights', 'Cycling Accessories'] },
  { id: 'skating', label: 'Skating & Skateboarding', icon: Target, subs: ['Skateboards', 'Longboards', 'Roller Skates', 'Inline Skates', 'Protective Pads', 'Helmets', 'Skate Accessories'] },
  { id: 'outdoor', label: 'Outdoor & Adventure Sports', icon: Map, subs: ['Camping Fitness Equipment', 'Hiking Accessories', 'Trekking Poles', 'Climbing Equipment', 'Outdoor Training Equipment', 'Adventure Accessories', 'Sports Backpacks', 'Hydration Packs'] },
  { id: 'running', label: 'Running & Athletics', icon: Target, subs: ['Running Shoes', 'Running Clothing', 'Running Shorts', 'Running Tops', 'Compression Wear', 'Running Belts', 'Hydration Belts', 'Race Accessories', 'Athletics Equipment'] },
  { id: 'clothing', label: 'Sports Clothing & Protective Gear', icon: Shirt, subs: ['Sports Jerseys', 'Sports Shorts', 'Sports Leggings', 'Sports Bras', 'Compression Wear', 'Sports Socks', 'Training Gloves', 'Knee Supports', 'Elbow Supports', 'Ankle Supports', 'Wrist Supports', 'Sports Protective Gear'] },
  { id: 'training', label: 'Sports Training Equipment', icon: Flag, subs: ['Training Cones', 'Agility Ladders', 'Training Hurdles', 'Speed Parachutes', 'Resistance Sleds', 'Reaction Training Equipment', 'Coaching Boards', 'Training Equipment Sets'] },
  { id: 'recovery', label: 'Recovery & Mobility', icon: Activity, subs: ['Foam Rollers', 'Massage Balls', 'Stretching Straps', 'Recovery Boots', 'Ice Packs', 'Hot/Cold Packs', 'Mobility Tools', 'Recovery Accessories'] },
  { id: 'awards', label: 'Sports Trophies & Awards', icon: Trophy, subs: ['Trophies', 'Medals', 'Plaques', 'Award Cups', 'Sports Certificates', 'Award Accessories'] },
  { id: 'bags', label: 'Sports Bags & Storage', icon: Briefcase, subs: ['Gym Bags', 'Sports Backpacks', 'Football Bags', 'Racket Bags', 'Equipment Bags', 'Ball Bags', 'Sports Storage Racks'] },
  { id: 'facilities', label: 'Sports Facilities & Equipment', icon: Flag, subs: ['Sports Goals', 'Nets', 'Benches', 'Scoreboards', 'Training Equipment', 'Field Marking Equipment', 'Sports Facility Accessories'] },
  { id: 'sets', label: 'Sports & Fitness Sets', icon: Gift, subs: ['Home Gym Sets', 'Dumbbell Sets', 'Yoga Sets', 'Boxing Sets', 'Football Training Sets', 'Fitness Starter Kits', 'Sports Gift Sets'] },
  { id: 'other', label: 'Other Sports & Fitness Products', icon: MoreHorizontal, subs: ['Miscellaneous Sports Equipment', 'Miscellaneous Fitness Equipment', 'Other Sports Accessories'] }
]

const COMMON_OPTION_TYPES = ['Size', 'Color', 'Weight', 'Material', 'Style', 'Fit']

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
      img.onerror = (e) => reject(e)
    }
    reader.onerror = (e) => reject(e)
  })
}

export default function SportsProductBuilder({ productType }: { productType: string | null }) {
  const [currentStep, setCurrentStep] = useState(0)
  
  const [category, setCategory] = useState('')
  const [subCategory, setSubCategory] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [attributes, setAttributes] = useState<Record<string, string>>({})
  
  const [hasOptions, setHasOptions] = useState<boolean | null>(null)
  
  const [optionsDef, setOptionsDef] = useState<{name: string, values: string[]}[]>([
    { name: 'Shade', values: [] }
  ])
  const [customValueInputs, setCustomValueInputs] = useState<Record<number, string>>({})
  
  const [basePrice, setBasePrice] = useState('')
  const [baseStock, setBaseStock] = useState('')
  const [variants, setVariants] = useState<any[]>([])

  

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [state, formAction, isPending] = useActionState(createSportsProductAction, null)
  const [isCompressing, setIsCompressing] = useState(false)
  const isLoading = isPending || isCompressing
  // ── Auto-save draft to localStorage ──
  const draftState = { currentStep, category, subCategory, name, description, attributes, hasOptions, optionsDef, customValueInputs, basePrice, baseStock, variants }
  const { clearDraft } = useDraftAutoSave('sports', draftState, (data) => {
    if (data.currentStep !== undefined) setCurrentStep(data.currentStep)
    if (data.category !== undefined) setCategory(data.category)
    if (data.subCategory !== undefined) setSubCategory(data.subCategory)
    if (data.name !== undefined) setName(data.name)
    if (data.description !== undefined) setDescription(data.description)
    if (data.attributes !== undefined) setAttributes(data.attributes)
    if (data.hasOptions !== undefined) setHasOptions(data.hasOptions)
    if (data.optionsDef !== undefined) setOptionsDef(data.optionsDef)
    if (data.customValueInputs !== undefined) setCustomValueInputs(data.customValueInputs)
    if (data.basePrice !== undefined) setBasePrice(data.basePrice)
    if (data.baseStock !== undefined) setBaseStock(data.baseStock)
    if (data.variants !== undefined) setVariants(data.variants)
  })

  


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

  const handleAddOptionAxis = () => {
    if (optionsDef.length < 3) {
      setOptionsDef([...optionsDef, { name: 'Volume', values: [] }])
    }
  }

  const handleRemoveOptionAxis = (idx: number) => {
    setOptionsDef(optionsDef.filter((_, i) => i !== idx))
  }

  const handleUpdateOptionName = (idx: number, name: string) => {
    const newDef = [...optionsDef]
    newDef[idx].name = name
    setOptionsDef(newDef)
  }

  const handleAddOptionValue = (idx: number) => {
    const val = customValueInputs[idx]?.trim()
    if (val && !optionsDef[idx].values.includes(val)) {
      const newDef = [...optionsDef]
      newDef[idx].values.push(val)
      setOptionsDef(newDef)
      setCustomValueInputs({ ...customValueInputs, [idx]: '' })
    }
  }

  const handleRemoveOptionValue = (idx: number, val: string) => {
    const newDef = [...optionsDef]
    newDef[idx].values = newDef[idx].values.filter(v => v !== val)
    setOptionsDef(newDef)
  }

  const generateVariants = () => {
    const validAxes = optionsDef.filter(o => o.name && o.values.length > 0)
    if (validAxes.length === 0) {
      setVariants([])
      return
    }

    const cartesian = (arrays: any[][]) => {
      return arrays.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())))
    }

    let permutations = []
    if (validAxes.length === 1) {
      permutations = validAxes[0].values.map(v => [v])
    } else {
      permutations = cartesian(validAxes.map(a => a.values))
    }

    const newVariants = permutations.map(combo => {
      const comboArr = Array.isArray(combo) ? combo : [combo]
      const title = comboArr.join(' / ')
      const optionsObj: Record<string, string> = {}
      validAxes.forEach((axis, i) => {
        optionsObj[axis.name] = comboArr[i]
      })
      return {
        title,
        options: optionsObj,
        price: basePrice,
        stock: baseStock,
        sku: ''
      }
    })
    setVariants(newVariants)
  }

  const activeCategory = SPORTS_CATEGORIES.find(c => c.id === category)

  const renderDynamicSpecs = () => {
    const lowerSub = subCategory.toLowerCase()

    if (lowerSub.includes('weight') || lowerSub.includes('dumbbell') || lowerSub.includes('barbell') || lowerSub.includes('kettlebell')) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1">Weight</label><input type="text" value={attributes.Weight || ''} onChange={e => handleAttributeChange('Weight', e.target.value)} placeholder="e.g. 5kg, 10lb, 20kg Pair" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Material / Finish</label><input type="text" value={attributes.Material || ''} onChange={e => handleAttributeChange('Material', e.target.value)} placeholder="e.g. Cast Iron, Neoprene, Rubber Coated" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Color (Optional)</label><input type="text" value={attributes.Color || ''} onChange={e => handleAttributeChange('Color', e.target.value)} className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Brand</label><input type="text" value={attributes.Brand || ''} onChange={e => handleAttributeChange('Brand', e.target.value)} className="w-full border rounded-md px-3 py-2" /></div>
        </div>
      )
    }

    if (lowerSub.includes('clothing') || lowerSub.includes('shirt') || lowerSub.includes('short') || lowerSub.includes('jersey') || lowerSub.includes('legging') || lowerSub.includes('shoe') || lowerSub.includes('boot')) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1">Size / Fit</label><input type="text" value={attributes.Size || ''} onChange={e => handleAttributeChange('Size', e.target.value)} placeholder="e.g. S, M, L, XL, UK 9, US 10" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Gender / Target</label>
            <select value={attributes.Gender || ''} onChange={e => handleAttributeChange('Gender', e.target.value)} className="w-full border rounded-md px-3 py-2 bg-white">
              <option value="">Select...</option>
              <option value="Men">Men</option>
              <option value="Women">Women</option>
              <option value="Unisex">Unisex</option>
              <option value="Kids / Youth">Kids / Youth</option>
            </select>
          </div>
          <div><label className="block text-sm font-medium mb-1">Color</label><input type="text" value={attributes.Color || ''} onChange={e => handleAttributeChange('Color', e.target.value)} className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Brand</label><input type="text" value={attributes.Brand || ''} onChange={e => handleAttributeChange('Brand', e.target.value)} className="w-full border rounded-md px-3 py-2" /></div>
        </div>
      )
    }

    if (lowerSub.includes('machine') || lowerSub.includes('treadmill') || lowerSub.includes('bike') || lowerSub.includes('rack') || lowerSub.includes('bench')) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1">Max User Weight / Capacity</label><input type="text" value={attributes.Capacity || ''} onChange={e => handleAttributeChange('Capacity', e.target.value)} placeholder="e.g. 150kg, 300lbs" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Dimensions (L x W x H)</label><input type="text" value={attributes.Dimensions || ''} onChange={e => handleAttributeChange('Dimensions', e.target.value)} placeholder="e.g. 180 x 80 x 120 cm" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Power Source / Specs (If applicable)</label><input type="text" value={attributes.Specs || ''} onChange={e => handleAttributeChange('Specs', e.target.value)} placeholder="e.g. 2.5 HP Motor, Magnetic Resistance" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Brand</label><input type="text" value={attributes.Brand || ''} onChange={e => handleAttributeChange('Brand', e.target.value)} className="w-full border rounded-md px-3 py-2" /></div>
        </div>
      )
    }

    if (lowerSub.includes('ball') && !lowerSub.includes('massage')) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1">Size / Number</label><input type="text" value={attributes.Size || ''} onChange={e => handleAttributeChange('Size', e.target.value)} placeholder="e.g. Size 5, Size 7" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Material</label><input type="text" value={attributes.Material || ''} onChange={e => handleAttributeChange('Material', e.target.value)} placeholder="e.g. PU Leather, Rubber, Synthetic" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Color / Design</label><input type="text" value={attributes.Color || ''} onChange={e => handleAttributeChange('Color', e.target.value)} className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Brand</label><input type="text" value={attributes.Brand || ''} onChange={e => handleAttributeChange('Brand', e.target.value)} className="w-full border rounded-md px-3 py-2" /></div>
        </div>
      )
    }

    if (lowerSub.includes('racket') || lowerSub.includes('bat') || lowerSub.includes('paddle') || lowerSub.includes('glove')) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1">Size / Weight / Grip</label><input type="text" value={attributes.Size || ''} onChange={e => handleAttributeChange('Size', e.target.value)} placeholder="e.g. 300g, Grip Size 3, 12oz, XL" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Material</label><input type="text" value={attributes.Material || ''} onChange={e => handleAttributeChange('Material', e.target.value)} placeholder="e.g. Graphite, Carbon Fiber, Leather" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Player Level / Style</label><input type="text" value={attributes.Style || ''} onChange={e => handleAttributeChange('Style', e.target.value)} placeholder="e.g. Professional, Beginner, Power" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Brand</label><input type="text" value={attributes.Brand || ''} onChange={e => handleAttributeChange('Brand', e.target.value)} className="w-full border rounded-md px-3 py-2" /></div>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label className="block text-sm font-medium mb-1">Brand</label><input type="text" value={attributes.Brand || ''} onChange={e => handleAttributeChange('Brand', e.target.value)} className="w-full border rounded-md px-3 py-2" /></div>
        <div><label className="block text-sm font-medium mb-1">Size / Dimensions</label><input type="text" value={attributes.Size || ''} onChange={e => handleAttributeChange('Size', e.target.value)} className="w-full border rounded-md px-3 py-2" /></div>
        <div><label className="block text-sm font-medium mb-1">Color / Design</label><input type="text" value={attributes.Color || ''} onChange={e => handleAttributeChange('Color', e.target.value)} className="w-full border rounded-md px-3 py-2" /></div>
        <div><label className="block text-sm font-medium mb-1">Material / Other Details</label><input type="text" value={attributes.Details || ''} onChange={e => handleAttributeChange('Details', e.target.value)} className="w-full border rounded-md px-3 py-2" /></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/products" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Add Sports & Fitness</h1>
      </div>

      <div className="flex justify-between mb-8 overflow-x-auto pb-4 hide-scrollbar">
        {STEPS.map((step, idx) => (
          <div key={step.id} className="flex flex-col items-center min-w-[100px] opacity-100">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold mb-2 transition-colors ${idx === currentStep ? 'bg-black text-white' : idx < currentStep ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
              {idx < currentStep ? <Check className="h-5 w-5" /> : idx + 1}
            </div>
            <span className={`text-xs font-medium text-center ${idx === currentStep ? 'text-black' : 'text-gray-400'}`}>{step.label}</span>
          </div>
        ))}
      </div>

      {state?.error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 font-medium">{state.error}</div>}

      <form action={async (formData) => {
        setIsCompressing(true)
        try {
          const compressedFormData = new FormData()
          for (const [key, value] of formData.entries()) {
            if (key !== 'photos') compressedFormData.append(key, value)
          }
          for (const file of photos) {
            try {
              const compressed = await compressImage(file)
              compressedFormData.append('photos', compressed)
            } catch (e) {
              compressedFormData.append('photos', file) 
            }
          }
          clearDraft()
          formAction(compressedFormData)
        } finally { setIsCompressing(false) }
      }}>
        <input type="hidden" name="subCategory" value={subCategory} />
        <input type="hidden" name="brand" value={attributes.Brand || ''} />
        <input type="hidden" name="condition" value={attributes.Condition || ''} />
        <input type="hidden" name="attributesJson" value={JSON.stringify(attributes)} />
        <input type="hidden" name="hasOptions" value={hasOptions ? 'true' : 'false'} />
        <input type="hidden" name="optionsDef" value={JSON.stringify(optionsDef)} />
        <input type="hidden" name="variantsJson" value={JSON.stringify(variants)} />

        {/* STEP 0: TYPE */}
        <div className={currentStep === 0 ? 'block animate-in fade-in' : 'hidden'}>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-6">What are you selling?</h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {SPORTS_CATEGORIES.map((cat) => (
                <button
                  key={cat.id} type="button"
                  onClick={() => { setCategory(cat.id); setSubCategory('') }}
                  className={`flex flex-col items-center justify-center p-4 sm:p-6 border-2 rounded-xl transition-all ${category === cat.id ? 'border-black bg-gray-50' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  <cat.icon className={`h-8 w-8 mb-3 ${category === cat.id ? 'text-black' : 'text-gray-400'}`} />
                  <span className="font-medium text-xs sm:text-sm text-center leading-tight">{cat.label}</span>
                </button>
              ))}
            </div>

            {activeCategory && (
              <div className="animate-in slide-in-from-top-4">
                <h3 className="font-semibold mb-4 border-t pt-6">Select specific item for {activeCategory.label}</h3>
                <div className="flex flex-wrap gap-3">
                  {activeCategory.subs.map(sub => (
                    <button
                      key={sub} type="button" onClick={() => setSubCategory(sub)}
                      className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${subCategory === sub ? 'bg-black text-white border-black' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="mt-10 flex justify-end">
              <button type="button" disabled={!subCategory} onClick={handleNext} className="bg-black text-white px-8 py-3 rounded-xl font-bold disabled:opacity-50 flex items-center">
                Next <ArrowLeft className="ml-2 h-5 w-5 rotate-180" />
              </button>
            </div>
          </div>
        </div>

        {/* STEP 1: PHOTOS */}
        <div className={currentStep === 1 ? 'block animate-in fade-in' : 'hidden'}>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-2">Upload Product Photos</h2>
            <p className="text-gray-500 mb-6">Upload up to 5 clear photos of the {subCategory}. Clear, bright pictures sell faster!</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {photos.map((file, idx) => (
                <div key={idx} className="relative aspect-square bg-gray-50 rounded-xl overflow-hidden border">
                  <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="Preview" />
                  <button type="button" onClick={() => setPhotos(p => p.filter((_, i) => i !== idx))} className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full text-red-600 hover:bg-white shadow-sm"><X className="h-4 w-4" /></button>
                </div>
              ))}
              {photos.length < 5 && (
                <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-gray-400 transition-colors">
                  <Upload className="h-8 w-8 mb-2" /><span className="font-medium">Upload</span><span className="text-xs mt-1 text-gray-400">{5 - photos.length} remaining</span>
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
            <h2 className="text-xl font-bold mb-6">{subCategory} Details</h2>
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 mb-8">
              {renderDynamicSpecs()}
            </div>
            <div className="flex justify-between">
              <button type="button" onClick={handleBack} className="px-8 py-3 border rounded-xl font-medium text-gray-700 hover:bg-gray-50">Back</button>
              <button type="button" onClick={handleNext} className="bg-black text-white px-8 py-3 rounded-xl font-bold">Next Step</button>
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
                <input type="text" name="name" value={name} onChange={e => setName(e.target.value)} placeholder={`e.g. Premium ${subCategory}`} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none" required />
              </div>
              <div>
                <label className="block font-medium text-gray-900 mb-1">Description</label>
                <textarea name="description" value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Describe the item, ingredients, benefits, or usage instructions..." className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none" required />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block font-medium text-gray-900 mb-1">Price (₦)</label>
                  <input type="number" name="price" value={basePrice} onChange={e => setBasePrice(e.target.value)} placeholder="0.00" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none" required={!hasOptions} />
                </div>
                <div>
                  <label className="block font-medium text-gray-900 mb-1">Stock Available</label>
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

        {/* STEP 4: GENERIC OPTIONS */}
        <div className={currentStep === 4 ? 'block animate-in fade-in' : 'hidden'}>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-2">Product Options & Variants</h2>
            <p className="text-gray-500 mb-6">Does this come in different shades, volumes (e.g. 30ml, 50ml), lengths (e.g. 18", 20"), or textures?</p>

            <div className="flex gap-4 mb-8">
              <button type="button" onClick={() => setHasOptions(false)} className={`flex-1 py-4 border-2 rounded-xl font-bold transition-all ${hasOptions === false ? 'border-black bg-gray-50 ring-2 ring-black ring-opacity-20' : 'border-gray-200 hover:border-gray-300'}`}>No, it's just one item</button>
              <button type="button" onClick={() => setHasOptions(true)} className={`flex-1 py-4 border-2 rounded-xl font-bold transition-all ${hasOptions === true ? 'border-black bg-gray-50 ring-2 ring-black ring-opacity-20' : 'border-gray-200 hover:border-gray-300'}`}>Yes, add variants</button>
            </div>

            {hasOptions && (
              <div className="space-y-6 mb-8 border-t pt-6 animate-in fade-in">
                {optionsDef.map((opt, idx) => (
                  <div key={idx} className="bg-gray-50 p-6 rounded-xl border relative">
                    {optionsDef.length > 1 && (
                      <button type="button" onClick={() => handleRemoveOptionAxis(idx)} className="absolute top-4 right-4 text-red-500 hover:bg-red-50 p-1.5 rounded-md"><Trash2 className="w-5 h-5" /></button>
                    )}
                    <label className="block font-medium mb-3">Option {idx + 1} Name</label>
                    <div className="flex gap-3 mb-4">
                      <select value={COMMON_OPTION_TYPES.includes(opt.name) ? opt.name : 'Custom'} onChange={e => {
                        if (e.target.value !== 'Custom') handleUpdateOptionName(idx, e.target.value)
                      }} className="border rounded-lg px-3 py-2 bg-white flex-1">
                        {COMMON_OPTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        <option value="Custom">Custom Name...</option>
                      </select>
                      {!COMMON_OPTION_TYPES.includes(opt.name) && (
                        <input type="text" value={opt.name} onChange={e => handleUpdateOptionName(idx, e.target.value)} className="border rounded-lg px-3 py-2 flex-1" placeholder="e.g. Hair Density" />
                      )}
                    </div>
                    
                    <label className="block font-medium text-sm text-gray-500 mb-2">Values for {opt.name}</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {opt.values.map(val => (
                        <span key={val} className="bg-black text-white px-3 py-1.5 rounded-full text-sm flex items-center">{val} <button type="button" onClick={() => handleRemoveOptionValue(idx, val)} className="ml-2 hover:text-gray-300"><X className="h-3 w-3" /></button></span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input type="text" value={customValueInputs[idx] || ''} onChange={e => setCustomValueInputs({...customValueInputs, [idx]: e.target.value})} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddOptionValue(idx) } }} placeholder={`Add ${opt.name} (e.g. Caramel, 30ml, 18")...`} className="border rounded-lg px-3 py-2 flex-1" />
                      <button type="button" onClick={() => handleAddOptionValue(idx)} className="bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800">Add</button>
                    </div>
                  </div>
                ))}
                
                {optionsDef.length < 3 && (
                  <button type="button" onClick={handleAddOptionAxis} className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 font-medium hover:border-gray-400 hover:bg-gray-50 flex items-center justify-center gap-2">
                    <PlusCircle className="w-5 h-5" /> Add Another Option (e.g. Volume)
                  </button>
                )}
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

              <div className="bg-gray-50 p-4 rounded-xl mb-6 flex gap-4 items-end flex-wrap">
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Apply Price to All</label>
                  <input type="number" value={basePrice} onChange={e => setBasePrice(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Price" />
                </div>
                <button type="button" onClick={() => { const v = [...variants]; v.forEach(va => va.price = basePrice); setVariants(v) }} className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium">Apply</button>
                
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Apply Stock to All</label>
                  <input type="number" value={baseStock} onChange={e => setBaseStock(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Stock" />
                </div>
                <button type="button" onClick={() => { const v = [...variants]; v.forEach(va => va.stock = baseStock); setVariants(v) }} className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium">Apply</button>
              </div>

              <div className="space-y-3 mb-8 max-h-[400px] overflow-y-auto pr-2">
                {variants.map((v, i) => (
                  <div key={i} className="flex items-center gap-4 bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                    <div className="font-bold w-1/3 truncate">{v.title}</div>
                    <div className="flex-1 relative">
                      <span className="absolute left-3 top-2.5 text-gray-400">₦</span>
                      <input type="number" value={v.price} onChange={e => { const newV = [...variants]; newV[i].price = e.target.value; setVariants(newV) }} className="w-full border rounded-lg pl-8 pr-3 py-2" placeholder="Price" />
                    </div>
                    <div className="w-24">
                      <input type="number" value={v.stock} onChange={e => { const newV = [...variants]; newV[i].stock = e.target.value; setVariants(newV) }} className="w-full border rounded-lg px-3 py-2" placeholder="Stock" />
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
              <div className="text-gray-500 text-sm mb-4">{attributes.Brand && `${attributes.Brand} • `}{attributes.Type || subCategory}</div>
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

