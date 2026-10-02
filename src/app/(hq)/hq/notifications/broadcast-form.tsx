'use client'

import { useState } from 'react'
import { sendBroadcast } from './actions'
import { Send, AlertCircle, CheckCircle2 } from 'lucide-react'

export function BroadcastForm({ stores, categories }: { stores: any[], categories: string[] }) {
  const [audience, setAudience] = useState('all')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{success: boolean, message: string} | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    const formData = new FormData(e.currentTarget)
    
    try {
      const res = await sendBroadcast(formData)
      setResult(res)
      if (res.success) {
        (e.target as HTMLFormElement).reset()
        setAudience('all')
      }
    } catch (err: any) {
      setResult({ success: false, message: err.message || 'An error occurred' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {result && (
        <div className={`p-4 rounded-lg flex items-start gap-3 ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {result.success ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <p className="text-sm font-medium pt-0.5">{result.message}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
        <select 
          name="audience" 
          value={audience} 
          onChange={(e) => setAudience(e.target.value)}
          className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Everybody (All Active Sellers)</option>
          <option value="category">By Store Category (e.g. Fashion, Electronics)</option>
          <option value="inactive_7">Inactive (No Orders in last 7 days)</option>
          <option value="specific">Specific Sellers</option>
        </select>
      </div>

      {audience === 'category' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Store Category</label>
          <select 
            name="storeCategory" 
            required
            className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Choose Category --</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      )}

      {audience === 'specific' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Sellers</label>
          <select 
            name="specificStores" 
            multiple 
            required
            className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
          >
            {stores.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.profiles?.email})</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Hold Ctrl (Windows) or Cmd (Mac) to select multiple.</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input 
          type="text" 
          name="title" 
          required 
          placeholder="e.g. System Maintenance Notice"
          className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
        <textarea 
          name="message" 
          required 
          rows={4}
          placeholder="The message that will appear in their dashboard..."
          className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        ></textarea>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Link (Optional)</label>
        <input 
          type="url" 
          name="link" 
          placeholder="https://..."
          className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="w-full sm:w-auto px-6 py-2.5 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Send className="w-4 h-4" />
        {loading ? 'Sending...' : 'Send Broadcast'}
      </button>
    </form>
  )
}
