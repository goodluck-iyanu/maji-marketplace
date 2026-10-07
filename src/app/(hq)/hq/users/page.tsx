import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { User } from 'lucide-react'
import { Pagination } from '../components/pagination'
import UsersList from './UsersList'
import DeleteAllUsersZone from './DeleteAllUsersZone'
import { getDateRange } from '@/lib/date-filters'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function AdminUsersPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const pageSize = 20
  const offset = (page - 1) * pageSize

  const search = params.search || ''
  const roleFilter = params.role || 'all'
  const storeFilter = params.store || 'all'
  const dateFilter = params.date || 'all'
  const sort = params.sort || 'newest'

  // Identify current admin ID
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  const currentAdminId = user?.id || null

  // 1. Build Select String based on role/store filters
  // If we want ONLY admins, we inner join admin_users.
  // If we want ONLY sellers, we inner join stores.
  let selectString = '*, stores(id, name), admin_users(user_id)'
  if (roleFilter === 'admin') selectString = '*, stores(id, name), admin_users!inner(user_id)'
  if (storeFilter === 'has_store' || roleFilter === ('seller' as string)) selectString = '*, stores!inner(id, name), admin_users(user_id)'
  // Note: if roleFilter === 'admin' AND storeFilter === 'has_store', we need both inner joins.
  if (roleFilter === 'admin' && (storeFilter === 'has_store' || roleFilter === ('seller' as string))) {
    selectString = '*, stores!inner(id, name), admin_users!inner(user_id)'
  }

  let query = supabaseAdmin
    .from('profiles')
    .select(selectString, { count: 'exact' })

  // 2. Filters that require exclusion (no store, no admin)
  if (storeFilter === 'no_store') {
    // PostgREST doesn't support left join "is null" filtering easily in a single string unless we do it in-memory or via view.
    // We will fetch all and filter in memory if "no_store" or "customer" is selected, 
    // BUT to keep pagination somewhat accurate, we'll over-fetch. 
    // Ideally this is a DB view. We'll increase the limit.
    query = query.limit(1000)
  } else if (roleFilter === 'customer') {
    query = query.limit(1000)
  } else {
    query = query.range(offset, offset + pageSize - 1)
  }

  // 3. Search Logic
  if (search) {
    const { data: matchedStores } = await supabaseAdmin
      .from('stores')
      .select('user_id')
      .or(`name.ilike.%${search}%,slug.ilike.%${search}%`)
      .limit(500)
    
    const matchedStoreUserIds = (matchedStores || []).map(s => s.user_id).filter(Boolean)
    
    const orClauses = [
      `full_name.ilike.%${search}%`,
      `email.ilike.%${search}%`,
      `phone.ilike.%${search}%`
    ]

    // Only add UUID search if it's a valid UUID to prevent Postgres syntax errors
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (uuidRegex.test(search)) {
      orClauses.push(`id.eq.${search}`)
    }

    if (matchedStoreUserIds.length > 0) {
      orClauses.push(`id.in.(${matchedStoreUserIds.join(',')})`)
    }
    
    query = query.or(orClauses.join(','))
  }

  // 4. Date Filter
  if (dateFilter !== 'all') {
    const range = getDateRange(dateFilter)
    if (range) {
      query = query.gte('created_at', range.start).lte('created_at', range.end)
    }
  }

  // 5. Sorting
  switch (sort) {
    case 'newest': query = query.order('created_at', { ascending: false }); break;
    case 'oldest': query = query.order('created_at', { ascending: true }); break;
    case 'name_asc': query = query.order('full_name', { ascending: true }); break;
    case 'name_desc': query = query.order('full_name', { ascending: false }); break;
    default: query = query.order('created_at', { ascending: false });
  }

  const { data: rawProfiles, count, error } = await query

  if (error) {
    console.error('[Admin Users] Error fetching profiles:', error)
  }

  let profiles = ((rawProfiles as any[]) || []).map((p: any) => ({
    ...p,
    isAdmin: p.admin_users && Array.isArray(p.admin_users) ? p.admin_users.length > 0 : !!p.admin_users,
    isSeller: p.stores && Array.isArray(p.stores) ? p.stores.length > 0 : !!p.stores
  }))

  // 6. In-memory filter for exclusions (since PostgREST makes NOT EXISTS hard on joined tables)
  if (storeFilter === 'no_store') profiles = profiles.filter(p => !p.isSeller)
  if (roleFilter === 'customer') profiles = profiles.filter(p => !p.isAdmin)

  // If we overfetched due to in-memory filtering, we slice here.
  let finalCount = count || 0
  if (storeFilter === 'no_store' || roleFilter === 'customer') {
    finalCount = profiles.length
    profiles = profiles.slice(offset, offset + pageSize)
  }

  const totalPages = Math.ceil(finalCount / pageSize)

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <User className="w-6 h-6 text-blue-600" /> Users Directory
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage customers, sellers, and administrators</p>
        </div>
      </div>

      <UsersList profiles={profiles} currentAdminId={currentAdminId} />

      {totalPages > 1 && (
        <div className="mt-6 border-t border-gray-100 pt-4">
          <Pagination totalPages={totalPages} currentPage={page} />
        </div>
      )}

      <DeleteAllUsersZone />
    </div>
  )
}
