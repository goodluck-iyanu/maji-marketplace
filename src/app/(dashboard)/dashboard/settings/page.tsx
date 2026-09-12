import { createClient } from '@/lib/supabase/server'
import { SubmitButton } from './submit-button'
import { saveSettingsAction } from './actions'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: store } = await supabase
    .from('stores')
    .select('*, store_settings(*)')
    .eq('user_id', user!.id)
    .single()

  const settings = Array.isArray(store?.store_settings) 
    ? store?.store_settings[0] 
    : (store?.store_settings || {})

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Store Settings</h1>

      <form action={saveSettingsAction} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-medium text-gray-900">General Information</h2>
          </div>
          <div className="p-6 space-y-4">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">About Store</label>
              <textarea 
                name="about_text"
                defaultValue={settings.about_text || ''} 
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black" 
                placeholder="Tell customers about your store..."
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-medium text-gray-900">Appearance</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
              <div className="flex items-center gap-3">
                <input 
                  type="color" 
                  name="primary_color"
                  defaultValue={settings.primary_color || '#000000'} 
                  className="h-10 w-10 border-0 p-0 rounded-md" 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
              <div className="flex items-center gap-3">
                <input 
                  type="color" 
                  name="secondary_color"
                  defaultValue={settings.secondary_color || '#ffffff'} 
                  className="h-10 w-10 border-0 p-0 rounded-md" 
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Layout Style</label>
              <select 
                name="layout"
                defaultValue={settings.layout || 'classic'} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
              >
                <option value="classic">Classic</option>
                <option value="minimal">Minimal</option>
                <option value="brand">Brand Focused</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <SubmitButton />
        </div>
      </form>
    </div>
  )
}

