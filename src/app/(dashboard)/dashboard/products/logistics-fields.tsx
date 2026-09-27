interface ProductLogisticsDefaults {
  weight_kg?: number | null
  length_cm?: number | null
  width_cm?: number | null
  height_cm?: number | null
  fragile?: boolean | null
  delivery_category?: string | null
  service_level?: string | null
}

export function LogisticsFields({
  productType,
  product,
}: {
  productType: string | null
  product?: ProductLogisticsDefaults
}) {
  if (productType !== 'physical') return null

  return (
    <section className="rounded-xl border border-gray-200 bg-gray-50 p-5 space-y-4">
      <div>
        <h3 className="font-semibold text-gray-900">Delivery package details</h3>
        <p className="mt-1 text-sm text-gray-600">
          Enter measured package information. Maji will not estimate missing weight or dimensions.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="text-sm font-medium text-gray-700">
          Weight (kg) <span className="text-red-600">*</span>
          <input
            type="number"
            name="weight_kg"
            min="0.001"
            step="0.001"
            required
            defaultValue={product?.weight_kg ?? ''}
            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2"
            placeholder="Measured weight"
          />
        </label>
        <label className="text-sm font-medium text-gray-700">
          Length (cm) (optional)
          <input type="number" name="length_cm" min="0.1" step="0.1" defaultValue={product?.length_cm ?? ''} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2" />
        </label>
        <label className="text-sm font-medium text-gray-700">
          Width (cm) (optional)
          <input type="number" name="width_cm" min="0.1" step="0.1" defaultValue={product?.width_cm ?? ''} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2" />
        </label>
        <label className="text-sm font-medium text-gray-700">
          Height (cm) (optional)
          <input type="number" name="height_cm" min="0.1" step="0.1" defaultValue={product?.height_cm ?? ''} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2" />
        </label>
        <label className="text-sm font-medium text-gray-700">
          Fragile? <span className="text-red-600">*</span>
          <select name="fragile" required defaultValue={product?.fragile == null ? '' : String(product.fragile)} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2">
            <option value="" disabled>Select one</option>
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        </label>
        <label className="text-sm font-medium text-gray-700">
          Service level <span className="text-red-600">*</span>
          <select name="service_level" required defaultValue={product?.service_level ?? ''} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2">
            <option value="" disabled>Select one</option>
            <option value="standard">Standard</option>
            <option value="express">Express</option>
          </select>
        </label>
        <label className="text-sm font-medium text-gray-700 sm:col-span-3">
          Delivery category (when applicable)
          <input
            type="text"
            name="delivery_category"
            defaultValue={product?.delivery_category ?? ''}
            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2"
            placeholder="For example, food or electronics"
          />
        </label>
      </div>
    </section>
  )
}
