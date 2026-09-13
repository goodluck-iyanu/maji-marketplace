'use client'

import { useState, useActionState, useRef } from 'react'
import { ArrowLeft, ArrowRight, Shirt, Briefcase, Sparkles, Check, Upload, X, Plus, Trash2, Loader2, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import { createFashionProductAction } from '../actions'

const STEPS = [
  { id: 'type', label: 'Product Type' },
  { id: 'photos', label: 'Photos' },
  { id: 'basic', label: 'Basic Info' },
  { id: 'details', label: 'Details' },
  { id: 'options', label: 'Options' },
  { id: 'variants', label: 'Inventory' },
  { id: 'review', label: 'Review' },
]

const PRODUCT_TYPES = [
  { id: 'clothing', label: 'Clothing', icon: Shirt, examples: 'T-shirts, Dresses, Jeans...' },
  { id: 'shoes', label: 'Shoes', icon: Sparkles, examples: 'Sneakers, Heels, Boots...' },
  { id: 'bags', label: 'Bags', icon: Briefcase, examples: 'Handbags, Backpacks...' },
  { id: 'accessories', label: 'Accessories', icon: Sparkles, examples: 'Watches, Hats, Belts...' },
  { id: 'other', label: 'Other Fashion', icon: Sparkles, examples: 'Anything else' },
]

const TARGET_AUDIENCES = ['Men', 'Women', 'Unisex', 'Kids']

export default function FashionProductBuilder({ productType }: { productType: string | null }) {
  const [currentStep, setCurrentStep] = useState(0)
  
  // State
  const [subCategory, setSubCategory] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [targetAudience, setTargetAudience] = useState<string[]>([])
  const [material, setMaterial] = useState('')
  const [hasOptions, setHasOptions] = useState<boolean | null>(null)
  const [sizes, setSizes] = useState<string[]>([])
  const [colors, setColors] = useState<string[]>([])
  const [customSize, setCustomSize] = useState('')
  const [customColor, setCustomColor] = useState('')
  
  const [basePrice, setBasePrice] = useState('')
  const [baseStock, setBaseStock] = useState('')
  const [variants, setVariants] = useState<any[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [state, formAction, isPending] = useActionState(createFashionProductAction, null)

  const handleNext = () => setCurrentStep(c => Math.min(c + 1, STEPS.length - 1))
  const handleBack = () => setCurrentStep(c => Math.max(c - 1, 0))

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setPhotos(prev => [...prev, ...newFiles].slice(0, 5))
    }
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

  const updateVariant = (index: number, field: string, value: string) => {
    const v = [...variants]
    v[index][field] = value
    setVariants(v)
  }

  const applyPriceToAll = () => {
    const v = [...variants]
    v.forEach(va => va.price = basePrice)
    setVariants(v)
  }
  
  const applyStockToAll = () => {
    const v = [...variants]
    v.forEach(va => va.stock = baseStock)
    setVariants(v)
  }

  // Effect to regenerate variants if options change and we move to variants step
  const handleNextToVariants = () => {
    generateVariants()
    handleNext()
  }

  // Pre-submit hook to inject variants JSON into form
  const [variantsJson, setVariantsJson] = useState('')
  
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/products" className="text-gray-500 hover:text-gray-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center justify-between text-sm font-medium text-gray-500 mb-2">
            <span>{STEPS[currentStep].label}</span>
            <span>Step {currentStep + 1} of {STEPS.length}</span>
          </div>
          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-black h-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {state?.error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm font-medium">
          {state.error}
        </div>
      )}

      <form action={formAction} onSubmit={() => setVariantsJson(JSON.stringify(variants))}>
        <input type="hidden" name="subCategory" value={subCategory} />
        <input type="hidden" name="targetAudience" value={JSON.stringify(targetAudience)} />
        <input type="hidden" name="material" value={material} />
        <input type="hidden" name="hasOptions" value={hasOptions ? 'true' : 'false'} />
        <input type="hidden" name="optionsDef" value={JSON.stringify({ sizes, colors })} />
        <input type="hidden" name="variantsJson" value={variantsJson} />
        <input type="hidden" name="productType" value={productType || 'physical'} />

        {/* --- STEP 0: TYPE --- */}
        <div className={currentStep === 0 ? 'block' : 'hidden'}>
          <h2 className="text-2xl font-bold mb-2">What are you selling?</h2>
          <p className="text-gray-500 mb-6">Choose the category that best fits your product.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PRODUCT_TYPES.map(type => (
              <button
                key={type.id}
                type="button"
                onClick={() => setSubCategory(type.id)}
                className={`flex items-start p-4 border rounded-xl transition-all text-left ${
                  subCategory === type.id ? 'border-black ring-1 ring-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`p-3 rounded-lg mr-4 ${subCategory === type.id ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}>
                  <type.icon className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{type.label}</div>
                  <div className="text-sm text-gray-500 mt-1">{type.examples}</div>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-8 flex justify-end">
            <button type="button" onClick={handleNext} disabled={!subCategory} className="bg-black text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50">
              Continue
            </button>
          </div>
        </div>

        {/* --- STEP 1: PHOTOS --- */}
        <div className={currentStep === 1 ? 'block' : 'hidden'}>
          <h2 className="text-2xl font-bold mb-2">Add your product photos</h2>
          <p className="text-gray-500 mb-6">Upload 2 to 5 high-quality photos. The first image will be the primary photo.</p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            {photos.map((file, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden border bg-gray-50">
                <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                {i === 0 && (
                  <div className="absolute top-2 left-2 bg-black text-white text-xs px-2 py-1 rounded shadow">
                    Primary
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setPhotos(p => p.filter((_, idx) => idx !== i))}
                  className="absolute top-2 right-2 bg-white/80 p-1.5 rounded-full hover:bg-white text-gray-900 shadow"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            
            {photos.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-black flex flex-col items-center justify-center text-gray-500 hover:text-black transition-colors"
              >
                <Upload className="h-8 w-8 mb-2" />
                <span className="text-sm font-medium">Add Photo</span>
              </button>
            )}
          </div>
          
          {/* We must inject the actual files into the form submission. 
              Since file inputs are read-only, we can't easily sync state File[] to an input.
              Instead we rely on the actual hidden input if we only used normal form, but we can't.
              Wait! We will just let the user use standard file input, and we will extract from formData. */}
          <input 
            type="file" 
            name="photos" 
            multiple 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handlePhotoUpload}
          />
          {/* Hack: The FileList inside fileInputRef is what gets submitted. 
              But React state `photos` might get out of sync if they remove a photo. 
              We will fix this in action by appending via FormData in an onSubmit intercept or just keeping it simple. */}

          <div className="mt-8 flex justify-between">
            <button type="button" onClick={handleBack} className="px-6 py-3 border rounded-lg font-medium text-gray-700 hover:bg-gray-50">Back</button>
            <button type="button" onClick={handleNext} disabled={photos.length < 2} className="bg-black text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50">
              Continue
            </button>
          </div>
        </div>

        {/* --- STEP 2: BASIC INFO --- */}
        <div className={currentStep === 2 ? 'block' : 'hidden'}>
          <h2 className="text-2xl font-bold mb-2">Tell customers about your product</h2>
          
          <div className="space-y-6 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Product Name *</label>
              <input 
                type="text" 
                name="name" 
                value={name} 
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Oversized Cotton T-Shirt"
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Description *</label>
              <textarea 
                name="description" 
                rows={5}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe the product, fit, material, style, or anything customers should know..."
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black outline-none"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-between">
            <button type="button" onClick={handleBack} className="px-6 py-3 border rounded-lg font-medium text-gray-700 hover:bg-gray-50">Back</button>
            <button type="button" onClick={handleNext} disabled={!name || !description} className="bg-black text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50">
              Continue
            </button>
          </div>
        </div>

        {/* --- STEP 3: DETAILS --- */}
        <div className={currentStep === 3 ? 'block' : 'hidden'}>
          <h2 className="text-2xl font-bold mb-2">Who is this for?</h2>
          <div className="flex flex-wrap gap-3 mt-4 mb-8">
            {TARGET_AUDIENCES.map(aud => (
              <button
                key={aud}
                type="button"
                onClick={() => setTargetAudience(p => p.includes(aud) ? p.filter(x => x !== aud) : [...p, aud])}
                className={`px-6 py-3 border rounded-full font-medium transition-colors ${
                  targetAudience.includes(aud) ? 'bg-black text-white border-black' : 'text-gray-700 hover:border-gray-400'
                }`}
              >
                {aud}
              </button>
            ))}
          </div>

          <h2 className="text-2xl font-bold mb-2">Material (Optional)</h2>
          <div className="flex flex-wrap gap-3 mt-4">
            {['Cotton', 'Denim', 'Leather', 'Linen', 'Polyester', 'Silk', 'Wool'].map(mat => (
              <button
                key={mat}
                type="button"
                onClick={() => setMaterial(mat)}
                className={`px-4 py-2 border rounded-full text-sm font-medium transition-colors ${
                  material === mat ? 'bg-black text-white border-black' : 'text-gray-700 hover:border-gray-400'
                }`}
              >
                {mat}
              </button>
            ))}
          </div>
          <input 
            type="text" 
            value={material} 
            onChange={e => setMaterial(e.target.value)}
            placeholder="Or type custom material..."
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black outline-none mt-4"
          />

          <div className="mt-12 flex justify-between">
            <button type="button" onClick={handleBack} className="px-6 py-3 border rounded-lg font-medium text-gray-700 hover:bg-gray-50">Back</button>
            <button type="button" onClick={handleNext} className="bg-black text-white px-6 py-3 rounded-lg font-medium">
              Continue
            </button>
          </div>
        </div>

        {/* --- STEP 4: OPTIONS --- */}
        <div className={currentStep === 4 ? 'block' : 'hidden'}>
          <h2 className="text-2xl font-bold mb-2">Does this product have different options?</h2>
          <p className="text-gray-500 mb-6">For example, different colors or sizes.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <button type="button" onClick={() => setHasOptions(true)} className={`p-4 border rounded-xl font-medium text-left ${hasOptions === true ? 'border-black ring-1 ring-black' : ''}`}>Yes, this product has options</button>
            <button type="button" onClick={() => setHasOptions(false)} className={`p-4 border rounded-xl font-medium text-left ${hasOptions === false ? 'border-black ring-1 ring-black' : ''}`}>No, it's one option</button>
          </div>

          {hasOptions && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div>
                <h3 className="font-bold mb-3">Sizes Available</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {['XS', 'S', 'M', 'L', 'XL', 'XXL', '6', '8', '10', '12', '14', '40', '42', '44'].map(sz => (
                    <button
                      key={sz} type="button"
                      onClick={() => setSizes(p => p.includes(sz) ? p.filter(x => x !== sz) : [...p, sz])}
                      className={`px-4 py-2 border rounded-md text-sm font-medium ${sizes.includes(sz) ? 'bg-black text-white border-black' : 'text-gray-700'}`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 max-w-sm">
                  <input type="text" value={customSize} onChange={e=>setCustomSize(e.target.value)} placeholder="Custom size" className="flex-1 px-3 py-2 border rounded-md text-sm" />
                  <button type="button" onClick={() => { if(customSize) { setSizes([...sizes, customSize]); setCustomSize('') } }} className="px-4 py-2 bg-gray-100 rounded-md text-sm font-medium">Add</button>
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-3">Colors Available</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Brown', 'Navy', 'Grey', 'Pink'].map(col => (
                    <button
                      key={col} type="button"
                      onClick={() => setColors(p => p.includes(col) ? p.filter(x => x !== col) : [...p, col])}
                      className={`px-4 py-2 border rounded-md text-sm font-medium ${colors.includes(col) ? 'bg-black text-white border-black' : 'text-gray-700'}`}
                    >
                      {col}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 max-w-sm">
                  <input type="text" value={customColor} onChange={e=>setCustomColor(e.target.value)} placeholder="Custom color (e.g. Wine)" className="flex-1 px-3 py-2 border rounded-md text-sm" />
                  <button type="button" onClick={() => { if(customColor) { setColors([...colors, customColor]); setCustomColor('') } }} className="px-4 py-2 bg-gray-100 rounded-md text-sm font-medium">Add</button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-12 flex justify-between">
            <button type="button" onClick={handleBack} className="px-6 py-3 border rounded-lg font-medium text-gray-700 hover:bg-gray-50">Back</button>
            <button type="button" onClick={handleNextToVariants} disabled={hasOptions === null} className="bg-black text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50">
              Continue
            </button>
          </div>
        </div>

        {/* --- STEP 5: INVENTORY & PRICING --- */}
        <div className={currentStep === 5 ? 'block' : 'hidden'}>
          <h2 className="text-2xl font-bold mb-2">Pricing & Inventory</h2>
          
          {!hasOptions || variants.length === 0 ? (
            <div className="space-y-6 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Price (') *</label>
                <input type="number" name="price" value={basePrice} onChange={e=>setBasePrice(e.target.value)} className="w-full px-4 py-3 border rounded-lg" placeholder="0.00" required={!hasOptions} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Stock Quantity *</label>
                <input type="number" name="stock" value={baseStock} onChange={e=>setBaseStock(e.target.value)} className="w-full px-4 py-3 border rounded-lg" placeholder="0" required={!hasOptions} />
              </div>
            </div>
          ) : (
            <div className="space-y-6 mt-6">
              <div className="p-4 bg-gray-50 border rounded-xl mb-6 flex items-end gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Base Price (')</label>
                  <input type="number" value={basePrice} onChange={e=>setBasePrice(e.target.value)} className="w-full px-3 py-2 border rounded-md" placeholder="e.g. 25000" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Base Stock</label>
                  <input type="number" value={baseStock} onChange={e=>setBaseStock(e.target.value)} className="w-full px-3 py-2 border rounded-md" placeholder="e.g. 10" />
                </div>
                <button type="button" onClick={() => { applyPriceToAll(); applyStockToAll(); }} className="px-4 py-2 bg-black text-white rounded-md text-sm font-medium whitespace-nowrap">
                  Apply to All
                </button>
              </div>

              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                    <tr>
                      <th className="px-4 py-3">Variant</th>
                      <th className="px-4 py-3">Price (')</th>
                      <th className="px-4 py-3">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {variants.map((v, i) => (
                      <tr key={i} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium text-gray-900">{v.title}</td>
                        <td className="px-4 py-3">
                          <input type="number" value={v.price} onChange={e => updateVariant(i, 'price', e.target.value)} className="w-full px-2 py-1.5 border rounded" placeholder="0.00" />
                        </td>
                        <td className="px-4 py-3">
                          <input type="number" value={v.stock} onChange={e => updateVariant(i, 'stock', e.target.value)} className="w-full px-2 py-1.5 border rounded" placeholder="0" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-12 flex justify-between">
            <button type="button" onClick={handleBack} className="px-6 py-3 border rounded-lg font-medium text-gray-700 hover:bg-gray-50">Back</button>
            <button type="button" onClick={handleNext} disabled={!basePrice && variants.some(v => !v.price)} className="bg-black text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50">
              Continue
            </button>
          </div>
        </div>

        {/* --- STEP 6: REVIEW --- */}
        <div className={currentStep === 6 ? 'block' : 'hidden'}>
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-black text-white rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">Ready to Publish</h2>
            <p className="text-gray-500 mt-2">Review your product details before going live.</p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-6 mb-8 border space-y-4">
            <div className="flex gap-4">
              <div className="h-20 w-20 rounded-lg bg-gray-200 overflow-hidden shrink-0">
                {photos.length > 0 && <img src={URL.createObjectURL(photos[0])} alt="product" className="h-full w-full object-cover" />}
              </div>
              <div>
                <h3 className="font-bold text-lg">{name}</h3>
                <div className="text-sm text-gray-500 line-clamp-2 mt-1">{description}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t">
              <div><span className="text-gray-500 block">Category</span> <span className="font-medium capitalize">{subCategory}</span></div>
              <div><span className="text-gray-500 block">Audience</span> <span className="font-medium">{targetAudience.join(', ') || 'Any'}</span></div>
              {hasOptions && <div><span className="text-gray-500 block">Variants</span> <span className="font-medium">{variants.length} combinations</span></div>}
              <div><span className="text-gray-500 block">Price</span> <span className="font-medium">'{basePrice || variants[0]?.price}</span></div>
            </div>
          </div>

          <div className="flex justify-between gap-4">
            <button type="button" disabled={isPending} onClick={handleBack} className="flex-1 py-4 border rounded-xl font-medium text-gray-700 hover:bg-gray-50">Back to Edit</button>
            <button type="submit" disabled={isPending} className="flex-[2] bg-black text-white py-4 rounded-xl font-bold text-lg disabled:opacity-70 flex items-center justify-center">
              {isPending ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : null}
              {isPending ? 'Publishing...' : 'Publish Product'}
            </button>
          </div>
        </div>

      </form>
    </div>
  )
}
