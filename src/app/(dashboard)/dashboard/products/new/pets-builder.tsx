'use client'

import { useState, useActionState, useRef } from 'react'
import { useDraftAutoSave } from '../hooks/useDraftAutoSave'
import { ArrowLeft, Check, Upload, X, Loader2, PlusCircle, Trash2, Dog, Cat, Bird, Fish, Rabbit, Bone, Home, Link as LinkIcon, Gamepad2, Scissors, Package, Droplet, Activity, Car, Shirt, Shield, Leaf, Heart, Gift, Box, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { createPetsProductAction } from '../actions'

const STEPS = [
  { id: 'type', label: 'Pets Category' },
  { id: 'photos', label: 'Photos' },
  { id: 'specs', label: 'Details' },
  { id: 'basic', label: 'Basic Info' },
  { id: 'options', label: 'Options' },
  { id: 'variants', label: 'Variants' },
  { id: 'review', label: 'Review' },
]

const PETS_CATEGORIES = [
  { id: 'dog', label: 'Dog Supplies', icon: Dog, subs: ['Dog Food', 'Dog Treats', 'Dog Bowls', 'Dog Feeders', 'Dog Collars', 'Dog Leashes', 'Dog Harnesses', 'Dog Beds', 'Dog Blankets', 'Dog Crates', 'Dog Kennels', 'Dog Toys', 'Dog Grooming Supplies', 'Dog Waste Bags', 'Dog Training Supplies', 'Dog Clothing', 'Dog Accessories', 'Other Dog Supplies'] },
  { id: 'cat', label: 'Cat Supplies', icon: Cat, subs: ['Cat Food', 'Cat Treats', 'Cat Bowls', 'Cat Feeders', 'Cat Collars', 'Cat Harnesses', 'Cat Leashes', 'Cat Beds', 'Cat Toys', 'Cat Trees', 'Cat Scratching Posts', 'Cat Litter', 'Litter Boxes', 'Cat Carriers', 'Cat Grooming Supplies', 'Cat Accessories', 'Other Cat Supplies'] },
  { id: 'bird', label: 'Bird Supplies', icon: Bird, subs: ['Bird Food', 'Bird Treats', 'Bird Cages', 'Bird Perches', 'Bird Feeders', 'Bird Waterers', 'Bird Toys', 'Bird Baths', 'Bird Nesting Supplies', 'Bird Accessories', 'Other Bird Supplies'] },
  { id: 'fish', label: 'Fish & Aquarium Supplies', icon: Fish, subs: ['Fish Food', 'Aquariums', 'Fish Tanks', 'Aquarium Filters', 'Aquarium Pumps', 'Aquarium Lights', 'Aquarium Heaters', 'Aquarium Decorations', 'Aquarium Plants', 'Gravel & Substrate', 'Water Conditioners', 'Fish Nets', 'Aquarium Cleaning Supplies', 'Aquarium Accessories', 'Other Aquarium Supplies'] },
  { id: 'small_pet', label: 'Small Pet Supplies', icon: Rabbit, subs: ['Hamster Food', 'Rabbit Food', 'Guinea Pig Food', 'Small Pet Cages', 'Small Pet Beds', 'Small Pet Toys', 'Small Pet Feeders', 'Hay & Bedding', 'Exercise Wheels', 'Small Pet Accessories', 'Other Small Pet Supplies'] },
  { id: 'food', label: 'Pet Food', icon: Box, subs: ['Dry Dog Food', 'Wet Dog Food', 'Dry Cat Food', 'Wet Cat Food', 'Puppy Food', 'Kitten Food', 'Senior Pet Food', 'Bird Food', 'Fish Food', 'Rabbit Food', 'Guinea Pig Food', 'Specialty Pet Food', 'Pet Food Bundles', 'Other Pet Food'] },
  { id: 'treats', label: 'Pet Treats & Chews', icon: Bone, subs: ['Dog Treats', 'Cat Treats', 'Training Treats', 'Dental Treats', 'Chew Bones', 'Natural Chews', 'Freeze-Dried Treats', 'Biscuits', 'Treat Sticks', 'Treat Packs', 'Other Pet Treats'] },
  { id: 'beds', label: 'Pet Beds & Furniture', icon: Home, subs: ['Dog Beds', 'Cat Beds', 'Pet Mats', 'Pet Blankets', 'Pet Sofas', 'Cat Trees', 'Cat Towers', 'Cat Hammocks', 'Pet Houses', 'Pet Kennels', 'Pet Furniture', 'Other Pet Furniture'] },
  { id: 'collars', label: 'Collars, Leashes & Harnesses', icon: LinkIcon, subs: ['Dog Collars', 'Cat Collars', 'Puppy Collars', 'Training Collars', 'Dog Leashes', 'Retractable Leashes', 'Dog Harnesses', 'Cat Harnesses', 'Lead Sets', 'Collar & Leash Sets', 'Personalized Collars', 'Other Walking Accessories'] },
  { id: 'toys', label: 'Pet Toys', icon: Gamepad2, subs: ['Balls', 'Chew Toys', 'Rope Toys', 'Plush Toys', 'Squeaky Toys', 'Interactive Toys', 'Puzzle Toys', 'Fetch Toys', 'Cat Teasers', 'Catnip Toys', 'Automatic Toys', 'Toy Sets', 'Other Pet Toys'] },
  { id: 'grooming', label: 'Pet Grooming & Hygiene', icon: Scissors, subs: ['Pet Shampoo', 'Pet Conditioner', 'Grooming Brushes', 'Combs', 'Nail Clippers', 'Pet Towels', 'Grooming Gloves', 'Grooming Kits', 'Ear Cleaning Supplies', 'Dental Care Supplies', 'Pet Wipes', 'Other Grooming Supplies'] },
  { id: 'toilet', label: 'Pet Toilet & Waste Supplies', icon: Trash2, subs: ['Cat Litter', 'Litter Boxes', 'Litter Mats', 'Litter Scoops', 'Dog Waste Bags', 'Waste Bag Dispensers', 'Puppy Training Pads', 'Pet Toilet Trays', 'Waste Disposal Accessories', 'Other Toilet Supplies'] },
  { id: 'cages', label: 'Pet Cages, Crates & Carriers', icon: Package, subs: ['Dog Crates', 'Cat Carriers', 'Bird Cages', 'Small Pet Cages', 'Travel Carriers', 'Pet Playpens', 'Portable Kennels', 'Pet Travel Bags', 'Cage Accessories', 'Other Pet Housing'] },
  { id: 'feeding', label: 'Pet Feeding Supplies', icon: Droplet, subs: ['Food Bowls', 'Water Bowls', 'Automatic Feeders', 'Automatic Waterers', 'Slow Feed Bowls', 'Raised Feeders', 'Travel Bowls', 'Feeding Mats', 'Food Storage Containers', 'Pet Water Bottles', 'Feeding Sets', 'Other Feeding Supplies'] },
  { id: 'training', label: 'Pet Training Supplies', icon: Activity, subs: ['Training Pads', 'Clickers', 'Training Treat Bags', 'Training Whistles', 'Training Leads', 'Training Toys', 'Agility Equipment', 'Pet Gates', 'Training Accessories', 'Other Training Supplies'] },
  { id: 'travel', label: 'Pet Travel & Outdoor', icon: Car, subs: ['Pet Carriers', 'Travel Bags', 'Car Seat Covers', 'Pet Seat Belts', 'Portable Bowls', 'Travel Water Bottles', 'Pet Backpacks', 'Outdoor Leashes', 'Reflective Accessories', 'Pet Strollers', 'Other Travel Supplies'] },
  { id: 'clothing', label: 'Pet Clothing & Accessories', icon: Shirt, subs: ['Dog Shirts', 'Dog Dresses', 'Dog Sweaters', 'Dog Jackets', 'Pet Raincoats', 'Pet Costumes', 'Pet Shoes', 'Pet Bandanas', 'Pet Bow Ties', 'Pet Accessories', 'Other Pet Clothing'] },
  { id: 'safety', label: 'Pet Safety & Home Accessories', icon: Shield, subs: ['Pet Gates', 'Pet Door', 'Safety Harnesses', 'Reflective Collars', 'ID Tags', 'Pet Cameras', 'Pet Monitoring Accessories', 'Furniture Protectors', 'Cable Protectors', 'Pet-Proofing Accessories', 'Other Safety Products'] },
  { id: 'aquarium', label: 'Aquarium & Habitat Decor', icon: Leaf, subs: ['Aquarium Plants', 'Artificial Plants', 'Aquarium Rocks', 'Aquarium Caves', 'Aquarium Ornaments', 'Driftwood', 'Tank Backgrounds', 'Reptile Habitat Decor', 'Habitat Accessories', 'Other Habitat Decor'] },
  { id: 'care', label: 'Pet Care Products', icon: Heart, subs: ['Pet Dental Care', 'Skin & Coat Care', 'Paw Care', 'Coat Care', 'Eye Care Products', 'Ear Care Products', 'Pet Cleaning Products', 'General Pet Care Supplies', 'Other Pet Care Products'] },
  { id: 'gifts', label: 'Pet Gift Sets & Bundles', icon: Gift, subs: ['Puppy Starter Kits', 'Kitten Starter Kits', 'Dog Walking Sets', 'Cat Care Sets', 'Grooming Kits', 'Feeding Sets', 'Pet Toy Bundles', 'Pet Travel Kits', 'Pet Gift Boxes', 'Other Pet Bundles'] },
  { id: 'other', label: 'Other', icon: MoreHorizontal, subs: ['Other Pet Supplies'] }
]

const COMMON_OPTION_TYPES = ['Size', 'Color', 'Flavor', 'Material', 'Weight', 'Volume', 'Breed Size']

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

export default function PetsProductBuilder({ productType }: { productType: string | null }) {
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
  const [state, formAction, isPending] = useActionState(createPetsProductAction, null)
  const [isCompressing, setIsCompressing] = useState(false)
  const isLoading = isPending || isCompressing
  // ── Auto-save draft to localStorage ──
  const draftState = { currentStep, category, subCategory, name, description, attributes, hasOptions, optionsDef, customValueInputs, basePrice, baseStock, variants }
  const { clearDraft } = useDraftAutoSave('pets', draftState, (data) => {
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

  const activeCategory = PETS_CATEGORIES.find(c => c.id === category)

  const renderDynamicSpecs = () => {
    const lowerSub = subCategory.toLowerCase()
    
    if (lowerSub.includes('food') || lowerSub.includes('treat') || lowerSub.includes('chew') || lowerSub.includes('biscuit')) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1">Flavor / Main Ingredient</label><input type="text" value={attributes.Flavor || ''} onChange={e => handleAttributeChange('Flavor', e.target.value)} placeholder="e.g. Chicken, Beef, Salmon" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Weight / Volume</label><input type="text" value={attributes.Weight || ''} onChange={e => handleAttributeChange('Weight', e.target.value)} placeholder="e.g. 5kg, 400g" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Pet Life Stage</label>
            <select value={attributes.LifeStage || ''} onChange={e => handleAttributeChange('LifeStage', e.target.value)} className="w-full border rounded-md px-3 py-2 bg-white">
              <option value="">Select...</option>
              <option value="Puppy / Kitten / Young">Puppy / Kitten / Young</option>
              <option value="Adult">Adult</option>
              <option value="Senior">Senior</option>
              <option value="All Life Stages">All Life Stages</option>
            </select>
          </div>
          <div><label className="block text-sm font-medium mb-1">Brand</label><input type="text" value={attributes.Brand || ''} onChange={e => handleAttributeChange('Brand', e.target.value)} className="w-full border rounded-md px-3 py-2" /></div>
        </div>
      )
    }

    if (lowerSub.includes('collar') || lowerSub.includes('leash') || lowerSub.includes('harness') || lowerSub.includes('clothing') || lowerSub.includes('shirt') || lowerSub.includes('sweater')) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1">Size (Neck / Chest / Back)</label><input type="text" value={attributes.Size || ''} onChange={e => handleAttributeChange('Size', e.target.value)} placeholder="e.g. S, M, L, XL or dimensions" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Color / Pattern</label><input type="text" value={attributes.Color || ''} onChange={e => handleAttributeChange('Color', e.target.value)} className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Material</label><input type="text" value={attributes.Material || ''} onChange={e => handleAttributeChange('Material', e.target.value)} placeholder="e.g. Nylon, Leather, Cotton" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Brand (Optional)</label><input type="text" value={attributes.Brand || ''} onChange={e => handleAttributeChange('Brand', e.target.value)} className="w-full border rounded-md px-3 py-2" /></div>
        </div>
      )
    }

    if (lowerSub.includes('bed') || lowerSub.includes('crate') || lowerSub.includes('carrier') || lowerSub.includes('tree') || lowerSub.includes('furniture') || lowerSub.includes('kennel') || lowerSub.includes('cage') || lowerSub.includes('aquarium') || lowerSub.includes('tank')) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1">Dimensions (L x W x H)</label><input type="text" value={attributes.Dimensions || ''} onChange={e => handleAttributeChange('Dimensions', e.target.value)} placeholder="e.g. 90 x 60 x 60 cm" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Material</label><input type="text" value={attributes.Material || ''} onChange={e => handleAttributeChange('Material', e.target.value)} placeholder="e.g. Wood, Wire, Plush" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Color</label><input type="text" value={attributes.Color || ''} onChange={e => handleAttributeChange('Color', e.target.value)} className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Brand (Optional)</label><input type="text" value={attributes.Brand || ''} onChange={e => handleAttributeChange('Brand', e.target.value)} className="w-full border rounded-md px-3 py-2" /></div>
        </div>
      )
    }

    if (lowerSub.includes('toy') || lowerSub.includes('teaser') || lowerSub.includes('ball')) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1">Material</label><input type="text" value={attributes.Material || ''} onChange={e => handleAttributeChange('Material', e.target.value)} placeholder="e.g. Rubber, Plush, Rope" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Breed Size Suitability</label>
            <select value={attributes.BreedSize || ''} onChange={e => handleAttributeChange('BreedSize', e.target.value)} className="w-full border rounded-md px-3 py-2 bg-white">
              <option value="">Select...</option>
              <option value="Small Breeds">Small Breeds</option>
              <option value="Medium Breeds">Medium Breeds</option>
              <option value="Large Breeds">Large Breeds</option>
              <option value="All Breeds">All Breeds</option>
            </select>
          </div>
          <div><label className="block text-sm font-medium mb-1">Feature</label><input type="text" value={attributes.Feature || ''} onChange={e => handleAttributeChange('Feature', e.target.value)} placeholder="e.g. Squeaky, Chew-Resistant" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Brand</label><input type="text" value={attributes.Brand || ''} onChange={e => handleAttributeChange('Brand', e.target.value)} className="w-full border rounded-md px-3 py-2" /></div>
        </div>
      )
    }

    if (lowerSub.includes('shampoo') || lowerSub.includes('conditioner') || lowerSub.includes('litter') || lowerSub.includes('pad') || lowerSub.includes('wipe') || lowerSub.includes('care') || lowerSub.includes('cleaning')) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1">Weight / Volume / Count</label><input type="text" value={attributes.Weight || ''} onChange={e => handleAttributeChange('Weight', e.target.value)} placeholder="e.g. 500ml, 10kg, 50 Pads" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Scent / Flavor</label><input type="text" value={attributes.Scent || ''} onChange={e => handleAttributeChange('Scent', e.target.value)} placeholder="e.g. Lavender, Unscented" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Target Pet</label>
            <select value={attributes.TargetPet || ''} onChange={e => handleAttributeChange('TargetPet', e.target.value)} className="w-full border rounded-md px-3 py-2 bg-white">
              <option value="">Select...</option>
              <option value="Dog">Dog</option>
              <option value="Cat">Cat</option>
              <option value="Bird">Bird</option>
              <option value="Fish">Fish</option>
              <option value="Small Pet">Small Pet</option>
              <option value="All Pets">All Pets</option>
            </select>
          </div>
          <div><label className="block text-sm font-medium mb-1">Brand</label><input type="text" value={attributes.Brand || ''} onChange={e => handleAttributeChange('Brand', e.target.value)} className="w-full border rounded-md px-3 py-2" /></div>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label className="block text-sm font-medium mb-1">Brand (Optional)</label><input type="text" value={attributes.Brand || ''} onChange={e => handleAttributeChange('Brand', e.target.value)} className="w-full border rounded-md px-3 py-2" /></div>
        <div><label className="block text-sm font-medium mb-1">Size / Weight</label><input type="text" value={attributes.Size || ''} onChange={e => handleAttributeChange('Size', e.target.value)} placeholder="e.g. Medium, 5kg" className="w-full border rounded-md px-3 py-2" /></div>
        <div><label className="block text-sm font-medium mb-1">Color / Flavor</label><input type="text" value={attributes.Color || ''} onChange={e => handleAttributeChange('Color', e.target.value)} className="w-full border rounded-md px-3 py-2" /></div>
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
        <h1 className="text-2xl font-bold tracking-tight">Add Pets & Pet Supplies</h1>
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
              {PETS_CATEGORIES.map((cat) => (
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

