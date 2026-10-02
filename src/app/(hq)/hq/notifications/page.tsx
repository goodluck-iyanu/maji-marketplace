import { createClient } from '@/lib/supabase/server'
import { Megaphone, BellRing } from 'lucide-react'
import { BroadcastForm } from './broadcast-form'

export const dynamic = 'force-dynamic'

export default async function AdminNotificationsPage() {
  const supabase = await createClient()

  // Fetch all stores for the specific select dropdown
  const { data: stores } = await supabase
    .from('stores')
    .select('id, name, profiles(email)')
    .eq('is_active', true)
    .order('name')

  // Fetch recent broadcasts (notifications created by admin)
  const { data: recentBroadcasts } = await supabase
    .from('notifications')
    .select('title, message, created_at, store_id')
    .eq('type', 'admin_message')
    .order('created_at', { ascending: false })
    .limit(100)

  // We want to group by exact timestamp to show it as one "Broadcast"
  // Since multiple rows are inserted at the exact same moment
  const groupedBroadcasts: Record<string, any> = {}
  
  if (recentBroadcasts) {
    recentBroadcasts.forEach(b => {
      const key = `${b.title}-${b.message}`
      if (!groupedBroadcasts[key]) {
        groupedBroadcasts[key] = {
          title: b.title,
          message: b.message,
          created_at: b.created_at,
          recipientCount: 0
        }
      }
      groupedBroadcasts[key].recipientCount += 1
    })
  }

  const broadcastHistory = Object.values(groupedBroadcasts).sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Broadcast Center</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Compose Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">New Broadcast</h2>
              <p className="text-sm text-gray-500">Send an alert to seller dashboards</p>
            </div>
          </div>
          
          <BroadcastForm stores={stores || []} />
        </div>

        {/* History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-[600px]">
          <div className="flex items-center gap-3 mb-6 shrink-0">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Broadcast History</h2>
              <p className="text-sm text-gray-500">Recently sent messages</p>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {broadcastHistory.map((b, i) => (
              <div key={i} className="p-4 border border-gray-100 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-900">{b.title}</h3>
                  <span className="text-xs text-gray-500 shrink-0 ml-4">{new Date(b.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-3 mb-3">{b.message}</p>
                <div className="flex items-center gap-2">
                  <span className="inline-flex px-2 py-1 bg-white border border-gray-200 rounded-md text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                    {b.recipientCount} Recipient{b.recipientCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            ))}
            
            {broadcastHistory.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <Megaphone className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm">No broadcasts sent yet.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
