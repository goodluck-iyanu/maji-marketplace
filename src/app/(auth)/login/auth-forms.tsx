'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  signUpAction,
  signInAction,
  verifyOtpAction,
  forgotPasswordAction,
  updatePasswordAction,
  signInWithGoogle,
} from './actions'
import { Loader2, Eye, EyeOff, ArrowLeft, CheckCircle2, Shield, KeyRound } from 'lucide-react'

type AuthMode =
  | 'login'
  | 'signup'
  | 'verify-signup'
  | 'forgot-password'
  | 'verify-reset'
  | 'new-password'
  | 'success'

function maskEmail(email: string) {
  if (!email.includes('@')) return email
  const [name, domain] = email.split('@')
  if (name.length <= 2) return name[0] + '***@' + domain
  return name[0] + name[1] + '***@' + domain
}

// =====================================================
// OTP INPUT — 6 individual digit boxes
// =====================================================
function OtpInput({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    refs.current[0]?.focus()
  }, [])

  return (
    <div className="flex gap-3 justify-center">
      {Array.from({ length: 6 }, (_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          disabled={disabled}
          value={value[i] || ''}
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            const digit = e.target.value.replace(/\D/g, '').slice(-1)
            if (!digit) return
            const before = value.slice(0, i)
            const after = value.slice(i + 1)
            const next = (before + digit + after).slice(0, 6)
            onChange(next)
            if (i < 5) refs.current[i + 1]?.focus()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace') {
              e.preventDefault()
              if (value[i]) {
                onChange(value.slice(0, i) + value.slice(i + 1))
              } else if (i > 0) {
                onChange(value.slice(0, i - 1) + value.slice(i))
                refs.current[i - 1]?.focus()
              }
            }
            if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus()
            if (e.key === 'ArrowRight' && i < 5) refs.current[i + 1]?.focus()
          }}
          onPaste={(e) => {
            e.preventDefault()
            const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
            onChange(pasted)
            refs.current[Math.min(pasted.length, 5)]?.focus()
          }}
          className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all disabled:opacity-50 bg-gray-50 focus:bg-white"
        />
      ))}
    </div>
  )
}

