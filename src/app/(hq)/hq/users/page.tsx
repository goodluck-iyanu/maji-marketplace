import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Shield, User, Store, Eye } from 'lucide-react'
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
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const params = await searchParams
  const q = params.q || ''
  const page = parseInt(params.page || '1', 10)
  const pageSize = 20
  const offset = (page - 1) * pageSize

  let query = supabaseAdmin
    .from('profiles')
    .select(`
      id,
      email,
      full_name,
      created_at,
      admin_users!left(role),
      stores!left(id, name, slug)
    `, { count: 'exact' })
  
  if (q) {
    query = query.or(`email.ilike.%${q}%,full_name.ilike.%${q}%`)
  }

  const { data: profiles, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (error) {
    console.error('Error fetching users:', error)
  }

  const totalPages = count ? Math.ceil(count / pageSize) : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <SearchInput placeholder="Search by name or email..." />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-900 font-medium">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Store / Seller Status</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {profiles?.map((profile: any) => {
                const isAdmin = profile.admin_users?.length > 0
                const isSeller = profile.stores?.length > 0
                return (
                  <tr key={profile.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                          <User className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{profile.full_name || 'No Name'}</p>
                          <p className="text-xs text-gray-500 truncate">{profile.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {isAdmin ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                          <Shield className="w-3.5 h-3.5" />
                          HQ Staff
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          <User className="w-3.5 h-3.5" />
                          Customer
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {isSeller ? (
                        <div className="flex flex-col">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 w-max mb-1">
                            <Store className="w-3.5 h-3.5" />
                            Seller
                          </span>
                          <span className="text-xs text-gray-500 truncate max-w-[150px]">{profile.stores[0].name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs">
                      {new Date(profile.created_at).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/hq/users/${profile.id}`}
                        className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
              {!profiles?.length && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No users found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination totalPages={totalPages} currentPage={page} />
      </div>
    </div>
  )
}
