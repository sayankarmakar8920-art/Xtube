'use client'

import { Film } from 'lucide-react'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import { VideoCard } from './VideoCard'

interface VideoGridProps {
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
  loading?: boolean
  emptyMessage?: string
}

function VideoCardSkeleton() {
  return (
    <div className="space-y-2">
      {/* Thumbnail skeleton */}
      <Skeleton className="aspect-video w-full rounded-lg bg-xtube-card" />
      {/* Title skeleton */}
      <Skeleton className="h-4 w-3/4 rounded bg-xtube-card" />
      {/* Meta skeleton */}
      <Skeleton className="h-3 w-1/2 rounded bg-xtube-card" />
    </div>
  )
}

export function VideoGrid({
  videos,
  loading = false,
  emptyMessage = 'No videos found',
}: VideoGridProps) {
  // Loading state
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <VideoCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  // Empty state
  if (!videos.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-xtube-card">
          <Film className="h-8 w-8 text-xtube-text-secondary" />
        </div>
        <p className="text-lg font-medium text-white">{emptyMessage}</p>
        <p className="mt-1 text-sm text-xtube-text-secondary">
          Check back later for new content
        </p>
      </motion.div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {videos.map((video) => (
        <VideoCard key={video.id} {...video} />
      ))}
    </div>
  )
}
