import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Shield, User, Store, Eye, Search, Filter } from 'lucide-react'
import Link from 'next/link'
import { SearchInput } from '../components/search-input'
import { Pagination } from '../components/pagination'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; role?: string; type?: string }>
}) {
  const params = await searchParams
  const q = params.q || ''
  const roleFilter = params.role || 'all'
  const typeFilter = params.type || 'all'
  const page = parseInt(params.page || '1', 10)
  const pageSize = 20
  const offset = (page - 1) * pageSize

  // Fetch all admin user IDs for manual stitching
  const { data: adminUsersData } = await supabaseAdmin.from('admin_users').select('user_id, role')
  const adminMap = new Map()
  adminUsersData?.forEach(a => adminMap.set(a.user_id, a.role))

  // Fetch profiles
  let query = supabaseAdmin
    .from('profiles')
    .select(`
      id,
      email,
      full_name,
      phone,
      created_at,
      stores(id, name, slug)
    `, { count: 'exact' })
  
  if (q) {
    query = query.or(`email.ilike.%${q}%,full_name.ilike.%${q}%`)
  }

  const { data: rawProfiles, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (error) {
    console.error('[Admin Users] Error fetching profiles:', error)
  }

  // Process profiles
  let profiles = (rawProfiles || []).map(p => {
    const adminRole = adminMap.get(p.id)
    return {
      ...p,
      isAdmin: !!adminRole,
      adminRole: adminRole || null,
      isSeller: p.stores && (p.stores as any[]).length > 0
    }
  })

  // Apply manual filters since we stitched roles and stores array checking in memory
  if (roleFilter === 'admin') profiles = profiles.filter(p => p.isAdmin)
  else if (roleFilter === 'customer') profiles = profiles.filter(p => !p.isAdmin)

  if (typeFilter === 'seller') profiles = profiles.filter(p => p.isSeller)
  else if (typeFilter === 'buyer') profiles = profiles.filter(p => !p.isSeller)

  const totalPages = count ? Math.ceil(count / pageSize) : 0

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

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center justify-between">
        <div className="w-full sm:w-96">
          <SearchInput placeholder="Search by name or email..." />
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-gray-500 font-medium">Role:</span>
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <Link href={`?q=${q}&type=${typeFilter}&role=all`} className={`px-3 py-1.5 rounded-md text-xs font-semibold ${roleFilter === 'all' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>All</Link>
              <Link href={`?q=${q}&type=${typeFilter}&role=customer`} className={`px-3 py-1.5 rounded-md text-xs font-semibold ${roleFilter === 'customer' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>Customers</Link>
              <Link href={`?q=${q}&type=${typeFilter}&role=admin`} className={`px-3 py-1.5 rounded-md text-xs font-semibold ${roleFilter === 'admin' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>Admins</Link>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 font-medium">Type:</span>
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <Link href={`?q=${q}&role=${roleFilter}&type=all`} className={`px-3 py-1.5 rounded-md text-xs font-semibold ${typeFilter === 'all' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>All</Link>
              <Link href={`?q=${q}&role=${roleFilter}&type=seller`} className={`px-3 py-1.5 rounded-md text-xs font-semibold ${typeFilter === 'seller' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>Sellers</Link>
              <Link href={`?q=${q}&role=${roleFilter}&type=buyer`} className={`px-3 py-1.5 rounded-md text-xs font-semibold ${typeFilter === 'buyer' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>Buyers Only</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-900 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {profiles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : (
                profiles.map((profile: any) => (
                  <tr key={profile.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 font-bold text-lg">
                          {profile.full_name?.charAt(0)?.toUpperCase() || <User className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 truncate">{profile.full_name || 'No Name'}</p>
                          <p className="text-xs text-gray-500 font-mono truncate">{profile.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900">{profile.email}</p>
                      {profile.phone && <p className="text-xs text-gray-500 mt-1">{profile.phone}</p>}
                    </td>
                    <td className="px-6 py-4">
                      {profile.isAdmin ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                          <Shield className="w-3 h-3" />
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          Customer
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {profile.isSeller ? (
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 w-max">
                            <Store className="w-3 h-3" />
                            Seller
                          </span>
                          <span className="text-[10px] text-gray-500 font-medium truncate max-w-[120px]">
                            {(profile.stores as any[])[0]?.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Buyer only</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium">
                      {new Date(profile.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/hq/users/${profile.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold text-xs transition-colors shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination totalPages={totalPages} />
        </div>
      )}
    </div>
  )
}
