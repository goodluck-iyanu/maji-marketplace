import { createClient as createAdminClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, User, Mail, Calendar, Shield, Store, ShoppingBag } from 'lucide-react'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Fetch complete user profile + admin check + stores
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select(`
      *,
      admin_users(role),
      stores(id, name, slug, is_active, created_at)
    `)
    .eq('id', id)
    .single()

  if (!profile) notFound()

  // Fetch recent orders placed BY this user (purchases)
  const { data: purchases } = await supabaseAdmin
    .from('orders')
    .select('id, payment_reference, total_amount, payment_status, created_at, stores(name)')
    .eq('customer_id', id)
    .order('created_at', { ascending: false })
    .limit(5)

  const isAdmin = profile.admin_users?.length > 0
  const isSeller = profile.stores?.length > 0
  const store = isSeller ? profile.stores[0] : null

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link 
          href="/hq/users" 
          className="p-2 -ml-2 text-gray-400 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
                <User className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">{profile.full_name || 'No Name Provided'}</h2>
              <p className="text-gray-500">{profile.email}</p>
              
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {isAdmin && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                    <Shield className="w-3.5 h-3.5" /> HQ Staff
                  </span>
                )}
                {isSeller && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                    <Store className="w-3.5 h-3.5" /> Seller
                  </span>
                )}
                {!isAdmin && !isSeller && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                    Customer
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-gray-100">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase">Email Address</p>
                  <p className="text-sm font-medium text-gray-900">{profile.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase">Joined Maji</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(profile.created_at).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase">User ID</p>
                  <p className="text-xs font-mono text-gray-900 break-all">{profile.id}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Relationships */}
        <div className="lg:col-span-2 space-y-6">
          
          {isSeller && store && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Store className="w-5 h-5 text-blue-600" /> Seller Relationship
                </h3>
                <Link 
                  href={`/hq/sellers/${store.id}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  View Store &rarr;
                </Link>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Store Name</p>
                  <p className="font-medium text-gray-900">{store.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Store Status</p>
                  <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold mt-1 ${store.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {store.is_active ? 'Active' : 'Suspended'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-gray-600" /> Recent Purchases
              </h3>
            </div>
            {(!purchases || purchases.length === 0) ? (
              <div className="p-6 text-center text-gray-500 text-sm">
                This user has not placed any orders yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-gray-900 font-medium">
                    <tr>
                      <th className="px-6 py-3">Order Ref</th>
                      <th className="px-6 py-3">Store</th>
                      <th className="px-6 py-3">Amount</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {purchases.map(order => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3">
                          <Link href={`/hq/orders/${order.id}`} className="font-mono text-blue-600 hover:underline">
                            {order.payment_reference}
                          </Link>
                        </td>
                        <td className="px-6 py-3">{order.stores?.name}</td>
                        <td className="px-6 py-3 font-medium text-gray-900">
                          ₦{Number(order.total_amount).toLocaleString()}
                        </td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {order.payment_status}
                          </span>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {purchases && purchases.length === 5 && (
              <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                <Link href={`/hq/orders?q=${profile.email}`} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                  View all orders by {profile.full_name?.split(' ')[0] || 'user'} &rarr;
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
