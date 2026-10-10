'use client'

import { useActionState } from 'react'
import { SubmitButton } from './submit-button'
import { saveSettingsAction } from './actions'
import { Lock, CheckCircle2 } from 'lucide-react'
import { MajiLogo } from '@/components/brand/maji-brand'

export function SettingsForm({ store, settings }: { store: any, settings: any }) {
  const [state, formAction] = useActionState(saveSettingsAction, null)

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new window.Image()
        img.src = event.target?.result as string
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const MAX_WIDTH = 800 // sufficient for a logo
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

  const handleAction = async (formData: FormData) => {
    const logoFile = formData.get('logo') as File | null
    if (logoFile && logoFile.size > 0) {
      try {
        const compressed = await compressImage(logoFile)
        formData.set('logo', compressed)
      } catch (err) {
        console.error('Compression failed', err)
      }
    }
    formAction(formData)
  }

  return (
    <form action={handleAction} className="space-y-6">
      {state?.error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-sm font-semibold">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-200/70 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Settings saved successfully!</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-[#FAF8F5]">
          <h2 className="text-base font-extrabold text-[#111111]">General Information</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-[#111111] mb-1.5">Store Logo</label>
            {settings.logo_url && (
              <div className="mb-3">
                <img src={settings.logo_url} alt="Store Logo" className="h-16 w-16 object-cover rounded-2xl border border-gray-200 shadow-xs" />
              </div>
            )}
            <input 
              type="file" 
              name="logo"
              accept="image/*"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl bg-[#FAF8F5] text-sm focus:outline-none focus:ring-2 focus:ring-[#F05A28]" 
            />
            <p className="text-xs text-gray-500 mt-1">Upload a square image (optional).</p>
          </div>
          <div>
            <label className="block text-sm font-bold text-[#111111] mb-1.5">Store Name</label>
            <input 
              type="text" 
              defaultValue={store?.name} 
              disabled
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed text-sm font-medium" 
            />
            <p className="text-xs text-gray-500 mt-1">Store name cannot be changed.</p>
          </div>
          {store?.product_type === 'physical' && store?.store_category && (
            <div>
              <label className="block text-sm font-bold text-[#111111] mb-1.5">Store Category</label>
              <input 
                type="text" 
                defaultValue={store.store_category.charAt(0).toUpperCase() + store.store_category.slice(1)} 
                disabled
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed text-sm font-medium" 
              />
              <p className="text-xs text-gray-500 mt-1">Products will be added under this category.</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-bold text-[#111111] mb-1.5">Store URL Slug</label>
            <div className="flex rounded-xl overflow-hidden border border-gray-200">
              <span className="inline-flex items-center px-3.5 border-r border-gray-200 bg-gray-50 text-gray-500 text-xs sm:text-sm font-medium">
                maji.hoberg.com.ng/store/
              </span>
              <input 
                type="text" 
                defaultValue={store?.slug} 
                disabled
                className="flex-1 min-w-0 block w-full px-3.5 py-2.5 bg-gray-50 text-gray-500 text-sm cursor-not-allowed font-medium" 
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-[#111111] mb-1.5">Store Address (Optional)</label>
            <textarea 
              name="address"
              defaultValue={settings.address || ''} 
              rows={2}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F05A28] text-sm" 
              placeholder="123 Main St, Lagos, Nigeria"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#111111] mb-1.5">About Store (Optional)</label>
            <textarea 
              name="about_text"
              defaultValue={settings.about_text || ''} 
              rows={3}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F05A28] text-sm" 
              placeholder="Tell customers about your store..."
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-[#FAF8F5]">
          <h2 className="text-base font-extrabold text-[#111111]">Social Links (Optional)</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-[#111111] mb-1.5">WhatsApp Number</label>
            <input 
              type="text" 
              name="whatsapp"
              defaultValue={store.social_links?.find((s: any) => s.platform === 'whatsapp')?.url || ''} 
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F05A28] text-sm" 
              placeholder="e.g. +2349012345678"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#111111] mb-1.5">TikTok Username</label>
            <div className="flex rounded-xl overflow-hidden border border-gray-200 focus-within:ring-2 focus-within:ring-[#F05A28]">
              <span className="inline-flex items-center px-3.5 border-r border-gray-200 bg-[#FAF8F5] text-gray-500 text-sm font-semibold">@</span>
              <input 
                type="text" 
                name="tiktok"
                defaultValue={store.social_links?.find((s: any) => s.platform === 'tiktok')?.url || ''} 
                className="flex-1 min-w-0 block w-full px-3.5 py-2.5 focus:outline-none text-sm" 
                placeholder="yourstore"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-[#111111] mb-1.5">Instagram Username</label>
            <div className="flex rounded-xl overflow-hidden border border-gray-200 focus-within:ring-2 focus-within:ring-[#F05A28]">
              <span className="inline-flex items-center px-3.5 border-r border-gray-200 bg-[#FAF8F5] text-gray-500 text-sm font-semibold">@</span>
              <input 
                type="text" 
                name="instagram"
                defaultValue={store.social_links?.find((s: any) => s.platform === 'instagram')?.url || ''} 
                className="flex-1 min-w-0 block w-full px-3.5 py-2.5 focus:outline-none text-sm" 
                placeholder="yourstore"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-[#111111] mb-1.5">Twitter (X) Username</label>
            <div className="flex rounded-xl overflow-hidden border border-gray-200 focus-within:ring-2 focus-within:ring-[#F05A28]">
              <span className="inline-flex items-center px-3.5 border-r border-gray-200 bg-[#FAF8F5] text-gray-500 text-sm font-semibold">@</span>
              <input 
                type="text" 
                name="twitter"
                defaultValue={store.social_links?.find((s: any) => s.platform === 'twitter')?.url || ''} 
                className="flex-1 min-w-0 block w-full px-3.5 py-2.5 focus:outline-none text-sm" 
                placeholder="yourstore"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-[#111111] mb-1.5">Facebook Username / Page</label>
            <div className="flex rounded-xl overflow-hidden border border-gray-200 focus-within:ring-2 focus-within:ring-[#F05A28]">
              <span className="inline-flex items-center px-3.5 border-r border-gray-200 bg-[#FAF8F5] text-gray-500 text-sm font-semibold">facebook.com/</span>
              <input 
                type="text" 
                name="facebook"
                defaultValue={store.social_links?.find((s: any) => s.platform === 'facebook')?.url || ''} 
                className="flex-1 min-w-0 block w-full px-3.5 py-2.5 focus:outline-none text-sm" 
                placeholder="yourstore"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-[#FAF8F5] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-[#111111]">Storefront Appearance</h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-gray-200 text-[11px] font-bold text-gray-600">
              <Lock className="w-3 h-3 text-[#F05A28]" /> Unified Maji Theme
            </span>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-gray-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-white border border-[#F05A28]/20 flex items-center justify-center shrink-0 shadow-2xs">
                <MajiLogo variant="symbol-small" colorway="ember-orange" size={24} />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-[#111111]">Official Maji Storefront Palette</h4>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  All Maji storefronts use the standardized Maji marketplace theme (Maji Ember <code className="font-mono text-[#F05A28]">#F05A28</code> primary action buttons, Deep Obsidian <code className="font-mono text-[#111111]">#111111</code>, and Market Alabaster <code className="font-mono text-gray-600">#FAF8F5</code>) for buyer trust and high conversion.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="w-7 h-7 rounded-full bg-[#F05A28] border-2 border-white shadow-xs" title="Maji Ember Primary #F05A28" />
              <span className="w-7 h-7 rounded-full bg-[#111111] border-2 border-white shadow-xs" title="Deep Obsidian #111111" />
              <span className="w-7 h-7 rounded-full bg-[#FAF8F5] border-2 border-gray-200 shadow-xs" title="Market Alabaster #FAF8F5" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-[#111111] mb-1.5">Layout Style</label>
            <select 
              name="layout"
              defaultValue={settings.layout || 'classic'} 
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F05A28] bg-white text-sm font-medium text-[#111111]"
            >
              <option value="classic">Classic (Standard Ecommerce)</option>
              <option value="minimal">Minimal (Clean &amp; Modern)</option>
              <option value="brand">Brand Focused (Highlights Logo &amp; Bio)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  )
}

