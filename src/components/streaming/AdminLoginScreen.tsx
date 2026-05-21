'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, Loader2, ShieldAlert, ArrowRight } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { XtubeLogo } from '@/components/shared/XtubeLogo'

// ─── Validation Helpers ─────────────────────────────────────────────────────

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// ─── Animated Background Orbs ───────────────────────────────────────────────

function BackgroundOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Primary red glow orb - top left */}
      <motion.div
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -20, 30, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-xtube-red/[0.07] blur-[120px]"
      />
      {/* Secondary red glow orb - bottom right */}
      <motion.div
        animate={{
          x: [0, -25, 15, 0],
          y: [0, 20, -25, 0],
          scale: [1, 0.9, 1.15, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
        className="absolute -bottom-32 -right-32 h-[450px] w-[450px] rounded-full bg-xtube-red/[0.05] blur-[100px]"
      />
      {/* Tertiary subtle orb - center */}
      <motion.div
        animate={{
          x: [0, 15, -10, 0],
          y: [0, -15, 10, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 4,
        }}
        className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-xtube-red/[0.03] blur-[80px]"
      />
      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  )
}

// ─── Main AdminLoginScreen Component ────────────────────────────────────────

export function AdminLoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})

  const setAdminLoggedIn = useAppStore((s) => s.setAdminLoggedIn)

  // ─── Field Validation ────────────────────────────────────────────────

  const validateFields = useCallback((): boolean => {
    const errors: { email?: string; password?: string } = {}

    if (!email.trim()) {
      errors.email = 'Email is required'
    } else if (!isValidEmail(email)) {
      errors.email = 'Invalid email format'
    }

    if (!password) {
      errors.password = 'Password is required'
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }, [email, password])

  // Clear field error on change
  useEffect(() => {
    if (fieldErrors.email && email.trim() && isValidEmail(email)) {
      setFieldErrors((prev) => ({ ...prev, email: undefined }))
    }
  }, [email, fieldErrors.email])

  useEffect(() => {
    if (fieldErrors.password && password.length >= 6) {
      setFieldErrors((prev) => ({ ...prev, password: undefined }))
    }
  }, [password, fieldErrors.password])

  // ─── Submit Handler ──────────────────────────────────────────────────

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)

      if (!validateFields()) return

      setIsLoading(true)

      try {
        const res = await fetch('/api/admin-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, rememberMe }),
        })

        const data = await res.json()

        if (data.success && data.token) {
          // Store token based on rememberMe preference
          const storage = rememberMe ? localStorage : sessionStorage
          storage.setItem('admin_token', data.token)
          storage.setItem('admin_email', data.admin?.email || email)

          // Update store
          setAdminLoggedIn(true)
        } else {
          setError(data.error || 'Login failed. Please try again.')
        }
      } catch {
        setError('Network error. Please check your connection and try again.')
      } finally {
        setIsLoading(false)
      }
    },
    [email, password, rememberMe, validateFields, setAdminLoggedIn]
  )

  // ─── Render ──────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050505] px-4 py-8"
    >
      <BackgroundOrbs />

      {/* ─── Login Card ─── */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Card glow ring */}
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-xtube-red/20 via-transparent to-transparent opacity-60" />

        <div className="relative glass-strong rounded-2xl p-6 sm:p-8">
          {/* ─── Logo + Title ─── */}
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-8 flex flex-col items-center gap-4"
          >
            {/* Xtube Logo */}
            <XtubeLogo size="xl" showText={true} showLive={true} disableAdminClick />

            <div className="text-center">
              <motion.p
                animate={{
                  textShadow: [
                    '0 0 8px rgba(255,0,0,0)',
                    '0 0 20px rgba(255,0,0,0.4)',
                    '0 0 8px rgba(255,0,0,0)',
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="mt-1 text-sm font-semibold tracking-widest text-[#FF0000] uppercase"
              >
                Admin Access
              </motion.p>
            </div>
          </motion.div>

          {/* ─── Error Alert ─── */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2.5 rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3">
                  <ShieldAlert className="h-4 w-4 flex-shrink-0 text-red-400" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── Form ─── */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email Field */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <label htmlFor="admin-email" className="mb-1.5 block text-xs font-medium text-xtube-text-secondary">
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                  <Mail className={`h-4 w-4 ${fieldErrors.email ? 'text-red-400' : 'text-xtube-text-secondary'}`} />
                </div>
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@xtube.com"
                  autoComplete="email"
                  disabled={isLoading}
                  className={`w-full rounded-xl border bg-[#0B0B0F] py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/20 transition-all focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                    fieldErrors.email
                      ? 'border-red-500/50 focus:ring-red-500/30'
                      : 'border-xtube-border focus:border-xtube-red/50 focus:ring-xtube-red/20'
                  }`}
                />
              </div>
              <AnimatePresence>
                {fieldErrors.email && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="mt-1.5 text-xs text-red-400"
                  >
                    {fieldErrors.email}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Password Field */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <label htmlFor="admin-password" className="mb-1.5 block text-xs font-medium text-xtube-text-secondary">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                  <Lock className={`h-4 w-4 ${fieldErrors.password ? 'text-red-400' : 'text-xtube-text-secondary'}`} />
                </div>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isLoading}
                  className={`w-full rounded-xl border bg-[#0B0B0F] py-3 pl-10 pr-11 text-sm text-white placeholder:text-white/20 transition-all focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                    fieldErrors.password
                      ? 'border-red-500/50 focus:ring-red-500/30'
                      : 'border-xtube-border focus:border-xtube-red/50 focus:ring-xtube-red/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-xtube-text-secondary transition-colors hover:text-white"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <AnimatePresence>
                {fieldErrors.password && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="mt-1.5 text-xs text-red-400"
                  >
                    {fieldErrors.password}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Remember Me + Forgot Password */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.55 }}
              className="flex items-center justify-between"
            >
              <label className="group flex cursor-pointer items-center gap-2.5">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="peer sr-only"
                    disabled={isLoading}
                  />
                  <div className="flex h-4.5 w-4.5 items-center justify-center rounded border border-xtube-border bg-[#0B0B0F] transition-all peer-checked:border-xtube-red peer-checked:bg-xtube-red/20 group-hover:border-white/20">
                    {rememberMe && (
                      <motion.svg
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="h-3 w-3 text-xtube-red"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </motion.svg>
                    )}
                  </div>
                </div>
                <span className="text-xs text-xtube-text-secondary transition-colors group-hover:text-white">
                  Remember me
                </span>
              </label>

              <button
                type="button"
                className="text-xs text-xtube-text-secondary transition-colors hover:text-xtube-red"
                onClick={() => setError('Password reset is not available in demo mode.')}
              >
                Forgot Password?
              </button>
            </motion.div>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
            >
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-xtube-red py-3.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(229,9,20,0.3)] transition-all hover:bg-xtube-red-hover hover:shadow-[0_0_30px_rgba(229,9,20,0.5)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {/* Shimmer effect on hover */}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </motion.button>
            </motion.div>
          </form>

          {/* ─── Footer ─── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.75 }}
            className="mt-6 border-t border-xtube-border pt-5 text-center"
          >
            <p className="text-[11px] text-white/25">
              Protected admin area. Unauthorized access is prohibited.
            </p>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  )
}
