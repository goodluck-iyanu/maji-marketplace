'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Search, Filter, Shield, Store, User, Eye, Trash2, X, SlidersHorizontal, AlertTriangle } from 'lucide-react'
import { deleteUser, bulkDeleteUsers } from './actions'

function updateParams(currentParams: URLSearchParams, key: string, value: string | null) {
  const newParams = new URLSearchParams(currentParams.toString())
  if (value && value !== 'all') {
    newParams.set(key, value)
  } else {
    newParams.delete(key)
  }
  newParams.set('page', '1')
  return newParams.toString()
}

export default function UsersList({ profiles, currentAdminId, totalCount }: { profiles: any[], currentAdminId: string | null, totalCount?: number }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const [userToDelete, setUserToDelete] = useState<any>(null)
  const [showBulkDelete, setShowBulkDelete] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  const filters = {
    search: searchParams.get('search'),
    role: searchParams.get('role') || 'all',
    store: searchParams.get('store') || 'all',
    date: searchParams.get('date') || 'all',
    sort: searchParams.get('sort') || 'newest',
  }

  // Clear selections when navigating pages/filters to prevent accidental deletions of unseen users
  useEffect(() => {
    setSelectedIds(new Set())
  }, [searchParams])

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

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const toggleAll = () => {
    if (selectedIds.size === profiles.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(profiles.map(p => p.id)))
    }
  }

  const performDelete = async () => {
    if (!userToDelete) return
    setActionError(null)

    if (userToDelete.isAdmin && deleteInput !== 'DELETE') {
      setActionError('You must type DELETE to confirm removing an administrator.')
      return
    }

    startTransition(async () => {
      const res = await deleteUser(userToDelete.id)
      if (res.success) {
        setUserToDelete(null)
        setDeleteInput('')
        setSelectedIds(prev => {
          const next = new Set(prev)
          next.delete(userToDelete.id)
          return next
        })
      } else {
        setActionError(res.error || 'Failed to delete user.')
      }
    })
  }

  const performBulkDelete = async () => {
    if (selectedIds.size === 0) return
    setActionError(null)

    const selectedAdmins = profiles.filter(p => selectedIds.has(p.id) && p.isAdmin)
    if (selectedAdmins.length > 0 && deleteInput !== 'DELETE') {
      setActionError('Administrators are selected. You must type DELETE to confirm.')
      return
    }

    startTransition(async () => {
      const res = await bulkDeleteUsers(Array.from(selectedIds))
      if (res.success) {
        setShowBulkDelete(false)
        setDeleteInput('')
        setSelectedIds(new Set())
        if (res.skipped?.length) {
          alert(`Deleted successfully, but skipped ${res.skipped.length} users (likely due to self-protection).`)
        }
      } else {
        setActionError(res.error || 'Failed to bulk delete users.')
      }
    })
  }

  const chips = []
  if (filters.search) chips.push({ key: 'search', label: `Search: ${filters.search}` })
  if (filters.role !== 'all') chips.push({ key: 'role', label: `Role: ${filters.role}` })
  if (filters.store !== 'all') chips.push({ key: 'store', label: `Store: ${filters.store}` })
  if (filters.date !== 'all') chips.push({ key: 'date', label: `Date: ${filters.date.replace('_', ' ')}` })

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Search name, email, phone, store..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filters {chips.length > 0 && <span className="ml-2 bg-blue-100 text-blue-800 py-0.5 px-2 rounded-full text-xs font-bold">{chips.length}</span>}
        </button>
      </div>

      {/* Drawer */}
      {isOpen && (
        <div className="bg-white border border-gray-200 shadow-lg rounded-xl p-4 sm:p-6 relative">
          <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"><X className="w-5 h-5" /></button>
          <h3 className="text-lg font-bold text-gray-900 mb-6">User Filters</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select value={filters.role} onChange={(e) => handleFilterChange('role', e.target.value)} className="w-full border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 py-2">
                <option value="all">All Roles</option>
                <option value="customer">Customers Only</option>
                <option value="seller">Sellers Only</option>
                <option value="admin">Admins Only</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Store Presence</label>
              <select value={filters.store} onChange={(e) => handleFilterChange('store', e.target.value)} className="w-full border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 py-2">
                <option value="all">Any</option>
                <option value="has_store">Has Store</option>
                <option value="no_store">No Store</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Joined Date</label>
              <select value={filters.date} onChange={(e) => handleFilterChange('date', e.target.value)} className="w-full border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 py-2">
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="this_year">This Year</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select value={filters.sort} onChange={(e) => handleFilterChange('sort', e.target.value)} className="w-full border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 py-2">
                <option value="newest">Newest Joined</option>
                <option value="oldest">Oldest Joined</option>
                <option value="name_asc">Name A-Z</option>
                <option value="name_desc">Name Z-A</option>
              </select>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-3">
            <button onClick={() => { setSearchTerm(''); router.push('?') }} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 w-full sm:w-auto">Clear All</button>
            <button onClick={() => setIsOpen(false)} className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 w-full sm:w-auto">Apply Filters</button>
          </div>
        </div>
      )}

      {/* Bulk Action Bar & Meta */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {totalCount !== undefined && (
          <p className="text-sm text-gray-500 font-medium">
            Showing {profiles.length} of {totalCount} users
          </p>
        )}
        
        {selectedIds.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between gap-4 shadow-sm w-full sm:w-auto ml-auto">
            <span className="text-sm font-medium text-blue-800">{selectedIds.size} selected</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedIds(new Set())}
                className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 shadow-sm"
              >
                Clear
              </button>
              <button
                onClick={() => setShowBulkDelete(true)}
                className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 flex items-center gap-2 shadow-sm"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile & Desktop List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Desktop Header */}
        <div className="hidden sm:grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-100 font-medium text-sm text-gray-900">
          <div className="col-span-1 text-center">
            <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4" checked={profiles.length > 0 && selectedIds.size === profiles.length} onChange={toggleAll} />
          </div>
          <div className="col-span-4">User</div>
          <div className="col-span-3">Contact</div>
          <div className="col-span-2">Role & Status</div>
          <div className="col-span-2 text-right">Action</div>
        </div>

        {/* Mobile Header (Just Select All) */}
        <div className="sm:hidden p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4" checked={profiles.length > 0 && selectedIds.size === profiles.length} onChange={toggleAll} />
            Select All
          </label>
        </div>

        <div className="divide-y divide-gray-100">
          {profiles.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No users found matching your criteria.
            </div>
          ) : (
            profiles.map((profile: any) => (
              <div key={profile.id} className="p-4 hover:bg-gray-50 flex flex-col sm:grid sm:grid-cols-12 sm:gap-4 sm:items-center relative">
                {/* Checkbox */}
                <div className="absolute top-4 right-4 sm:static sm:col-span-1 sm:text-center z-10">
                  <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 sm:w-4 sm:h-4" checked={selectedIds.has(profile.id)} onChange={() => toggleSelection(profile.id)} />
                </div>

                {/* User Info */}
                <div className="sm:col-span-4 flex items-center gap-3 pr-10 sm:pr-0">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 font-bold text-lg">
                    {profile.full_name?.charAt(0)?.toUpperCase() || <User className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 truncate text-sm sm:text-base">{profile.full_name || 'No Name'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Joined {new Date(profile.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Contact */}
                <div className="sm:col-span-3 mt-3 sm:mt-0 text-sm">
                  <p className="text-gray-900 truncate">{profile.email}</p>
                  {profile.phone && <p className="text-xs text-gray-500 mt-1">{profile.phone}</p>}
                </div>

                {/* Role/Status */}
                <div className="sm:col-span-2 mt-3 sm:mt-0 flex flex-wrap gap-2">
                  {profile.isAdmin ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700"><Shield className="w-3 h-3" /> Admin</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">Customer</span>
                  )}
                  {profile.isSeller && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700"><Store className="w-3 h-3" /> Seller</span>
                  )}
                  {profile.stores && profile.stores.length > 0 && (
                    <p className="w-full text-xs text-gray-500 font-medium truncate mt-1">{(profile.stores as any[])[0]?.name}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="sm:col-span-2 mt-4 sm:mt-0 flex justify-end gap-2">
                  <Link href={`/hq/users/${profile.id}`} className="inline-flex items-center justify-center gap-1 p-2 px-3 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 shadow-sm text-sm font-medium flex-1 sm:flex-none">
                    <Eye className="w-4 h-4" /> <span className="sm:hidden">View</span>
                  </Link>
                  <button onClick={() => setUserToDelete(profile)} className="inline-flex items-center justify-center gap-1 p-2 px-3 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 shadow-sm text-sm font-medium flex-1 sm:flex-none">
                    <Trash2 className="w-4 h-4" /> <span className="sm:hidden">Delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delete Single User Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-red-100">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Delete this user?</h2>
            
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <p className="font-bold text-gray-900">{userToDelete.full_name || 'No Name'}</p>
              <p className="text-sm text-gray-500">{userToDelete.email}</p>
            </div>

            {userToDelete.isSeller && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <p className="text-amber-800 text-sm font-bold flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4" /> Warning: This user is a Seller</p>
                <p className="text-amber-700 text-xs">This user owns <strong>{(userToDelete.stores as any[])[0]?.name}</strong>.</p>
                <p className="text-amber-700 text-xs mt-1">Deleting this account removes their access. Historical order and financial records will be preserved where required.</p>
              </div>
            )}

            <p className="text-red-600 text-sm font-medium mb-4">
              This permanently removes the user's Maji account.
            </p>

            {currentAdminId === userToDelete.id && (
              <p className="text-red-700 text-sm font-bold bg-red-100 p-2 rounded mb-4">
                You cannot delete the account you are currently using.
              </p>
            )}

            {userToDelete.isAdmin && currentAdminId !== userToDelete.id && (
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

            {actionError && <p className="text-red-600 text-sm mb-4">{actionError}</p>}

            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
              <button onClick={() => { setUserToDelete(null); setDeleteInput(''); setActionError(null); }} className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button 
                onClick={performDelete} 
                disabled={isPending || currentAdminId === userToDelete.id || (userToDelete.isAdmin && deleteInput !== 'DELETE')}
                className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {showBulkDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-red-100">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Delete {selectedIds.size} users?</h2>
            
            <p className="text-red-600 text-sm font-medium mb-4">
              This permanently removes the selected users from Maji.
            </p>
            
            <div className="max-h-32 overflow-y-auto mb-4 bg-gray-50 p-2 rounded border border-gray-100">
              {profiles.filter(p => selectedIds.has(p.id)).map(p => (
                <div key={p.id} className="text-xs text-gray-700 py-1 border-b border-gray-100 last:border-0 truncate">
                  {p.full_name || 'No Name'} ({p.email}) {p.isAdmin && <span className="text-purple-600 font-bold ml-1">(Admin)</span>} {p.isSeller && <span className="text-green-600 font-bold ml-1">(Seller)</span>}
                </div>
              ))}
            </div>

            {profiles.some(p => selectedIds.has(p.id) && p.id === currentAdminId) && (
              <p className="text-red-700 text-sm font-bold bg-red-100 p-2 rounded mb-4">
                Your own account is in this selection and will be skipped.
              </p>
            )}

            {profiles.some(p => selectedIds.has(p.id) && p.isAdmin) && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Administrators are selected. Type <span className="font-mono bg-gray-200 px-1 rounded text-black font-bold">DELETE</span> to confirm.
                </label>
                <input
                  type="text"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  className="w-full border-gray-300 rounded-lg text-sm focus:ring-red-500 focus:border-red-500"
                />
              </div>
            )}

            {actionError && <p className="text-red-600 text-sm mb-4">{actionError}</p>}

            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
              <button onClick={() => { setShowBulkDelete(false); setDeleteInput(''); setActionError(null); }} className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button 
                onClick={performBulkDelete} 
                disabled={isPending || (profiles.some(p => selectedIds.has(p.id) && p.isAdmin) && deleteInput !== 'DELETE')}
                className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? 'Deleting...' : 'Delete Selected'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
