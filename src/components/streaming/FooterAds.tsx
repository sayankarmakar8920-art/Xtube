'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Megaphone, Volume2, VolumeX, Play, Pause, X, ChevronLeft, ChevronRight } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface FooterAdItem {
  id: string
  title: string
  mediaUrl: string
  thumbnailUrl?: string
  adType: 'image' | 'video' | 'gif'
  mediaFormat: string
  linkUrl?: string
  startDate?: string | null
  endDate?: string | null
}

interface FooterAdsProps {
  ads: FooterAdItem[]
}

// ─── Component ───────────────────────────────────────────────────────────────

export function FooterAds({ ads }: FooterAdsProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isClosed, setIsClosed] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Auto-rotate carousel every 8s
  useEffect(() => {
    if (!ads.length || ads.length <= 1) return
    const timer = setInterval(() => {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % ads.length)
        setIsTransitioning(false)
      }, 200)
    }, 8000)
    return () => clearInterval(timer)
  }, [ads.length])

  // If closed by user, don't render
  if (isClosed) return null

  // ── Empty State ──────────────────────────────────────────────────────────
  if (!ads.length) {
    return (
      <div className="w-full px-3 md:px-6 lg:px-8">
        <div
          className="
            mx-auto
            w-full max-w-[970px]
            h-[100px] md:h-[150px] lg:h-[250px]
            rounded-xl
            bg-[#0a0a0a]/40
            border border-white/[0.04]
            flex flex-col items-center justify-center gap-1.5
            select-none
            transition-all duration-300
          "
        >
          <Megaphone className="h-6 w-6 text-white/[0.06]" />
          <span className="text-white/[0.08] text-xs font-medium">Ad Space</span>
        </div>
      </div>
    )
  }

  const currentAd = ads[currentIndex]

  const navigateTo = (index: number) => {
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentIndex(index)
      setIsTransitioning(false)
    }, 200)
  }

  return (
    <div className="w-full px-3 md:px-6 lg:px-8">
      <div
        className="
          relative
          mx-auto
          w-full max-w-[970px]
          rounded-xl
          bg-[#0B0B0F]/90
          border border-white/[0.06]
          shadow-[0_4px_30px_rgba(0,0,0,0.4),0_0_1px_rgba(255,30,30,0.05)]
          overflow-hidden
          transition-all duration-300
        "
      >
        {/* Close button */}
        <button
          onClick={() => setIsClosed(true)}
          className="absolute top-2 right-2 z-30 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white/40 transition-all hover:bg-black/70 hover:text-white/80 hover:border-white/20"
          aria-label="Close ad"
        >
          <X className="h-3 w-3" />
        </button>

        {/* AD badge */}
        <div className="absolute top-2 left-2 z-30">
          <span className="inline-flex items-center gap-1 rounded-md bg-[#ff1e1e]/10 border border-[#ff1e1e]/20 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-[#ff1e1e]/70">
            <Megaphone className="h-2 w-2" />
            AD
          </span>
        </div>

        {/* Carousel indicators */}
        {ads.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5">
            {ads.map((_, i) => (
              <button
                key={i}
                onClick={() => navigateTo(i)}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? 'w-4 bg-[#ff1e1e]'
                    : 'w-1.5 bg-white/20 hover:bg-white/40'
                }`}
                aria-label={`Go to ad ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Carousel nav arrows (desktop only) */}
        {ads.length > 1 && (
          <>
            <button
              onClick={() => navigateTo((currentIndex - 1 + ads.length) % ads.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-30 hidden md:flex h-7 w-7 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-white/50 transition-all hover:bg-black/60 hover:text-white/80"
              aria-label="Previous ad"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigateTo((currentIndex + 1) % ads.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-30 hidden md:flex h-7 w-7 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-white/50 transition-all hover:bg-black/60 hover:text-white/80"
              aria-label="Next ad"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Ad content with loading state via key */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentAd.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: isTransitioning ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            <FooterAdCard ad={currentAd} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Ad Card with built-in loading ──────────────────────────────────────────

function FooterAdCard({ ad }: { ad: FooterAdItem }) {
  const [isMuted, setIsMuted] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [mediaLoaded, setMediaLoaded] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const impressionFired = useRef(false)

  // ── Impression tracking (fire once) ─────────────────────────────────────
  useEffect(() => {
    if (impressionFired.current) return
    impressionFired.current = true

    fetch('/api/footer-ads', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: ad.id, incrementImpressions: true }),
    }).catch(() => {})
  }, [ad.id])

  // ── Click tracking ──────────────────────────────────────────────────────
  const handleClick = useCallback(() => {
    fetch('/api/footer-ads', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: ad.id, incrementClicks: true }),
    }).catch(() => {})

    if (ad.linkUrl) {
      window.open(ad.linkUrl, '_blank', 'noopener,noreferrer')
    }
  }, [ad.id, ad.linkUrl])

  // ── Video controls ──────────────────────────────────────────────────────
  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
      setIsMuted(videoRef.current.muted)
    }
  }, [])

  const togglePause = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play()
        setIsPaused(false)
      } else {
        videoRef.current.pause()
        setIsPaused(true)
      }
    }
  }, [])

  // ── Media renderer ──────────────────────────────────────────────────────
  const isVideo = ad.adType === 'video' || ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ad.mediaFormat)

  return (
    <div className="relative w-full">
      {/* Loading skeleton */}
      <AnimatePresence>
        {!mediaLoaded && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-10 flex items-center justify-center bg-[#0B0B0F] h-[100px] md:h-[150px] lg:h-[250px] rounded-xl"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#ff1e1e]/30 border-t-[#ff1e1e]" />
              <span className="text-[10px] text-white/20">Loading ad...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isVideo ? (
        <div
          className="relative w-full cursor-pointer"
          onClick={handleClick}
        >
          <video
            ref={videoRef}
            src={ad.mediaUrl}
            poster={ad.thumbnailUrl}
            autoPlay
            muted
            loop
            playsInline
            onLoadedData={() => setMediaLoaded(true)}
            className="
              w-full
              h-[100px] md:h-[150px] lg:h-[250px]
              object-cover
              rounded-xl
              will-change-transform
            "
            preload="metadata"
          >
            <track kind="captions" />
          </video>

          {/* Gradient overlay */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

          {/* Video controls */}
          <div className="absolute bottom-2 right-2 flex items-center gap-1 z-20">
            <button
              type="button"
              onClick={toggleMute}
              className="flex items-center justify-center h-6 w-6 rounded-md bg-black/40 backdrop-blur-sm border border-white/10 text-white/60 transition-colors hover:bg-black/60 hover:text-white/90"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
            </button>
            <button
              type="button"
              onClick={togglePause}
              className="flex items-center justify-center h-6 w-6 rounded-md bg-black/40 backdrop-blur-sm border border-white/10 text-white/60 transition-colors hover:bg-black/60 hover:text-white/90"
              aria-label={isPaused ? 'Play' : 'Pause'}
            >
              {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
            </button>
          </div>
        </div>
      ) : (
        <div
          className="relative w-full cursor-pointer"
          onClick={handleClick}
        >
          <img
            src={ad.mediaUrl}
            alt={ad.title}
            onLoad={() => setMediaLoaded(true)}
            loading="lazy"
            className="
              w-full
              h-[100px] md:h-[150px] lg:h-[250px]
              object-cover
              rounded-xl
              will-change-transform
            "
            draggable={false}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
        </div>
      )}
    </div>
  )
}
