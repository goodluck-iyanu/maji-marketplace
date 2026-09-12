import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export default async function proxy(request: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.next()
    }
    return await updateSession(request)
  } catch (e) {
    return NextResponse.next()
  }
}
