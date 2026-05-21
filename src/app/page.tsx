'use client'

import { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { Sidebar } from '@/components/streaming/Sidebar'
import { BottomNav } from '@/components/streaming/BottomNav'
import { SearchBar } from '@/components/streaming/SearchBar'
import { FooterAds } from '@/components/streaming/FooterAds'
import { HeroAdsSlider } from '@/components/streaming/HeroAdsSlider'
import { CategorySection } from '@/components/streaming/CategorySection'
import { VideoGrid } from '@/components/streaming/VideoGrid'
import { AdminPanel } from '@/components/streaming/AdminPanel'
import { Flame, Sparkles, Clock, Search, Film, History, Upload, Plus } from 'lucide-react'
import { AgeVerificationPopup } from '@/components/streaming/AgeVerificationPopup'
import { PopupAdOverlay } from '@/components/streaming/PopupAdOverlay'
import { XtubeLogo } from '@/components/shared/XtubeLogo'
import { AdminLoginModal } from '@/components/shared/AdminLoginModal'
import { useDebounce } from '@/lib/performance/hooks'
import { useRealtimeSubscription } from '@/lib/supabase/realtime'

// ─── Dynamic Import VideoPlayer (heavy component - code split) ───────────────
const VideoPlayer = lazy(() =>
  import('@/components/streaming/VideoPlayer').then(m => ({ default: m.VideoPlayer }))
)

// ─── Types ───────────────────────────────────────────────────────────────────

interface VideoData {
  id: string
  title: string
  description: string
  thumbnail: string
  videoUrl: string
  category: string
  duration: string
  views: number
  isHd: boolean
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

interface CategoryData {
  id: string
  name: string
  slug: string
  icon: string | null
  order: number
}

interface AdData {
  id: string
  type: string
  position: string
  title: string
  imageUrl: string
  linkUrl: string | null
  impressions: number
  clicks: number
  revenue: number
  isActive: boolean
  startDate: string | null
  endDate: string | null
  frequency: number
  createdAt: string
}

interface FooterAdData {
  id: string
  title: string
  mediaUrl: string
  thumbnailUrl?: string
  adType: string
  mediaFormat: string
  linkUrl?: string
  isActive: boolean
  impressions: number
  clicks: number
  ctr: number
  startDate?: string | null
  endDate?: string | null
}

interface HeroAdData {
  id: string
  title: string
  description?: string | null
  category?: string | null
  mediaUrl: string
  thumbnailUrl?: string | null
  adType: string
  mediaFormat: string
  linkUrl?: string | null
  isActive: boolean
  displayOrder: number
  impressions: number
  clicks: number
  ctr: number
  startDate?: string | null
  endDate?: string | null
}

interface CommentData {
  id: string
  content: string
  likes: number
  createdAt: string
  user: {
    id: string
    username: string
    avatar: string | null
  }
  replies?: CommentData[]
}

// ─── Main Page Component ─────────────────────────────────────────────────────

export default function XtubeHome() {
  const {
    currentView,
    selectedVideoId,
    selectedCategory,
    searchQuery,
    sidebarCollapsed,
    adminUnlocked,
  } = useAppStore()

  // ─── Restore admin session on page load ────────────────────────────────────

  useEffect(() => {
    const token = sessionStorage.getItem('admin_token')
    if (token && !useAppStore.getState().adminUnlocked) {
      useAppStore.getState().setAdminUnlocked(true)
      useAppStore.getState().setAdminLoggedIn(true)
    }
  }, [])

  const [currentVideo, setCurrentVideo] = useState<VideoData | null>(null)
  const [videoComments, setVideoComments] = useState<CommentData[]>([])

  // ─── Initial API data fetching (populates data on first load) ──────────────
  const [apiVideos, setApiVideos] = useState<VideoData[]>([])
  const [apiCategories, setApiCategories] = useState<CategoryData[]>([])
  const [apiFooterAds, setApiFooterAds] = useState<FooterAdData[]>([])
  const [apiHeroAds, setApiHeroAds] = useState<HeroAdData[]>([])
  const [apiAds, setApiAds] = useState<AdData[]>([])
  const [apiLoaded, setApiLoaded] = useState(false)

  // ─── Supabase Realtime Subscriptions (supplements API data with live updates) ──
  const { data: realtimeVideos, isLoading: videosLoading } = useRealtimeSubscription<VideoData>('Video', { filter: 'isPublished=eq.true', initialData: apiVideos })
  const { data: realtimeCategories, isLoading: catsLoading } = useRealtimeSubscription<CategoryData>('Category', { initialData: apiCategories })
  const { data: realtimeFooterAds } = useRealtimeSubscription<FooterAdData>('FooterAd', { filter: 'isActive=eq.true', initialData: apiFooterAds })
  const { data: realtimeHeroAds } = useRealtimeSubscription<HeroAdData>('HeroAd', { filter: 'isActive=eq.true', initialData: apiHeroAds })
  const { data: realtimeAds } = useRealtimeSubscription<AdData>('Ad', { filter: 'isActive=eq.true', initialData: apiAds })


  useEffect(() => {
    let cancelled = false
    const fetchInitialData = async () => {
      try {
        const [videosRes, categoriesRes, footerAdsRes, heroAdsRes, adsRes] = await Promise.all([
          fetch('/api/videos?limit=100'),
          fetch('/api/categories'),
          fetch('/api/footer-ads?active=true'),
          fetch('/api/hero-ads?active=true'),
          fetch('/api/ads'),
        ])
        if (cancelled) return
        if (videosRes.ok) {
          const data = await videosRes.json()
          setApiVideos(data.videos || [])
        }
        if (categoriesRes.ok) {
          const data = await categoriesRes.json()
          setApiCategories(data.categories || [])
        }
        if (footerAdsRes.ok) {
          const data = await footerAdsRes.json()
          setApiFooterAds(data.footerAds || [])
        }
        if (heroAdsRes.ok) {
          const data = await heroAdsRes.json()
          setApiHeroAds(data.heroAds || [])
        }
        if (adsRes.ok) {
          const data = await adsRes.json()
          setApiAds(data.ads || [])
        }
        setApiLoaded(true)
      } catch (err) {
        console.error('Error fetching initial data:', err)
        setApiLoaded(true)
      }
    }
    fetchInitialData()
    return () => { cancelled = true }
  }, [])

  // Filter ads by date range (realtime only filters by isActive, not scheduling)
  const isWithinSchedule = (ad: { isActive: boolean; startDate?: string | null; endDate?: string | null }) => {
    if (!ad.isActive) return false
    const now = new Date()
    if (ad.startDate && new Date(ad.startDate) > now) return false
    if (ad.endDate && new Date(ad.endDate) < now) return false
    return true
  }

  // Merge: hook manages the unified merged list, so we can read directly from realtime hook results
  const videos = realtimeVideos as VideoData[]
  const categories = realtimeCategories as CategoryData[]
  const ads = realtimeAds as AdData[]
  const footerAds = (realtimeFooterAds as FooterAdData[]).filter(isWithinSchedule)
  const heroAds = (realtimeHeroAds as HeroAdData[]).filter(isWithinSchedule)

  // Progressive loading: show content as soon as ANY data arrives
  // Max skeleton time: 800ms then show whatever we have
  const [skeletonTimeout, setSkeletonTimeout] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setSkeletonTimeout(false), 800)
    return () => clearTimeout(t)
  }, [])
  const loading = skeletonTimeout && !videos.length && !categories.length && !apiLoaded
  const realtimeLoading = videosLoading || catsLoading

  // Seed only runs once EVER per browser (persisted via localStorage)
  const seedRan = useRef(false)
  useEffect(() => {
    if (!seedRan.current && !localStorage.getItem('xtube_seeded')) {
      seedRan.current = true
      localStorage.setItem('xtube_seeded', '1')
      fetch('/api/seed', { method: 'POST' }).catch(() => {})
    }
  }, [])

  // ─── Load video when selected ──────────────────────────────────────────────

  useEffect(() => {
    if (!selectedVideoId) return
    let cancelled = false
    const load = async () => {
      try {
        const [videoRes, commentsRes] = await Promise.all([
          fetch(`/api/videos/${selectedVideoId}`),
          fetch(`/api/comments?videoId=${selectedVideoId}`),
        ])
        if (cancelled) return
        if (videoRes.ok) {
          const videoData = await videoRes.json()
          setCurrentVideo(videoData.video)
        }
        if (commentsRes.ok) {
          const commentsData = await commentsRes.json()
          setVideoComments(commentsData.comments || [])
        }
      } catch (err) {
        if (!cancelled) console.error('Error loading video:', err)
      }
    }
    load()
    return () => { cancelled = true }
  }, [selectedVideoId])

  // ─── Add Comment Handler ───────────────────────────────────────────────────

  const handleAddComment = useCallback(
    async (content: string, parentId?: string) => {
      if (!selectedVideoId) return
      try {
        const res = await fetch('/api/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content,
            videoId: selectedVideoId,
            parentId,
          }),
        })
        if (res.ok) {
          const commentsRes = await fetch(`/api/comments?videoId=${selectedVideoId}`)
          if (commentsRes.ok) {
            const commentsData = await commentsRes.json()
            setVideoComments(commentsData.comments || [])
          }
        }
      } catch (err) {
        console.error('Error adding comment:', err)
      }
    },
    [selectedVideoId]
  )

  // ─── Group videos by category (memoized to prevent re-computing) ──────────

  const videosByCategory = useMemo(() => {
    const grouped: Record<string, VideoData[]> = {}
    videos.forEach((v) => {
      if (!grouped[v.category]) grouped[v.category] = []
      grouped[v.category].push(v)
    })
    return grouped
  }, [videos])

  // ─── Get trending videos (memoized) ────────────────────────────────────

  const trendingVideos = useMemo(() =>
    [...videos].sort((a, b) => b.views - a.views).slice(0, 20),
    [videos]
  )

  // ─── Debounced search query for performance ──────────────────────────────

  const debouncedSearchQuery = useDebounce(searchQuery, 200)

  // ─── Get filtered videos for search (memoized with debounced query) ────────

  const searchResults = useMemo(() =>
    debouncedSearchQuery
      ? videos.filter(
          (v) =>
            v.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
            v.description?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
        )
      : [],
    [videos, debouncedSearchQuery]
  )

  // ─── Get related videos for video player (memoized) ────────────────────────

  const relatedVideos = useMemo(() =>
    currentVideo
      ? videos
          .filter((v) => v.id !== currentVideo.id)
          .sort((a, b) => {
            if (a.category === currentVideo.category && b.category !== currentVideo.category) return -1
            if (b.category === currentVideo.category && a.category !== currentVideo.category) return 1
            return b.views - a.views
          })
          .slice(0, 15)
          .map((v) => ({
            id: v.id,
            title: v.title,
            thumbnail: v.thumbnail,
            duration: v.duration,
            views: v.views,
            category: v.category,
          }))
      : [],
    [currentVideo, videos]
  )

  // ─── Prepare footer ads data (memoized) ────────────────────────────────────
  const footerAdsData = useMemo(() =>
    footerAds.map((ad) => ({
      id: ad.id,
      title: ad.title,
      mediaUrl: ad.mediaUrl,
      thumbnailUrl: ad.thumbnailUrl || undefined,
      adType: ad.adType as 'image' | 'video' | 'gif' | 'html5',
      mediaFormat: ad.mediaFormat,
      linkUrl: ad.linkUrl || undefined,
    })),
    [footerAds]
  )

  // ─── Prepare hero ads data (memoized) ────────────────────────────────────
  const heroAdsData = useMemo(() =>
    heroAds.map((ad) => ({
      id: ad.id,
      title: ad.title,
      description: ad.description || undefined,
      category: ad.category || undefined,
      mediaUrl: ad.mediaUrl,
      thumbnailUrl: ad.thumbnailUrl || undefined,
      adType: ad.adType as 'image' | 'video',
      mediaFormat: ad.mediaFormat,
      linkUrl: ad.linkUrl || undefined,
    })),
    [heroAds]
  )

  // ─── Get videos for specific category (memoized) ────────────────────────────

  const categoryVideos = useMemo(() =>
    selectedCategory
      ? videos.filter((v) => v.category === selectedCategory)
      : [],
    [videos, selectedCategory]
  )

  // ─── Render Views ──────────────────────────────────────────────────────────

  const renderHomeView = () => {
    // Show skeleton ONLY while no data AND within timeout window
    const hasAnyData = videos.length > 0 || categories.length > 0
    if (loading && !hasAnyData) {
      return (
        <div className="space-y-6 pb-20 md:pb-8">
          <div className="h-[240px] sm:h-[320px] md:h-[420px] animate-shimmer-opt" />
          <section className="px-3 md:px-5 space-y-4">
            <div className="h-7 w-40 rounded-lg animate-shimmer-opt" />
            <div className="flex gap-3 overflow-hidden">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-[200px] sm:w-[220px] md:w-[240px] flex-shrink-0 space-y-2">
                  <div className="aspect-video rounded-lg animate-shimmer-opt" />
                  <div className="h-4 w-3/4 rounded animate-shimmer-opt" />
                  <div className="h-3 w-1/2 rounded animate-shimmer-opt" />
                </div>
              ))}
            </div>
          </section>
        </div>
      )
    }

    // ─── Empty state when no videos exist ────────────────────────────────────
    if (videos.length === 0) {
      return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4 pb-20 md:pb-8">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-1/2 top-1/3 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-xtube-red/5 blur-[120px]" />
          </div>
          <div className="relative z-10 flex flex-col items-center gap-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-xtube-card border border-xtube-border">
              <Film className="h-10 w-10 text-xtube-red" />
            </div>
            <h2 className="text-2xl font-bold text-white">No Videos Yet</h2>
            <p className="max-w-sm text-sm text-xtube-text-secondary">
              Add videos via the Admin Panel and they will appear here instantly with real-time updates.
            </p>
            <p className="text-xs text-xtube-text-secondary/60 mt-2">
              Click the logo 7 times to access Admin Panel
            </p>
          </div>
        </div>
      )
    }

    return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Hero Ads Slider - cinematic hero banner at top */}
      <HeroAdsSlider ads={heroAdsData} />

      {/* Trending section - only shows when videos exist */}
      {trendingVideos.length > 0 && (
      <section className="px-3 md:px-5">
        <CategorySection
          title="🔥 Trending Now"
          category="trending"
          videos={trendingVideos.map((v) => ({
            id: v.id,
            title: v.title,
            thumbnail: v.thumbnail,
            duration: v.duration,
            views: v.views,
            category: v.category,
            isHd: v.isHd,
            createdAt: v.createdAt,
          }))}
        />
      </section>
      )}
      {Object.entries(videosByCategory).map(([category, categoryVids]) => (
        <section key={category} className="px-4 md:px-6">
          <CategorySection
            title={category}
            category={category}
            videos={categoryVids.map((v) => ({
              id: v.id,
              title: v.title,
              thumbnail: v.thumbnail,
              duration: v.duration,
              views: v.views,
              category: v.category,
              isHd: v.isHd,
              createdAt: v.createdAt,
            }))}
          />
        </section>
      ))}
    </div>
    )
  }

  const renderTrendingView = () => (
    <div className="px-3 md:px-5 pb-20 md:pb-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-xtube-red/20">
          <Flame className="h-5 w-5 text-xtube-red" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Trending</h1>
          <p className="text-sm text-xtube-text-secondary">Most popular videos right now</p>
        </div>
      </div>
      <VideoGrid
        videos={trendingVideos.map((v) => ({
          id: v.id,
          title: v.title,
          thumbnail: v.thumbnail,
          duration: v.duration,
          views: v.views,
          category: v.category,
          isHd: v.isHd,
          createdAt: v.createdAt,
        }))}
        loading={loading}
        emptyMessage="No trending videos"
      />
    </div>
  )

  const renderCategoryView = () => (
    <div className="px-3 md:px-5 pb-20 md:pb-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-xtube-red/20">
          <Sparkles className="h-5 w-5 text-xtube-red" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">
            {selectedCategory || 'All Categories'}
          </h1>
          <p className="text-sm text-xtube-text-secondary">
            Browse videos by category
          </p>
        </div>
      </div>
      <div className="mb-6 flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {categories.map((cat) => (
          <motion.button
            key={cat.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => useAppStore.getState().setSelectedCategory(cat.name)}
            className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              selectedCategory === cat.name
                ? 'bg-xtube-red text-white'
                : 'bg-xtube-card text-xtube-text-secondary hover:bg-xtube-card-hover hover:text-white'
            }`}
          >
            {cat.name}
          </motion.button>
        ))}
      </div>
      <VideoGrid
        videos={categoryVideos.map((v) => ({
          id: v.id,
          title: v.title,
          thumbnail: v.thumbnail,
          duration: v.duration,
          views: v.views,
          category: v.category,
          isHd: v.isHd,
          createdAt: v.createdAt,
        }))}
        loading={loading}
        emptyMessage={`No videos in ${selectedCategory || 'this category'}`}
      />
    </div>
  )

  const renderBookmarksView = () => (
    <div className="px-3 md:px-5 pb-20 md:pb-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-xtube-red/20">
          <Clock className="h-5 w-5 text-xtube-red" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Bookmarks</h1>
          <p className="text-sm text-xtube-text-secondary">Your saved videos</p>
        </div>
      </div>
      <VideoGrid
        videos={[]}
        loading={loading}
        emptyMessage="No bookmarked videos yet. Save videos to watch later!"
      />
    </div>
  )

  const renderHistoryView = () => (
    <div className="px-3 md:px-5 pb-20 md:pb-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-xtube-red/20">
          <History className="h-5 w-5 text-xtube-red" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Watch History</h1>
          <p className="text-sm text-xtube-text-secondary">Videos you've watched</p>
        </div>
      </div>
      <VideoGrid
        videos={[]}
        loading={loading}
        emptyMessage="No watch history yet. Start watching videos!"
      />
    </div>
  )

  const renderSearchView = () => (
    <div className="px-3 md:px-5 pb-20 md:pb-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-xtube-red/20">
          <Search className="h-5 w-5 text-xtube-red" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">
            Search: {searchQuery}
          </h1>
          <p className="text-sm text-xtube-text-secondary">
            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
          </p>
        </div>
      </div>
      <VideoGrid
        videos={searchResults.map((v) => ({
          id: v.id,
          title: v.title,
          thumbnail: v.thumbnail,
          duration: v.duration,
          views: v.views,
          category: v.category,
          isHd: v.isHd,
          createdAt: v.createdAt,
        }))}
        loading={loading}
        emptyMessage={`No videos found for "${searchQuery}"`}
      />
    </div>
  )

  const renderVideoView = () => {
    if (!currentVideo) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="animate-pulse-red flex h-12 w-12 items-center justify-center rounded-full bg-xtube-red/20">
            <Film className="h-6 w-6 text-xtube-red" />
          </div>
        </div>
      )
    }

    return (
      <Suspense fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-xtube-red border-t-transparent" />
        </div>
      }>
        <VideoPlayer
          video={currentVideo}
          relatedVideos={relatedVideos}
          comments={videoComments}
          onAddComment={handleAddComment}
        />
      </Suspense>
    )
  }

  // ─── Main Render ───────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Video view has its own full layout */}
      {currentView === 'video' ? (
        <AnimatePresence mode="wait">
          <motion.div
            key="video"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {renderVideoView()}
          </motion.div>
        </AnimatePresence>
      ) : (
        <>
          {/* Desktop Sidebar */}
          <Sidebar />

          {/* Mobile Bottom Nav */}
          <BottomNav />

          {/* Main Content Area */}
          <motion.main
            className={`min-h-screen transition-all duration-300 ${
              sidebarCollapsed ? 'md:ml-[64px]' : 'md:ml-[180px]'
            }`}
          >
            {/* Top Header Bar */}
            {currentView !== 'admin' && (
              <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-xtube-border bg-[#050505] px-3 md:px-4 lg:px-5">
                <div className="flex items-center gap-2">
                  {/* Mobile Logo — only shows on mobile (<768px), sidebar has logo on md+ */}
                  <div className="md:hidden">
                    <XtubeLogo
                      size="sm"
                      showText={true}
                      showLive={true}
                    />
                  </div>

                  {/* View Title - only on md+ since sidebar has logo */}
                  <h2 className="hidden text-xs font-medium text-xtube-text-secondary md:block">
                    {currentView === 'home' && 'Home'}
                    {currentView === 'trending' && 'Trending'}
                    {currentView === 'category' && 'Categories'}
                    {currentView === 'bookmarks' && 'Bookmarks'}
                    {currentView === 'history' && 'History'}
                    {currentView === 'search' && 'Search'}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <SearchBar />
                </div>
              </header>
            )}

            {/* Page Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {currentView === 'home' && renderHomeView()}
                {currentView === 'trending' && renderTrendingView()}
                {currentView === 'category' && renderCategoryView()}
                {currentView === 'bookmarks' && renderBookmarksView()}
                {currentView === 'history' && renderHistoryView()}
                {currentView === 'search' && renderSearchView()}
              </motion.div>
            </AnimatePresence>

            {/* Footer Ads Section - shows on ALL views, above footer */}
            <div className="pb-20 md:pb-6 pt-4">
              <FooterAds ads={footerAdsData} />
            </div>
          </motion.main>
        </>
      )}

      {/* Age Verification Popup */}
      <AgeVerificationPopup />

      {/* Popup Ads Overlay (realtime) */}
      <PopupAdOverlay initialDelay={5000} cooldownPeriod={30000} />

      {/* Admin Login Modal (triggered by 7th logo click on desktop) */}
      <AdminLoginModal />

      {/* Admin Panel Overlay */}
      <AdminPanel />
    </div>
  )
}
