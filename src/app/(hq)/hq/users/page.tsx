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

  // Query our new secure HQ users view
  let query = supabaseAdmin
    .from('hq_users_directory')
    .select('*', { count: 'exact' })

  // 1. Role Filter
  if (roleFilter === 'admin') {
    query = query.eq('is_admin', true)
  } else if (roleFilter === 'seller') {
    query = query.eq('is_seller', true)
  } else if (roleFilter === 'customer') {
    // customers = not an admin
    query = query.eq('is_admin', false)
  }

  // 2. Store Filter
  if (storeFilter === 'has_store') {
    query = query.eq('is_seller', true)
  } else if (storeFilter === 'no_store') {
    query = query.eq('is_seller', false)
  }

  // 3. Search Logic
  if (search) {
    const orClauses = [
      `full_name.ilike.%${search}%`,
      `email.ilike.%${search}%`,
      `phone.ilike.%${search}%`,
      `store_name.ilike.%${search}%`,
      `store_slug.ilike.%${search}%`
    ]

    // Only add UUID search if it's a valid UUID to prevent Postgres syntax errors
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (uuidRegex.test(search)) {
      orClauses.push(`id.eq.${search}`)
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

  // Pagination
  query = query.range(offset, offset + pageSize - 1)

  const { data: rawProfiles, count, error } = await query

  if (error) {
    console.error('[Admin Users] Error fetching profiles:', error)
  }

  const profiles = (rawProfiles || []).map((p: any) => ({
    ...p,
    isAdmin: p.is_admin,
    isSeller: p.is_seller,
    stores: p.store_id ? [{ name: p.store_name, slug: p.store_slug }] : []
  }))

  const finalCount = count || 0
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

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl">
          <h2 className="font-bold mb-2">Error loading users</h2>
          <p className="text-sm mb-4">The database query failed. This usually means the <code>hq_users_directory</code> view has not been applied to your database yet.</p>
          <div className="bg-white p-4 rounded text-sm font-mono overflow-x-auto text-red-900 border border-red-100">
            {error.message}
          </div>
          <p className="text-sm mt-4 text-red-800 font-medium">Please run: <code>npx supabase db push</code> or manually apply the latest SQL migration in your Supabase dashboard.</p>
        </div>
      ) : (
        <UsersList profiles={profiles} currentAdminId={currentAdminId} totalCount={finalCount} />
      )}

      {totalPages > 1 && (
        <div className="mt-6 border-t border-gray-100 pt-4">
          <Pagination totalPages={totalPages} currentPage={page} />
        </div>
      )}

      {/* Put Danger Zone inside a collapsed section */}
      <div className="mt-16 border-t border-gray-200 pt-8">
        <details className="group">
          <summary className="cursor-pointer text-sm font-bold text-gray-500 hover:text-red-600 transition-colors list-none flex items-center justify-center gap-2">
            <span>Show Danger Zone</span>
          </summary>
          <div className="mt-4">
            <DeleteAllUsersZone />
          </div>
        </details>
      </div>
    </div>
  )
}
