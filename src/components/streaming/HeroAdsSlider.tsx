'use client'

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Info, ChevronLeft, ChevronRight, Volume2, VolumeX, Megaphone, Maximize2, Clock } from 'lucide-react'
import { useAppStore } from '@/lib/store'

/* ────────────────────────────────────────────
   Types
   ──────────────────────────────────────────── */

interface HeroAdItem {
  id: string
  title: string
  description?: string
  category?: string
  mediaUrl: string
  thumbnailUrl?: string
  adType: 'image' | 'video'
  mediaFormat: string
  linkUrl?: string
  startDate?: string | null
  endDate?: string | null
}

interface HeroAdsSliderProps {
  ads: HeroAdItem[]
}

/* ────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────── */

const AUTOPLAY_DELAY = 6_000  // 6 seconds in ms
const TRANSITION_SPEED = 600    // ms - faster transition
const SWIPE_THRESHOLD = 50        // px minimum swipe distance
const MAX_VISIBLE_ADS = 6         // Maximum hero ads to display

/* ────────────────────────────────────────────
   Staggered content animation variants
   ──────────────────────────────────────────── */

const contentVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.3 },
  },
  exit: {
    transition: { staggerChildren: 0.04, staggerDirection: -1 },
  },
}

const contentItem = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
}

/* ────────────────────────────────────────────
   Component
   ──────────────────────────────────────────── */

