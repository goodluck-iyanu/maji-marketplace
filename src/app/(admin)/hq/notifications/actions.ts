'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function sendBroadcast(formData: FormData) {
  const supabase = await createClient()

  // Verify Admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: adminRole } = await supabase.from('admin_users').select('role').eq('user_id', user.id).single()
  if (!adminRole) throw new Error('Unauthorized')

  const title = formData.get('title') as string
  const message = formData.get('message') as string
  const link = formData.get('link') as string
  const audience = formData.get('audience') as string
  const specificStores = formData.getAll('specificStores') as string[] // store UUIDs

  if (!title || !message) {
    throw new Error('Title and message are required')
  }

  let storeIdsToNotify: string[] = []

  if (audience === 'all') {
    const { data: stores } = await supabase.from('stores').select('id')
    storeIdsToNotify = stores?.map(s => s.id) || []
  } 
  else if (audience === 'inactive_7') {
    // Find all stores
    const { data: stores } = await supabase.from('stores').select('id')
    const allStoreIds = stores?.map(s => s.id) || []

    // Find stores with orders in the last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('store_id')
      .gte('created_at', sevenDaysAgo.toISOString())

    const activeStoreIds = new Set(recentOrders?.map(o => o.store_id) || [])

    // Filter to stores NOT in activeStoreIds
    storeIdsToNotify = allStoreIds.filter(id => !activeStoreIds.has(id))
  }
  else if (audience === 'specific') {
    storeIdsToNotify = specificStores
  }

  if (storeIdsToNotify.length === 0) {
    return { success: false, message: 'No stores matched this audience criteria.' }
  }

  // Build notifications array
  const notifications = storeIdsToNotify.map(store_id => ({
    store_id,
    title,
    message,
    type: 'admin_message',
    link: link || null,
    is_read: false
  }))

  // Insert in batches if very large, but Supabase handles up to 1000s easily
  const { error } = await supabase.from('notifications').insert(notifications)

  if (error) {
    console.error('Failed to send broadcast:', error)
    return { success: false, message: 'Failed to send broadcast.' }
  }

  revalidatePath('/hq/notifications')
  return { success: true, message: `Successfully sent to ${storeIdsToNotify.length} stores.` }
}
