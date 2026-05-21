'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Lock, Eye, EyeOff, Loader2, ShieldAlert, X, Fingerprint } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { XtubeLogo } from '@/components/shared/XtubeLogo'

// ─── Rate Limiting (in-memory, per-session) ──────────────────────────────────

const loginAttempts: { timestamp: number }[] = []
const MAX_ATTEMPTS = 5
const WINDOW_MS = 60_000 // 1 minute

function isRateLimited(): boolean {
  const now = Date.now()
  // Remove old attempts outside the window
  while (loginAttempts.length > 0 && now - loginAttempts[0].timestamp > WINDOW_MS) {
    loginAttempts.shift()
  }
  return loginAttempts.length >= MAX_ATTEMPTS
}

function recordAttempt() {
  loginAttempts.push({ timestamp: Date.now() })
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function AdminLoginModal() {
  const showAdminModal = useAppStore((s) => s.showAdminModal)
  const setShowAdminModal = useAppStore((s) => s.setShowAdminModal)
  const setAdminUnlocked = useAppStore((s) => s.setAdminUnlocked)
  const setAdminLoggedIn = useAppStore((s) => s.setAdminLoggedIn)
  const setView = useAppStore((s) => s.setView)

  const [adminId, setAdminId] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shakeError, setShakeError] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showAdminModal) handleClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [showAdminModal])

  // Focus trap - focus the modal when it opens
  useEffect(() => {
    if (showAdminModal) {
      setTimeout(() => {
        const firstInput = modalRef.current?.querySelector('input')
        if (firstInput) firstInput.focus()
      }, 300)
    }
  }, [showAdminModal])

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showAdminModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [showAdminModal])

  const handleClose = useCallback(() => {
    setShowAdminModal(false)
    setAdminId('')
    setAdminPassword('')
    setError(null)
    setIsLoading(false)
  }, [setShowAdminModal])

  const triggerShake = useCallback(() => {
    setShakeError(true)
    setTimeout(() => setShakeError(false), 600)
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate fields
    if (!adminId.trim() || !adminPassword.trim()) {
      setError('Admin ID and Password are required')
      triggerShake()
      return
    }

    // Rate limit check
    if (isRateLimited()) {
      setError('Too many attempts. Please try again in 1 minute.')
      triggerShake()
      return
    }

    setIsLoading(true)
    recordAttempt()

    try {
      const res = await fetch('/api/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminId, password: adminPassword }),
      })

      const data = await res.json()

      if (data.success && data.token) {
        // Store token
        sessionStorage.setItem('admin_token', data.token)
        sessionStorage.setItem('admin_email', data.admin?.email || adminId)

        // Update store
        setAdminUnlocked(true)
        setAdminLoggedIn(true)
        setShowAdminModal(false)

        // Navigate to admin
        setView('admin')

        // Clear form
        setAdminId('')
        setAdminPassword('')
      } else {
        setError(data.error || 'Invalid credentials. Access denied.')
        triggerShake()
      }
    } catch {
      setError('Network error. Please check your connection.')
      triggerShake()
    } finally {
      setIsLoading(false)
    }
  }, [adminId, adminPassword, setAdminUnlocked, setAdminLoggedIn, setShowAdminModal, setView, triggerShake])

  return (
    <AnimatePresence>
      {showAdminModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={(e) => {
            // Close on backdrop click
            if (e.target === e.currentTarget) handleClose()
          }}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Animated red glow orbs */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <motion.div
              animate={{ x: [0, 20, -15, 0], y: [0, -15, 20, 0], scale: [1, 1.1, 0.95, 1] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -left-20 -top-20 h-[400px] w-[400px] rounded-full bg-[#ff0000]/[0.06] blur-[100px]"
            />
            <motion.div
              animate={{ x: [0, -15, 10, 0], y: [0, 15, -20, 0], scale: [1, 0.9, 1.15, 1] }}
              transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
              className="absolute -bottom-20 -right-20 h-[350px] w-[350px] rounded-full bg-[#ff0000]/[0.04] blur-[80px]"
            />
          </div>

          {/* Modal Card */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              x: shakeError ? [0, -12, 12, -8, 8, -4, 4, 0] : 0,
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{
              opacity: { duration: 0.3 },
              y: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
              scale: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
              x: { duration: 0.5, ease: 'easeOut' },
            }}
            className="relative z-10 w-full max-w-[420px]"
          >
            {/* Glow ring border */}
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-[#ff0000]/20 via-[#ff0000]/5 to-transparent opacity-70" />

            {/* Card body */}
            <div className="relative rounded-2xl border border-white/[0.06] bg-[#0B0B0F]/95 p-6 shadow-[0_0_60px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:p-8">
              {/* Close button */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClose}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-white/30 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </motion.button>

              {/* Logo + Title */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className="mb-7 flex flex-col items-center gap-3"
              >
                <div className="flex items-center gap-2">
                  <XtubeLogo size="md" showText={true} showLive={false} disableAdminClick />
                </div>
                <div className="flex items-center gap-2">
                  <Fingerprint className="h-4 w-4 text-[#ff0000]" />
                  <span className="text-sm font-semibold tracking-widest text-[#ff0000] uppercase">
                    Admin Access
                  </span>
                </div>
              </motion.div>

              {/* Error Alert */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.08] px-3 py-2.5">
                      <ShieldAlert className="h-4 w-4 flex-shrink-0 text-red-400" />
                      <p className="text-xs text-red-300">{error}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Admin ID Field */}
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25, duration: 0.35 }}
                >
                  <label htmlFor="modal-admin-id" className="mb-1.5 block text-[11px] font-medium text-white/40 uppercase tracking-wider">
                    Admin ID
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                      <User className="h-4 w-4 text-white/30" />
                    </div>
                    <input
                      id="modal-admin-id"
                      type="text"
                      value={adminId}
                      onChange={(e) => setAdminId(e.target.value)}
                      placeholder="admin@xtube.com"
                      autoComplete="username"
                      disabled={isLoading}
                      className="w-full rounded-xl border border-white/[0.08] bg-[#0a0a0a] py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/15 transition-all focus:border-[#ff0000]/40 focus:outline-none focus:ring-2 focus:ring-[#ff0000]/20 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </motion.div>

                {/* Password Field */}
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35, duration: 0.35 }}
                >
                  <label htmlFor="modal-admin-password" className="mb-1.5 block text-[11px] font-medium text-white/40 uppercase tracking-wider">
                    Password
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                      <Lock className="h-4 w-4 text-white/30" />
                    </div>
                    <input
                      id="modal-admin-password"
                      type={showPassword ? 'text' : 'password'}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      disabled={isLoading}
                      className="w-full rounded-xl border border-white/[0.08] bg-[#0a0a0a] py-3 pl-10 pr-11 text-sm text-white placeholder:text-white/15 transition-all focus:border-[#ff0000]/40 focus:outline-none focus:ring-2 focus:ring-[#ff0000]/20 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-white/30 transition-colors hover:text-white"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </motion.div>

                {/* Submit Button */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45, duration: 0.35 }}
                  className="pt-2"
                >
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#ff0000] py-3.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(255,0,0,0.3)] transition-all hover:bg-[#e60000] hover:shadow-[0_0_36px_rgba(255,0,0,0.5)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {/* Shimmer */}
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Authenticating...</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="h-4 w-4" />
                        <span>Login</span>
                      </>
                    )}
                  </motion.button>
                </motion.div>

                {/* Cancel */}
                <motion.button
                  type="button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  onClick={handleClose}
                  className="w-full rounded-xl py-2.5 text-xs font-medium text-white/30 transition-colors hover:text-white/60"
                >
                  Cancel
                </motion.button>
              </form>

              {/* Footer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-5 border-t border-white/[0.04] pt-4 text-center"
              >
                <p className="text-[10px] text-white/15">
                  Protected admin area. Unauthorized access is prohibited.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
