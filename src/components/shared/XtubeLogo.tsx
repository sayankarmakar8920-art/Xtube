'use client'

import { useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { processAdminClick, getAdminClickCount, isPhone } from '@/lib/admin-click'

// ─── Types ───────────────────────────────────────────────────────────────────

interface XtubeLogoProps {
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /** Show full text or just icon */
  showText?: boolean
  /** Show "Live" red text alongside Xtube */
  showLive?: boolean
  /** Click handler override — if provided, replaces default admin click logic */
  onClick?: () => void
  /** Disable admin click logic entirely (for decorative logos inside modals) */
  disableAdminClick?: boolean
  /** Additional CSS classes */
  className?: string
}

// ─── Size Map ────────────────────────────────────────────────────────────────

const sizeMap = {
  xs:  { icon: 20, letter: 10, nameText: 13, liveText: 11, gap: 5  },
  sm:  { icon: 24, letter: 12, nameText: 16, liveText: 13, gap: 6  },
  md:  { icon: 32, letter: 16, nameText: 20, liveText: 16, gap: 8  },
  lg:  { icon: 40, letter: 20, nameText: 26, liveText: 21, gap: 10 },
  xl:  { icon: 56, letter: 28, nameText: 36, liveText: 28, gap: 14 },
}

// ─── SVG Logo Icon ───────────────────────────────────────────────────────────

function LogoIcon({ size, pulseGlow }: { size: number; pulseGlow: boolean }) {
  const r = size / 2
  const innerR = r * 0.85
  const fontSize = size * 0.5

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      <defs>
        {/* Glow filter */}
        <filter id={`glow-${size}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={size * 0.08} result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        {/* Inner shadow for 3D depth */}
        <radialGradient id={`circleGrad-${size}`} cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ff3333" />
          <stop offset="100%" stopColor="#cc0000" />
        </radialGradient>
        {/* Highlight arc */}
        <radialGradient id={`highlight-${size}`} cx="40%" cy="30%" r="50%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>

      {/* Outer glow ring (animated when pulseGlow) */}
      {pulseGlow && (
        <circle
          cx={r}
          cy={r}
          r={innerR + 2}
          fill="none"
          stroke="#ff0000"
          strokeWidth="2"
          opacity="0.4"
        >
          <animate attributeName="r" values={`${innerR + 1};${innerR + 4};${innerR + 1}`} dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0.15;0.4" dur="1.5s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Main circle */}
      <circle
        cx={r}
        cy={r}
        r={innerR}
        fill={`url(#circleGrad-${size})`}
        filter={`url(#glow-${size})`}
      />

      {/* Highlight overlay for 3D effect */}
      <circle
        cx={r}
        cy={r}
        r={innerR}
        fill={`url(#highlight-${size})`}
      />

      {/* "X" letter */}
      <text
        x={r}
        y={r + fontSize * 0.36}
        textAnchor="middle"
        fontSize={fontSize}
        fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif"
        fontWeight="900"
        fill="white"
        style={{ letterSpacing: '-0.02em' }}
      >
        X
      </text>
    </svg>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function XtubeLogo({
  size = 'md',
  showText = true,
  showLive = true,
  onClick,
  disableAdminClick = false,
  className = '',
}: XtubeLogoProps) {
  const showAdminModal = useAppStore((s) => s.showAdminModal)

  const s = sizeMap[size]

  // Read stored click count from sessionStorage for pulse animation
  const storedClickCount = getAdminClickCount()
  const pulseGlow = storedClickCount > 0 && !showAdminModal

  // ─── Debounce to prevent double-firing from click + touchstart ──────────
  const lastClickTimeRef = useRef(0)
  const isTouchFiredRef = useRef(false)

  // Core handler — processes the admin click logic
  const handleLogoAction = useCallback(() => {
    // If custom onClick provided, call it instead
    if (onClick) {
      onClick()
      return
    }

    // If admin click is disabled (decorative logo), do nothing
    if (disableAdminClick) return

    // If admin modal is already open, don't process more clicks
    if (useAppStore.getState().showAdminModal) return

    // Debounce: prevent double-fire from both touchstart and click (150ms window)
    const now = Date.now()
    if (now - lastClickTimeRef.current < 150) return
    lastClickTimeRef.current = now

    // Determine device type: only true phones are blocked, tablets work like desktop
    const isPhoneDevice = isPhone()

    // Process the click using sessionStorage-based counter
    const result = processAdminClick(isPhoneDevice)

    if (result === 'admin') {
      // ★ 7th continuous click! Open admin login modal
      useAppStore.getState().setShowAdminModal(true)
    } else if (result === 'navigate') {
      // Admin already logged in, navigate home
      const store = useAppStore.getState()
      store.setView('home')
      store.setSelectedVideoId(null)
    } else {
      // Clicks 1-6 or phone: refresh the page
      window.location.reload()
    }
  }, [onClick, disableAdminClick])

  // onClick handler — most reliable, works on ALL devices
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    // If touch already fired, skip the click event to prevent double-fire
    if (isTouchFiredRef.current) {
      isTouchFiredRef.current = false
      return
    }
    handleLogoAction()
  }, [handleLogoAction])

  // touchstart handler — instant response on touch devices (no 300ms delay)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    isTouchFiredRef.current = true
    handleLogoAction()
  }, [handleLogoAction])

  return (
    <motion.button
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={`flex items-center focus:outline-none ${className}`}
      style={{
        touchAction: 'manipulation',    // removes 300ms delay on mobile
        WebkitTapHighlightColor: 'transparent', // no blue flash on tap
        userSelect: 'none',             // prevent text selection on rapid taps
      }}
      aria-label="Xtube Home"
    >
      {/* Red circle icon with X */}
      <LogoIcon size={s.icon} pulseGlow={pulseGlow} />

      {/* Text: "Xtube" white + "Live" red */}
      <AnimatePresence>
        {showText && (
          <motion.span
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.2 }}
            className="flex items-baseline whitespace-nowrap leading-none"
            style={{ gap: s.gap * 0.4 }}
          >
            {/* "Xtube" in white */}
            <span
              className="font-extrabold text-white"
              style={{
                fontSize: s.nameText,
                letterSpacing: '-0.03em',
              }}
            >
              Xtube
            </span>

            {/* "Live" in red with subtle glow */}
            {showLive && (
              <motion.span
                animate={pulseGlow ? {
                  textShadow: [
                    '0 0 6px rgba(255,0,0,0.3)',
                    '0 0 16px rgba(255,0,0,0.6)',
                    '0 0 6px rgba(255,0,0,0.3)',
                  ],
                } : {
                  textShadow: '0 0 8px rgba(255,0,0,0.2)',
                }}
                transition={{ duration: 1.5, repeat: pulseGlow ? Infinity : 0 }}
                className="font-extrabold text-[#FF0000]"
                style={{
                  fontSize: s.liveText,
                  letterSpacing: '0.02em',
                }}
              >
                Live
              </motion.span>
            )}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
