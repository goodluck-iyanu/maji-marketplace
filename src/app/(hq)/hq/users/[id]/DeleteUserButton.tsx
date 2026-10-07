'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, AlertTriangle } from 'lucide-react'
import { deleteUser } from '../actions'

export default function DeleteUserButton({ user, store, currentAdminId }: { user: any, store: any, currentAdminId: string | null }) {
  const [isOpen, setIsOpen] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleDelete = () => {
    setError(null)
    if (user.isAdmin && deleteInput !== 'DELETE') {
      setError('You must type DELETE to confirm removing an administrator.')
      return
    }

    startTransition(async () => {
      const res = await deleteUser(user.id)
      if (res.success) {
        setIsOpen(false)
        router.push('/hq/users')
      } else {
        setError(res.error || 'Failed to delete user.')
      }
    })
  }

  const isSelf = currentAdminId === user.id

  if (isSelf) {
    return (
      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-xl text-center">
        <p className="text-gray-500 text-sm font-medium">You cannot delete the account you are currently using.</p>
      </div>
    )
  }

  return (
    <div className="mt-8 pt-6 border-t border-gray-100">
      <button
        onClick={() => setIsOpen(true)}
        className="w-full py-3 px-4 bg-white border border-red-200 text-red-600 rounded-xl hover:bg-red-50 text-sm font-bold flex items-center justify-center gap-2 transition-colors"
      >
        <Trash2 className="w-4 h-4" /> Delete User
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-red-100 text-left">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Delete this user?</h2>
            
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <p className="font-bold text-gray-900">{user.full_name || 'No Name'}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>

            {store && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <p className="text-amber-800 text-sm font-bold flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4" /> Warning: This user is a Seller</p>
                <p className="text-amber-700 text-xs">This user owns <strong>{store.name}</strong>.</p>
                <p className="text-amber-700 text-xs mt-1">Deleting this account removes their access. Historical order and financial records will be preserved where required.</p>
              </div>
            )}

            <p className="text-red-600 text-sm font-medium mb-4">
              This permanently removes the user's Maji account.
            </p>

            {user.isAdmin && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  This account has administrator privileges. Type <span className="font-mono bg-gray-200 px-1 rounded text-black font-bold">DELETE</span> to confirm.
                </label>
                <input
                  type="text"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  className="w-full border-gray-300 rounded-lg text-sm focus:ring-red-500 focus:border-red-500"
                />
              </div>
            )}

            {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

            <div className="flex justify-end gap-3">
              <button onClick={() => { setIsOpen(false); setDeleteInput(''); setError(null); }} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button 
                onClick={handleDelete} 
                disabled={isPending || (user.isAdmin && deleteInput !== 'DELETE')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isPending ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
