import { createClient } from '@/lib/supabase/server'
import { Settings } from 'lucide-react'
import { updatePlatformSettings } from './actions'

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
  const supabase = await createClient()

  const { data: settings } = await supabase
    .from('platform_settings')
    .select('*')
    .single()

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Financial Configuration</h2>
            <p className="text-sm text-gray-500">Configure global platform fees</p>
          </div>
        </div>

        <form action={updatePlatformSettings} className="space-y-6">
          <div>
            <label htmlFor="commissionPercentage" className="block text-sm font-medium text-gray-700 mb-1">
              Commission Percentage (%)
            </label>
            <input
              type="number"
              step="0.01"
              id="commissionPercentage"
              name="commissionPercentage"
              defaultValue={settings?.commission_percentage || 4}
              className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">The percentage taken from the product subtotal.</p>
          </div>
          
          <div>
            <label htmlFor="commissionFixed" className="block text-sm font-medium text-gray-700 mb-1">
              Fixed Fee (₦)
            </label>
            <input
              type="number"
              step="0.01"
              id="commissionFixed"
              name="commissionFixed"
              defaultValue={settings?.commission_fixed_fee || 50}
              className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">The fixed amount added to the platform fee.</p>
          </div>

          <button type="submit" className="px-6 py-2.5 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors">
            Save Settings
          </button>
        </form>
      </div>
    </div>
  )
}
