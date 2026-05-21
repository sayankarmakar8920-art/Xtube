'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  SkipForward,
  X,
  ExternalLink,
  Megaphone,
  Clock,
  Volume2,
  VolumeX,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AdData {
  id: string
  type: 'video' | 'image'
  mediaUrl: string
  mediaFormat: string // mp4, jpg, png, webp, gif
  adDuration: number // seconds
  skipAfter: number // seconds before skip button appears
  title: string
  linkUrl?: string
  timing?: number // for mid-roll/overlay: when to show (seconds into video)
}

export interface VideoAdsPlayerProps {
  // Current video playback state (controlled by parent VideoPlayer)
  isPlaying: boolean
  currentTime: number
  duration: number

  // Ad data (fetched from /api/video-ads)
  preRollAds: AdData[]
  midRollAds: AdData[]
  postRollAds: AdData[]
  overlayAds: AdData[]
  midrollTimings: number[] // e.g. [1800, 3600, 5400]

  // Callbacks
  onAdStart: (adId: string) => void
  onAdEnd: (adId: string) => void
  onAdSkip: (adId: string) => void
  onAdComplete: (adId: string) => void
  onAdClick: (adId: string) => void
  onRequestPause: () => void
  onRequestPlay: () => void
  onRequestSeek: (time: number) => void
}

// ─── Internal state types ────────────────────────────────────────────────────

type AdPhase = 'pre-roll' | 'mid-roll' | 'post-roll' | null

interface ActiveAdState {
  ad: AdData
  phase: AdPhase
  indexInPhase: number // 0-based index within the current phase's ad list
  totalInPhase: number // total ads in this phase
}

// ─── Helper: format time as M:SS ─────────────────────────────────────────────

function formatAdTime(seconds: number): string {
  if (seconds <= 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// ─── Animation Variants ──────────────────────────────────────────────────────

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.3, ease: 'easeIn' } },
}

