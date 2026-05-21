'use client'

import { memo } from 'react'
import { Play, Clock, Eye } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { useIntersectionObserver } from '@/lib/performance/hooks'

interface VideoCardProps {
  id: string
  title: string
  thumbnail: string
  duration: string
  views: number
  category: string
  isHd: boolean
  createdAt: string
}

function formatViews(views: number): string {
  if (views >= 1_000_000) {
    return `${(views / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  }
  if (views >= 1_000) {
    return `${(views / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  }
  return views.toString()
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)

  if (diffYears > 0) return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`
  if (diffMonths > 0) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`
  if (diffWeeks > 0) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`
  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffMinutes > 0) return `${diffMinutes} min ago`
  return 'Just now'
}

export const VideoCard = memo(function VideoCard({
  id,
  title,
  thumbnail,
  duration,
  views,
  category,
  isHd,
  createdAt,
}: VideoCardProps) {
  const navigateToVideo = useAppStore((s) => s.navigateToVideo)
  const { ref: lazyRef, isIntersecting } = useIntersectionObserver({
    triggerOnce: true,
    rootMargin: '200px',
  })

  return (
    <div
      className="group cursor-pointer gpu-accelerated transition-transform duration-200 hover:scale-[1.03]"
      onClick={() => navigateToVideo(id)}
      role="button"
      tabIndex={0}
      aria-label={`Watch ${title}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          navigateToVideo(id)
        }
      }}
    >
      {/* Thumbnail Container */}
      <div ref={lazyRef} className="relative aspect-video overflow-hidden rounded-lg bg-xtube-card">
        {/* Background image - lazy loaded via IntersectionObserver */}
        {isIntersecting ? (
          <img
            src={thumbnail}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
            decoding="async"
            fetchPriority="low"
          />
        ) : (
          <div className="h-full w-full bg-xtube-card animate-shimmer-opt" />
        )}

        {/* Hover overlay with play icon + red glow (CSS-only) */}
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 shadow-[0_0_20px_rgba(229,9,20,0.3)] opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-xtube-red/90 text-white shadow-lg scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300">
            <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
          </div>
        </div>

        {/* Category tag - top left */}
        <div className="absolute left-2 top-2">
          <span className="rounded bg-xtube-red/90 px-2 py-0.5 text-xs font-semibold text-white">
            {category}
          </span>
        </div>

        {/* HD badge - top right */}
        {isHd && (
          <div className="absolute right-2 top-2">
            <span className="rounded bg-xtube-red px-1.5 py-0.5 text-[10px] font-bold text-white">
              HD
            </span>
          </div>
        )}

        {/* Duration badge - bottom right */}
        <div className="absolute bottom-2 right-2">
          <span className="flex items-center gap-1 rounded bg-black/75 px-1.5 py-0.5 text-xs font-medium text-white">
            <Clock className="h-3 w-3" />
            {duration}
          </span>
        </div>

        {/* Bottom gradient */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
      </div>

      {/* Card info below thumbnail */}
      <div className="mt-2 space-y-1">
        {/* Title */}
        <h3 className="truncate text-[13px] font-medium text-white transition-colors group-hover:text-xtube-red">
          {title}
        </h3>

        {/* Views + date */}
        <div className="flex items-center gap-2 text-[11px] text-xtube-text-secondary">
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {formatViews(views)}
          </span>
          <span>•</span>
          <span>{formatRelativeDate(createdAt)}</span>
        </div>
      </div>
    </div>
  )
})
