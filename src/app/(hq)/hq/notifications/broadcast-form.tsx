'use client'

import { useState, useEffect } from 'react'
import { sendBroadcast } from './actions'
import { Send, AlertCircle, Users, LayoutGrid, MapPin, Mail, BellRing, Calculator } from 'lucide-react'

export function BroadcastForm({ categories, countries, states }: { categories: string[], countries: string[], states: string[] }) {
  const [audience, setAudience] = useState('all')
  const [userStatus, setUserStatus] = useState('all')
  const [customerSegment, setCustomerSegment] = useState('all')
  const [sellerSegment, setSellerSegment] = useState('all')
  const [category, setCategory] = useState('all')
  const [location, setLocation] = useState('worldwide')
  const [channelEmail, setChannelEmail] = useState(true)
  const [channelInApp, setChannelInApp] = useState(true)
  
  const [loading, setLoading] = useState(false)
  const [counting, setCounting] = useState(false)
  const [recipientCount, setRecipientCount] = useState<number | null>(null)
  const [result, setResult] = useState<{success: boolean, message: string} | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  // Force disable in-app if audience is purely customers (no stores to notify)
  useEffect(() => {
    if (audience === 'customers') {
      setChannelInApp(false)
    } else {
      setChannelInApp(true)
    }
  }, [audience])

  // Recalculate recipients whenever filters change
  useEffect(() => {
    const fetchCount = async () => {
      setCounting(true)
      try {
        const res = await fetch('/api/hq/broadcast-count', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audience, userStatus, customerSegment, sellerSegment, category, location
          })
        })
        const data = await res.json()
        setRecipientCount(data.count)
      } catch (err) {
        console.error('Failed to count recipients', err)
      } finally {
        setCounting(false)
      }
    }
    const debounceId = setTimeout(() => {
      fetchCount()
    }, 500)
    return () => clearTimeout(debounceId)
  }, [audience, userStatus, customerSegment, sellerSegment, category, location])

  async function handleConfirmSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!showConfirm) {
      setShowConfirm(true)
      return
    }

    setLoading(true)
    setResult(null)

    const formData = new FormData(e.currentTarget)
    // Manually inject channels
    if (channelEmail) formData.append('channels', 'email')
    if (channelInApp && audience !== 'customers') formData.append('channels', 'in_app')
    
    // Inject exact counts and filters
    formData.append('recipientCount', String(recipientCount || 0))
    formData.append('filters', JSON.stringify({
      audience, userStatus, customerSegment, sellerSegment, category, location
    }))
    
    try {
      const res = await sendBroadcast(formData)
      setResult(res)
      if (res.success) {
        (e.target as HTMLFormElement).reset()
        setAudience('all')
        setCategory('all')
        setLocation('worldwide')
        setShowConfirm(false)
      }
    } catch (err: any) {
      setResult({ success: false, message: err.message || 'An error occurred' })
      setShowConfirm(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleConfirmSubmit} className="space-y-8 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
      
      {/* 1. AUDIENCE TARGETING */}
      <div className="space-y-6">
        <h3 className="font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600" />
          1. Audience Targeting
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Global Segment</label>
            <select 
              name="audience" 
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">Everyone</option>
              <option value="customers">All Customers</option>
              <option value="sellers">All Sellers</option>
              <option value="admins">All Admins/Staff</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">User Status</label>
            <select 
              value={userStatus}
              onChange={(e) => setUserStatus(e.target.value)}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">Any Status</option>
              <option value="active">Active Users</option>
              <option value="inactive">Inactive Users</option>
              <option value="verified">Verified Emails</option>
              <option value="unverified">Unverified Emails</option>
            </select>
          </div>

          {audience === 'customers' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Customer Segment</label>
              <select 
                value={customerSegment}
                onChange={(e) => setCustomerSegment(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="all">All Customers</option>
                <option value="with_orders">Customers with Orders</option>
                <option value="no_orders">Never Purchased</option>
                <option value="delivered_orders">Customers with Delivered Orders</option>
              </select>
            </div>
          )}

          {audience === 'sellers' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Seller Segment</label>
              <select 
                value={sellerSegment}
                onChange={(e) => setSellerSegment(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="all">All Sellers</option>
                <option value="with_products">Sellers with Products</option>
                <option value="no_products">Sellers with No Products</option>
                <option value="with_sales">Sellers with Sales</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 2. CATEGORY & LOCATION */}
      <div className="space-y-6">
        <h3 className="font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 text-indigo-600" />
          2. Categories & Location
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-gray-400" /> Store Category
            </label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Targets users associated with these store categories.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" /> Location (Worldwide)
            </label>
            <select 
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="worldwide">Worldwide</option>
              {countries.length > 0 && (
                <optgroup label="Countries">
                  {countries.map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </optgroup>
              )}
              {states.length > 0 && (
                <optgroup label="States / Regions">
                  {states.map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* 3. RECIPIENT COUNT (LIVE) */}
      <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex items-center justify-between">
        <div>
          <h4 className="font-bold text-blue-900 flex items-center gap-2 mb-1">
            <Calculator className="w-5 h-5" /> Estimated Recipients
          </h4>
          <p className="text-sm text-blue-700">Calculated in real-time based on your combination filters.</p>
        </div>
        <div className="text-3xl font-black text-blue-900">
          {counting ? (
            <span className="animate-pulse">...</span>
          ) : (
            recipientCount !== null ? recipientCount.toLocaleString() : '0'
          )}
        </div>
      </div>

      {/* 4. CHANNELS */}
      <div className="space-y-6">
        <h3 className="font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
          <Send className="w-5 h-5 text-indigo-600" />
          3. Delivery Channels
        </h3>
        <div className="flex gap-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              checked={channelEmail}
              onChange={(e) => setChannelEmail(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="flex items-center gap-2 font-medium text-gray-700"><Mail className="w-4 h-4" /> Email</span>
          </label>
          <label className={`flex items-center gap-3 ${audience === 'customers' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
            <input 
              type="checkbox" 
              checked={channelInApp}
              onChange={(e) => setChannelInApp(e.target.checked)}
              disabled={audience === 'customers'}
              className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50"
            />
            <span className="flex items-center gap-2 font-medium text-gray-700">
              <BellRing className="w-4 h-4" /> In-App (Seller Portal)
            </span>
            {audience === 'customers' && <span className="text-xs text-red-500 font-medium">(Sellers Only)</span>}
          </label>
        </div>
      </div>

      {/* 5. CONTENT */}
      <div className="space-y-6">
        <h3 className="font-bold text-gray-900 border-b pb-2">4. Broadcast Content</h3>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
          <input 
            type="text" 
            name="title" 
            required
            maxLength={100}
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="e.g. Platform Update: New Features"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Message</label>
          <textarea 
            name="message" 
            required
            rows={4}
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Write your broadcast message..."
          ></textarea>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Optional Link</label>
          <input 
            type="url" 
            name="link"
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="https://..."
          />
        </div>
      </div>

      {result && (
        <div className={`p-4 rounded-lg flex items-start gap-3 ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {result.success ? <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" /> : <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />}
          <div>
            <h4 className="font-bold">{result.success ? 'Success' : 'Error'}</h4>
            <p className="text-sm mt-1">{result.message}</p>
          </div>
        </div>
      )}

      {/* SUBMIT / CONFIRMATION */}
      <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          This broadcast will be sent securely to {recipientCount || 0} recipients.
        </p>
        
        {showConfirm ? (
          <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
            <button 
              type="button"
              onClick={() => setShowConfirm(false)}
              disabled={loading}
              className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading || recipientCount === 0 || (!channelEmail && !channelInApp)}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-sm disabled:opacity-50 transition-colors"
            >
              {loading ? 'Sending Broadcast...' : `Confirm Send to ${recipientCount} Users`}
            </button>
          </div>
        ) : (
          <button 
            type="submit" 
            disabled={recipientCount === 0 || (!channelEmail && !channelInApp)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-sm disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" /> Send Broadcast
          </button>
        )}
      </div>

    </form>
  )
}