const bannerSlideUp = {
  hidden: { y: '100%', opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
  exit: { y: '100%', opacity: 0, transition: { duration: 0.25, ease: 'easeIn' } },
}

const skipButtonVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, y: 10, transition: { duration: 0.2, ease: 'easeIn' } },
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function VideoAdsPlayer({
  isPlaying,
  currentTime,
  duration,
  preRollAds,
  midRollAds,
  postRollAds,
  overlayAds,
  midrollTimings,
  onAdStart,
  onAdEnd,
  onAdSkip,
  onAdComplete,
  onAdClick,
  onRequestPause,
  onRequestPlay,
  onRequestSeek,
}: VideoAdsPlayerProps) {
  // ─── State ─────────────────────────────────────────────────────────────────

  // Track which ads have been played in this session
  const playedAdsRef = useRef<Set<string>>(new Set())

  // Active full-screen ad (pre/mid/post-roll)
  const [activeAd, setActiveAd] = useState<ActiveAdState | null>(null)

  // Active overlay ad
  const [activeOverlay, setActiveOverlay] = useState<AdData | null>(null)

  // Ad playback timer (counts up from 0)
  const [adElapsed, setAdElapsed] = useState(0)

  // Whether skip button is available
  const [canSkip, setCanSkip] = useState(false)

  // Ad video ref
  const adVideoRef = useRef<HTMLVideoElement>(null)

  // Timer refs
  const adTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const overlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Track pre-roll phase
  const preRollQueueRef = useRef<AdData[]>([])
  const preRollIndexRef = useRef(0)

  // Track mid-roll detection (which timings have been triggered)
  const triggeredMidrollTimingsRef = useRef<Set<number>>(new Set())

  // Track overlay detection
  const triggeredOverlayTimingsRef = useRef<Set<string>>(new Set())

  // Track post-roll triggered
  const postRollTriggeredRef = useRef(false)

  // Track ad video muted state
  const [adVideoMuted, setAdVideoMuted] = useState(true)

  // Store the currentTime when mid-roll ad starts, so we can resume
  const midrollResumeTimeRef = useRef<number>(0)

  // ─── Clear ad timer ────────────────────────────────────────────────────────

  const clearAdTimer = useCallback(() => {
    if (adTimerRef.current) {
      clearInterval(adTimerRef.current)
      adTimerRef.current = null
    }
  }, [])

  const clearOverlayTimer = useCallback(() => {
    if (overlayTimerRef.current) {
      clearTimeout(overlayTimerRef.current)
      overlayTimerRef.current = null
    }
  }, [])

  // ─── Start a full-screen ad ────────────────────────────────────────────────

  const startAd = useCallback(
    (ad: AdData, phase: AdPhase, indexInPhase: number, totalInPhase: number) => {
      // Don't play the same ad twice
      if (playedAdsRef.current.has(ad.id)) return

      // Mark as played
      playedAdsRef.current.add(ad.id)

      // If this is a mid-roll, save the resume time
      if (phase === 'mid-roll') {
        midrollResumeTimeRef.current = currentTime
      }

      // Pause the main video
      onRequestPause()

      // Set active ad state
      setActiveAd({
        ad,
        phase,
        indexInPhase,
        totalInPhase,
      })
      setAdElapsed(0)
      setCanSkip(ad.skipAfter <= 0)

      // Notify parent
      onAdStart(ad.id)

      // Start the ad timer for image ads (video ads use 'ended' event)
      if (ad.type === 'image') {
        clearAdTimer()
        let elapsed = 0
        adTimerRef.current = setInterval(() => {
          elapsed += 0.1
          setAdElapsed(elapsed)

          // Check skip availability
          if (elapsed >= ad.skipAfter && !canSkip) {
            setCanSkip(true)
          }

          // Auto-advance when ad duration is reached
          if (elapsed >= ad.adDuration) {
            clearAdTimer()
            onAdComplete(ad.id)
            onAdEnd(ad.id)
            setActiveAd(null)
            setAdElapsed(0)
            setCanSkip(false)

            // Resume main video
            if (phase === 'mid-roll') {
              onRequestSeek(midrollResumeTimeRef.current)
            }
            onRequestPlay()
          }
        }, 100)
      }
    },
    [isPlaying, currentTime, onRequestPause, onRequestPlay, onRequestSeek, onAdStart, onAdEnd, onAdComplete, canSkip, clearAdTimer]
  )

  // ─── Handle video ad time update ──────────────────────────────────────────

  const handleAdVideoTimeUpdate = useCallback(() => {
    const vid = adVideoRef.current
    if (!vid || !activeAd) return

    const elapsed = vid.currentTime
    setAdElapsed(elapsed)

    if (elapsed >= activeAd.ad.skipAfter && !canSkip) {
      setCanSkip(true)
    }
  }, [activeAd, canSkip])

  // ─── Handle video ad ended ─────────────────────────────────────────────────

  const handleAdVideoEnded = useCallback(() => {
    if (!activeAd) return

    onAdComplete(activeAd.ad.id)
    onAdEnd(activeAd.ad.id)
    setActiveAd(null)
    setAdElapsed(0)
    setCanSkip(false)

    // Resume main video
    if (activeAd.phase === 'mid-roll') {
      onRequestSeek(midrollResumeTimeRef.current)
    }
    onRequestPlay()
  }, [activeAd, onAdComplete, onAdEnd, onRequestPlay, onRequestSeek])

  // ─── Skip ad ───────────────────────────────────────────────────────────────

  const handleSkipAd = useCallback(() => {
    if (!activeAd) return

    clearAdTimer()
    onAdSkip(activeAd.ad.id)
    onAdEnd(activeAd.ad.id)
    setActiveAd(null)
    setAdElapsed(0)
    setCanSkip(false)

    // Resume main video
    if (activeAd.phase === 'mid-roll') {
      onRequestSeek(midrollResumeTimeRef.current)
    }
    onRequestPlay()
  }, [activeAd, clearAdTimer, onAdSkip, onAdEnd, onRequestPlay, onRequestSeek])

  // ─── Click ad ──────────────────────────────────────────────────────────────

  const handleAdClick = useCallback(() => {
    if (!activeAd) return

    onAdClick(activeAd.ad.id)

    // Open link in new tab if available
    if (activeAd.ad.linkUrl) {
      window.open(activeAd.ad.linkUrl, '_blank', 'noopener,noreferrer')
    }
  }, [activeAd, onAdClick])

  // ─── Close overlay ad ──────────────────────────────────────────────────────

  const handleCloseOverlay = useCallback(() => {
    if (!activeOverlay) return

    clearOverlayTimer()
    onAdEnd(activeOverlay.id)
    setActiveOverlay(null)
  }, [activeOverlay, clearOverlayTimer, onAdEnd])

  // ─── Click overlay ad ──────────────────────────────────────────────────────

  const handleOverlayClick = useCallback(() => {
    if (!activeOverlay) return

    onAdClick(activeOverlay.id)
    if (activeOverlay.linkUrl) {
      window.open(activeOverlay.linkUrl, '_blank', 'noopener,noreferrer')
    }
  }, [activeOverlay, onAdClick])

  // ─── Pre-roll detection ────────────────────────────────────────────────────
  // Pre-roll ads play when the component first mounts and video is about to play

  const preRollStartedRef = useRef(false)

  useEffect(() => {
    if (preRollAds.length === 0 || preRollStartedRef.current || activeAd || activeOverlay) return

    // Start pre-roll when the video first starts playing
    if (isPlaying && currentTime < 1 && !preRollStartedRef.current) {
      preRollStartedRef.current = true
      preRollQueueRef.current = [...preRollAds]
      preRollIndexRef.current = 0

      // Schedule the first pre-roll ad (deferred to avoid set-state-in-effect)
      const timer = setTimeout(() => {
        startAd(preRollAds[0], 'pre-roll', 0, preRollAds.length)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [isPlaying, currentTime, preRollAds, activeAd, activeOverlay, startAd])

  // ─── Sequential pre-roll: after one pre-roll ends, start next ──────────────
  // This is handled by watching activeAd become null while pre-roll queue has more

  useEffect(() => {
    if (activeAd || !preRollStartedRef.current) return

    // Check if there are more pre-roll ads to play
    const nextIndex = preRollIndexRef.current + 1
    if (nextIndex < preRollQueueRef.current.length && preRollQueueRef.current.length > 0) {
      preRollIndexRef.current = nextIndex
      const nextAd = preRollQueueRef.current[nextIndex]
      // Small delay for transition
      const timer = setTimeout(() => {
        startAd(nextAd, 'pre-roll', nextIndex, preRollQueueRef.current.length)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [activeAd, startAd])

  // ─── Mid-roll detection ────────────────────────────────────────────────────
  // Detect when currentTime crosses a midroll timing point

  useEffect(() => {
    if (!isPlaying || activeAd || midRollAds.length === 0) return

    // Check each mid-roll timing
    for (const timing of midrollTimings) {
      // Use 1-second tolerance for detection
      if (
        currentTime >= timing &&
        currentTime <= timing + 1 &&
        !triggeredMidrollTimingsRef.current.has(timing)
      ) {
        triggeredMidrollTimingsRef.current.add(timing)

        // Find the mid-roll ad for this timing
        const midRollAd = midRollAds.find(
          (ad) => ad.timing && Math.abs(ad.timing - timing) < 2
        )

        if (midRollAd && !playedAdsRef.current.has(midRollAd.id)) {
          // Defer to avoid set-state-in-effect
          const timer = setTimeout(() => {
            startAd(midRollAd, 'mid-roll', 0, 1)
          }, 0)
          return () => clearTimeout(timer)
        }
      }
    }
  }, [currentTime, isPlaying, activeAd, midRollAds, midrollTimings, startAd])

  // ─── Post-roll detection ───────────────────────────────────────────────────
  // Post-roll plays when the video ends (currentTime >= duration - 0.5)

  useEffect(() => {
    if (
      postRollAds.length > 0 &&
      duration > 0 &&
      currentTime >= duration - 0.5 &&
      !postRollTriggeredRef.current &&
      !activeAd
    ) {
      postRollTriggeredRef.current = true
      // Defer to avoid set-state-in-effect
      const timer = setTimeout(() => {
        startAd(postRollAds[0], 'post-roll', 0, postRollAds.length)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [currentTime, duration, postRollAds, activeAd, startAd])

  // ─── Overlay ad detection ──────────────────────────────────────────────────
  // Overlay ads show at scheduled times without pausing the video

  useEffect(() => {
    if (!isPlaying || activeOverlay || overlayAds.length === 0) return

    for (const overlayAd of overlayAds) {
      const timing = overlayAd.timing
      if (timing === undefined || timing === null) continue

      // Check if we've crossed the timing point
      const adKey = `${overlayAd.id}-${timing}`
      if (
        currentTime >= timing &&
        currentTime <= timing + 1.5 &&
        !triggeredOverlayTimingsRef.current.has(adKey) &&
        !playedAdsRef.current.has(overlayAd.id)
      ) {
        triggeredOverlayTimingsRef.current.add(adKey)
        playedAdsRef.current.add(overlayAd.id)

        // Defer state update to avoid set-state-in-effect
        const adToShow = overlayAd
        const timer = setTimeout(() => {
          // Show overlay ad (does NOT pause the video)
          onAdStart(adToShow.id)
          setActiveOverlay(adToShow)

          // Auto-dismiss after adDuration
          clearOverlayTimer()
          overlayTimerRef.current = setTimeout(() => {
            onAdComplete(adToShow.id)
            onAdEnd(adToShow.id)
            setActiveOverlay(null)
          }, (adToShow.adDuration || 10) * 1000)
        }, 0)
        return () => clearTimeout(timer)
      }
    }
  }, [currentTime, isPlaying, activeOverlay, overlayAds, onAdStart, onAdComplete, onAdEnd, clearOverlayTimer])

  // ─── Cleanup on unmount ────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      clearAdTimer()
      clearOverlayTimer()
    }
  }, [clearAdTimer, clearOverlayTimer])

  // ─── Computed values ───────────────────────────────────────────────────────

  const adRemaining = activeAd ? Math.max(0, activeAd.ad.adDuration - adElapsed) : 0
  const adProgress = activeAd ? Math.min(1, adElapsed / activeAd.ad.adDuration) : 0
  const isImageAd = activeAd?.ad.type === 'image'
  const isVideoAd = activeAd?.ad.type === 'video'

  // Mid-roll ad indicator positions for the timeline
  const midrollMarkers = midrollTimings
    .filter((t) => duration > 0)
    .map((t) => ((t / duration) * 100))

  // ─── Render: Nothing if no active ad ───────────────────────────────────────

  if (!activeAd && !activeOverlay) {
    // Render mid-roll timeline markers (invisible container, markers only)
    if (midrollMarkers.length > 0 && duration > 0) {
      return (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10" aria-hidden="true">
          {midrollMarkers.map((pos, i) => (
            <div
              key={`midroll-marker-${i}`}
              className="absolute bottom-0 h-3 w-[3px] -translate-x-1/2 rounded-sm bg-amber-400/80"
              style={{ left: `${pos}%` }}
            />
          ))}
        </div>
      )
    }
    return null
  }

  // ─── Render: Overlay Ad ────────────────────────────────────────────────────

  if (activeOverlay && !activeAd) {
    return (
      <>
        {/* Mid-roll markers (still render when overlay is active) */}
        {midrollMarkers.length > 0 && duration > 0 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10" aria-hidden="true">
            {midrollMarkers.map((pos, i) => (
              <div
                key={`midroll-marker-overlay-${i}`}
                className="absolute bottom-0 h-3 w-[3px] -translate-x-1/2 rounded-sm bg-amber-400/80"
                style={{ left: `${pos}%` }}
              />
            ))}
          </div>
        )}

        {/* Overlay Ad Banner */}
        <AnimatePresence>
          <motion.div
            variants={bannerSlideUp}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-x-0 bottom-[20%] z-30 mx-2 sm:mx-3"
          >
            <div
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-black/80 px-3 py-2.5 backdrop-blur-xl sm:gap-4 sm:px-4 sm:py-3"
              onClick={handleOverlayClick}
              role="button"
              aria-label={`Ad: ${activeOverlay.title}. Click to learn more.`}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleOverlayClick()
                }
              }}
            >
              {/* Ad image */}
              <div className="h-12 w-16 flex-shrink-0 overflow-hidden rounded-md sm:h-14 sm:w-20">
                {activeOverlay.mediaUrl ? (
                  <img
                    src={activeOverlay.mediaUrl}
                    alt={activeOverlay.title}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-white/5">
                    <Megaphone className="h-5 w-5 text-white/30" />
                  </div>
                )}
              </div>

              {/* Ad text */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center rounded-sm bg-amber-500/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">
                    Ad
                  </span>
                  <span className="truncate text-xs font-medium text-white/90 sm:text-sm">
                    {activeOverlay.title}
                  </span>
                </div>
                <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-white/50 transition-colors hover:text-amber-400 sm:text-xs">
                  <ExternalLink className="h-3 w-3" />
                  Learn More
                </span>
              </div>

              {/* Close button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation()
                  handleCloseOverlay()
                }}
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
                aria-label="Close ad"
              >
                <X className="h-3.5 w-3.5" />
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
      </>
    )
  }

  // ─── Render: Full-screen Ad (Pre/Mid/Post-roll) ───────────────────────────

  if (!activeAd) return null

  return (
    <>
      {/* Mid-roll markers */}
      {midrollMarkers.length > 0 && duration > 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10" aria-hidden="true">
          {midrollMarkers.map((pos, i) => (
            <div
              key={`midroll-marker-ad-${i}`}
              className="absolute bottom-0 h-3 w-[3px] -translate-x-1/2 rounded-sm bg-amber-400/80"
              style={{ left: `${pos}%` }}
            />
          ))}
        </div>
      )}

      {/* Full-screen ad overlay */}
      <AnimatePresence>
        <motion.div
          key={`ad-${activeAd.ad.id}`}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="absolute inset-0 z-40 flex flex-col bg-[#050505]"
          role="dialog"
          aria-label={`Advertisement: ${activeAd.ad.title}`}
        >
          {/* ─── Top Bar ─────────────────────────────────────────────────── */}
          <div className="relative z-10 flex items-center justify-between px-3 py-2 sm:px-5 sm:py-3">
            {/* Left: Ad badge + ad count */}
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="inline-flex items-center rounded-sm bg-amber-500 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-black sm:px-2.5 sm:py-1 sm:text-sm">
                Ad
              </span>
              <span className="text-xs font-medium text-white/70 sm:text-sm">
                Ad · {activeAd.indexInPhase + 1} of {activeAd.totalInPhase}
              </span>
            </div>

            {/* Right: Countdown timer */}
            <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 sm:gap-2 sm:px-3">
              <Clock className="h-3 w-3 text-amber-400 sm:h-3.5 sm:w-3.5" />
              <span className="text-xs font-mono font-semibold text-amber-400 sm:text-sm">
                {formatAdTime(adRemaining)}
              </span>
            </div>
          </div>

          {/* ─── Ad Content Area ──────────────────────────────────────────── */}
          <div
            className="relative flex flex-1 cursor-pointer items-center justify-center overflow-hidden"
            onClick={handleAdClick}
            role="button"
            tabIndex={0}
            aria-label={`Click to visit ${activeAd.ad.linkUrl || 'sponsor'}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleAdClick()
              }
            }}
          >
            {/* Video ad */}
            {isVideoAd && (
              <video
                ref={adVideoRef}
                src={activeAd.ad.mediaUrl}
                className="h-full w-full object-contain"
                autoPlay
                muted={adVideoMuted}
                playsInline
                onTimeUpdate={handleAdVideoTimeUpdate}
                onEnded={handleAdVideoEnded}
                onError={() => {
                  // Fallback: if video fails, treat as completed
                  handleAdVideoEnded()
                }}
              />
            )}

            {/* Image ad */}
            {isImageAd && activeAd.ad.mediaUrl && (
              <motion.img
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                src={activeAd.ad.mediaUrl}
                alt={activeAd.ad.title}
                className="h-full w-full object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
            )}

            {/* Fallback if no media */}
            {((isImageAd && !activeAd.ad.mediaUrl) || (isVideoAd && !activeAd.ad.mediaUrl)) && (
              <div className="flex flex-col items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-500/10 sm:h-24 sm:w-24">
                  <Megaphone className="h-10 w-10 text-amber-400 sm:h-12 sm:w-12" />
                </div>
                <p className="text-lg font-semibold text-white sm:text-xl">{activeAd.ad.title}</p>
              </div>
            )}

            {/* Mute/unmute for video ads */}
            {isVideoAd && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  const newMuted = !adVideoMuted
                  setAdVideoMuted(newMuted)
                  if (adVideoRef.current) {
                    adVideoRef.current.muted = newMuted
                  }
                }}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white/70 transition-colors hover:bg-black/70 hover:text-white sm:right-4 sm:top-4"
                aria-label={adVideoMuted ? 'Unmute ad' : 'Mute ad'}
              >
                {adVideoMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>
            )}
          </div>

          {/* ─── Mid-roll Resume Message ──────────────────────────────────── */}
          <AnimatePresence>
            {activeAd.phase === 'mid-roll' && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="flex items-center justify-center py-1.5 sm:py-2"
              >
                <span className="text-xs text-white/50 sm:text-sm">
                  Your video will resume in{' '}
                  <span className="font-semibold text-amber-400">{Math.ceil(adRemaining)}</span>{' '}
                  second{Math.ceil(adRemaining) !== 1 ? 's' : ''}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── Post-roll Message ─────────────────────────────────────────── */}
          <AnimatePresence>
            {activeAd.phase === 'post-roll' && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="flex items-center justify-center py-1.5 sm:py-2"
              >
                <span className="text-xs text-white/50 sm:text-sm">
                  Thanks for watching
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── Bottom Section: Progress Bar + Skip Button ───────────────── */}
          <div className="relative z-10 px-3 pb-3 sm:px-5 sm:pb-4">
            {/* Ad Progress Bar (amber colored) */}
            <div className="mb-2.5 h-1 w-full overflow-hidden rounded-full bg-white/10 sm:h-1.5 sm:mb-3">
              <motion.div
                className="h-full origin-left rounded-full bg-gradient-to-r from-amber-500 to-amber-400"
                style={{
                  width: `${adProgress * 100}%`,
                  transition: 'width 100ms linear',
                }}
              />
            </div>

            {/* Skip button area */}
            <div className="flex items-center justify-between">
              {/* Left: Ad title (truncated) */}
              <p className="max-w-[50%] truncate text-xs text-white/40 sm:text-sm">
                {activeAd.ad.title}
              </p>

              {/* Right: Skip button */}
              <AnimatePresence mode="wait">
                {canSkip ? (
                  <motion.button
                    key="skip"
                    variants={skipButtonVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSkipAd}
                    className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:border-white/30 hover:bg-white/20 sm:gap-2 sm:px-5 sm:py-2.5 sm:text-sm"
                    aria-label="Skip ad"
                  >
                    <SkipForward className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Skip Ad
                  </motion.button>
                ) : (
                  <motion.div
                    key="countdown"
                    variants={skipButtonVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/40 sm:px-4 sm:py-2.5 sm:text-sm"
                  >
                    <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    Skip in {Math.max(0, Math.ceil(activeAd.ad.skipAfter - adElapsed))}s
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ─── Subtle top/bottom gradients for premium feel ─────────────── */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/40 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
        </motion.div>
      </AnimatePresence>
    </>
  )
}
