'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, Check, Trash2, ExternalLink, Inbox } from 'lucide-react'
import { createClient } from '@/lib/supabase/browser'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  is_read: boolean
  link: string | null
  created_at: string
}

export function NotificationBell({ storeId }: { storeId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [hasNew, setHasNew] = useState(false)
  const [ready, setReady] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch initial notifications (with graceful error handling)
  useEffect(() => {
    let cancelled = false
    async function fetchNotifications() {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('store_id', storeId)
          .order('created_at', { ascending: false })
          .limit(20)
        
        if (!cancelled && data) {
          setNotifications(data)
        }
        // If error (e.g. table doesn't exist), just silently ignore
        if (error) {
          console.warn('Notifications table may not exist yet:', error.message)
        }
      } catch (err) {
        // Gracefully handle - notifications just won't show
        console.warn('Could not fetch notifications:', err)
      }
      if (!cancelled) setReady(true)
    }
    fetchNotifications()
    return () => { cancelled = true }
  }, [storeId])

  // Real-time subscription
  useEffect(() => {
    if (!ready) return // Don't subscribe until initial fetch completes

    // Append a random string so React 18 Strict Mode double-mounting 
    // doesn't reuse an already-subscribed channel and crash.
    const channelName = `notif-${storeId}-${Math.random().toString(36).substring(7)}`
    const channel = supabase.channel(channelName)

    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `store_id=eq.${storeId}`
      },
      (payload) => {
        const newNotif = payload.new as Notification
        setNotifications(prev => [newNotif, ...prev])
        setHasNew(true)
        setTimeout(() => setHasNew(false), 3000)
      }
    )

    channel.subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        console.warn('Realtime channel error for notifications — table may not exist or replication not enabled.')
      }
    })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [storeId, ready])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen])

  const unreadCount = notifications.filter(n => !n.is_read).length

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
  }

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    await supabase.from('notifications').update({ is_read: true }).eq('store_id', storeId)
  }

  const deleteNotification = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    await supabase.from('notifications').delete().eq('id', id)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-black transition-colors focus:outline-none"
      >
        <Bell className={`h-6 w-6 ${hasNew ? 'animate-bounce text-black' : ''}`} />
        
        {/* Unread indicator */}
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
          </span>
        )}
      </button>

      {/* Animated Dropdown */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
          style={{
            animation: 'fadeInSlideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            transformOrigin: 'top right'
          }}
        >
          <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="max-h-[28rem] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Inbox className="h-10 w-10 mb-3 opacity-20" />
                <p className="text-sm">No notifications yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`p-4 transition-colors hover:bg-gray-50 group relative ${notif.is_read ? 'opacity-70' : 'bg-blue-50/30'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => {
                          if (!notif.is_read) markAsRead(notif.id)
                          if (notif.link) {
                            setIsOpen(false)
                            router.push(notif.link)
                          }
                        }}
                      >
                        <h4 className={`text-sm ${notif.is_read ? 'font-medium text-gray-700' : 'font-bold text-gray-900'}`}>
                          {notif.title}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                          {notif.message}
                        </p>
                        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-2 block">
                          {new Date(notif.created_at).toLocaleDateString()} at {new Date(notif.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      
                      {/* Action buttons appear on hover */}
                      <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notif.is_read && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); markAsRead(notif.id) }}
                            className="p-1.5 bg-white border border-gray-200 rounded-md text-gray-500 hover:text-blue-600 hover:border-blue-200 transition-colors tooltip-trigger"
                            title="Mark as read"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id) }}
                          className="p-1.5 bg-white border border-gray-200 rounded-md text-gray-500 hover:text-red-600 hover:border-red-200 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        {notif.link && (
                           <Link 
                            href={notif.link}
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 bg-white border border-gray-200 rounded-md text-gray-500 hover:text-black hover:border-black transition-colors"
                            title="View Details"
                           >
                            <ExternalLink className="h-3.5 w-3.5" />
                           </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Add keyframe animation block safely inside JSX */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInSlideDown {
          from { opacity: 0; transform: scale(0.95) translateY(-10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}} />
    </div>
  )
}
