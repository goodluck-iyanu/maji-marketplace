'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  signUpAction,
  signInAction,
  verifyOtpAction,
  forgotPasswordAction,
  updatePasswordAction,
  signInWithGoogle,
} from './actions'
import { Eye, EyeOff, ArrowLeft, CheckCircle2, Shield, KeyRound } from 'lucide-react'
import {
  MajiLogo,
  MajiLoginSplashOverlay,
  MajiSpinner,
} from '@/components/brand/maji-brand'

type AuthMode =
  | 'login'
  | 'signup'
  | 'verify-signup'
  | 'forgot-password'
  | 'verify-reset'
  | 'new-password'
  | 'success'

// Shared input style (shadcn/ui + Maji brand tokens)
const inputClass =
  'w-full rounded-xl px-4 py-3 bg-[#FAF8F5] border border-neutral-200 text-[#111111] placeholder:text-neutral-400 focus:ring-2 focus:ring-[#F05A28]/25 focus:border-[#F05A28] focus:bg-white outline-none transition-all text-sm'

const btnPrimary =
  'w-full bg-[#111111] text-white rounded-xl px-4 py-3.5 hover:bg-[#F05A28] transition-all font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 shadow-xs cursor-pointer'

function maskEmail(email: string) {
  if (!email.includes('@')) return email
  const [name, domain] = email.split('@')
  if (name.length <= 2) return name[0] + '***@' + domain
  return name[0] + name[1] + '***@' + domain
}

// =====================================================
// PASSWORD INPUT — defined OUTSIDE AuthForms to avoid
// keyboard dismissal on mobile (stable React identity)
// =====================================================
function PasswordInput({
  value,
  onChange,
  placeholder = 'Enter password',
  showPassword,
  onToggle,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  showPassword: boolean
  onToggle: () => void
}) {
  return (
    <div className="relative">
      <input
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClass + ' pr-12'}
        autoComplete="off"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#111111] transition-colors"
        tabIndex={-1}
      >
        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
  )
}

