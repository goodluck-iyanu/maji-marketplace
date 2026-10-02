import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Megaphone } from 'lucide-react'
import { BroadcastForm } from './broadcast-form'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function AdminNotificationsPage() {
  const { data: stores } = await supabaseAdmin
    .from('stores')
    .select('store_category, pickup_state, pickup_country, pickup_city')

  const storeCategoriesRaw = stores?.map(s => s.store_category).filter(Boolean) as string[]
  const storeCategories = Array.from(new Set(storeCategoriesRaw)).sort()

  const countriesRaw = stores?.map(s => s.pickup_country).filter(Boolean) as string[]
  const countries = Array.from(new Set(countriesRaw)).sort()
  
  const statesRaw = stores?.map(s => s.pickup_state).filter(Boolean) as string[]
  const states = Array.from(new Set(statesRaw)).sort()

  let recentBroadcasts = []
  const { data, error } = await supabaseAdmin
    .from('broadcasts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)
  
  if (!error && data) {
    recentBroadcasts = data
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-blue-600" />
            Global Broadcast System
          </h1>
          <p className="text-sm text-gray-500 mt-1">Advanced audience targeting and multi-channel delivery</p>
        </div>
      </div>

      <BroadcastForm 
        categories={storeCategories} 
        countries={countries}
        states={states}
      />

      {/* Broadcast History */}
      <div className="mt-12 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Broadcast History</h2>
          <p className="text-sm text-gray-500">Recent broadcasts sent from HQ</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-100 font-medium text-gray-900">
              <tr>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Audience</th>
                <th className="px-6 py-4">Channels</th>
                <th className="px-6 py-4 text-right">Recipients</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentBroadcasts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No broadcast history found. Ensure you have run migration 00020.
                  </td>
                </tr>
              ) : (
                recentBroadcasts.map((b: any) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{b.title}</p>
                      <p className="text-xs text-gray-500 truncate max-w-xs">{b.message}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700">
                        {b.filters?.audience || 'Global'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        {b.channels?.map((ch: string) => (
                          <span key={ch} className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600">
                            {ch}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                      {b.intended_recipients}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(b.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
