import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsForm } from './settings-form'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const { data: store } = await supabase
    .from('stores')
    .select('*, store_settings(*), social_links(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!store) {
    redirect('/onboarding')
  }

  const settings = Array.isArray(store.store_settings) 
    ? store.store_settings[0] 
    : (store.store_settings || {})

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#111111]">Store Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your store profile, social links, and storefront layout</p>
      </div>
      <SettingsForm store={store} settings={settings} />
    </div>
  )
}


