'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createStoreAction(prevState: any, formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const name = formData.get('storeName') as string
  const productType = formData.get('productType') as string
  const address = formData.get('address') as string
  const storeCategory = formData.get('storeCategory') as string
  
  const facebook = formData.get('facebook') as string
  const twitter = formData.get('twitter') as string
  const x = formData.get('x') as string
  const instagram = formData.get('instagram') as string
  const tiktok = formData.get('tiktok') as string
  const whatsapp = formData.get('whatsapp') as string
  const youtube = formData.get('youtube') as string
  const linkedin = formData.get('linkedin') as string
  const telegram = formData.get('telegram') as string
  const logoFile = formData.get('logo') as File | null

  if (!name || !name.trim()) {
    return { error: 'Store name is required' }
  }

  // Basic slugify
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') || 'store'

  // Call the postgres function to get a unique slug
  const { data: uniqueSlug, error: slugError } = await supabase
    .rpc('generate_unique_store_slug', { base_slug: baseSlug })

  if (slugError) {
    console.error('Slug error:', slugError)
    return { error: 'Failed to generate store URL.' }
  }

  // Insert the store
  const { data: store, error: storeError } = await supabase
    .from('stores')
    .insert({
      user_id: user.id,
      name: name,
      slug: uniqueSlug,
      product_type: productType,
      store_category: storeCategory,
    })
    .select('id')
    .single()

  if (storeError) {
    console.error('Store error:', storeError)
    if (storeError.code === '23505') {
      return { error: 'This store name is currently unavailable. Please try another.' }
    }
    return { error: 'Could not create store. Please try again.' }
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

  // Initialize store settings
  const settingsToInsert: any = {
    store_id: store.id,
  }
  if (address) settingsToInsert.address = address
  if (logo_url) settingsToInsert.logo_url = logo_url

  const { error: settingsError } = await supabase
    .from('store_settings')
    .insert(settingsToInsert)

  if (settingsError) {
    console.error('Settings error:', settingsError)
    // Non-fatal
  }

  // Insert Social Links
  const linksToInsert = []
  if (facebook) linksToInsert.push({ store_id: store.id, platform: 'facebook', url: facebook })
  if (twitter) linksToInsert.push({ store_id: store.id, platform: 'twitter', url: twitter })
  if (x) linksToInsert.push({ store_id: store.id, platform: 'x', url: x })
  if (instagram) linksToInsert.push({ store_id: store.id, platform: 'instagram', url: instagram })
  if (tiktok) linksToInsert.push({ store_id: store.id, platform: 'tiktok', url: tiktok })
  if (whatsapp) linksToInsert.push({ store_id: store.id, platform: 'whatsapp', url: whatsapp })
  if (youtube) linksToInsert.push({ store_id: store.id, platform: 'youtube', url: youtube })
  if (linkedin) linksToInsert.push({ store_id: store.id, platform: 'linkedin', url: linkedin })
  if (telegram) linksToInsert.push({ store_id: store.id, platform: 'telegram', url: telegram })
  
  if (linksToInsert.length > 0) {
    await supabase.from('social_links').insert(linksToInsert)
  }

  // Redirect to their dashboard
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
