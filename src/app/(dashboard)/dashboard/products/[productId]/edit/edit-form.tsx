'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { editProductAction } from '../../actions'
import { SubmitButton } from '../../new/submit-button'

export function EditProductForm({ product, productType }: { product: any, productType: string | null }) {
  const [state, formAction] = useActionState(editProductAction, null)

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="productId" value={product.id} />
      
      {state?.error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm font-medium">
          {state.error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-6 space-y-6">
          
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-blue-800 text-sm">
            <strong>Note:</strong> To change images, please delete this product and create a new one. Image editing is coming soon!
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Product Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              defaultValue={product.name}
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-black transition-shadow"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              id="description"
              rows={4}
              defaultValue={product.description || ''}
              className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-black transition-shadow"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                Price
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">NGN</span>
                </div>
                <input
                  type="number"
                  name="price"
                  id="price"
                  min="0"
                  step="1"
                  defaultValue={product.price}
                  className="w-full pl-12 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-black transition-shadow"
                />
              </div>
            </div>

            <div>
              <label htmlFor="discount_percent" className="block text-sm font-medium text-gray-700 mb-1">
                Discount (%)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">%</span>
                </div>
                <input
                  type="number"
                  name="discount_percent"
                  id="discount_percent"
                  min="0"
                  step="1"
                  defaultValue={product.discount_percent || 0}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-black transition-shadow"
                />
              </div>
            </div>
          </div>

          {product.has_variants && (
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-blue-800 text-sm">
              <strong>Note:</strong> This product has variants (like sizes/colors). Updating the Price here will <strong>bulk-update</strong> all your variants to match this new price. A full individual variant editor will be added in a future update.
              
              {product.product_variants && product.product_variants.length > 0 && (
                <div className="mt-4 bg-white border border-yellow-200 rounded overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-yellow-100/50">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Variant</th>
                        <th className="px-3 py-2 font-semibold">Price</th>
                        <th className="px-3 py-2 font-semibold">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-yellow-100">
                      {product.product_variants.map((v: any) => (
                        <tr key={v.id}>
                          <td className="px-3 py-2 font-medium">{v.title}</td>
                          <td className="px-3 py-2">₦{v.price.toLocaleString()}</td>
                          <td className="px-3 py-2">{v.stock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <div className="pt-4 border-t border-gray-100">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Type
              </label>
              <div className="flex items-center space-x-4 mt-2">
                <label className={`flex items-center ${productType === 'physical' ? 'opacity-100' : 'opacity-50 cursor-not-allowed'}`}>
                  <input type="radio" name="is_digital_radio" value="false" checked={productType === 'physical'} disabled className="h-4 w-4 text-black focus:ring-black border-gray-300 disabled:cursor-not-allowed" readOnly />
                  <span className="ml-2 text-sm text-gray-700">Physical (Ships)</span>
                </label>
                <label className={`flex items-center ${productType === 'digital' ? 'opacity-100' : 'opacity-50 cursor-not-allowed'}`}>
                  <input type="radio" name="is_digital_radio" value="true" checked={productType === 'digital'} disabled className="h-4 w-4 text-black focus:ring-black border-gray-300 disabled:cursor-not-allowed" readOnly />
                  <span className="ml-2 text-sm text-gray-700">Digital (Download)</span>
                </label>
                {/* Hidden input to ensure value is submitted since disabled fields are ignored */}
                <input type="hidden" name="is_digital" value={productType === 'digital' ? 'true' : 'false'} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Link 
          href="/dashboard/products"
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          Cancel
        </Link>
        <SubmitButton label="Save Changes" />
      </div>
    </form>
  )
}
