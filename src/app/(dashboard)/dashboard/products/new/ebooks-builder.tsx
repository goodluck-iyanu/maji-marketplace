'use client'

import { useState, useActionState, useRef } from 'react'
import { ArrowLeft, ArrowRight, Book, Sparkles, Check, Upload, X, Loader2, Image as ImageIcon, FileText, File } from 'lucide-react'
import Link from 'next/link'
import { createEbookProductAction } from '../actions'
import { getResumableUploadUrl } from '../drive-actions'

const STEPS = [
  { id: 'basic', label: 'Basic Info' },
  { id: 'cover', label: 'Cover Image' },
  { id: 'upload', label: 'Upload Ebook' },
  { id: 'details', label: 'Product Details' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'downloads', label: 'Download Settings' },
  { id: 'review', label: 'Review' },
]

const EBOOK_CATEGORIES = [
  'Business & Entrepreneurship',
  'Marketing & Sales',
  'Fiction & Literature',
  'Health & Fitness',
  'Self-Help & Personal Development',
  'Technology & Programming',
  'Finance & Investing',
  'Education & Textbooks',
  'Arts & Photography',
  'Cookbooks & Recipes',
  'Other'
]

const LANGUAGES = ['English', 'French', 'Spanish', 'Hausa', 'Yoruba', 'Igbo', 'Other']
const FORMATS = ['PDF', 'EPUB', 'MOBI', 'DOCX', 'TXT', 'ZIP']

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
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height
            height = MAX_HEIGHT
          }
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }))
          } else {
            reject(new Error('Canvas to Blob failed'))
          }
        }, 'image/jpeg', 0.8)
      }
      img.onerror = (e) => reject(e)
    }
    reader.onerror = (e) => reject(e)
  })
}