export function HeroAdsSlider({ ads }: HeroAdsSliderProps) {
  // Limit to max 6 ads
  const visibleAds = useMemo(() => ads.slice(0, MAX_VISIBLE_ADS), [ads])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [videoMuted, setVideoMuted] = useState(true)
  const [videoLoaded, setVideoLoaded] = useState<Record<string, boolean>>({})
  const [isHovering, setIsHovering] = useState(false)

  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({})
  const containerRef = useRef<HTMLDivElement>(null)

  const navigateToVideo = useAppStore((s) => s.navigateToVideo)

  const hasMultipleAds = visibleAds.length > 1

  /* ── Derived indices ── */
  const nextIndex = useMemo(
    () => (currentIndex + 1) % visibleAds.length,
    [currentIndex, visibleAds.length],
  )

  /* ── Go to slide ── */
  const goToSlide = useCallback(
    (index: number) => {
      setCurrentIndex((prev) => {
        if (prev === index) return prev
        return index
      })
    },
    [],
  )

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % visibleAds.length)
  }, [visibleAds.length])

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + visibleAds.length) % visibleAds.length)
  }, [visibleAds.length])

  /* ── Autoplay (30 minutes) ── */
  useEffect(() => {
    if (!hasMultipleAds) return

    // Clear any existing timer
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current)
      autoplayRef.current = null
    }

    // Don't start if paused (hover on desktop)
    if (isPaused) return

    autoplayRef.current = setInterval(goToNext, AUTOPLAY_DELAY)

    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current)
        autoplayRef.current = null
      }
    }
  }, [goToNext, hasMultipleAds, isPaused])

  /* ── Pause on hover (desktop only) ── */
  const handleMouseEnter = useCallback(() => {
    if (window.innerWidth >= 768) {
      setIsPaused(true)
      setIsHovering(true)
    }
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsPaused(false)
    setIsHovering(false)
  }, [])

  /* ── Impression & Click tracking ── */
  const impressionFiredRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!visibleAds.length) return
    const currentAd = visibleAds[currentIndex]
    if (!currentAd || impressionFiredRef.current.has(currentAd.id)) return

    // Fire impression once per ad
    impressionFiredRef.current = new Set(impressionFiredRef.current).add(currentAd.id)

    fetch('/api/hero-ads', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: currentAd.id, incrementImpressions: true }),
    }).catch(() => {
      // Silently fail — tracking should not break UI
    })
  }, [currentIndex, visibleAds])

  const handleWatchNow = useCallback(() => {
    const currentAd = visibleAds[currentIndex]
    if (!currentAd) return

    // Track click
    fetch('/api/hero-ads', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: currentAd.id, incrementClicks: true }),
    }).catch(() => {})

    // Navigate if there's a link or video
    if (currentAd.linkUrl) {
      window.open(currentAd.linkUrl, '_blank', 'noopener,noreferrer')
    }
  }, [currentIndex, visibleAds])

  /* ── Video: pause when not active, play when active ── */
  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([id, video]) => {
      if (!video) return
      const ad = visibleAds[currentIndex]
      if (ad && id === ad.id && ad.adType === 'video') {
        const timer = setTimeout(() => {
          video.play().catch(() => {})
        }, 300)
        return () => clearTimeout(timer)
      } else {
        video.pause()
      }
    })
  }, [currentIndex, visibleAds])

  /* ── Touch / Swipe support ── */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }, [])

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return
      if (!hasMultipleAds) return

      const deltaX = e.changedTouches[0].clientX - touchStartX.current
      const deltaY = e.changedTouches[0].clientY - touchStartY.current

      // Only trigger if horizontal swipe is dominant and exceeds threshold
      if (Math.abs(deltaX) > SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX < 0) {
          goToNext()
        } else {
          goToPrev()
        }
      }

      touchStartX.current = null
      touchStartY.current = null
    },
    [goToNext, goToPrev, hasMultipleAds],
  )

  /* ── Keyboard support ── */
  useEffect(() => {
    if (!hasMultipleAds) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goToPrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        goToNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToNext, goToPrev, hasMultipleAds])

  /* ── Video loaded handler ── */
  const handleVideoLoaded = useCallback((id: string) => {
    setVideoLoaded((prev) => ({ ...prev, [id]: true }))
  }, [])

  /* ── Fullscreen handler ── */
  const handleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      containerRef.current.requestFullscreen().catch(() => {})
    }
  }, [])

  /* ────────────────────────────────────────────
     No Ads Placeholder
     ──────────────────────────────────────────── */
  if (!visibleAds.length) {
    return (
      <div
        className="relative w-full overflow-hidden select-none"
        style={{ background: '#050505' }}
        role="region"
        aria-label="Hero advertisement space"
      >
        <div className="relative h-[40vh] sm:h-[45vh] md:h-[50vh] lg:h-[65vh] flex items-center justify-center">
          {/* Cinematic dark background with subtle gradients */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#050505] to-[#080810]" />
          
          {/* Subtle red glow orb */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[600px] rounded-full bg-[#ff1e1e]/[0.03] blur-[120px]" />
          
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />
          
          {/* Content */}
          <div className="relative z-10 flex flex-col items-center gap-4 px-6 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl border border-white/5 bg-[#0B0B0F]/80"
            >
              <Megaphone className="h-8 w-8 sm:h-10 sm:w-10 text-[#ff1e1e]/40" />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-2"
            >
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white/30 tracking-tight">
                No Hero Ads Available
              </h2>
              <p className="text-sm text-white/15 max-w-md">
                Hero ads will appear here once uploaded from the admin panel
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-2 rounded-full border border-dashed border-white/10 bg-white/[0.02] px-4 py-2"
            >
              <div className="h-1.5 w-1.5 rounded-full bg-[#ff1e1e]/30" />
              <span className="text-[11px] text-white/20 font-medium">Hero Ad Space</span>
              <div className="h-1.5 w-1.5 rounded-full bg-[#ff1e1e]/30" />
            </motion.div>
          </div>
          
          {/* Bottom gradient fade */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#050505] to-transparent z-10 pointer-events-none" />
        </div>
      </div>
    )
  }

  const currentAd = visibleAds[currentIndex]

  /* ────────────────────────────────────────────
     Render
     ──────────────────────────────────────────── */

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden select-none"
      style={{ background: '#050505' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="region"
      aria-label="Hero advertisement slider"
      aria-roledescription="carousel"
    >
      {/* ── Slide area: responsive heights ── */}
      <div className="relative h-[40vh] sm:h-[45vh] md:h-[50vh] lg:h-[65vh]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentAd.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: TRANSITION_SPEED / 1000, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0 will-change-transform"
          >
            {/* ── Background media ── */}
            {currentAd.adType === 'video' ? (
              <>
                {/* Shimmer placeholder while video loads */}
                {!videoLoaded[currentAd.id] && (
                  <div className="absolute inset-0 animate-shimmer z-0" />
                )}

                <video
                  ref={(el) => {
                    videoRefs.current[currentAd.id] = el
                  }}
                  src={currentAd.mediaUrl}
                  poster={currentAd.thumbnailUrl || undefined}
                  autoPlay
                  muted={videoMuted}
                  loop
                  playsInline
                  onLoadedData={() => handleVideoLoaded(currentAd.id)}
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                    videoLoaded[currentAd.id] ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{ willChange: 'transform' }}
                />

                {/* Video gradient overlay for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/90 via-[#050505]/30 to-transparent" />
              </>
            ) : (
              <>
                {/* Static image - no parallax zoom for performance */}
                <div className="absolute inset-0 overflow-hidden">
                  <img
                    src={currentAd.mediaUrl}
                    alt={currentAd.title}
                    loading={currentIndex === 0 ? 'eager' : 'lazy'}
                    fetchPriority={currentIndex === 0 ? 'high' : 'auto'}
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* Cinematic dark overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/50 to-[#050505]/10" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/90 via-[#050505]/40 to-transparent" />
              </>
            )}

            {/* ── Subtle vignette ── */}
            <div className="absolute inset-0" style={{
              background: 'radial-gradient(ellipse at center, transparent 50%, rgba(5,5,5,0.4) 100%)',
            }} />
          </motion.div>
        </AnimatePresence>

        {/* ── Preload next slide (hidden) ── */}
        {hasMultipleAds && (
          <div className="pointer-events-none absolute inset-0 opacity-0" aria-hidden="true">
            {visibleAds[nextIndex]?.adType === 'image' && (
              <img
                src={visibleAds[nextIndex].mediaUrl}
                alt=""
                loading="eager"
                className="h-full w-full object-cover"
              />
            )}
            {visibleAds[nextIndex]?.adType === 'video' && (
              <video
                src={visibleAds[nextIndex].mediaUrl}
                poster={visibleAds[nextIndex].thumbnailUrl || undefined}
                muted
                preload="auto"
                className="h-full w-full object-cover"
              />
            )}
          </div>
        )}

        {/* ── Content overlay ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${currentAd.id}`}
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 flex items-end"
          >
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 md:px-8 pb-16 sm:pb-20 md:pb-24 lg:pb-28 xl:pb-32">
              <div className="max-w-xl space-y-3 sm:space-y-4">
                {/* Sponsored badge */}
                <motion.div variants={contentItem} className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 rounded-full bg-[#ff1e1e]/10 border border-[#ff1e1e]/20 px-3 py-1">
                    <Megaphone className="h-3 w-3 text-[#ff1e1e]" />
                    <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-[#ff1e1e]">
                      Sponsored
                    </span>
                  </div>
                </motion.div>

                {/* Scheduled badge */}
                {currentAd.startDate && new Date(currentAd.startDate) > new Date() && (
                  <motion.div variants={contentItem}>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-amber-400">
                      <Clock className="h-3 w-3" />
                      Scheduled
                    </span>
                  </motion.div>
                )}

                {/* Category badge */}
                {currentAd.category && (
                  <motion.div variants={contentItem}>
                    <span className="inline-flex items-center rounded-sm bg-[#ff1e1e] px-2.5 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white shadow-[0_0_12px_rgba(255,30,30,0.3)]">
                      {currentAd.category}
                    </span>
                  </motion.div>
                )}

                {/* Title */}
                <motion.h2
                  variants={contentItem}
                  className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white leading-[1.05] tracking-tight"
                >
                  {currentAd.title}
                </motion.h2>

                {/* Description */}
                {currentAd.description && (
                  <motion.p
                    variants={contentItem}
                    className="line-clamp-2 text-sm sm:text-base text-white/50 max-w-md leading-relaxed"
                  >
                    {currentAd.description}
                  </motion.p>
                )}

                {/* CTA buttons */}
                <motion.div variants={contentItem} className="flex items-center gap-3 pt-2 sm:pt-3">
                  <motion.button
                    whileHover={{ scale: 1.04, boxShadow: '0 0 25px rgba(229,9,20,0.5)' }}
                    whileTap={{ scale: 0.96 }}
                    onClick={handleWatchNow}
                    className="flex items-center gap-2 rounded-md bg-[#ff1e1e] px-5 py-2.5 sm:px-7 sm:py-3 md:px-8 md:py-3.5 text-sm sm:text-base font-semibold text-white transition-all hover:bg-[#ff2e2e] shadow-[0_0_20px_rgba(255,30,30,0.4)]"
                  >
                    <Play className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" />
                    Watch Now
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.04, backgroundColor: 'rgba(255,255,255,0.12)' }}
                    whileTap={{ scale: 0.96 }}
                    className="glass flex items-center gap-2 rounded-md px-5 py-2.5 sm:px-7 sm:py-3 md:px-8 md:py-3.5 text-sm sm:text-base font-semibold text-white transition-colors hover:bg-white/10"
                  >
                    <Info className="h-4 w-4 sm:h-5 sm:w-5" />
                    More Info
                  </motion.button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* ── Video controls (top right) ── */}
        {currentAd.adType === 'video' && videoLoaded[currentAd.id] && (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 flex items-center gap-2">
            {/* Mute/Unmute */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setVideoMuted((m) => !m)}
              className="glass flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full text-white/70 hover:text-white transition-colors"
              aria-label={videoMuted ? 'Unmute video' : 'Mute video'}
            >
              {videoMuted ? (
                <VolumeX className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </motion.button>

            {/* Fullscreen */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleFullscreen}
              className="glass hidden md:flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full text-white/70 hover:text-white transition-colors"
              aria-label="Fullscreen"
            >
              <Maximize2 className="h-4 w-4 sm:h-5 sm:w-5" />
            </motion.button>
          </div>
        )}

        {/* ── Navigation arrows (visible on desktop, hidden on mobile) ── */}
        {hasMultipleAds && (
          <>
            {/* Previous */}
            <motion.button
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.12)' }}
              whileTap={{ scale: 0.9 }}
              onClick={goToPrev}
              className="hidden md:flex absolute left-3 lg:left-5 top-1/2 -translate-y-1/2 z-20 glass h-11 w-11 lg:h-14 lg:w-14 items-center justify-center rounded-full text-white/60 hover:text-white transition-all duration-200"
              aria-label="Previous ad"
            >
              <ChevronLeft className="h-5 w-5 lg:h-6 lg:w-6" />
            </motion.button>

            {/* Next */}
            <motion.button
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.12)' }}
              whileTap={{ scale: 0.9 }}
              onClick={goToNext}
              className="hidden md:flex absolute right-3 lg:right-5 top-1/2 -translate-y-1/2 z-20 glass h-11 w-11 lg:h-14 lg:w-14 items-center justify-center rounded-full text-white/60 hover:text-white transition-all duration-200"
              aria-label="Next ad"
            >
              <ChevronRight className="h-5 w-5 lg:h-6 lg:w-6" />
            </motion.button>
          </>
        )}

        {/* ── Slider indicators ── */}
        {hasMultipleAds && (
          <div className="absolute bottom-5 sm:bottom-7 md:bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5">
            {visibleAds.map((ad, index) => (
              <button
                key={ad.id}
                onClick={() => goToSlide(index)}
                aria-label={`Go to ad ${index + 1}`}
                aria-current={index === currentIndex ? 'true' : undefined}
                className="relative h-[6px] overflow-hidden rounded-full transition-all duration-300 cursor-pointer"
              >
                {index === currentIndex ? (
                  <motion.div
                    layoutId="hero-ads-dot"
                    className="h-full rounded-full bg-[#ff1e1e] shadow-[0_0_8px_rgba(255,30,30,0.5)]"
                    initial={false}
                    animate={{ width: 36 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                ) : (
                  <div className="h-full w-[6px] rounded-full bg-white/25 hover:bg-white/50 transition-colors duration-200" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* ── Bottom fade-to-content gradient ── */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#050505] to-transparent z-10 pointer-events-none" />

        {/* ── Hover red glow on edges ── */}
        {isHovering && (
          <>
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-[#ff1e1e]/20 to-transparent z-20 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-[#ff1e1e]/20 to-transparent z-20 pointer-events-none" />
          </>
        )}
      </div>
    </div>
  )
}