// =====================================================
// MAIN AUTH FORMS COMPONENT
// =====================================================
export function AuthForms({
  defaultMode = 'login',
  initialError,
}: {
  defaultMode?: 'login' | 'signup'
  initialError?: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [mode, setMode] = useState<AuthMode>(defaultMode)
  const [error, setError] = useState(initialError || '')

  // Form state
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')

  const clearError = () => setError('')

  const goTo = (next: AuthMode) => {
    clearError()
    setOtp('')
    setShowPassword(false)
    setMode(next)
  }

  // ---------- HANDLERS ----------

  const handleSignUp = () => {
    clearError()
    if (!email || !phone || !password || !confirmPassword) {
      return setError('Please fill in all fields.')
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters.')
    }
    if (password !== confirmPassword) {
      return setError('Passwords do not match.')
    }

    startTransition(async () => {
      const fd = new FormData()
      fd.set('email', email)
      fd.set('phone', phone)
      fd.set('password', password)

      const res = await signUpAction(fd)
      if (res?.error) {
        setError(res.error)
      } else if (res?.needsVerification) {
        goTo('verify-signup')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    })
  }

  const handleVerifySignup = () => {
    clearError()
    if (otp.length !== 6) return setError('Please enter the full 6-digit code.')

    startTransition(async () => {
      const res = await verifyOtpAction(email, otp, 'signup')
      if (res?.error) {
        setError(res.error)
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    })
  }

  const handleSignIn = () => {
    clearError()
    if (!identifier || !password) return setError('Please fill in all fields.')

    startTransition(async () => {
      const fd = new FormData()
      fd.set('identifier', identifier)
      fd.set('password', password)

      const res = await signInAction(fd)
      if (res?.error) {
        setError(res.error)
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    })
  }

  const handleForgotPassword = () => {
    clearError()
    if (!identifier) return setError('Please enter your email or phone number.')

    startTransition(async () => {
      const res = await forgotPasswordAction(identifier)
      if (res?.error) {
        setError(res.error)
      } else {
        setResetEmail(res?.email || identifier)
        goTo('verify-reset')
      }
    })
  }

  const handleVerifyReset = () => {
    clearError()
    if (otp.length !== 6) return setError('Please enter the full 6-digit code.')

    startTransition(async () => {
      const res = await verifyOtpAction(resetEmail, otp, 'recovery')
      if (res?.error) {
        setError(res.error)
      } else {
        goTo('new-password')
      }
    })
  }

  const handleUpdatePassword = () => {
    clearError()
    if (!newPassword || !confirmNewPassword) return setError('Please fill in both fields.')
    if (newPassword.length < 6) return setError('Password must be at least 6 characters.')
    if (newPassword !== confirmNewPassword) return setError('Passwords do not match.')

    startTransition(async () => {
      const res = await updatePasswordAction(newPassword)
      if (res?.error) {
        setError(res.error)
      } else {
        goTo('success')
        setTimeout(() => {
          setPassword('')
          setIdentifier('')
          goTo('login')
        }, 3000)
      }
    })
  }

  // ---------- SHARED UI PIECES ----------

  const inputClass =
    'w-full rounded-lg px-4 py-3 bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-black focus:border-black focus:bg-white outline-none transition-all text-sm'

  const btnPrimary =
    'w-full bg-black text-white rounded-lg px-4 py-3 hover:bg-gray-800 transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'

  const PasswordField = ({
    val,
    set,
    placeholder = 'Enter password',
  }: {
    val: string
    set: (v: string) => void
    placeholder?: string
  }) => (
    <div className="relative">
      <input
        type={showPassword ? 'text' : 'password'}
        value={val}
        onChange={(e) => set(e.target.value)}
        placeholder={placeholder}
        className={inputClass + ' pr-12'}
        required
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
  )

  const ErrorBox = () =>
    error ? (
      <div className="p-3 bg-red-50 text-red-600 text-center text-sm border border-red-200 rounded-lg mt-4">
        {error}
      </div>
    ) : null

  const BackBtn = ({ to, label = 'Back' }: { to: AuthMode; label?: string }) => (
    <button
      onClick={() => goTo(to)}
      className="flex items-center text-sm text-gray-500 hover:text-black transition-colors"
    >
      <ArrowLeft className="h-4 w-4 mr-1" /> {label}
    </button>
  )

  // ---------- SCREENS ----------

  // ===== VERIFY SIGNUP OTP =====
  if (mode === 'verify-signup') {
    return (
      <div className="space-y-6">
        <BackBtn to="signup" />
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
            <Shield className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-semibold">Verify your email</h2>
          <p className="text-sm text-gray-500">
            We sent a 6-digit verification code to
            <br />
            <span className="font-medium text-gray-700">{maskEmail(email)}</span>
          </p>
        </div>

        <OtpInput value={otp} onChange={setOtp} disabled={isPending} />

        <button onClick={handleVerifySignup} disabled={isPending || otp.length !== 6} className={btnPrimary}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Verifying...
            </>
          ) : (
            'Verify & Continue'
          )}
        </button>

        <p className="text-xs text-center text-gray-400">
          Didn&apos;t receive the code? Check your spam folder or wait 60 seconds to request again.
        </p>
        <ErrorBox />
      </div>
    )
  }

  // ===== FORGOT PASSWORD =====
  if (mode === 'forgot-password') {
    return (
      <div className="space-y-6">
        <BackBtn to="login" label="Back to login" />
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="h-16 w-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
            <KeyRound className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-semibold">Reset Password</h2>
          <p className="text-sm text-gray-500">
            Enter the email or phone number linked to your account.
            <br />
            We&apos;ll send a reset code to your email.
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Email or Phone Number</label>
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="you@example.com or +234..."
            className={inputClass}
          />
        </div>

        <button onClick={handleForgotPassword} disabled={isPending || !identifier} className={btnPrimary}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Sending code...
            </>
          ) : (
            'Send Reset Code'
          )}
        </button>
        <ErrorBox />
      </div>
    )
  }

  // ===== VERIFY RESET OTP =====
  if (mode === 'verify-reset') {
    return (
      <div className="space-y-6">
        <BackBtn to="forgot-password" />
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
            <Shield className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-semibold">Enter reset code</h2>
          <p className="text-sm text-gray-500">
            We sent a 6-digit code to
            <br />
            <span className="font-medium text-gray-700">{maskEmail(resetEmail)}</span>
          </p>
        </div>

        <OtpInput value={otp} onChange={setOtp} disabled={isPending} />

        <button onClick={handleVerifyReset} disabled={isPending || otp.length !== 6} className={btnPrimary}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Verifying...
            </>
          ) : (
            'Verify Code'
          )}
        </button>

        <p className="text-xs text-center text-gray-400">Didn&apos;t receive it? Check your spam folder.</p>
        <ErrorBox />
      </div>
    )
  }

  // ===== SET NEW PASSWORD =====
  if (mode === 'new-password') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="h-16 w-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
            <KeyRound className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-semibold">Set new password</h2>
          <p className="text-sm text-gray-500">Choose a strong password for your account.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">New Password</label>
            <PasswordField val={newPassword} set={setNewPassword} placeholder="At least 6 characters" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Confirm New Password</label>
            <PasswordField val={confirmNewPassword} set={setConfirmNewPassword} placeholder="Re-enter password" />
          </div>
        </div>

        <button
          onClick={handleUpdatePassword}
          disabled={isPending || !newPassword || !confirmNewPassword}
          className={btnPrimary}
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Updating...
            </>
          ) : (
            'Update Password'
          )}
        </button>
        <ErrorBox />
      </div>
    )
  }

  // ===== SUCCESS =====
  if (mode === 'success') {
    return (
      <div className="flex flex-col items-center text-center space-y-4 py-8">
        <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-semibold">Password Updated!</h2>
        <p className="text-sm text-gray-500">Redirecting you to login...</p>
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    )
  }

  // ===== LOGIN / SIGNUP (default view with tabs) =====
  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => goTo('login')}
          className={`flex-1 py-2.5 text-sm text-center transition-all ${
            mode === 'login'
              ? 'text-black border-b-2 border-black font-semibold'
              : 'text-gray-400 border-b-2 border-transparent hover:text-gray-600 font-medium'
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => goTo('signup')}
          className={`flex-1 py-2.5 text-sm text-center transition-all ${
            mode === 'signup'
              ? 'text-black border-b-2 border-black font-semibold'
              : 'text-gray-400 border-b-2 border-transparent hover:text-gray-600 font-medium'
          }`}
        >
          Create Account
        </button>
      </div>

      {/* ---- LOGIN FORM ---- */}
      {mode === 'login' && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Email or Phone Number</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="you@example.com or +234..."
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Password</label>
            <PasswordField val={password} set={setPassword} />
          </div>

          <div className="flex justify-end">
            <button type="button" onClick={() => goTo('forgot-password')} className="text-sm text-gray-500 hover:text-black transition-colors">
              Forgot password?
            </button>
          </div>

          <button onClick={handleSignIn} disabled={isPending} className={btnPrimary}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </div>
      )}

      {/* ---- SIGNUP FORM ---- */}
      {mode === 'signup' && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+2348012345678"
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Password</label>
            <PasswordField val={password} set={setPassword} placeholder="At least 6 characters" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Confirm Password</label>
            <PasswordField val={confirmPassword} set={setConfirmPassword} placeholder="Re-enter password" />
          </div>

          <button onClick={handleSignUp} disabled={isPending} className={btnPrimary}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </div>
      )}

      <ErrorBox />

      {/* ---- OR Divider + Google ---- */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-400">Or</span>
        </div>
      </div>

      <form>
        <button
          formAction={signInWithGoogle}
          className="w-full border border-gray-200 bg-white text-gray-700 rounded-lg px-4 py-2.5 hover:bg-gray-50 transition-all flex items-center justify-center gap-2.5 text-sm font-medium"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>
      </form>
    </div>
  )
}
