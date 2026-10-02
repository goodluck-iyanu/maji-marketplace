import { createClient as createAdminClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Package, Store, Tag, List, Activity } from 'lucide-react'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function AdminProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Fetch product and store
  const { data: product } = await supabaseAdmin
    .from('products')
    .select(`
      *,
      stores (id, name, slug)
    `)
    .eq('id', id)
    .single()

  if (!product) notFound()

  // Try to find if there are variants
  const { data: variants } = await supabaseAdmin
    .from('product_variants')
    .select('*')
    .eq('product_id', id)

  // Try to find recent order items containing this product
  const { data: recentSales } = await supabaseAdmin
    .from('order_items')
    .select(`
      id,
      quantity,
      price_at_purchase,
      orders (id, payment_reference, created_at, payment_status)
    `)
    .eq('product_id', id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Calculate total units sold
  const totalUnitsSold = recentSales?.filter(s => (s.orders as any)?.payment_status === 'paid').reduce((sum, item) => sum + item.quantity, 0) || 0

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/hq/products" className="p-2 -ml-2 text-gray-400 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Product Details</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Product Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="aspect-square bg-gray-50 flex items-center justify-center border-b border-gray-100">
              {product.images && product.images[0] ? (
                <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <Package className="w-16 h-16 text-gray-300" />
              )}
            </div>
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h2>
              <div className="flex gap-2 mb-4">
                <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600">
                  {product.is_digital ? 'Digital' : 'Physical'}
                </span>
                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  product.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {product.is_published ? 'Published' : 'Draft'}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">₦{Number(product.price).toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase mb-1 flex items-center gap-1"><Store className="w-3 h-3"/> Store</p>
              <Link href={`/hq/sellers/${product.stores?.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                {product.stores?.name}
              </Link>
            </div>
            {product.category && (
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase mb-1 flex items-center gap-1"><Tag className="w-3 h-3"/> Category</p>
                <p className="text-sm font-medium text-gray-900">{product.category}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase mb-1 flex items-center gap-1"><List className="w-3 h-3"/> Inventory Stock</p>
              <p className="text-sm font-medium text-gray-900">{product.stock_quantity ?? 'Unlimited'}</p>
            </div>
          </div>
        </div>

        {/* Right Column: Variants and Sales */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Description */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Description</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{product.description || 'No description provided.'}</p>
          </div>

          {/* Variants */}
          {variants && variants.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h3 className="font-bold text-gray-900">Product Variants</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-gray-900 font-medium">
                    <tr>
                      <th className="px-5 py-3">Variant Name</th>
                      <th className="px-5 py-3">Price Adj.</th>
                      <th className="px-5 py-3">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {variants.map(v => (
                      <tr key={v.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3 font-medium text-gray-900">{v.name}</td>
                        <td className="px-5 py-3">{v.price_adjustment ? `+₦${Number(v.price_adjustment).toLocaleString()}` : '-'}</td>
                        <td className="px-5 py-3">{v.stock_quantity ?? '∞'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recent Orders */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-600" /> Recent Sales Activity
              </h3>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{totalUnitsSold} Units Sold (Paid)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-900 font-medium">
                  <tr>
                    <th className="px-5 py-3">Order Ref</th>
                    <th className="px-5 py-3">Qty</th>
                    <th className="px-5 py-3">Price at Purchase</th>
                    <th className="px-5 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentSales?.map(sale => (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <Link href={`/hq/orders/${(sale.orders as any)?.id}`} className="font-mono text-blue-600 hover:underline">
                          {(sale.orders as any)?.payment_reference}
                        </Link>
                        {(sale.orders as any)?.payment_status !== 'paid' && (
                          <span className="ml-2 inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700">
                            Unpaid
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 font-medium">{sale.quantity}</td>
                      <td className="px-5 py-3">₦{Number(sale.price_at_purchase).toLocaleString()}</td>
                      <td className="px-5 py-3 whitespace-nowrap text-xs">
                        {(sale.orders as any)?.created_at ? new Date((sale.orders as any).created_at).toLocaleDateString() : ''}
                      </td>
                    </tr>
                  ))}
                  {(!recentSales || recentSales.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-gray-500">No sales recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}


