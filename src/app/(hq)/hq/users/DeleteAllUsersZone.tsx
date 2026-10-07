'use client'

import { useState, useTransition } from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { deleteAllEligibleUsers } from './actions'
import { useRouter } from 'next/navigation'

export default function DeleteAllUsersZone() {
  const [isOpen, setIsOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const router = useRouter()

  const handleDeleteAll = () => {
    if (confirmText !== 'DELETE ALL USERS') return
    
    startTransition(async () => {
      setError(null)
      setSuccessMsg(null)
      const res = await deleteAllEligibleUsers(confirmText)
      
      if (!res.success) {
        setError(res.error || 'Failed to delete all users.')
      } else {
        setSuccessMsg(`Successfully deleted ${res.deletedCount} non-admin users.`)
        setIsOpen(false)
        setConfirmText('')
        router.refresh()
      }
    })
  }

  return (
    <div className="mt-16 border-t border-red-200 pt-8">
      <div className="bg-red-50 rounded-xl p-6 border border-red-100">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0 mt-1">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-red-900">Danger Zone: Delete All Users</h3>
            <p className="text-red-700 text-sm mt-1 max-w-2xl">
              This action is destructive and cannot be undone. It will permanently remove all eligible user accounts from Maji.
              Administrators are automatically protected and will not be deleted. Historical financial and order records will be preserved where required.
            </p>
            
            {successMsg && (
              <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                {successMsg}
              </div>
            )}
            
            <button
              onClick={() => setIsOpen(true)}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-colors"
            >
              Delete All Users
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-red-100">
            <div className="flex items-center gap-3 mb-4 text-red-600">
              <AlertTriangle className="w-6 h-6" />
              <h2 className="text-xl font-bold">Delete All Maji Users?</h2>
            </div>
            
            <p className="text-gray-600 text-sm mb-4">
              This action is destructive and cannot be easily undone. It will permanently remove eligible user accounts.
            </p>
            
            <ul className="text-sm text-gray-700 list-disc list-inside mb-4 space-y-1">
              <li>Never delete the currently authenticated admin.</li>
              <li>Never accidentally remove other HQ admins.</li>
              <li>Preserve required financial/order records.</li>
              <li>Do not corrupt historical transactions.</li>
            </ul>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type <span className="font-mono font-bold text-black bg-gray-100 px-1 rounded">DELETE ALL USERS</span> exactly below to confirm:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm font-mono"
                placeholder="DELETE ALL USERS"
              />
            </div>

            {error && <p className="text-red-600 text-sm font-medium mb-4">{error}</p>}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setIsOpen(false); setConfirmText(''); setError(null); }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={confirmText !== 'DELETE ALL USERS' || isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isPending ? 'Deleting...' : <><Trash2 className="w-4 h-4" /> Confirm Delete All</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