export default function EbooksProductBuilder({ productType }: { productType: string | null }) {
  const [currentStep, setCurrentStep] = useState(0)
  
  // State
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [author, setAuthor] = useState('')
  const [language, setLanguage] = useState('English')
  const [category, setCategory] = useState('')
  
  const [coverPhoto, setCoverPhoto] = useState<File | null>(null)
  
  const [ebookFile, setEbookFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploadingDrive, setIsUploadingDrive] = useState(false)
  const [uploadedFileId, setUploadedFileId] = useState('')
  
  const [format, setFormat] = useState('PDF')
  const [pages, setPages] = useState('')
  const [includes, setIncludes] = useState<string[]>([])
  
  const [isFree, setIsFree] = useState(false)
  const [price, setPrice] = useState('')
  const [hasDiscount, setHasDiscount] = useState(false)
  const [salePrice, setSalePrice] = useState('')
  
  const [downloadsAllowed, setDownloadsAllowed] = useState('3') // -1 for unlimited
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const ebookInputRef = useRef<HTMLInputElement>(null)
  
  const [state, formAction, isPending] = useActionState(createEbookProductAction, null)
  const [isCompressing, setIsCompressing] = useState(false)
  const isLoading = isPending || isCompressing

  const handleNext = () => setCurrentStep(c => Math.min(c + 1, STEPS.length - 1))
  const handleBack = () => setCurrentStep(c => Math.max(c - 1, 0))

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCoverPhoto(e.target.files[0])
    }
  }

  const handleEbookSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 200 * 1024 * 1024) {
        alert('File is too large. Maximum size is 200MB.')
        return
      }
      setEbookFile(file)
      // Auto-detect format
      const ext = file.name.split('.').pop()?.toUpperCase()
      if (ext && FORMATS.includes(ext)) {
        setFormat(ext)
      } else if (ext === 'ZIP' || ext === 'RAR') {
        setFormat('ZIP')
      }
    }
  }

  const removeCover = () => {
    setCoverPhoto(null)
  }

  const removeEbook = () => {
    setEbookFile(null)
    setUploadedFileId('')
    setUploadProgress(0)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const toggleInclude = (item: string) => {
    setIncludes(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    )
  }

  const uploadToGoogleDrive = async () => {
    if (!ebookFile) return

    setIsUploadingDrive(true)
    setUploadProgress(0)

    try {
      // 1. Get Resumable Upload URL from our secure server action
      const { uploadUrl, error } = await getResumableUploadUrl(ebookFile.name, ebookFile.type || 'application/octet-stream', ebookFile.size)
      
      if (error || !uploadUrl) {
        throw new Error(error || 'Failed to get upload URL')
      }

      // 2. Upload file directly to Google Drive via XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest()
      
      const uploadPromise = new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100)
            setUploadProgress(percentComplete)
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText)
            // response.id contains the Google Drive File ID
            resolve(response.id)
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`))
          }
        })

        xhr.addEventListener('error', () => reject(new Error('Network error during upload')))
        xhr.addEventListener('abort', () => reject(new Error('Upload aborted')))
      })

      xhr.open('PUT', uploadUrl)
      // Google requires exactly the same Content-Length and Type as declared
      xhr.setRequestHeader('Content-Type', ebookFile.type || 'application/octet-stream')
      xhr.send(ebookFile)

      const fileId = await uploadPromise as string
      setUploadedFileId(fileId)
      
      // Advance to next step automatically
      handleNext()
      
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Failed to upload file to Google Drive. Please try again.')
      setUploadProgress(0)
    } finally {
      setIsUploadingDrive(false)
    }
  }

  const handleSubmit = async (formData: FormData) => {
    if (!coverPhoto) {
      alert('Please upload a cover image.')
      return
    }
    if (!uploadedFileId) {
      alert('Please wait for the ebook file to finish uploading to Google Drive.')
      return
    }
    
    setIsCompressing(true)
    try {
      const compressedCover = await compressImage(coverPhoto)
      formData.set('coverPhoto', compressedCover)
      
      // Append Digital Fields
      formData.append('digitalFileId', uploadedFileId)
      formData.append('digitalFileSize', ebookFile ? formatFileSize(ebookFile.size) : 'Unknown')
      
      formAction(formData)
    } catch (error) {
      console.error(error)
    } finally {
      setIsCompressing(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Basic Info
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Ebook Title *</label>
              <input
                type="text"
                name="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. How to Start a Business in Nigeria"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Description *</label>
              <textarea
                name="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
                placeholder="Tell customers what this ebook is about..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all resize-none"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Author (Optional)</label>
                <input
                  type="text"
                  name="author"
                  value={author}
                  onChange={e => setAuthor(e.target.value)}
                  placeholder="e.g. Goodluck Iyanu"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Language</label>
                <select
                  name="language"
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none bg-white"
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Category *</label>
              <select
                name="category"
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none bg-white"
                required
              >
                <option value="">Select a category</option>
                {EBOOK_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        )
      
      case 1: // Cover Image
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Cover Image *</label>
              <p className="text-sm text-gray-500 mb-4">Upload the main cover image for your ebook. This is what customers will see on your storefront.</p>
              
              {!coverPhoto ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-[3/4] max-w-sm mx-auto border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-black hover:bg-gray-50 transition-colors"
                >
                  <ImageIcon className="w-10 h-10 text-gray-400 mb-3" />
                  <span className="text-sm font-medium text-gray-900">Click to upload cover</span>
                  <span className="text-xs text-gray-500 mt-1">JPG, PNG, WebP</span>
                </div>
              ) : (
                <div className="relative w-full aspect-[3/4] max-w-sm mx-auto border rounded-xl overflow-hidden group">
                  <img src={URL.createObjectURL(coverPhoto)} alt="Cover preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button type="button" onClick={removeCover} className="p-2 bg-white text-red-600 rounded-full hover:bg-red-50">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleCoverUpload}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>
        )
      
      case 2: // Upload Ebook
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 text-center">
            <h3 className="text-xl font-semibold mb-2">Upload Your Ebook</h3>
            <p className="text-gray-500 mb-8">Your customers will receive this file automatically after purchasing.</p>
            
            {uploadedFileId ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    <Check className="w-6 h-6" />
                  </div>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-1">Upload complete</h4>
                <p className="text-sm text-gray-600 mb-4">{ebookFile?.name} ({formatFileSize(ebookFile?.size || 0)})</p>
                <div className="flex gap-3 justify-center">
                  <button type="button" onClick={removeEbook} className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100">
                    Remove & Re-upload
                  </button>
                </div>
              </div>
            ) : isUploadingDrive ? (
              <div className="border border-gray-200 rounded-xl p-8">
                <Loader2 className="w-10 h-10 text-[#FF7A00] animate-spin mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Uploading to Secure Storage...</h4>
                <p className="text-sm text-gray-500 mb-4">{ebookFile?.name}</p>
                <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-2.5 mb-2">
                  <div className="bg-[#FF7A00] h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                </div>
                <p className="text-sm font-medium text-gray-700 mb-4">{uploadProgress}% • {formatFileSize(ebookFile?.size || 0)}</p>
                <p className="text-xs text-[#FF7A00] font-medium bg-orange-50 py-2 px-4 rounded-lg inline-block">Please do not close this page.</p>
              </div>
            ) : ebookFile ? (
              <div className="border border-gray-200 rounded-xl p-8">
                <FileText className="w-12 h-12 text-[#FF7A00] mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">{ebookFile.name}</h4>
                <p className="text-sm text-gray-500 mb-6">{formatFileSize(ebookFile.size)} • Ready to upload</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button type="button" onClick={removeEbook} className="px-6 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">
                    Cancel
                  </button>
                  <button type="button" onClick={uploadToGoogleDrive} className="px-6 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800">
                    Start Upload
                  </button>
                </div>
              </div>
            ) : (
              <div 
                onClick={() => ebookInputRef.current?.click()}
                className="w-full max-w-2xl mx-auto border-2 border-dashed border-gray-300 rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-[#FF7A00] hover:bg-orange-50/30 transition-colors"
              >
                <Upload className="w-12 h-12 text-[#FF7A00] mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-1">Drag & drop your file</h4>
                <p className="text-sm text-gray-500 mb-4">or click to choose a file</p>
                <span className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium shadow-sm mb-4">Choose File</span>
                <p className="text-xs text-gray-400">PDF, EPUB, MOBI, ZIP • Maximum: 200 MB</p>
              </div>
            )}
            
            <input
              type="file"
              ref={ebookInputRef}
              onChange={handleEbookSelect}
              className="hidden"
            />
          </div>
        )
      
      case 3: // Product Details
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-lg font-medium mb-4">What will the customer receive?</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Ebook Format</label>
                <select
                  name="format"
                  value={format}
                  onChange={e => setFormat(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none bg-white"
                >
                  {FORMATS.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Number of pages</label>
                <input
                  type="number"
                  name="pages"
                  value={pages}
                  onChange={e => setPages(e.target.value)}
                  placeholder="e.g. 120"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">What's included?</label>
              <div className="space-y-2">
                {['Main Ebook', 'Bonus PDF', 'Worksheets', 'Audio Version', 'Video Guide'].map(item => (
                  <label key={item} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input 
                      type="checkbox" 
                      className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                      checked={includes.includes(item)}
                      onChange={() => toggleInclude(item)}
                    />
                    <span className="ml-3 text-sm font-medium text-gray-900">{item}</span>
                  </label>
                ))}
              </div>
              <input type="hidden" name="includes" value={JSON.stringify(includes)} />
            </div>
          </div>
        )

      case 4: // Pricing
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">Is this product free?</label>
              <div className="flex gap-4 mb-6">
                <label className={`flex-1 flex items-center justify-center p-4 border rounded-xl cursor-pointer transition-colors ${!isFree ? 'border-black bg-gray-50 ring-1 ring-black' : 'hover:bg-gray-50'}`}>
                  <input type="radio" name="isFree" checked={!isFree} onChange={() => setIsFree(false)} className="sr-only" />
                  <span className="font-medium">Paid</span>
                </label>
                <label className={`flex-1 flex items-center justify-center p-4 border rounded-xl cursor-pointer transition-colors ${isFree ? 'border-black bg-gray-50 ring-1 ring-black' : 'hover:bg-gray-50'}`}>
                  <input type="radio" name="isFree" checked={isFree} onChange={() => { setIsFree(true); setPrice('0') }} className="sr-only" />
                  <span className="font-medium">Free</span>
                </label>
              </div>
            </div>

            {!isFree && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Price (₦) *</label>
                  <input
                    type="number"
                    name="price"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    placeholder="5000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                    required={!isFree}
                  />
                </div>

                <div className="pt-4">
                  <label className="flex items-center cursor-pointer mb-4">
                    <input
                      type="checkbox"
                      checked={hasDiscount}
                      onChange={(e) => setHasDiscount(e.target.checked)}
                      className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-900">Add discount</span>
                  </label>

                  {hasDiscount && (
                    <div className="animate-in slide-in-from-top-2">
                      <label className="block text-sm font-medium text-gray-900 mb-2">Sale Price (₦) *</label>
                      <input
                        type="number"
                        name="salePrice"
                        value={salePrice}
                        onChange={e => setSalePrice(e.target.value)}
                        placeholder="3500"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                        required={hasDiscount}
                      />
                    </div>
                  )}
                </div>
              </>
            )}
            
            {/* Hidden inputs to make sure server actions receives values correctly */}
            {isFree && <input type="hidden" name="price" value="0" />}
            {isFree && <input type="hidden" name="salePrice" value="" />}
          </div>
        )
      
      case 5: // Download Settings
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-lg font-medium mb-4">Download Access</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">Downloads allowed per purchase</label>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {['1', '3', '5', '-1'].map(opt => (
                  <label key={opt} className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors ${downloadsAllowed === opt ? 'border-black bg-gray-50 ring-1 ring-black' : 'hover:bg-gray-50'}`}>
                    <input 
                      type="radio" 
                      name="downloadsAllowed"
                      value={opt}
                      checked={downloadsAllowed === opt} 
                      onChange={() => setDownloadsAllowed(opt)} 
                      className="sr-only" 
                    />
                    <span className="font-medium">{opt === '-1' ? 'Unlimited' : `${opt} downloads`}</span>
                  </label>
                ))}
                {/* Hidden input to ensure it submits */}
                <input type="hidden" name="downloadsAllowed" value={downloadsAllowed} />
              </div>
            </div>
            
            <div className="bg-orange-50 border border-orange-100 rounded-lg p-4">
              <h4 className="font-medium text-orange-800 mb-1 flex items-center"><Check className="w-4 h-4 mr-2" /> Automatic Delivery</h4>
              <p className="text-sm text-orange-700">Customers will get immediate access to download the file directly from their order confirmation page and email receipt after a successful payment.</p>
            </div>
          </div>
        )
      
      case 6: // Review
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex gap-6 p-6 border border-gray-200 rounded-xl bg-white shadow-sm">
              <div className="w-24 h-32 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                {coverPhoto && (
                  <img src={URL.createObjectURL(coverPhoto)} alt="Cover" className="w-full h-full object-cover" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{name || 'Untitled Ebook'}</h3>
                <p className="text-sm text-gray-500 mb-4">{category || 'No Category'}</p>
                <div className="text-lg font-bold text-[#FF7A00]">
                  {isFree ? 'Free' : `₦${hasDiscount && salePrice ? salePrice : price || '0'}`}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 space-y-4">
              <div className="flex items-center text-sm">
                <Check className="w-5 h-5 text-green-500 mr-3" />
                <span className="font-medium w-32">Cover image:</span>
                <span className="text-gray-600">{coverPhoto ? 'Uploaded' : 'Missing'}</span>
              </div>
              <div className="flex items-center text-sm">
                <Check className={`w-5 h-5 mr-3 ${uploadedFileId ? 'text-green-500' : 'text-gray-300'}`} />
                <span className="font-medium w-32">Ebook file:</span>
                <span className="text-gray-600">{uploadedFileId ? `${ebookFile?.name} (${formatFileSize(ebookFile?.size || 0)})` : 'Missing'}</span>
              </div>
              <div className="flex items-center text-sm">
                <Check className="w-5 h-5 text-green-500 mr-3" />
                <span className="font-medium w-32">Downloads:</span>
                <span className="text-gray-600">{downloadsAllowed === '-1' ? 'Unlimited' : `${downloadsAllowed} per purchase`}</span>
              </div>
            </div>

            {state?.error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-md border border-red-100 text-sm">
                {state.error}
              </div>
            )}
          </div>
        )
    }
  }

  const isNextDisabled = () => {
    if (currentStep === 0) return !name.trim() || !description.trim() || !category
    if (currentStep === 1) return !coverPhoto
    if (currentStep === 2) return !uploadedFileId
    if (currentStep === 4) return !isFree && !price
    return false
  }

  return (
    <div className="max-w-3xl mx-auto pb-24 pt-8 px-4 sm:px-0">
      <div className="mb-8">
        <Link href="/dashboard/products" className="inline-flex items-center text-sm text-gray-500 hover:text-black mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to products
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Add Ebook</h1>
          <div className="text-sm font-medium text-gray-500">
            Step {currentStep + 1} of {STEPS.length}
          </div>
        </div>
        
        <div className="flex gap-2 mt-6 overflow-x-auto pb-2 scrollbar-hide">
          {STEPS.map((step, idx) => (
            <div 
              key={step.id}
              className={`flex items-center flex-shrink-0 text-sm font-medium ${
                idx === currentStep ? 'text-black' : 
                idx < currentStep ? 'text-green-600' : 'text-gray-400'
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 text-xs ${
                idx === currentStep ? 'bg-black text-white' : 
                idx < currentStep ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                {idx < currentStep ? <Check className="w-3 h-3" /> : idx + 1}
              </div>
              {step.label}
              {idx < STEPS.length - 1 && <div className="w-8 h-px bg-gray-200 mx-3" />}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <form action={handleSubmit}>
          {/* Hidden inputs to preserve state across steps */}
          <input type="hidden" name="productType" value={productType || 'digital'} />
          
          <div className="p-6 sm:p-10">
            {renderStep()}
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 0 || isLoading || isUploadingDrive}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-white disabled:opacity-50 transition-colors"
            >
              Back
            </button>
            
            {currentStep < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={isNextDisabled() || isUploadingDrive}
                className="px-6 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading || isUploadingDrive}
                className="px-8 py-2.5 bg-[#FF7A00] text-white rounded-lg font-medium hover:bg-[#e66e00] disabled:opacity-70 transition-colors flex items-center shadow-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  'Publish Ebook'
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
