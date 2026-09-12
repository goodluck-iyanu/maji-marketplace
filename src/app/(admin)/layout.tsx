import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ShieldCheck, Users, Store, Activity, LogOut } from 'lucide-react'
import Link from 'next/link'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Strictly check if user is admin via the database
  const { data: admin } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!admin) {
    // Not an admin, kick them out
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      <div className="w-64 border-r border-gray-800 flex flex-col bg-black">
        <div className="h-16 flex items-center px-6 border-b border-gray-800 text-red-500 font-bold">
          <ShieldCheck className="mr-2" /> MAJI ADMIN
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-1">
          <Link href="/admin" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-800 hover:text-white">
            <Activity className="mr-3 h-5 w-5 text-gray-400" />
            Overview
          </Link>
          <Link href="/admin/stores" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-800 hover:text-white">
            <Store className="mr-3 h-5 w-5 text-gray-400" />
            Stores
          </Link>
          <Link href="/admin/users" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-800 hover:text-white">
            <Users className="mr-3 h-5 w-5 text-gray-400" />
            Users
          </Link>
          <Link href="/admin/payout-changes" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-800 hover:text-white">
            <ShieldCheck className="mr-3 h-5 w-5 text-gray-400" />
            Payout Approvals
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-800">
           <form action="/auth/signout" method="post">
              <button className="flex items-center px-3 py-2 w-full text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white rounded-md">
                <LogOut className="mr-3 h-5 w-5 text-gray-400" />
                Sign out
              </button>
           </form>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