// =====================================================
// OTP INPUT — Standard input for flexible length
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
  return (
    <input
      type="text"
      inputMode="numeric"
      disabled={disabled}
      value={value}
      placeholder="Enter code"
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, '')
        onChange(digits)
      }}
      className="w-full text-center tracking-[0.5em] text-2xl font-bold py-4 border-2 border-neutral-200 rounded-2xl focus:ring-2 focus:ring-[#F05A28]/25 focus:border-[#F05A28] outline-none transition-all disabled:opacity-50 bg-[#FAF8F5] focus:bg-white text-[#111111]"
    />
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
  const [isRedirecting, setIsRedirecting] = useState(false)
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

  const togglePassword = () => setShowPassword((p) => !p)
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
    if (!email || !phone || !password || !confirmPassword)
      return setError('Please fill in all fields.')
    if (password.length < 6)
      return setError('Password must be at least 6 characters.')
    if (password !== confirmPassword)
      return setError('Passwords do not match.')

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
        setIsRedirecting(true)
        router.push('/dashboard')
        router.refresh()
      }
    })
  }

  const handleVerifySignup = () => {
    clearError()
    if (!otp) return setError('Please enter the code.')

    startTransition(async () => {
      const res = await verifyOtpAction(email, otp, 'signup')
      if (res?.error) {
        setError(res.error)
      } else {
        setIsRedirecting(true)
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
        setIsRedirecting(true)
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
    if (!otp) return setError('Please enter the code.')

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

  const showAuthSplashOverlay =
    isRedirecting ||
    (isPending && (mode === 'login' || mode === 'signup' || mode === 'verify-signup'))

  const splashTitle = isRedirecting
    ? 'Welcome to Maji! Opening your store...'
    : mode === 'signup'
    ? 'Creating your Maji seller account...'
    : mode === 'verify-signup'
    ? 'Verifying your code & launching Maji...'
    : 'Signing you in to Maji...'

  // ---------- RENDER ----------

  // ===== VERIFY SIGNUP OTP =====
  if (mode === 'verify-signup') {
    return (
      <>
        <MajiLoginSplashOverlay visible={showAuthSplashOverlay} title={splashTitle} />
        <div className="space-y-6">
          <button
            onClick={() => goTo('signup')}
            className="flex items-center text-sm font-medium text-neutral-500 hover:text-[#111111] transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </button>

          <div className="flex flex-col items-center text-center space-y-3">
            <div className="h-16 w-16 bg-[#FAF8F5] border border-[#111111]/[0.07] rounded-2xl flex items-center justify-center">
              <MajiLogo variant="symbol" colorway="ember-orange" size={38} animation="bounce" />
            </div>
            <h2 className="text-xl font-bold text-[#111111]">Verify your email</h2>
            <p className="text-sm text-neutral-500">
              We sent a 6-digit verification code to
              <br />
              <span className="font-semibold text-[#111111]">{maskEmail(email)}</span>
            </p>
          </div>

          <OtpInput value={otp} onChange={setOtp} disabled={isPending} />

          <button onClick={handleVerifySignup} disabled={isPending || !otp} className={btnPrimary}>
            {isPending ? (
              <>
                <MajiSpinner size={18} color="white" /> Verifying...
              </>
            ) : (
              'Verify & Continue'
            )}
          </button>

          <p className="text-xs text-center text-neutral-400">
            Didn&apos;t receive the code? Check your spam folder or wait 60s to request again.
          </p>

          {error && (
            <div className="p-3.5 bg-red-50 text-red-600 text-center text-sm border border-red-200 rounded-xl font-medium">
              {error}
            </div>
          )}
        </div>
      </>
    )
  }

  // ===== FORGOT PASSWORD =====
  if (mode === 'forgot-password') {
    return (
      <div className="space-y-6">
        <button
          onClick={() => goTo('login')}
          className="flex items-center text-sm font-medium text-neutral-500 hover:text-[#111111] transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to login
        </button>

        <div className="flex flex-col items-center text-center space-y-3">
          <div className="h-16 w-16 bg-[#F05A28]/10 text-[#F05A28] rounded-2xl flex items-center justify-center">
            <KeyRound className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-[#111111]">Reset Password</h2>
          <p className="text-sm text-neutral-500">
            Enter the email or phone number linked to your account.
            <br />
            We&apos;ll send a reset code to your email.
          </p>
        </div>

        <div>
          <label className="text-sm font-semibold text-[#111111] block mb-1.5">
            Email or Phone Number
          </label>
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="you@example.com or +234..."
            className={inputClass}
          />
        </div>

        <button
          onClick={handleForgotPassword}
          disabled={isPending || !identifier}
          className={btnPrimary}
        >
          {isPending ? (
            <>
              <MajiSpinner size={18} color="white" /> Sending code...
            </>
          ) : (
            'Send Reset Code'
          )}
        </button>

        {error && (
          <div className="p-3.5 bg-red-50 text-red-600 text-center text-sm border border-red-200 rounded-xl font-medium">
            {error}
          </div>
        )}
      </div>
    )
  }

  // ===== VERIFY RESET OTP =====
  if (mode === 'verify-reset') {
    return (
      <div className="space-y-6">
        <button
          onClick={() => goTo('forgot-password')}
          className="flex items-center text-sm font-medium text-neutral-500 hover:text-[#111111] transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </button>

        <div className="flex flex-col items-center text-center space-y-3">
          <div className="h-16 w-16 bg-[#F05A28]/10 text-[#F05A28] rounded-2xl flex items-center justify-center">
            <Shield className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-[#111111]">Enter reset code</h2>
          <p className="text-sm text-neutral-500">
            We sent a 6-digit code to
            <br />
            <span className="font-semibold text-[#111111]">{maskEmail(resetEmail)}</span>
          </p>
        </div>

        <OtpInput value={otp} onChange={setOtp} disabled={isPending} />

        <button onClick={handleVerifyReset} disabled={isPending || !otp} className={btnPrimary}>
          {isPending ? (
            <>
              <MajiSpinner size={18} color="white" /> Verifying...
            </>
          ) : (
            'Verify Code'
          )}
        </button>

        <p className="text-xs text-center text-neutral-400">
          Didn&apos;t receive it? Check your spam folder.
        </p>

        {error && (
          <div className="p-3.5 bg-red-50 text-red-600 text-center text-sm border border-red-200 rounded-xl font-medium">
            {error}
          </div>
        )}
      </div>
    )
  }

  // ===== SET NEW PASSWORD =====
  if (mode === 'new-password') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="h-16 w-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <KeyRound className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-[#111111]">Set new password</h2>
          <p className="text-sm text-neutral-500">Choose a strong password for your account.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-[#111111] block mb-1.5">
              New Password
            </label>
            <PasswordInput
              value={newPassword}
              onChange={setNewPassword}
              placeholder="At least 6 characters"
              showPassword={showPassword}
              onToggle={togglePassword}
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-[#111111] block mb-1.5">
              Confirm New Password
            </label>
            <PasswordInput
              value={confirmNewPassword}
              onChange={setConfirmNewPassword}
              placeholder="Re-enter password"
              showPassword={showPassword}
              onToggle={togglePassword}
            />
          </div>
        </div>

        <button
          onClick={handleUpdatePassword}
          disabled={isPending || !newPassword || !confirmNewPassword}
          className={btnPrimary}
        >
          {isPending ? (
            <>
              <MajiSpinner size={18} color="white" /> Updating...
            </>
          ) : (
            'Update Password'
          )}
        </button>

        {error && (
          <div className="p-3.5 bg-red-50 text-red-600 text-center text-sm border border-red-200 rounded-xl font-medium">
            {error}
          </div>
        )}
      </div>
    )
  }

  // ===== SUCCESS =====
  if (mode === 'success') {
    return (
      <div className="flex flex-col items-center text-center space-y-4 py-8">
        <div className="h-20 w-20 bg-[#FAF8F5] border border-[#111111]/[0.07] rounded-3xl flex items-center justify-center">
          <MajiLogo variant="symbol" colorway="ember-orange" size={48} animation="bounce" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Password Updated
        </div>
        <h2 className="text-xl font-bold text-[#111111]">All set!</h2>
        <p className="text-sm text-neutral-500">Redirecting you to sign in...</p>
        <MajiSpinner size={22} color="ember" />
      </div>
    )
  }

  // ===== LOGIN / SIGNUP (default view with tabs) =====
  return (
    <>
      <MajiLoginSplashOverlay visible={showAuthSplashOverlay} title={splashTitle} />

      <div className="space-y-6">
        {/* Segmented Tab Switcher (shadcn/ui Tabs pattern) */}
        <div className="grid grid-cols-2 p-1 bg-[#FAF8F5] rounded-2xl border border-[#111111]/[0.06]">
          <button
            type="button"
            onClick={() => goTo('login')}
            className={`py-2.5 text-sm rounded-xl text-center transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-[#111111] shadow-xs font-semibold'
                : 'text-neutral-500 hover:text-[#111111] font-medium'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => goTo('signup')}
            className={`py-2.5 text-sm rounded-xl text-center transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-white text-[#111111] shadow-xs font-semibold'
                : 'text-neutral-500 hover:text-[#111111] font-medium'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* ---- LOGIN FORM ---- */}
        {mode === 'login' && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-[#111111] block mb-1.5">
                Email or Phone Number
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="you@example.com or +234..."
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-[#111111] block mb-1.5">
                Password
              </label>
              <PasswordInput
                value={password}
                onChange={setPassword}
                showPassword={showPassword}
                onToggle={togglePassword}
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => goTo('forgot-password')}
                className="text-xs font-semibold text-neutral-500 hover:text-[#F05A28] transition-colors cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            <button onClick={handleSignIn} disabled={isPending} className={btnPrimary}>
              {isPending ? (
                <>
                  <MajiSpinner size={18} color="white" /> Signing in...
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
              <label className="text-sm font-semibold text-[#111111] block mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-[#111111] block mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+2348012345678"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-[#111111] block mb-1.5">
                Password
              </label>
              <PasswordInput
                value={password}
                onChange={setPassword}
                placeholder="At least 6 characters"
                showPassword={showPassword}
                onToggle={togglePassword}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-[#111111] block mb-1.5">
                Confirm Password
              </label>
              <PasswordInput
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Re-enter password"
                showPassword={showPassword}
                onToggle={togglePassword}
              />
            </div>

            <button onClick={handleSignUp} disabled={isPending} className={btnPrimary}>
              {isPending ? (
                <>
                  <MajiSpinner size={18} color="white" /> Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-3.5 bg-red-50 text-red-600 text-center text-sm border border-red-200 rounded-xl font-medium">
            {error}
          </div>
        )}

        {/* ---- OR Divider + Google ---- */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-neutral-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-neutral-400 font-medium">Or</span>
          </div>
        </div>

        <form>
          <button
            formAction={signInWithGoogle}
            className="w-full border border-neutral-200 bg-white text-[#111111] rounded-xl px-4 py-3 hover:bg-[#FAF8F5] hover:border-neutral-300 transition-all flex items-center justify-center gap-2.5 text-sm font-semibold cursor-pointer"
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
    </>
  )
}
