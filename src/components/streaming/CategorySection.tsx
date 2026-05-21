'use client'

import { useRef, useState, useCallback, memo, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { VideoCard } from './VideoCard'

interface CategorySectionProps {
  title: string
  category: string
  videos: Array<{
    id: string
    title: string
    thumbnail: string
    duration: string
    views: number
    category: string
    isHd: boolean
    createdAt: string
  }>
}

/** Lazy card slot – only renders VideoCard when inside the scroll viewport */
const LazyCardSlot = memo(function LazyCardSlot({ video }: { video: CategorySectionProps['videos'][number] }) {
  const [isInView, setIsInView] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsInView(true) },
      { rootMargin: '300px', threshold: 0 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className="w-[200px] flex-shrink-0 sm:w-[220px] md:w-[240px] lg:w-[260px]">
      {isInView ? <VideoCard {...video} /> : <div className="aspect-video rounded-lg bg-xtube-card animate-shimmer-opt" />}
    </div>
  )
})

export const CategorySection = memo(function CategorySection({ title, category, videos }: CategorySectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)
  const { setView, setSelectedCategory } = useAppStore()

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setShowLeftArrow(scrollLeft > 10)
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10)
  }, [])

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const scrollAmount = scrollRef.current.clientWidth * 0.75
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }, [])

  const handleSeeAll = useCallback(() => {
    setSelectedCategory(category)
    setView('category')
  }, [category, setSelectedCategory, setView])

  if (!videos.length) return null

  return (
    <section className="group relative">
      {/* Section header */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold text-white sm:text-lg md:text-xl">
          {title}
        </h2>
        <button
          onClick={handleSeeAll}
          className="flex items-center gap-1 text-xs font-medium text-xtube-red transition-colors hover:text-xtube-red-hover"
        >
          See All
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable area with arrows */}
      <div className="relative">
        {/* Left scroll arrow */}
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 z-20 -translate-y-1/2 glass flex h-10 w-10 items-center justify-center rounded-full text-white/60 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white/10 hover:text-white hover:scale-110 active:scale-95"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        {/* Right scroll arrow */}
        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 z-20 -translate-y-1/2 glass flex h-10 w-10 items-center justify-center rounded-full text-white/60 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white/10 hover:text-white hover:scale-110 active:scale-95"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}

        {/* Left fade */}
        {showLeftArrow && (
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-12 bg-gradient-to-r from-xtube-bg to-transparent" />
        )}

        {/* Right fade */}
        {showRightArrow && (
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-12 bg-gradient-to-l from-xtube-bg to-transparent" />
        )}

        {/* Scrollable container */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="no-scrollbar flex gap-3 overflow-x-auto scroll-smooth pb-2 gpu-accelerated"
          style={{ willChange: 'scroll-position' }}
        >
          {videos.map((video) => (
            <LazyCardSlot key={video.id} video={video} />
          ))}
        </div>
      </div>
    </section>
  )
})
