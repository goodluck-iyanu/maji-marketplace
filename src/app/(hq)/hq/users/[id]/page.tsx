import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { User, Mail, Phone, Calendar, Store, ArrowLeft, Shield, Package, ShoppingBag, Wallet, ArrowUpRight } from 'lucide-react'
import DeleteUserButton from './DeleteUserButton'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function AdminUserDetailsPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select(`
      *,
      admin_users(user_id)
    `)
    .eq('id', id)
    .single()

  if (!profile) notFound()

  const isAdmin = profile.admin_users && Array.isArray(profile.admin_users) ? profile.admin_users.length > 0 : !!profile.admin_users

  // Identify current admin ID
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  const currentAdminId = user?.id || null

  const { data: store } = await supabaseAdmin
    .from('stores')
    .select('*')
    .eq('user_id', id)
    .single()

  const isSeller = !!store

  const { data: buyerOrders } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('customer_email', profile.email)
    .order('created_at', { ascending: false })

  const totalSpent = (buyerOrders || [])
    .filter(o => o.payment_status === 'paid')
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0)

  let sellerMetrics = {
    productsCount: 0,
    totalSales: 0,
    pendingBalance: 0,
    payoutAccount: null as any
  }

  if (isSeller) {
    const { count } = await supabaseAdmin
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', store.id)
    sellerMetrics.productsCount = count || 0

    const { data: txs } = await supabaseAdmin
      .from('financial_transactions')
      .select('amount, status, transaction_type')
      .eq('store_id', store.id)

    if (txs) {
      sellerMetrics.totalSales = txs
        .filter(t => t.transaction_type === 'product_sale' && t.status === 'completed')
        .reduce((sum, t) => sum + Number(t.amount), 0)
    }

    const { data: ledger } = await supabaseAdmin
      .from('seller_ledger')
      .select('pending_balance')
      .eq('store_id', store.id)
      .single()
    if (ledger) {
      sellerMetrics.pendingBalance = Number(ledger.pending_balance || 0)
    }

    const { data: payoutAcct } = await supabaseAdmin
      .from('store_payout_accounts')
      .select('*')
      .eq('store_id', store.id)
      .eq('is_primary', true)
      .single()
    sellerMetrics.payoutAccount = payoutAcct
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div>
        <Link href="/hq/users" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Users Directory
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-2xl shrink-0">
            {profile.full_name?.charAt(0)?.toUpperCase() || <User className="w-8 h-8" />}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              {profile.full_name || 'No Name'}
              {isAdmin && <span className="px-3 py-1 text-xs font-bold bg-purple-100 text-purple-700 rounded-full flex items-center gap-1"><Shield className="w-3 h-3"/> ADMIN</span>}
            </h1>
            <p className="text-gray-500 font-mono text-sm mt-1">{profile.id}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* LEFT COL: Profile & Buyer Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2"><User className="w-4 h-4 text-gray-400"/> Profile Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-gray-600">
                <Mail className="w-4 h-4 text-gray-400 shrink-0"/> {profile.email}
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Phone className="w-4 h-4 text-gray-400 shrink-0"/> {profile.phone || 'No phone number'}
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Calendar className="w-4 h-4 text-gray-400 shrink-0"/> Joined {new Date(profile.created_at).toLocaleDateString()}
              </div>
            </div>

            <DeleteUserButton user={{ ...profile, isAdmin }} store={store} currentAdminId={currentAdminId} />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2"><ShoppingBag className="w-4 h-4 text-blue-500"/> Buyer Metrics</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs font-medium text-gray-500">Total Orders</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{buyerOrders?.length || 0}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-xs font-medium text-blue-600">Total Spent</p>
                <p className="text-xl font-bold text-blue-900 mt-1">₦{totalSpent.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COL: Seller Info & Orders */}
        <div className="md:col-span-2 space-y-6">
          
          {/* SELLER CARD */}
          {isSeller ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-900 p-6 flex items-start justify-between">
                <div>
                  <h2 className="font-bold text-white flex items-center gap-2 text-lg">
                    <Store className="w-5 h-5 text-gray-400"/> Seller Profile: {store.name}
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">{store.slug} • {store.store_category || 'Uncategorized'}</p>
                </div>
                {store.is_active ? (
                  <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-500/20">Active Store</span>
                ) : (
                  <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold border border-red-500/20">Inactive</span>
                )}
              </div>
              <div className="p-6">
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <p className="text-xs font-medium text-gray-500 flex items-center gap-1"><Package className="w-3 h-3"/> Products</p>
                    <p className="text-xl font-bold text-gray-900 mt-2">{sellerMetrics.productsCount}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Total Sales Earned</p>
                    <p className="text-xl font-bold text-gray-900 mt-2">₦{sellerMetrics.totalSales.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Pending Balance</p>
                    <p className="text-xl font-bold text-orange-600 mt-2">₦{sellerMetrics.pendingBalance.toLocaleString()}</p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">Payout Account</p>
                    {sellerMetrics.payoutAccount ? (
                      <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-gray-400"/>
                        {sellerMetrics.payoutAccount.account_name} • {sellerMetrics.payoutAccount.bank_code}
                      </p>
                    ) : (
                      <p className="text-sm text-red-500">Not configured</p>
                    )}
                  </div>
                  <Link href={`/hq/payouts/${store.id}`} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-semibold text-sm transition-colors">
                    View Ledger <ArrowUpRight className="w-4 h-4"/>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center">
              <Store className="w-8 h-8 text-gray-300 mb-3" />
              <p className="font-semibold text-gray-900">Not a Seller</p>
              <p className="text-sm text-gray-500 mt-1 max-w-sm">This user only has a customer profile and has not opened a store on Maji.</p>
            </div>
          )}

          {/* BUYER ORDER HISTORY */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Purchase History</h2>
              <span className="text-xs font-semibold text-gray-500">{buyerOrders?.length || 0} orders</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 border-b border-gray-100 font-medium">
                  <tr>
                    <th className="px-6 py-3">Reference</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(!buyerOrders || buyerOrders.length === 0) ? (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No purchases found.</td></tr>
                  ) : (
                    buyerOrders.slice(0, 10).map((o: any) => (
                      <tr key={o.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3">
                          <Link href={`/hq/orders?search=${o.payment_reference}`} className="font-mono font-medium text-blue-600 hover:underline">
                            {o.payment_reference}
                          </Link>
                        </td>
                        <td className="px-6 py-3 text-xs">{new Date(o.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-3">
                          {o.payment_status === 'paid' ? (
                            <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700">Paid</span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700">Pending</span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-right font-bold text-gray-900">
                          ₦{Number(o.total_amount).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {buyerOrders && buyerOrders.length > 10 && (
                <div className="p-4 bg-gray-50 border-t border-gray-100 text-center text-xs font-medium text-gray-500">
                  Showing latest 10 orders
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
