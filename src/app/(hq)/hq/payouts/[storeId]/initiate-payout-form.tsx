'use client'

import { useState } from 'react'
import { initiatePayout, completePayout } from '../actions'
import { Wallet, Loader2, CheckCircle2 } from 'lucide-react'

export function InitiatePayoutForm({ storeId, maxAmount, disabled }: { storeId: string, maxAmount: number, disabled: boolean }) {
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState(maxAmount)
  const [result, setResult] = useState<{success: boolean, message: string} | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!confirm(`Are you sure you want to initiate a payout of ₦${amount.toLocaleString()}? This will deduct from the seller's pending balance.`)) return

    setLoading(true)
    setResult(null)

    try {
      await initiatePayout(storeId, amount, 'Manual Admin Payout')
      setResult({ success: true, message: 'Payout initiated successfully.' })
      setAmount(0)
    } catch (err: any) {
      setResult({ success: false, message: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
        <Wallet className="w-4 h-4 text-gray-500" /> Initiate Payout
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Amount (₦)</label>
          <input 
            type="number" 
            min="1"
            max={maxAmount}
            required
            disabled={disabled || loading}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-50"
          />
        </div>

        {result && (
          <div className={`p-3 rounded-lg flex items-start gap-2 text-sm ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {result.success ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : null}
            <p>{result.message}</p>
          </div>
        )}

        <button 
          type="submit" 
          disabled={disabled || loading || amount <= 0 || amount > maxAmount}
          className="w-full bg-black hover:bg-gray-800 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Payout'}
        </button>
      </div>
    </form>
  )
}
