'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useCallback, useTransition } from 'react'
import { Filter, X, Search, SlidersHorizontal, Check } from 'lucide-react'

// Helper to update URL params
function updateParams(currentParams: URLSearchParams, key: string, value: string | null) {
  const newParams = new URLSearchParams(currentParams.toString())
  if (value && value !== 'all') {
    newParams.set(key, value)
  } else {
    newParams.delete(key)
  }
  newParams.set('page', '1') // reset pagination on filter change
  return newParams.toString()
}

export default function OrderFilters({ storeOptions }: { storeOptions: { id: string, name: string }[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  const [isOpen, setIsOpen] = useState(false)
  
  // Local state for debounced search
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')

  const currentFilters = {
    search: searchParams.get('search'),
    payment: searchParams.get('payment') || 'all',
    delivery: searchParams.get('delivery') || 'all',
    status: searchParams.get('status') || 'all',
    date: searchParams.get('date') || 'all',
    date_from: searchParams.get('date_from'),
    date_to: searchParams.get('date_to'),
    amount: searchParams.get('amount') || 'all',
    amount_min: searchParams.get('amount_min'),
    amount_max: searchParams.get('amount_max'),
    fulfilment: searchParams.get('fulfilment') || 'all',
    seller: searchParams.get('seller') || 'all',
    tracking: searchParams.get('tracking') || 'all',
    provider: searchParams.get('provider') || 'all',
    sort: searchParams.get('sort') || 'newest'
  }

  // Handle Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== (searchParams.get('search') || '')) {
        startTransition(() => {
          router.push(`?${updateParams(searchParams, 'search', searchTerm || null)}`)
        })
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm, searchParams, router])

  const handleFilterChange = (key: string, value: string) => {
    startTransition(() => {
      router.push(`?${updateParams(searchParams, key, value)}`)
    })
  }

  const clearAll = () => {
    setSearchTerm('')
    startTransition(() => {
      router.push('?')
    })
    setIsOpen(false)
  }

  const removeFilter = (key: string) => {
    if (key === 'search') setSearchTerm('')
    handleFilterChange(key, 'all')
  }

  // Generate Chips
  const chips = []
  if (currentFilters.search) chips.push({ key: 'search', label: `Search: ${currentFilters.search}` })
  if (currentFilters.payment !== 'all') chips.push({ key: 'payment', label: `Payment: ${currentFilters.payment}` })
  if (currentFilters.delivery !== 'all') chips.push({ key: 'delivery', label: `Delivery: ${currentFilters.delivery.replace(/_/g, ' ')}` })
  if (currentFilters.status !== 'all') chips.push({ key: 'status', label: `Status: ${currentFilters.status}` })
  if (currentFilters.date !== 'all') chips.push({ key: 'date', label: `Date: ${currentFilters.date.replace(/_/g, ' ')}` })
  if (currentFilters.amount !== 'all') chips.push({ key: 'amount', label: `Amount: ${currentFilters.amount.replace(/_/g, ' ')}` })
  if (currentFilters.fulfilment !== 'all') chips.push({ key: 'fulfilment', label: `Fulfilment: ${currentFilters.fulfilment}` })
  if (currentFilters.seller !== 'all') {
    const storeName = storeOptions.find(s => s.id === currentFilters.seller)?.name || 'Store'
    chips.push({ key: 'seller', label: `Store: ${storeName}` })
  }
  if (currentFilters.tracking !== 'all') chips.push({ key: 'tracking', label: `Tracking: ${currentFilters.tracking.replace(/_/g, ' ')}` })
  if (currentFilters.provider !== 'all') chips.push({ key: 'provider', label: `Provider: ${currentFilters.provider}` })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Search order ref, name, email, phone, tracking..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filters Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filters {chips.length > 0 && <span className="ml-2 bg-blue-100 text-blue-800 py-0.5 px-2 rounded-full text-xs font-bold">{chips.length}</span>}
        </button>
      </div>

      {/* Active Chips */}
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-500 mr-2">Active filters:</span>
          {chips.map(chip => (
            <span key={chip.key} className="inline-flex items-center py-1 pl-2.5 pr-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              {chip.label}
              <button
                type="button"
                onClick={() => removeFilter(chip.key)}
                className="flex-shrink-0 ml-1 h-4 w-4 rounded-full inline-flex items-center justify-center text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none focus:bg-blue-500 focus:text-white"
              >
                <span className="sr-only">Remove filter</span>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            onClick={clearAll}
            className="text-xs text-red-600 hover:text-red-800 hover:underline ml-2 font-medium"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Filter Drawer / Panel */}
      {isOpen && (
        <div className="bg-white border border-gray-200 shadow-lg rounded-xl p-6 relative">
          <div className="absolute top-4 right-4">
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-500">
              <X className="h-5 w-5" />
            </button>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-6">Advanced Filters</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {/* Payment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
              <select
                value={currentFilters.payment}
                onChange={(e) => handleFilterChange('payment', e.target.value)}
                className="w-full border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Payments</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
                <option value="partially_refunded">Partially Refunded</option>
              </select>
            </div>

            {/* Delivery */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Status</label>
              <select
                value={currentFilters.delivery}
                onChange={(e) => handleFilterChange('delivery', e.target.value)}
                className="w-full border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Deliveries</option>
                <option value="awaiting_authorization">Awaiting Authorization</option>
                <option value="ready_for_dispatch">Ready for Dispatch</option>
                <option value="shipment_requested">Shipment Requested</option>
                <option value="dispatched">Dispatched</option>
                <option value="picked_up">Picked Up</option>
                <option value="in_transit">In Transit</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="delivery_exception">Delivery Exception</option>
              </select>
            </div>

            {/* Order Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order Status</label>
              <select
                value={currentFilters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="preparing">Preparing</option>
                <option value="ready_for_pickup">Ready for Pickup</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <select
                value={currentFilters.date}
                onChange={(e) => handleFilterChange('date', e.target.value)}
                className="w-full border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="this_year">This Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {currentFilters.date === 'custom' && (
              <div className="col-span-1 md:col-span-3 lg:col-span-4 flex gap-4 bg-gray-50 p-4 rounded-lg mt-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">From Date</label>
                  <input
                    type="date"
                    value={currentFilters.date_from || ''}
                    onChange={(e) => handleFilterChange('date_from', e.target.value)}
                    className="border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 py-1.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">To Date</label>
                  <input
                    type="date"
                    value={currentFilters.date_to || ''}
                    onChange={(e) => handleFilterChange('date_to', e.target.value)}
                    className="border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 py-1.5"
                  />
                </div>
              </div>
            )}
            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
              <select
                value={currentFilters.amount}
                onChange={(e) => handleFilterChange('amount', e.target.value)}
                className="w-full border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Any Amount</option>
                <option value="under_5k">Under ₦5,000</option>
                <option value="5k_20k">₦5,000 - ₦20,000</option>
                <option value="20k_50k">₦20,000 - ₦50,000</option>
                <option value="50k_plus">₦50,000+</option>
              </select>
            </div>

            {currentFilters.amount === 'custom' && (
              <div className="col-span-1 md:col-span-3 lg:col-span-4 flex gap-4 bg-gray-50 p-4 rounded-lg mt-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Min Amount (?)</label>
                  <input
                    type="number"
                    value={currentFilters.amount_min || ''}
                    onChange={(e) => handleFilterChange('amount_min', e.target.value)}
                    className="border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 py-1.5 w-32"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Max Amount (?)</label>
                  <input
                    type="number"
                    value={currentFilters.amount_max || ''}
                    onChange={(e) => handleFilterChange('amount_max', e.target.value)}
                    className="border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 py-1.5 w-32"
                    placeholder="50000"
                  />
                </div>
              </div>
            )}
            {/* Fulfilment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fulfilment</label>
              <select
                value={currentFilters.fulfilment}
                onChange={(e) => handleFilterChange('fulfilment', e.target.value)}
                className="w-full border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Fulfilment</option>
                <option value="delivery">Delivery</option>
                <option value="arrange">Arrange with Seller</option>
                <option value="digital">Digital Product</option>
              </select>
            </div>

            {/* Seller */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seller / Store</label>
              <select
                value={currentFilters.seller}
                onChange={(e) => handleFilterChange('seller', e.target.value)}
                className="w-full border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Sellers</option>
                {storeOptions.map(store => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
            </div>

            {/* Tracking */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Status</label>
              <select
                value={currentFilters.tracking}
                onChange={(e) => handleFilterChange('tracking', e.target.value)}
                className="w-full border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Tracking</option>
                <option value="not_added">Tracking Not Added</option>
                <option value="added">Tracking Added</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>

            {/* Delivery Provider */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Provider</label>
              <select
                value={currentFilters.provider}
                onChange={(e) => handleFilterChange('provider', e.target.value)}
                className="w-full border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Providers</option>
                <option value="theyutes">Theyutes</option>
                <option value="other">Other / None</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={currentFilters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="w-full border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Total</option>
                <option value="lowest">Lowest Total</option>
                <option value="updated">Recently Updated</option>
              </select>
            </div>
            
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end gap-3">
            <button
              onClick={clearAll}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Clear All
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


