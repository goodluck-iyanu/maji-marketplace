'use client'

import { useState } from 'react'
import { completePayout } from '../actions'
import { CheckCircle2, Loader2 } from 'lucide-react'

export function CompletePayoutButton({ transactionId }: { transactionId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleComplete() {
    if (!confirm('Mark this payout as successfully completed?')) return
    setLoading(true)
    try {
      await completePayout(transactionId)
    } catch (e: any) {
      alert('Failed: ' + e.message)
    }
    setLoading(false)
  }

  return (
    <button 
      onClick={handleComplete}
      disabled={loading}
      className="ml-3 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black text-white hover:bg-gray-800 disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
      Mark Done
    </button>
  )
}
