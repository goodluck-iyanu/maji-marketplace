import { createClient } from '@/lib/supabase/server'
import { Shield, User, Store } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const supabase = await createClient()

  // Fetch all profiles, plus their admin role and store info if they have any
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select(`
      id,
      email,
      full_name,
      created_at,
      admin_users!left(role),
      stores!left(id, name, slug)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching users:', error)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
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
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{profile.full_name || 'No Name'}</p>
                          <p className="text-xs text-gray-500">{profile.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {isAdmin ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                          <Shield className="w-3.5 h-3.5" />
                          Admin
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
                  </tr>
                )
              })}
              {!profiles?.length && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
