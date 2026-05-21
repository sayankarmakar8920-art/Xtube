'use client'

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

export function CategorySection({ title, category, videos }: CategorySectionProps) {
  if (!videos.length) return null

  return (
    <section className="group relative">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold text-white sm:text-lg md:text-xl">{title}</h2>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {videos.map((video) => (
          <VideoCard key={video.id} {...video} />
        ))}
      </div>
    </section>
  )
}
