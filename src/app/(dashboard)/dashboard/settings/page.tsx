import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from './settings-form'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: store } = await supabase
    .from('stores')
    .select('*, store_settings(*), social_links(*)')
    .eq('user_id', user!.id)
    .single()

  const settings = Array.isArray(store?.store_settings) 
    ? store?.store_settings[0] 
    : (store?.store_settings || {})

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Store Settings</h1>
      <SettingsForm store={store} settings={settings} />
    </div>
  )
}

