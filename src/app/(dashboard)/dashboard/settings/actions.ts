'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveSettingsAction(prevState: any, formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!store) return { error: 'Store not found' }

  const name = (formData.get('name') as string) || ''
  const about_text = (formData.get('about_text') as string) || ''
  const primary_color = (formData.get('primary_color') as string) || '#000000'
  const secondary_color = (formData.get('secondary_color') as string) || '#ffffff'
  const layout = (formData.get('layout') as string) || 'classic'

  const address = (formData.get('address') as string) || ''
  const facebook = (formData.get('facebook') as string) || ''
  const twitter = (formData.get('twitter') as string) || ''
  const instagram = (formData.get('instagram') as string) || ''
  const logoFile = formData.get('logo') as File | null

  if (!name.trim()) {
    return { error: 'Store name is required' }
  }

  // Handle Logo Upload
  let logo_url = undefined
  if (logoFile && logoFile.size > 0) {
    const fileExt = logoFile.name.split('.').pop()
    const fileName = `${store.id}/logo-${Math.random().toString(36).substring(7)}.${fileExt}`
    
    // We reuse product-images bucket or assume 'store-assets' bucket exists
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('store-assets')
      .upload(fileName, logoFile)
      
    if (!uploadError && uploadData) {
      const { data: publicUrl } = supabase.storage.from('store-assets').getPublicUrl(fileName)
      logo_url = publicUrl.publicUrl
    }
  }

  // Update store name
  if (name) {
    await supabase.from('stores').update({ name }).eq('id', store.id)
  }

  const { createClient: createAdminClient } = await import('@supabase/supabase-js')
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const settingsToUpsert: any = {
    store_id: store.id,
    about_text,
    primary_color,
    secondary_color,
    layout,
    address,
  }
  if (logo_url) {
    settingsToUpsert.logo_url = logo_url
  }

  const { error } = await supabaseAdmin.from('store_settings').upsert(settingsToUpsert, { onConflict: 'store_id' })

  // Update Social Links
  await supabaseAdmin.from('social_links').delete().eq('store_id', store.id)
  const linksToInsert = []
  if (facebook) linksToInsert.push({ store_id: store.id, platform: 'facebook', url: facebook })
  if (twitter) linksToInsert.push({ store_id: store.id, platform: 'twitter', url: twitter })
  if (instagram) linksToInsert.push({ store_id: store.id, platform: 'instagram', url: instagram })
  
  if (linksToInsert.length > 0) {
    await supabaseAdmin.from('social_links').insert(linksToInsert)
  }

  if (error) {
    console.error('Save settings error:', error)
    return { error: 'Failed to save settings' }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}
