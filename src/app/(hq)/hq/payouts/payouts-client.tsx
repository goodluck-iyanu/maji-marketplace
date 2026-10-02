'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, X, Clock, AlertCircle } from 'lucide-react'
import { approvePayoutChange, rejectPayoutChange } from './actions'

export function PayoutsClient({ sellers, payoutHistory, pendingRequests, resolvedRequests }: any) {
  const [tab, setTab] = useState<'balances' | 'history' | 'requests'>('balances')
  const [loadingReq, setLoadingReq] = useState<string | null>(null)

  const handleApprove = async (id: string) => {
    if (!confirm('Are you sure you want to APPROVE this bank account change? This will update the seller\'s active payout details.')) return
    setLoadingReq(id)
    try {
      await approvePayoutChange(id)
    } catch (e: any) {
      alert('Failed: ' + e.message)
    }
    setLoadingReq(null)
  }

  const handleReject = async (id: string) => {
    if (!confirm('Are you sure you want to REJECT this bank account change?')) return
    setLoadingReq(id)
    try {
      await rejectPayoutChange(id)
    } catch (e: any) {
      alert('Failed: ' + e.message)
    }
    setLoadingReq(null)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* TABS */}
      <div className="border-b border-gray-100 px-6 flex items-center gap-6">
        <button 
          onClick={() => setTab('balances')}
          className={`py-4 font-semibold text-sm border-b-2 transition-colors ${tab === 'balances' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
        >
          Seller Balances
        </button>
        <button 
          onClick={() => setTab('history')}
          className={`py-4 font-semibold text-sm border-b-2 transition-colors ${tab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
        >
          Payout History
        </button>
        <button 
          onClick={() => setTab('requests')}
          className={`py-4 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 ${tab === 'requests' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
        >
          Account Changes
          {pendingRequests.length > 0 && (
            <span className="bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded-full">{pendingRequests.length}</span>
          )}
        </button>
      </div>

      {/* CONTENT */}
      <div className="p-0 overflow-x-auto">
        
        {/* TAB: BALANCES */}
        {tab === 'balances' && (
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-100 font-medium text-gray-900">
              <tr>
                <th className="px-6 py-4">Seller / Store</th>
                <th className="px-6 py-4 text-right">Total Earned</th>
                <th className="px-6 py-4 text-right">Already Paid</th>
                <th className="px-6 py-4 text-right">Pending Balance</th>
                <th className="px-6 py-4">Last Payout</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sellers.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No sellers found.</td></tr>
              ) : (
                sellers.map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.slug}</p>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-700">₦{s.earned.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-medium text-green-700">₦{s.paid.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900">₦{s.pendingBalance.toLocaleString()}</td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {s.lastPayoutDate ? new Date(s.lastPayoutDate).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/hq/payouts/${s.id}`} className="text-blue-600 hover:text-blue-800 font-semibold text-xs">
                        View Ledger &rarr;
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {/* TAB: HISTORY */}
        {tab === 'history' && (
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-100 font-medium text-gray-900">
              <tr>
                <th className="px-6 py-4">Payout ID / Date</th>
                <th className="px-6 py-4">Store</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payoutHistory.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No payouts found in ledger.</td></tr>
              ) : (
                payoutHistory.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-mono text-[10px] text-gray-400 truncate w-32" title={p.id}>{p.id}</p>
                      <p className="text-xs font-medium text-gray-900 mt-1">{new Date(p.created_at).toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{p.stores?.name}</p>
                      <Link href={`/hq/payouts/${p.store_id}`} className="text-[10px] text-blue-600 hover:underline">View Store</Link>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900">
                      ₦{Math.abs(Number(p.amount)).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {p.status === 'completed' && <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700">Completed</span>}
                      {p.status === 'pending' && <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700">Pending</span>}
                      {p.status === 'failed' && <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700">Failed</span>}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 max-w-[200px] truncate" title={p.description}>
                      {p.description || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {/* TAB: REQUESTS */}
        {tab === 'requests' && (
          <div className="p-6 space-y-8">
            {pendingRequests.length === 0 && resolvedRequests.length === 0 && (
              <p className="text-center text-gray-500 py-8">No payout account change requests.</p>
            )}

            {pendingRequests.length > 0 && (
              <div>
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-orange-500"/> Pending Requests</h3>
                <div className="grid gap-4">
                  {pendingRequests.map((r: any) => (
                    <div key={r.id} className="border border-gray-200 rounded-xl p-4 flex items-center justify-between bg-orange-50/30">
                      <div>
                        <p className="font-bold text-gray-900">{r.stores?.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Requested: {new Date(r.requested_at).toLocaleString()}</p>
                        <div className="mt-3 flex gap-4 text-sm">
                          <div>
                            <p className="text-xs text-gray-400">New Bank Code</p>
                            <p className="font-mono font-medium">{r.new_bank_code}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">New Account</p>
                            <p className="font-mono font-medium">{r.new_account_number}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">New Name</p>
                            <p className="font-medium">{r.new_account_name}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => handleApprove(r.id)}
                          disabled={loadingReq === r.id}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded text-sm font-semibold flex items-center gap-2 justify-center disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" /> Approve
                        </button>
                        <button 
                          onClick={() => handleReject(r.id)}
                          disabled={loadingReq === r.id}
                          className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-1.5 rounded text-sm font-semibold flex items-center gap-2 justify-center disabled:opacity-50"
                        >
                          <X className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {resolvedRequests.length > 0 && (
              <div>
                <h3 className="font-bold text-gray-900 mb-4">Audit Trail (Resolved)</h3>
                <div className="overflow-hidden border border-gray-100 rounded-xl">
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 border-b border-gray-100 font-medium">
                      <tr>
                        <th className="px-4 py-3">Store</th>
                        <th className="px-4 py-3">Decision</th>
                        <th className="px-4 py-3">Previous Account</th>
                        <th className="px-4 py-3">Date Resolved</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {resolvedRequests.map((r: any) => (
                        <tr key={r.id}>
                          <td className="px-4 py-3 font-medium text-gray-900">{r.stores?.name}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${r.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {r.previous_account_data ? (
                              <div className="text-xs">
                                <p>{r.previous_account_data.account_name}</p>
                                <p className="font-mono text-gray-500">{r.previous_account_data.account_number} ({r.previous_account_data.bank_code})</p>
                              </div>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {r.resolved_at ? new Date(r.resolved_at).toLocaleString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  )
}
