'use client'

import { useActionState, useState } from 'react'
import { SubmitButton } from './submit-button'
import { saveSettingsAction } from './actions'

export function SettingsForm({ store, settings }: { store: any, settings: any }) {
  const [state, formAction] = useActionState(saveSettingsAction, null)
  const [primaryColor, setPrimaryColor] = useState(settings.primary_color || '#000000')
  const [secondaryColor, setSecondaryColor] = useState(settings.secondary_color || '#ffffff')

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm font-medium">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm font-medium">
          Settings saved successfully!
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-medium text-gray-900">General Information</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Store Logo</label>
            {settings.logo_url && (
              <div className="mb-2">
                <img src={settings.logo_url} alt="Store Logo" className="h-16 w-16 object-cover rounded-md border" />
              </div>
            )}
            <input 
              type="file" 
              name="logo"
              accept="image/*"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black" 
            />
            <p className="text-xs text-gray-500 mt-1">Upload a square image (optional).</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
            <input 
              type="text" 
              name="name"
              defaultValue={store?.name} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Store URL Slug</label>
            <div className="flex rounded-md shadow-sm">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                maji.hoberg.com.ng/store/
              </span>
              <input 
                type="text" 
                defaultValue={store?.slug} 
                disabled
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 bg-gray-50 text-gray-500 sm:text-sm cursor-not-allowed" 
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Store Address (Optional)</label>
            <textarea 
              name="address"
              defaultValue={settings.address || ''} 
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black" 
              placeholder="123 Main St, Lagos, Nigeria"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">About Store (Optional)</label>
            <textarea 
              name="about_text"
              defaultValue={settings.about_text || ''} 
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black" 
              placeholder="Tell customers about your store..."
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-medium text-gray-900">Social Links (Optional)</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
            <input 
              type="text" 
              name="whatsapp"
              defaultValue={store.social_links?.find((s: any) => s.platform === 'whatsapp')?.url || ''} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black" 
              placeholder="e.g. +2349012345678"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">TikTok Username</label>
            <div className="flex rounded-md shadow-sm">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">@</span>
              <input 
                type="text" 
                name="tiktok"
                defaultValue={store.social_links?.find((s: any) => s.platform === 'tiktok')?.url || ''} 
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-black focus:border-black sm:text-sm" 
                placeholder="yourstore"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instagram Username</label>
            <div className="flex rounded-md shadow-sm">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">@</span>
              <input 
                type="text" 
                name="instagram"
                defaultValue={store.social_links?.find((s: any) => s.platform === 'instagram')?.url || ''} 
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-black focus:border-black sm:text-sm" 
                placeholder="yourstore"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Twitter (X) Username</label>
            <div className="flex rounded-md shadow-sm">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">@</span>
              <input 
                type="text" 
                name="twitter"
                defaultValue={store.social_links?.find((s: any) => s.platform === 'twitter')?.url || ''} 
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-black focus:border-black sm:text-sm" 
                placeholder="yourstore"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Facebook Username / Page</label>
            <div className="flex rounded-md shadow-sm">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">facebook.com/</span>
              <input 
                type="text" 
                name="facebook"
                defaultValue={store.social_links?.find((s: any) => s.platform === 'facebook')?.url || ''} 
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-black focus:border-black sm:text-sm" 
                placeholder="yourstore"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Appearance</h2>
          <button 
            type="button" 
            onClick={() => { setPrimaryColor('#000000'); setSecondaryColor('#ffffff'); }}
            className="text-sm font-medium text-gray-600 hover:text-black border px-3 py-1 rounded bg-white hover:bg-gray-100 transition-colors"
          >
            Reset to Default
          </button>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <label className="block text-sm font-bold text-gray-900 mb-1">Brand Color (Primary)</label>
            <p className="text-xs text-gray-500 mb-3">Main color used for buttons, badges, and accents.</p>
            <div className="flex items-center gap-3">
              <input 
                type="color" 
                name="primary_color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-16 cursor-pointer border border-gray-300 rounded p-0.5" 
              />
              <span className="text-sm font-mono font-medium text-gray-600 uppercase">{primaryColor}</span>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <label className="block text-sm font-bold text-gray-900 mb-1">Text Color (Secondary)</label>
            <p className="text-xs text-gray-500 mb-3">Color used for the text inside your primary buttons.</p>
            <div className="flex items-center gap-3">
              <input 
                type="color" 
                name="secondary_color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="h-10 w-16 cursor-pointer border border-gray-300 rounded p-0.5" 
              />
              <span className="text-sm font-mono font-medium text-gray-600 uppercase">{secondaryColor}</span>
            </div>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-gray-900 mb-2">Live Preview</label>
            <div 
              className="p-6 rounded-lg flex items-center justify-between border shadow-sm transition-colors duration-300" 
              style={{ backgroundColor: primaryColor, color: secondaryColor, borderColor: primaryColor }}
            >
              <div>
                <h4 className="font-bold text-lg sm:text-xl">Your Custom Store</h4>
                <p className="opacity-90 text-sm mt-1">This is how your Add to Cart buttons will look.</p>
              </div>
              <div 
                className="px-4 py-2 sm:px-6 sm:py-3 rounded font-bold shadow-sm" 
                style={{ backgroundColor: secondaryColor, color: primaryColor }}
              >
                Add to Cart
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-gray-900 mb-1 mt-2">Layout Style</label>
            <select 
              name="layout"
              defaultValue={settings.layout || 'classic'} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black bg-white"
            >
              <option value="classic">Classic (Standard Ecommerce)</option>
              <option value="minimal">Minimal (Clean & Modern)</option>
              <option value="brand">Brand Focused (Highlights Logo & Bio)</option>
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

