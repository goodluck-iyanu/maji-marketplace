import os

CODE = """'use client'

import { useState, useActionState, useRef } from 'react'
import { ArrowLeft, ArrowRight, Check, Upload, Loader2, Image as ImageIcon, FileText, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { createDigitalProductAction } from '../actions'
import { getResumableUploadUrl } from '../drive-actions'

const STEPS = [
  { id: 'basic', label: 'Basic Info' },
  { id: 'cover', label: 'Preview Images' },
  { id: 'upload', label: 'Upload Asset' },
  { id: 'details', label: 'Details' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'downloads', label: 'Delivery' },
  { id: 'review', label: 'Review' },
]

const CATEGORY_CONFIG: Record<string, any> = {
  graphics: {
    title: 'Add Graphic / Design Asset',
    categories: ['Icons', 'Illustrations', 'Patterns', 'Textures', 'UI Kits', 'Logos', 'Branding', 'Backgrounds', 'Other'],
    formats: ['ZIP', 'PNG', 'SVG', 'PSD', 'AI', 'FIG', 'LINK'],
    apps: ['Figma', 'Illustrator', 'Photoshop', 'Canva', 'Sketch', 'None']
  },
  photography: {
    title: 'Add Photo / Presets',
    categories: ['Lightroom Presets', 'Stock Photos', 'LUTs', 'Overlays', 'Mockups', 'Other'],
    formats: ['ZIP', 'DNG', 'XMP', 'JPG', 'PNG', 'LINK'],
    apps: ['Lightroom', 'Photoshop', 'Premiere', 'Final Cut', 'None']
  },
  audio: {
    title: 'Add Audio / Music',
    categories: ['Beats', 'Sound Effects', 'Sample Packs', 'Vocals', 'Podcasts', 'Audiobooks', 'Other'],
    formats: ['ZIP', 'WAV', 'MP3', 'FLAC', 'LINK'],
    apps: ['Ableton', 'FL Studio', 'Logic Pro', 'Pro Tools', 'None']
  },
  video: {
    title: 'Add Video / Motion',
    categories: ['Stock Footage', 'Video Templates', 'Transitions', 'VFX', 'Animations', 'Other'],
    formats: ['ZIP', 'MP4', 'MOV', 'MOGRT', 'AEP', 'LINK'],
    apps: ['Premiere Pro', 'After Effects', 'Final Cut', 'DaVinci Resolve', 'None']
  },
  software: {
    title: 'Add Software / Tool',
    categories: ['Plugins', 'Scripts', 'Desktop Apps', 'Themes', 'Extensions', 'Other'],
    formats: ['ZIP', 'EXE', 'DMG', 'APK', 'LINK'],
    apps: ['WordPress', 'Shopify', 'Chrome', 'Windows', 'Mac', 'Other']
  },
  courses: {
    title: 'Add Course / Learning',
    categories: ['Video Course', 'Text Course', 'Masterclass', 'Workshop', 'Coaching', 'Other'],
    formats: ['ZIP', 'MP4', 'PDF', 'LINK'],
    apps: ['Teachable', 'Kajabi', 'Notion', 'Discord', 'None']
  },
  fonts: {
    title: 'Add Font',
    categories: ['Serif', 'Sans Serif', 'Display', 'Script', 'Handwritten', 'Other'],
    formats: ['ZIP', 'OTF', 'TTF', 'WOFF', 'LINK'],
    apps: ['Any']
  },
  '3d': {
    title: 'Add 3D Asset',
    categories: ['Characters', 'Environments', 'Props', 'Textures', 'Animations', 'Other'],
    formats: ['ZIP', 'OBJ', 'FBX', 'BLEND', 'STL', 'LINK'],
    apps: ['Blender', 'Maya', 'Unity', 'Unreal Engine', 'Cinema 4D', 'None']
  },
  memberships: {
    title: 'Add Membership / Access',
    categories: ['Community Access', 'Newsletter', 'Content Library', 'Mentorship', 'Other'],
    formats: ['LINK', 'PDF'],
    apps: ['Discord', 'Slack', 'Telegram', 'Patreon', 'Other']
  },
  other_digital: {
    title: 'Add Digital Product',
    categories: ['Digital Art', 'Guides', 'Cheatsheets', 'Prompts', 'Other'],
    formats: ['ZIP', 'PDF', 'LINK', 'OTHER'],
    apps: ['Any']
  }
}

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
    }
  })
}

export default function DigitalProductBuilder({ productType, storeCategory }: { productType: string | null, storeCategory: string }) {
  const config = CATEGORY_CONFIG[storeCategory] || CATEGORY_CONFIG['other_digital']
  const [currentStep, setCurrentStep] = useState(0)
  
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  
  const [coverPhoto, setCoverPhoto] = useState<File | null>(null)
  
  const [deliveryType, setDeliveryType] = useState('file')
  const [templateFile, setTemplateFile] = useState<File | null>(null)
  const [templateLink, setTemplateLink] = useState('')
  
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploadingDrive, setIsUploadingDrive] = useState(false)
  const [uploadedFileId, setUploadedFileId] = useState('')
  
  const [app, setApp] = useState('')
  const [format, setFormat] = useState(config.formats[0])
  const [includes, setIncludes] = useState<string[]>([])
  
  const [isFree, setIsFree] = useState(false)
  const [price, setPrice] = useState('')
  const [hasDiscount, setHasDiscount] = useState(false)
  const [salePrice, setSalePrice] = useState('')
  
  const [downloadsAllowed, setDownloadsAllowed] = useState('-1')
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const templateInputRef = useRef<HTMLInputElement>(null)
  
  const [state, formAction, isPending] = useActionState(createDigitalProductAction, null)
  const [isCompressing, setIsCompressing] = useState(false)
  const isLoading = isPending || isCompressing

  const handleNext = () => setCurrentStep(c => Math.min(c + 1, STEPS.length - 1))
  const handleBack = () => setCurrentStep(c => Math.max(c - 1, 0))

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setCoverPhoto(e.target.files[0])
  }

  const handleTemplateSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 200 * 1024 * 1024) { alert('File is too large. Maximum size is 200MB.'); return }
      setTemplateFile(file)
      const ext = file.name.split('.').pop()?.toUpperCase()
      if (ext && config.formats.includes(ext)) setFormat(ext)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const uploadToGoogleDrive = async () => {
    if (!templateFile) return
    setIsUploadingDrive(true)
    setUploadProgress(0)

    try {
      const { uploadUrl, error } = await getResumableUploadUrl(templateFile.name, templateFile.type || 'application/octet-stream', templateFile.size)
      if (error || !uploadUrl) throw new Error(error || 'Failed to get upload URL')

      const xhr = new XMLHttpRequest()
      const uploadPromise = new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100))
        })
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText).id)
          else reject(new Error(`Upload failed`))
        })
        xhr.addEventListener('error', () => reject(new Error('Network error')))
      })

      xhr.open('PUT', uploadUrl)
      xhr.setRequestHeader('Content-Type', templateFile.type || 'application/octet-stream')
      xhr.send(templateFile)

      setUploadedFileId(await uploadPromise as string)
      handleNext()
    } catch (err: any) {
      alert(err.message || 'Failed to upload')
    } finally {
      setIsUploadingDrive(false)
    }
  }

  const handleSubmit = async (formData: FormData) => {
    if (!coverPhoto) { alert('Upload a cover image.'); return }
    if (deliveryType === 'file' && !uploadedFileId) { alert('Wait for upload to finish.'); return }
    if (deliveryType === 'link' && !templateLink) { alert('Enter a valid link.'); return }
    
    setIsCompressing(true)
    try {
      formData.set('coverPhoto', await compressImage(coverPhoto))
      formData.append('deliveryType', deliveryType)
      if (deliveryType === 'file') {
        formData.append('digitalFileId', uploadedFileId)
        formData.append('digitalFileSize', templateFile ? formatFileSize(templateFile.size) : 'Unknown')
      } else {
        formData.append('digitalFileLink', templateLink)
        formData.append('digitalFileSize', 'Link')
        formData.set('format', 'LINK')
      }
      formAction(formData)
    } catch (e) {
      console.error(e)
    } finally {
      setIsCompressing(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <label className="block text-sm font-medium mb-2">Product Name *</label>
              <input type="text" name="name" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description *</label>
              <textarea name="description" value={description} onChange={e => setDescription(e.target.value)} rows={5} className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black outline-none resize-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Category *</label>
              <select name="category" value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black outline-none bg-white" required>
                <option value="">Select a category</option>
                {config.categories.map((c: string) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        )
      case 1:
        return (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <label className="block text-sm font-medium mb-2">Cover Image *</label>
              {!coverPhoto ? (
                <div onClick={() => fileInputRef.current?.click()} className="w-full aspect-video max-w-xl mx-auto border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
                  <ImageIcon className="w-10 h-10 text-gray-400 mb-3" />
                  <span className="text-sm font-medium">Click to upload</span>
                </div>
              ) : (
                <div className="relative w-full aspect-video max-w-xl mx-auto border rounded-xl overflow-hidden group">
                  <img src={URL.createObjectURL(coverPhoto)} alt="Preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setCoverPhoto(null)} className="absolute top-2 right-2 p-2 bg-white text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-5 h-5" /></button>
                </div>
              )}
              <input type="file" ref={fileInputRef} onChange={handleCoverUpload} accept="image/*" className="hidden" />
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-6 animate-in fade-in">
            <h3 className="text-lg font-medium mb-4">How will customers receive this?</h3>
            <div className="flex gap-4 mb-8">
              <label className={`flex-1 flex flex-col p-4 border rounded-xl cursor-pointer ${deliveryType === 'file' ? 'border-black bg-gray-50 ring-1 ring-black' : 'hover:bg-gray-50'}`}>
                <input type="radio" checked={deliveryType === 'file'} onChange={() => setDeliveryType('file')} className="sr-only" />
                <span className="font-medium mb-1">Upload a File</span>
              </label>
              <label className={`flex-1 flex flex-col p-4 border rounded-xl cursor-pointer ${deliveryType === 'link' ? 'border-black bg-gray-50 ring-1 ring-black' : 'hover:bg-gray-50'}`}>
                <input type="radio" checked={deliveryType === 'link'} onChange={() => setDeliveryType('link')} className="sr-only" />
                <span className="font-medium mb-1">Secret Link</span>
              </label>
            </div>

            {deliveryType === 'file' ? (
              <div className="text-center">
                {uploadedFileId ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                    <Check className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <h4 className="font-medium text-gray-900 mb-1">Upload complete</h4>
                    <button type="button" onClick={() => {setTemplateFile(null); setUploadedFileId('')}} className="text-sm text-red-600 hover:underline">Remove & Re-upload</button>
                  </div>
                ) : isUploadingDrive ? (
                  <div className="border border-gray-200 rounded-xl p-8">
                    <Loader2 className="w-10 h-10 text-[#FF7A00] animate-spin mx-auto mb-4" />
                    <h4 className="font-medium mb-2">Uploading to Secure Storage...</h4>
                    <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-2.5 mb-2">
                      <div className="bg-[#FF7A00] h-2.5 rounded-full transition-all" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                  </div>
                ) : templateFile ? (
                  <div className="border border-gray-200 rounded-xl p-8">
                    <FileText className="w-12 h-12 text-[#FF7A00] mx-auto mb-4" />
                    <h4 className="font-medium mb-4">{templateFile.name}</h4>
                    <div className="flex justify-center gap-3">
                      <button type="button" onClick={() => setTemplateFile(null)} className="px-6 py-2 border rounded-lg">Cancel</button>
                      <button type="button" onClick={uploadToGoogleDrive} className="px-6 py-2 bg-black text-white rounded-lg">Start Upload</button>
                    </div>
                  </div>
                ) : (
                  <div onClick={() => templateInputRef.current?.click()} className="w-full max-w-2xl mx-auto border-2 border-dashed rounded-2xl p-12 cursor-pointer hover:bg-gray-50">
                    <Upload className="w-12 h-12 text-[#FF7A00] mx-auto mb-4" />
                    <h4 className="font-medium">Upload File (Max: 200MB)</h4>
                  </div>
                )}
                <input type="file" ref={templateInputRef} onChange={handleTemplateSelect} className="hidden" />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-2">Secret Link *</label>
                <input type="url" value={templateLink} onChange={e => setTemplateLink(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black outline-none" placeholder="https://..." required={deliveryType === 'link'} />
              </div>
            )}
          </div>
        )
      case 3:
        return (
          <div className="space-y-6 animate-in fade-in">
            <h3 className="text-lg font-medium mb-4">Specifications</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Software / App (Optional)</label>
                <select name="app" value={app} onChange={e => setApp(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black outline-none bg-white">
                  <option value="">Select App</option>
                  {config.apps.map((a: string) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              {deliveryType === 'file' && (
                <div>
                  <label className="block text-sm font-medium mb-2">File Format</label>
                  <select name="format" value={format} onChange={e => setFormat(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black outline-none bg-white">
                    {config.formats.map((f: string) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-3">What's included?</label>
              <div className="space-y-2">
                {['Source Files', 'Documentation', 'Video Tutorial', 'Commercial License', 'Support'].map(item => (
                  <label key={item} className="flex items-center p-3 border rounded-lg cursor-pointer">
                    <input type="checkbox" className="h-4 w-4 text-black rounded" checked={includes.includes(item)} onChange={() => setIncludes(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item])} />
                    <span className="ml-3 text-sm font-medium">{item}</span>
                  </label>
                ))}
              </div>
              <input type="hidden" name="includes" value={JSON.stringify(includes)} />
            </div>
          </div>
        )
      case 4:
        return (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <label className="block text-sm font-medium mb-3">Is this free?</label>
              <div className="flex gap-4 mb-6">
                <label className={`flex-1 flex justify-center p-4 border rounded-xl cursor-pointer ${!isFree ? 'border-black bg-gray-50' : ''}`}><input type="radio" checked={!isFree} onChange={() => setIsFree(false)} className="sr-only" /><span className="font-medium">Paid</span></label>
                <label className={`flex-1 flex justify-center p-4 border rounded-xl cursor-pointer ${isFree ? 'border-black bg-gray-50' : ''}`}><input type="radio" checked={isFree} onChange={() => { setIsFree(true); setPrice('0') }} className="sr-only" /><span className="font-medium">Free</span></label>
              </div>
            </div>
            {!isFree && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Price (₦) *</label>
                  <input type="number" name="price" value={price} onChange={e => setPrice(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black outline-none" required={!isFree} />
                </div>
                <div className="pt-4">
                  <label className="flex items-center cursor-pointer mb-4">
                    <input type="checkbox" checked={hasDiscount} onChange={(e) => setHasDiscount(e.target.checked)} className="w-4 h-4 rounded text-black" />
                    <span className="ml-2 text-sm font-medium">Add discount</span>
                  </label>
                  {hasDiscount && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Sale Price (₦) *</label>
                      <input type="number" name="salePrice" value={salePrice} onChange={e => setSalePrice(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black outline-none" required={hasDiscount} />
                    </div>
                  )}
                </div>
              </>
            )}
            {isFree && <input type="hidden" name="price" value="0" />}
            {isFree && <input type="hidden" name="salePrice" value="" />}
          </div>
        )
      case 5:
        return (
          <div className="space-y-6 animate-in fade-in">
            <h3 className="text-lg font-medium mb-4">Delivery Settings</h3>
            <div>
              <label className="block text-sm font-medium mb-3">Downloads / Access allowed per purchase</label>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {['1', '3', '5', '-1'].map(opt => (
                  <label key={opt} className={`flex justify-center p-3 border rounded-lg cursor-pointer ${downloadsAllowed === opt ? 'border-black bg-gray-50 ring-1 ring-black' : ''}`}>
                    <input type="radio" checked={downloadsAllowed === opt} onChange={() => setDownloadsAllowed(opt)} className="sr-only" />
                    <span className="font-medium">{opt === '-1' ? 'Unlimited' : `${opt} times`}</span>
                  </label>
                ))}
                <input type="hidden" name="downloadsAllowed" value={downloadsAllowed} />
              </div>
            </div>
          </div>
        )
      case 6:
        return (
          <div className="space-y-8 animate-in fade-in">
            <div className="flex gap-6 p-6 border rounded-xl bg-white shadow-sm">
              <div className="w-40 aspect-video bg-gray-100 rounded-lg overflow-hidden">
                {coverPhoto && <img src={URL.createObjectURL(coverPhoto)} alt="Cover" className="w-full h-full object-cover" />}
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">{name || 'Untitled'}</h3>
                <p className="text-sm text-gray-500 mb-4">{category}</p>
                <div className="text-lg font-bold text-[#FF7A00]">{isFree ? 'Free' : `₦${hasDiscount && salePrice ? salePrice : price || '0'}`}</div>
              </div>
            </div>
            {state?.error && <div className="p-4 bg-red-50 text-red-600 rounded-md border border-red-100 text-sm">{state.error}</div>}
          </div>
        )
    }
  }

  const isNextDisabled = () => {
    if (currentStep === 0) return !name.trim() || !description.trim() || !category
    if (currentStep === 1) return !coverPhoto
    if (currentStep === 2) return deliveryType === 'file' ? !uploadedFileId : !templateLink
    if (currentStep === 4) return !isFree && !price
    return false
  }

  return (
    <div className="max-w-3xl mx-auto pb-24 pt-8 px-4 sm:px-0">
      <div className="mb-8">
        <Link href="/dashboard/products" className="inline-flex items-center text-sm text-gray-500 hover:text-black mb-6"><ArrowLeft className="w-4 h-4 mr-1" />Back</Link>
        <h1 className="text-2xl font-bold">{config.title}</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <form action={handleSubmit}>
          <input type="hidden" name="productType" value={productType || 'digital'} />
          <input type="hidden" name="storeCategory" value={storeCategory} />
          
          <div className="p-6 sm:p-10">{renderStep()}</div>

          <div className="px-6 py-4 bg-gray-50 border-t flex justify-between">
            <button type="button" onClick={handleBack} disabled={currentStep === 0 || isLoading || isUploadingDrive} className="px-6 py-2.5 border rounded-lg text-gray-700 disabled:opacity-50">Back</button>
            {currentStep < STEPS.length - 1 ? (
              <button type="button" onClick={handleNext} disabled={isNextDisabled() || isUploadingDrive} className="px-6 py-2.5 bg-black text-white rounded-lg disabled:opacity-50 flex items-center">Continue<ArrowRight className="w-4 h-4 ml-2" /></button>
            ) : (
              <button type="submit" disabled={isLoading || isUploadingDrive} className="px-8 py-2.5 bg-[#FF7A00] text-white rounded-lg flex items-center">
                {isLoading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Publishing...</> : 'Publish Asset'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
"""

with open('src/app/(dashboard)/dashboard/products/new/digital-builder.tsx', 'w', encoding='utf-8') as f:
    f.write(CODE)
