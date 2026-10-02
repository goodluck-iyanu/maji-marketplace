import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Store, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminSellersPage() {
  const supabase = await createClient()

  const { data: stores, error } = await supabase
    .from('stores')
    .select(`
      id,
      name,
      slug,
      is_active,
      created_at,
      profiles (full_name, email),
      products (id),
      orders (id, total_amount, payment_status)
    `)
    .order('created_at', { ascending: false })

  if (error) console.error('Error fetching stores:', error)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Sellers & Stores</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-900 font-medium">
              <tr>
                <th className="px-6 py-4">Store</th>
                <th className="px-6 py-4">Owner</th>
                <th className="px-6 py-4 text-center">Products</th>
                <th className="px-6 py-4 text-center">Orders</th>
                <th className="px-6 py-4 text-right">GMV</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stores?.map((store: any) => {
                const owner = store.profiles
                const productCount = store.products?.length || 0
                const paidOrders = store.orders?.filter((o: any) => o.payment_status === 'paid') || []
                const gmv = paidOrders.reduce((sum: number, o: any) => sum + (Number(o.total_amount) || 0), 0)

                return (
                  <tr key={store.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-indigo-50 flex items-center justify-center text-indigo-500 flex-shrink-0">
                          <Store className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 truncate max-w-[200px]">{store.name}</p>
                          <p className="text-xs text-gray-500">/{store.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{owner?.full_name || 'No Name'}</p>
                      <p className="text-xs text-gray-500">{owner?.email}</p>
                    </td>
                    <td className="px-6 py-4 text-center font-medium">
                      {productCount}
                    </td>
                    <td className="px-6 py-4 text-center font-medium">
                      {paidOrders.length}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900">
                      ₦{gmv.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        store.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {store.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {/* We'll implement individual store details page later if needed, for now link to their public store */}
                      <Link href={`/store/${store.slug}`} target="_blank" className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-indigo-600 transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
              {!stores?.length && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No stores found.
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
