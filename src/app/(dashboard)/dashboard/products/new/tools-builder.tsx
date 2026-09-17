'use client'

import { useState, useActionState, useRef } from 'react'
import { ArrowLeft, Check, Upload, X, Loader2, PlusCircle, Trash2, Hammer, Zap, Briefcase, Paperclip, Home, Lock, Droplet, Plug, Lightbulb, Building, Palette, Scissors, Car, Leaf, Ruler, Link as LinkIcon, Settings, Shield, Activity, Factory, Box, Sparkles, Wrench, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { createToolsProductAction } from '../actions'

const STEPS = [
  { id: 'type', label: 'Tools Category' },
  { id: 'photos', label: 'Photos' },
  { id: 'specs', label: 'Details' },
  { id: 'basic', label: 'Basic Info' },
  { id: 'options', label: 'Options' },
  { id: 'variants', label: 'Variants' },
  { id: 'review', label: 'Review' },
]

const TOOLS_CATEGORIES = [
  { id: 'hand_tools', label: 'Hand Tools', icon: Hammer, subs: ['Hammers', 'Screwdrivers', 'Pliers', 'Wrenches', 'Spanners', 'Adjustable Wrenches', 'Allen Keys', 'Hex Keys', 'Utility Knives', 'Chisels', 'Files', 'Hand Saws', 'Hacksaws', 'Wire Cutters', 'Bolt Cutters', 'Pry Bars', 'Tape Measures', 'Spirit Levels', 'Tool Sets', 'Other Hand Tools'] },
  { id: 'power_tools', label: 'Power Tools', icon: Zap, subs: ['Electric Drills', 'Cordless Drills', 'Impact Drills', 'Impact Drivers', 'Angle Grinders', 'Circular Saws', 'Jigsaws', 'Reciprocating Saws', 'Heat Guns', 'Sanders', 'Polishers', 'Rotary Tools', 'Planers', 'Routers', 'Demolition Hammers', 'Other Power Tools'] },
  { id: 'tool_sets', label: 'Tool Sets & Kits', icon: Briefcase, subs: ['Screwdriver Sets', 'Socket Sets', 'Wrench Sets', 'Mechanics Tool Sets', 'Drill Sets', 'DIY Tool Kits', 'Home Tool Kits', 'Professional Tool Kits', 'Electrical Tool Kits', 'Plumbing Tool Kits', 'Automotive Tool Kits', 'Multi-Tool Sets', 'Other Tool Sets'] },
  { id: 'fasteners', label: 'Fasteners', icon: Paperclip, subs: ['Screws', 'Nails', 'Bolts', 'Nuts', 'Washers', 'Anchors', 'Wall Plugs', 'Rivets', 'Threaded Rods', 'Fastener Sets', 'Other Fasteners'] },
  { id: 'door_window', label: 'Door & Window Hardware', icon: Home, subs: ['Door Handles', 'Door Locks', 'Padlocks', 'Door Hinges', 'Door Closers', 'Door Stops', 'Door Bolts', 'Cabinet Locks', 'Window Locks', 'Window Handles', 'Window Hinges', 'Latches', 'Door Accessories', 'Other Door & Window Hardware'] },
  { id: 'locks', label: 'Locks & Security Hardware', icon: Lock, subs: ['Padlocks', 'Deadbolts', 'Door Locks', 'Cabinet Locks', 'Combination Locks', 'Key Safes', 'Lock Cylinders', 'Lock Sets', 'Security Chains', 'Security Hardware', 'Other Locks & Security Products'] },
  { id: 'plumbing', label: 'Plumbing Supplies', icon: Droplet, subs: ['PVC Pipes', 'PPR Pipes', 'Pipe Fittings', 'Elbows', 'Tees', 'Couplings', 'Adapters', 'Valves', 'Taps', 'Faucets', 'Hose Connectors', 'Pipe Clamps', 'Pipe Sealants', 'Plumbing Repair Kits', 'Other Plumbing Supplies'] },
  { id: 'electrical', label: 'Electrical Hardware', icon: Plug, subs: ['Electrical Cables', 'Wires', 'Switches', 'Electrical Sockets', 'Extension Cords', 'Plugs', 'Circuit Breakers', 'Fuse Holders', 'Electrical Boxes', 'Cable Ties', 'Cable Clips', 'Conduits', 'Cable Glands', 'Terminal Blocks', 'Electrical Accessories', 'Other Electrical Hardware'] },
  { id: 'electrical_install', label: 'Electrical Installation Products', icon: Lightbulb, subs: ['Light Switches', 'Wall Sockets', 'Junction Boxes', 'Distribution Boards', 'Consumer Units', 'Cable Trunking', 'Cable Channels', 'Conduit Pipes', 'Electrical Connectors', 'Wire Connectors', 'Insulation Tape', 'Electrical Installation Kits', 'Other Installation Products'] },
  { id: 'building', label: 'Building & Construction Hardware', icon: Building, subs: ['Cement Tools', 'Trowels', 'Floats', 'Masonry Tools', 'Brick Hammers', 'Construction Levels', 'Measuring Tools', 'Tile Cutters', 'Tile Spacers', 'Tile Tools', 'Construction Fasteners', 'Building Accessories', 'Other Construction Hardware'] },
  { id: 'painting', label: 'Painting Supplies', icon: Palette, subs: ['Paint Brushes', 'Paint Rollers', 'Paint Trays', 'Paint Scrapers', 'Putty Knives', 'Paint Buckets', 'Masking Tape', 'Drop Cloths', 'Paint Mixing Tools', 'Spray Paint Accessories', 'Painting Tool Sets', 'Other Painting Supplies'] },
  { id: 'woodworking', label: 'Woodworking Tools', icon: Scissors, subs: ['Wood Saws', 'Chisels', 'Wood Planes', 'Clamps', 'Wood Files', 'Carving Tools', 'Wood Drill Bits', 'Router Bits', 'Sanding Tools', 'Measuring Tools', 'Woodworking Tool Sets', 'Other Woodworking Tools'] },
  { id: 'automotive', label: 'Automotive Tools', icon: Car, subs: ['Car Jacks', 'Jack Stands', 'Socket Sets', 'Wrench Sets', 'Torque Wrenches', 'Oil Filter Tools', 'Spark Plug Tools', 'Battery Testers', 'Tyre Pressure Gauges', 'Tyre Repair Tools', 'Mechanics Tool Sets', 'Automotive Pliers', 'Automotive Screwdrivers', 'Other Automotive Tools'] },
  { id: 'garden', label: 'Garden & Outdoor Tools', icon: Leaf, subs: ['Shovels', 'Spades', 'Hoes', 'Rakes', 'Garden Shears', 'Pruning Tools', 'Secateurs', 'Axes', 'Wheelbarrows', 'Garden Trowels', 'Garden Tool Sets', 'Hose Reels', 'Watering Tools', 'Other Garden Tools'] },
  { id: 'measuring', label: 'Measuring & Testing Tools', icon: Ruler, subs: ['Tape Measures', 'Spirit Levels', 'Laser Levels', 'Measuring Wheels', 'Calipers', 'Micrometers', 'Multimeters', 'Voltage Testers', 'Stud Finders', 'Distance Meters', 'Measuring Kits', 'Other Measuring Tools'] },
  { id: 'clamps', label: 'Clamps, Vises & Workholding', icon: LinkIcon, subs: ['C-Clamps', 'Bar Clamps', 'Pipe Clamps', 'Spring Clamps', 'Bench Vises', 'Machine Vises', 'Corner Clamps', 'Quick-Grip Clamps', 'Clamp Sets', 'Other Workholding Tools'] },
  { id: 'drill_bits', label: 'Drill Bits & Cutting Accessories', icon: Settings, subs: ['Drill Bits', 'Masonry Drill Bits', 'Wood Drill Bits', 'Metal Drill Bits', 'Hole Saws', 'Saw Blades', 'Grinding Discs', 'Cutting Discs', 'Sanding Discs', 'Router Bits', 'Tool Blades', 'Bit Sets', 'Other Cutting Accessories'] },
  { id: 'workwear', label: 'Workwear & Safety Equipment', icon: Shield, subs: ['Work Gloves', 'Safety Goggles', 'Safety Glasses', 'Ear Protection', 'Dust Masks', 'Respirators', 'Safety Helmets', 'Reflective Vests', 'Knee Pads', 'Work Aprons', 'Protective Clothing', 'Safety Equipment Sets', 'Other Safety Equipment'] },
  { id: 'ladders', label: 'Ladders & Access Equipment', icon: Activity, subs: ['Step Ladders', 'Extension Ladders', 'Folding Ladders', 'Platform Ladders', 'Work Platforms', 'Ladder Accessories', 'Other Access Equipment'] },
  { id: 'workshop', label: 'Workshop Equipment', icon: Factory, subs: ['Workbenches', 'Tool Cabinets', 'Tool Chests', 'Workshop Shelving', 'Parts Organizers', 'Workshop Lights', 'Work Tables', 'Tool Storage Systems', 'Workshop Accessories', 'Other Workshop Equipment'] },
  { id: 'storage', label: 'Tool Storage & Organization', icon: Box, subs: ['Tool Boxes', 'Tool Bags', 'Tool Chests', 'Tool Cabinets', 'Parts Boxes', 'Organizer Cases', 'Storage Bins', 'Wall Tool Racks', 'Tool Belts', 'Tool Holders', 'Other Tool Storage'] },
  { id: 'adhesives', label: 'Adhesives, Sealants & Tapes', icon: Droplet, subs: ['Super Glue', 'Construction Adhesive', 'Epoxy', 'Silicone Sealant', 'Threadlocker', 'PVC Cement', 'Double-Sided Tape', 'Duct Tape', 'Electrical Tape', 'Masking Tape', 'Thread Seal Tape', 'Adhesive Sets', 'Other Adhesives & Sealants'] },
  { id: 'abrasives', label: 'Abrasives & Finishing Supplies', icon: Sparkles, subs: ['Sandpaper', 'Sanding Sponges', 'Grinding Wheels', 'Polishing Pads', 'Wire Brushes', 'Buffing Wheels', 'Abrasive Discs', 'Polishing Compounds', 'Abrasive Sets', 'Other Abrasives'] },
  { id: 'replacement', label: 'Replacement Parts & Hardware Accessories', icon: Wrench, subs: ['Drill Chucks', 'Tool Batteries', 'Charger Accessories', 'Replacement Blades', 'Replacement Handles', 'Tool Belts', 'Tool Brushes', 'Machine Accessories', 'Hardware Repair Kits', 'Other Replacement Parts'] },
  { id: 'diy', label: 'DIY & Home Repair', icon: Hammer, subs: ['Home Repair Kits', 'Furniture Repair Kits', 'Wall Repair Tools', 'Picture Hanging Kits', 'Mounting Hardware', 'DIY Tool Sets', 'Repair Tapes', 'Repair Adhesives', 'General Hardware Kits', 'Other DIY Supplies'] },
  { id: 'industrial', label: 'Industrial & Workshop Supplies', icon: Factory, subs: ['Industrial Fasteners', 'Machine Components', 'Bearings', 'Springs', 'Chains', 'Gears', 'Industrial Clamps', 'Workshop Consumables', 'Industrial Accessories', 'Other Industrial Supplies'] },
  { id: 'other', label: 'Other', icon: MoreHorizontal, subs: ['Other Tools & Hardware'] }
]

const COMMON_OPTION_TYPES = ['Size', 'Color', 'Material', 'Voltage', 'Power', 'Length', 'Diameter']

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

export default function ToolsProductBuilder({ productType }: { productType: string | null }) {
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
  const [state, formAction, isPending] = useActionState(createToolsProductAction, null)
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

  const activeCategory = TOOLS_CATEGORIES.find(c => c.id === category)

  const renderDynamicSpecs = () => {
    const lowerSub = subCategory.toLowerCase()
    
    if (lowerSub.includes('power') || lowerSub.includes('electric') || lowerSub.includes('drill') || lowerSub.includes('saw') || lowerSub.includes('grinder') || lowerSub.includes('sander') || lowerSub.includes('polisher') || lowerSub.includes('router') || lowerSub.includes('heater')) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1">Power Source / Voltage</label><input type="text" value={attributes.PowerSource || ''} onChange={e => handleAttributeChange('PowerSource', e.target.value)} placeholder="e.g. 20V Cordless, 220V AC" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Wattage / Power</label><input type="text" value={attributes.Power || ''} onChange={e => handleAttributeChange('Power', e.target.value)} placeholder="e.g. 750W, 1500W" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Included Accessories</label><input type="text" value={attributes.Accessories || ''} onChange={e => handleAttributeChange('Accessories', e.target.value)} placeholder="e.g. 2 Batteries + Charger, Case" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Brand</label><input type="text" value={attributes.Brand || ''} onChange={e => handleAttributeChange('Brand', e.target.value)} className="w-full border rounded-md px-3 py-2" /></div>
        </div>
      )
    }

    if (lowerSub.includes('fastener') || lowerSub.includes('screw') || lowerSub.includes('nail') || lowerSub.includes('bolt') || lowerSub.includes('nut') || lowerSub.includes('washer') || lowerSub.includes('anchor') || lowerSub.includes('rivet')) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1">Size / Length / Diameter</label><input type="text" value={attributes.Size || ''} onChange={e => handleAttributeChange('Size', e.target.value)} placeholder="e.g. M8 x 50mm, 2 inches" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Material / Finish</label><input type="text" value={attributes.Material || ''} onChange={e => handleAttributeChange('Material', e.target.value)} placeholder="e.g. Stainless Steel, Zinc Plated" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Pack Size / Count</label><input type="text" value={attributes.Count || ''} onChange={e => handleAttributeChange('Count', e.target.value)} placeholder="e.g. Pack of 100, 10 Pcs" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Brand (Optional)</label><input type="text" value={attributes.Brand || ''} onChange={e => handleAttributeChange('Brand', e.target.value)} className="w-full border rounded-md px-3 py-2" /></div>
        </div>
      )
    }

    if (lowerSub.includes('ladder') || lowerSub.includes('storage') || lowerSub.includes('box') || lowerSub.includes('cabinet') || lowerSub.includes('chest') || lowerSub.includes('bench') || lowerSub.includes('table')) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1">Dimensions (L x W x H) / Height</label><input type="text" value={attributes.Dimensions || ''} onChange={e => handleAttributeChange('Dimensions', e.target.value)} placeholder="e.g. 1.5m High, 60x40x40 cm" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Material</label><input type="text" value={attributes.Material || ''} onChange={e => handleAttributeChange('Material', e.target.value)} placeholder="e.g. Aluminum, Steel, Plastic" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Load Capacity / Weight Limit</label><input type="text" value={attributes.Capacity || ''} onChange={e => handleAttributeChange('Capacity', e.target.value)} placeholder="e.g. 150kg Max" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Brand</label><input type="text" value={attributes.Brand || ''} onChange={e => handleAttributeChange('Brand', e.target.value)} className="w-full border rounded-md px-3 py-2" /></div>
        </div>
      )
    }

    if (lowerSub.includes('paint') || lowerSub.includes('adhesive') || lowerSub.includes('sealant') || lowerSub.includes('glue') || lowerSub.includes('epoxy') || lowerSub.includes('tape') || lowerSub.includes('cement')) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1">Volume / Weight / Length</label><input type="text" value={attributes.Volume || ''} onChange={e => handleAttributeChange('Volume', e.target.value)} placeholder="e.g. 500ml, 1L, 50m Roll" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Color / Finish</label><input type="text" value={attributes.Color || ''} onChange={e => handleAttributeChange('Color', e.target.value)} placeholder="e.g. Clear, White, Matte Black" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Application / Surface Type</label><input type="text" value={attributes.Application || ''} onChange={e => handleAttributeChange('Application', e.target.value)} placeholder="e.g. Wood, Metal, Multi-purpose" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Brand</label><input type="text" value={attributes.Brand || ''} onChange={e => handleAttributeChange('Brand', e.target.value)} className="w-full border rounded-md px-3 py-2" /></div>
        </div>
      )
    }

    if (lowerSub.includes('plumb') || lowerSub.includes('pipe') || lowerSub.includes('valve') || lowerSub.includes('faucet') || lowerSub.includes('electrical') || lowerSub.includes('wire') || lowerSub.includes('cable') || lowerSub.includes('switch') || lowerSub.includes('socket')) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1">Size / Length / Diameter</label><input type="text" value={attributes.Size || ''} onChange={e => handleAttributeChange('Size', e.target.value)} placeholder="e.g. 1/2 Inch, 100m Roll, 2.5mm²" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Rating / Specification</label><input type="text" value={attributes.Rating || ''} onChange={e => handleAttributeChange('Rating', e.target.value)} placeholder="e.g. 13A, 250V, PN16" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Material / Color</label><input type="text" value={attributes.Material || ''} onChange={e => handleAttributeChange('Material', e.target.value)} placeholder="e.g. PVC, Brass, White" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Brand</label><input type="text" value={attributes.Brand || ''} onChange={e => handleAttributeChange('Brand', e.target.value)} className="w-full border rounded-md px-3 py-2" /></div>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label className="block text-sm font-medium mb-1">Brand</label><input type="text" value={attributes.Brand || ''} onChange={e => handleAttributeChange('Brand', e.target.value)} className="w-full border rounded-md px-3 py-2" /></div>
        <div><label className="block text-sm font-medium mb-1">Size / Dimensions</label><input type="text" value={attributes.Size || ''} onChange={e => handleAttributeChange('Size', e.target.value)} placeholder="e.g. 8 Inch, 20mm" className="w-full border rounded-md px-3 py-2" /></div>
        <div><label className="block text-sm font-medium mb-1">Material / Finish</label><input type="text" value={attributes.Material || ''} onChange={e => handleAttributeChange('Material', e.target.value)} placeholder="e.g. Chrome Vanadium, Carbon Steel" className="w-full border rounded-md px-3 py-2" /></div>
        <div><label className="block text-sm font-medium mb-1">Other Details (Count/Color)</label><input type="text" value={attributes.Details || ''} onChange={e => handleAttributeChange('Details', e.target.value)} className="w-full border rounded-md px-3 py-2" /></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/products" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Add Tools & Hardware</h1>
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
              {TOOLS_CATEGORIES.map((cat) => (
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

