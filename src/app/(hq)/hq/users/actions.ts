'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

// Admin client bypasses RLS
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Helper to check if requester is an admin
async function verifyAdmin() {
  const cookieStore = await cookies()
  const authCookie = cookieStore.get('sb-access-token')?.value || cookieStore.getAll().find(c => c.name.endsWith('-auth-token'))?.value
  
  if (!authCookie) return null

  try {
    // Determine the current user UUID from the raw token if possible, or just hit supabase auth getUser
    // Note: next-js auth setups might vary. Using admin client to decode a jwt or verify via standard client is better.
    // For safety, let's just create a standard client with the cookie
    const { createServerClient } = await import('@supabase/ssr')
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          }
        }
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Check admin table
    const { data: isAdmin } = await supabaseAdmin
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .single()

    if (!isAdmin) return null

    return user.id
  } catch (error) {
    return null
  }
}

async function logAudit(adminId: string, action: string, targetId: string | null, details: any) {
  try {
    await supabaseAdmin.from('admin_audit_logs').insert({
      admin_id: adminId,
      action,
      target_id: targetId,
      details
    })
  } catch (e) {
    console.error('Failed to write audit log:', e)
  }
}

export async function deleteUser(targetUserId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const adminId = await verifyAdmin()
    if (!adminId) return { success: false, error: 'Unauthorized: Admin privileges required.' }

    if (adminId === targetUserId) {
      return { success: false, error: 'You cannot delete your own admin account while logged in.' }
    }

    // Attempt to delete user via Admin API
    // Note: Our DB migration 00023_safe_user_deletion.sql handles preserving stores/financials via ON DELETE SET NULL.
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId)

    if (deleteError) {
      return { success: false, error: deleteError.message }
    }

    await logAudit(adminId, 'delete_user', targetUserId, { timestamp: new Date().toISOString() })
    revalidatePath('/hq/users')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'An unexpected error occurred during deletion.' }
  }
}

export async function bulkDeleteUsers(targetUserIds: string[]): Promise<{ success: boolean; error?: string; skipped: string[] }> {
  try {
    const adminId = await verifyAdmin()
    if (!adminId) return { success: false, error: 'Unauthorized: Admin privileges required.', skipped: targetUserIds }

    const skipped: string[] = []
    
    for (const targetId of targetUserIds) {
      if (adminId === targetId) {
        skipped.push(targetId) // Skip self
        continue
      }
      
      const { error } = await supabaseAdmin.auth.admin.deleteUser(targetId)
      if (error) {
        skipped.push(targetId)
      }
    }

    await logAudit(adminId, 'bulk_delete_users', null, { attempted: targetUserIds.length, skipped: skipped.length, timestamp: new Date().toISOString() })
    revalidatePath('/hq/users')
    return { success: true, skipped }
  } catch (error: any) {
    return { success: false, error: error.message || 'An unexpected error occurred.', skipped: targetUserIds }
  }
}

export async function deleteAllEligibleUsers(confirmationText: string): Promise<{ success: boolean; error?: string; deletedCount?: number }> {
  try {
    const adminId = await verifyAdmin()
    if (!adminId) return { success: false, error: 'Unauthorized: Admin privileges required.' }

    if (confirmationText !== 'DELETE ALL USERS') {
      return { success: false, error: 'Invalid confirmation text.' }
    }

    // Fetch all users
    let deletedCount = 0
    let hasMore = true
    let page = 1

    while (hasMore) {
      const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: 1000
      })

      if (listError) throw listError

      if (!usersData.users || usersData.users.length === 0) {
        hasMore = false
        break
      }

      for (const user of usersData.users) {
        if (user.id === adminId) continue // Never delete self

        // We should skip other admins to be safe, unless explicitly required. 
        // We'll skip users who are in the admin_users table to prevent locking out the whole system.
        const { data: isAdmin } = await supabaseAdmin
          .from('admin_users')
          .select('user_id')
          .eq('user_id', user.id)
          .single()

        if (isAdmin) continue // Skip admins for safety

        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
        if (!deleteError) {
          deletedCount++
        }
      }

      page++
      // Basic safeguard: don't loop forever if there's a bug
      if (page > 50) hasMore = false 
    }

    await logAudit(adminId, 'delete_all_eligible_users', null, { deletedCount, timestamp: new Date().toISOString() })
    revalidatePath('/hq/users')
    return { success: true, deletedCount }
  } catch (error: any) {
    return { success: false, error: error.message || 'An unexpected error occurred.' }
  }
}
