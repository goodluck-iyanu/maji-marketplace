'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// ====== SIGN UP ======
export async function signUpAction(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const password = formData.get('password') as string

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { phone },
    },
  })

  if (error) {
    return { error: error.message }
  }

  // If no session returned, email confirmation (OTP) is required
  if (data.user && !data.session) {
    return { success: true, needsVerification: true }
  }

  // Auto-confirmed, user can proceed
  return { success: true, needsVerification: false }
}

// ====== VERIFY OTP (signup or recovery) ======
export async function verifyOtpAction(email: string, token: string, type: 'signup' | 'recovery') {
  const supabase = await createClient()

  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

// ====== SIGN IN (email or phone + password) ======
export async function signInAction(formData: FormData) {
  const supabase = await createClient()
  const identifier = (formData.get('identifier') as string).trim()
  const password = formData.get('password') as string

  let loginEmail = identifier

  // Detect if the identifier looks like a phone number
  const isPhone = identifier.startsWith('+') || /^\d{7,}$/.test(identifier.replace(/[\s\-()]/g, ''))

  if (isPhone) {
    // Look up the user's email by their phone number in auth metadata
    const { createClient: createAdminClient } = require('@supabase/supabase-js')
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
    const matchedUser = users?.find((u: any) => u.user_metadata?.phone === identifier)

    if (!matchedUser) {
      return { error: 'No account found with this phone number.' }
    }

    loginEmail = matchedUser.email!
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: loginEmail,
    password,
  })

  if (error) {
    if (error.message === 'Email not confirmed') {
      return { error: 'Please verify your email first. Check your inbox for the verification code.' }
    }
    return { error: error.message }
  }

  return { success: true }
}

// ====== FORGOT PASSWORD ======
export async function forgotPasswordAction(identifier: string) {
  const trimmed = identifier.trim()
  let resetEmail = trimmed

  const isPhone = trimmed.startsWith('+') || /^\d{7,}$/.test(trimmed.replace(/[\s\-()]/g, ''))

  if (isPhone) {
    const { createClient: createAdminClient } = require('@supabase/supabase-js')
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
    const matchedUser = users?.find((u: any) => u.user_metadata?.phone === trimmed)

    if (!matchedUser) {
      return { error: 'No account found with this phone number.' }
    }

    resetEmail = matchedUser.email!
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(resetEmail)

  if (error) {
    return { error: error.message }
  }

  return { success: true, email: resetEmail }
}

// ====== UPDATE PASSWORD (after recovery OTP verified) ======
export async function updatePasswordAction(newPassword: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

// ====== GOOGLE OAUTH ======
export async function signInWithGoogle() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (data.url) {
    redirect(data.url)
  }
}
