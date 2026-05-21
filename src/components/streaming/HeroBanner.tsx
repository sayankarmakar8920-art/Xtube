'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Info, ChevronLeft, ChevronRight, Megaphone } from 'lucide-react'
import { useAppStore } from '@/lib/store'

interface BannerItem {
  id: string
  title: string
  description: string
  thumbnail: string
  category: string
  isAd?: boolean
}

interface HeroBannerProps {
  banners: BannerItem[]
}

export function HeroBanner({ banners }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const navigateToVideo = useAppStore((s) => s.navigateToVideo)

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % banners.length)
  }, [banners.length])

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)
  }, [banners.length])

  // Auto-slide every 6 seconds
  useEffect(() => {
    if (banners.length <= 1) return
    const timer = setInterval(goToNext, 6000)
    return () => clearInterval(timer)
  }, [goToNext, banners.length])

  if (!banners.length) return null

  const currentBanner = banners[currentIndex]

  return (
    <div className="relative w-full overflow-hidden bg-xtube-bg">
      {/* Banner area */}
      <div className="relative h-[240px] sm:h-[320px] md:h-[420px] lg:h-[480px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0"
          >
            {/* Background image */}
            <img
              src={currentBanner.thumbnail}
              alt={currentBanner.title}
              className="h-full w-full object-cover"
            />

            {/* Bottom gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-xtube-bg via-xtube-bg/60 to-transparent" />

            {/* Side gradient for text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-xtube-bg/80 via-transparent to-transparent" />

            {/* Content overlay */}
            <div className="absolute inset-0 flex items-end pb-12 sm:pb-16 md:pb-20">
              <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 md:px-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="max-w-lg space-y-3 sm:space-y-4"
                >
                  {/* Ad badge */}
                  {currentBanner.isAd && (
                    <div className="flex items-center gap-1.5">
                      <Megaphone className="h-4 w-4 text-xtube-red" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-xtube-red">
                        Sponsored
                      </span>
                    </div>
                  )}

                  {/* Category tag */}
                  <span className="inline-block rounded bg-xtube-red px-2.5 py-1 text-xs font-bold text-white">
                    {currentBanner.category}
                  </span>

                  {/* Title */}
                  <h1 className="text-xl font-bold text-white sm:text-2xl md:text-3xl lg:text-4xl leading-tight">
                    {currentBanner.title}
                  </h1>

                  {/* Description */}
                  <p className="line-clamp-2 text-xs text-xtube-text-secondary sm:text-sm">
                    {currentBanner.description}
                  </p>

                  {/* Action buttons */}
                  <div className="flex items-center gap-3 pt-1">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigateToVideo(currentBanner.id)}
                      className="flex items-center gap-2 rounded-md bg-xtube-red px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-xtube-red-hover sm:px-5 sm:py-2.5 sm:text-sm"
                    >
                      <Play className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" />
                      Watch Now
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="glass flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/10 sm:px-5 sm:py-2.5 sm:text-sm"
                    >
                      <Info className="h-4 w-4 sm:h-5 sm:w-5" />
                      More Info
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation arrows */}
        {banners.length > 1 && (
          <>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={goToPrev}
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 glass flex h-10 w-10 items-center justify-center rounded-full text-white opacity-0 transition-opacity hover:bg-white/10 sm:left-4 sm:h-12 sm:w-12 group-hover:opacity-100 md:opacity-0 md:hover:opacity-100"
              aria-label="Previous banner"
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={goToNext}
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 glass flex h-10 w-10 items-center justify-center rounded-full text-white opacity-0 transition-opacity hover:bg-white/10 sm:right-4 sm:h-12 sm:w-12 group-hover:opacity-100 md:opacity-0 md:hover:opacity-100"
              aria-label="Next banner"
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </motion.button>
          </>
        )}
      </div>

      {/* Navigation dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 sm:bottom-6">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Go to banner ${index + 1}`}
              className="relative h-1.5 overflow-hidden rounded-full transition-all duration-300"
            >
              {index === currentIndex ? (
                <motion.div
                  layoutId="hero-dot"
                  className="h-full w-8 rounded-full bg-xtube-red"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              ) : (
                <div className="h-full w-1.5 rounded-full bg-white/30 hover:bg-white/50" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
