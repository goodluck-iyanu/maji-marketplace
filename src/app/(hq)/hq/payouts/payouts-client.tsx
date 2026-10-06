'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, X, Clock, AlertCircle, RefreshCw } from 'lucide-react'
import { approvePayoutChange, rejectPayoutChange } from './actions'
import { syncPaystackVerification } from './verification-actions'

export function PayoutsClient({ sellers, payoutHistory, pendingRequests, resolvedRequests, verificationQueue, allPayoutAccounts }: any) {
  const [tab, setTab] = useState<'balances' | 'history' | 'requests' | 'verification'>('balances')
  const [loadingReq, setLoadingReq] = useState<string | null>(null)
  const [syncing, setSyncing] = useState<string | null>(null)

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

  const handleSync = async (storeId: string) => {
    setSyncing(storeId)
    try {
      const res = await syncPaystackVerification(storeId)
      if (res.error) alert(res.error)
      else alert(res.message || 'Verification status synced.')
    } catch (e: any) {
      alert('Failed: ' + e.message)
    }
    setSyncing(null)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="flex border-b border-gray-200 overflow-x-auto">
        <button 
          onClick={() => setTab('balances')}
          className={`px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${tab === 'balances' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Seller Balances
        </button>
        <button 
          onClick={() => setTab('history')}
          className={`px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${tab === 'history' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Payout History
        </button>
        <button 
          onClick={() => setTab('verification')}
          className={`px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors flex items-center ${tab === 'verification' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Verification Queue
          {verificationQueue?.length > 0 && (
            <span className="ml-2 bg-blue-100 text-blue-700 py-0.5 px-2 rounded-full text-xs">{verificationQueue.length}</span>
          )}
        </button>
        <button 
          onClick={() => setTab('requests')}
          className={`px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors flex items-center ${tab === 'requests' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Account Change Requests
          {pendingRequests?.length > 0 && (
            <span className="ml-2 bg-red-100 text-red-700 py-0.5 px-2 rounded-full text-xs">{pendingRequests.length}</span>
          )}
        </button>
      </div>

      <div className="p-0">
        {tab === 'balances' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller / Store</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Pending Balance</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Earned</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Paid</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Last Payout</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sellers.map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{s.name}</div>
                      <Link href={`/hq/sellers/${s.id}`} className="text-xs text-blue-600 hover:underline">View Seller</Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`text-sm font-bold ${s.pendingBalance > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        ₦{s.pendingBalance.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                      ₦{s.earned.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                      ₦{s.paid.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {s.lastPayoutDate ? new Date(s.lastPayoutDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/hq/payouts/${s.id}`} className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1.5 rounded-md">
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
                {sellers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 text-sm">No seller financial records found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'history' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference/Desc</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payoutHistory.map((h: any) => (
                  <tr key={h.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(h.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {h.stores?.name || 'Unknown Store'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {h.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                      ₦{Math.abs(Number(h.amount)).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${h.status === 'completed' ? 'bg-green-100 text-green-800' : 
                          h.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'}`}>
                        {h.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {payoutHistory.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 text-sm">No payout history found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'verification' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank Info</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subaccount</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allPayoutAccounts.map((req: any) => (
                  <tr key={req.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{req.stores?.name}</div>
                      <div className="text-xs text-gray-500">{new Date(req.created_at).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{req.account_name}</div>
                      <div className="text-xs text-gray-500">{req.bank_code} - {req.account_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                      {req.subaccount_code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${req.status === 'verified' ? 'bg-green-100 text-green-800' : 
                          req.status === 'pending_verification' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleSync(req.store_id)}
                        disabled={syncing === req.store_id}
                        className="inline-flex items-center text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1.5 rounded-md disabled:opacity-50"
                      >
                        <RefreshCw className={`w-4 h-4 mr-1 ${syncing === req.store_id ? 'animate-spin' : ''}`} />
                        Sync Paystack
                      </button>
                    </td>
                  </tr>
                ))}
                {allPayoutAccounts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 text-sm">No payout accounts found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'requests' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Requests</h3>
            <div className="space-y-4 mb-8">
              {pendingRequests.map((req: any) => (
                <div key={req.id} className="border border-red-200 bg-red-50 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <span className="font-bold text-gray-900">{req.stores?.name}</span>
                      <span className="text-sm text-gray-500">requested an account change on {new Date(req.requested_at).toLocaleString()}</span>
                    </div>
                    <div className="text-sm text-gray-700 mt-2 pl-7 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 font-medium">NEW Details</p>
                        <p className="font-medium mt-1">{req.new_account_name}</p>
                        <p className="font-mono text-gray-600">{req.new_bank_code} - {req.new_account_number}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => handleApprove(req.id)}
                      disabled={loadingReq === req.id}
                      className="bg-green-600 text-white px-4 py-2 rounded-md font-medium text-sm flex items-center justify-center gap-1 hover:bg-green-700 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" /> Approve & Update
                    </button>
                    <button 
                      onClick={() => handleReject(req.id)}
                      disabled={loadingReq === req.id}
                      className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md font-medium text-sm flex items-center justify-center gap-1 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <X className="w-4 h-4" /> Reject Request
                    </button>
                  </div>
                </div>
              ))}
              {pendingRequests.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4 bg-gray-50 rounded-lg">No pending account change requests.</p>
              )}
            </div>

            <h3 className="text-lg font-medium text-gray-900 mb-4">Past Requests</h3>
            <div className="space-y-3">
              {resolvedRequests.map((req: any) => (
                <div key={req.id} className="border border-gray-200 bg-white p-4 rounded-xl flex items-center justify-between">
                  <div>
                     <span className="font-medium text-gray-900">{req.stores?.name}</span>
                     <span className="text-sm text-gray-500 ml-2">requested {new Date(req.requested_at).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${req.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {req.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
