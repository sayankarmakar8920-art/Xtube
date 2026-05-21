'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, ShieldX } from 'lucide-react'

const STORAGE_KEY = 'xtube_age_verified'

export function AgeVerificationPopup() {
  const [show, setShow] = useState(() => {
    if (typeof window === 'undefined') return false
    return !sessionStorage.getItem(STORAGE_KEY)
  })
  const [exiting, setExiting] = useState(false)

  const handleEnter = () => {
    setExiting(true)
    sessionStorage.setItem(STORAGE_KEY, 'true')
    // Also set in localStorage for persistence across tabs
    localStorage.setItem(STORAGE_KEY, Date.now().toString())
    setTimeout(() => {
      setShow(false)
      setExiting(false)
    }, 400)
  }

  const handleExit = () => {
    setExiting(true)
    setTimeout(() => {
      window.location.href = 'https://www.google.com'
    }, 400)
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: exiting ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
        >
          {/* Blurred backdrop */}
          <div className="absolute inset-0 bg-[#050505]/95 backdrop-blur-xl" />

          {/* Red ambient glow */}
          <div className="pointer-events-none absolute left-1/2 top-1/3 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E50914]/[0.06] blur-[150px]" />
          <div className="pointer-events-none absolute left-1/3 bottom-1/4 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-[#E50914]/[0.03] blur-[100px]" />

          {/* Main popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{
              opacity: exiting ? 0 : 1,
              scale: exiting ? 0.9 : 1,
              y: exiting ? 20 : 0,
            }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 mx-4 w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0B0B0F]/90 shadow-[0_0_60px_rgba(229,9,20,0.15)]"
            style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
          >
            {/* Top red glow line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#E50914] to-transparent shadow-[0_0_15px_rgba(229,9,20,0.5)]" />

            {/* Content */}
            <div className="px-6 py-8 sm:px-8 sm:py-10 flex flex-col items-center gap-6">
              {/* Shield icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.6, delay: 0.2, type: 'spring', stiffness: 200 }}
                className="flex h-20 w-20 items-center justify-center rounded-full border border-[#E50914]/20 bg-[#E50914]/10 shadow-[0_0_30px_rgba(229,9,20,0.2)]"
              >
                <ShieldCheck className="h-10 w-10 text-[#E50914]" />
              </motion.div>

              {/* Title */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-center space-y-2"
              >
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Age Verification
                </h2>
                <p className="text-base sm:text-lg text-white/60 font-medium">
                  Are you 18 years or older?
                </p>
              </motion.div>

              {/* Warning text */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="text-center text-xs sm:text-sm text-white/30 max-w-xs leading-relaxed"
              >
                This website contains age-restricted content. By entering, you confirm you are at least 18 years old.
              </motion.p>

              {/* Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="flex w-full flex-col sm:flex-row gap-3 sm:gap-4"
              >
                {/* Enter button */}
                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(229,9,20,0.4)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleEnter}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#E50914] px-6 py-3.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(229,9,20,0.3)] transition-colors hover:bg-[#ff1f2f]"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Enter
                </motion.button>

                {/* Exit button */}
                <motion.button
                  whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,255,255,0.08)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleExit}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-bold text-white/70 transition-colors hover:text-white"
                >
                  <ShieldX className="h-4 w-4" />
                  Exit
                </motion.button>
              </motion.div>

              {/* Footer note */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="text-[10px] text-white/15 text-center"
              >
                By clicking &quot;Enter&quot;, you agree to our Terms of Service and Privacy Policy.
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
