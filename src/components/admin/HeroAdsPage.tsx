'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useHeroAds, type HeroAdItem } from '@/hooks/useAdsManager'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CloudUpload,
  Upload,
  Trash2,
  CheckCircle2,
  Megaphone,
  Eye,
  TrendingUp,
  MousePointer,
  Clock,
  Image as ImageIcon,
  Video as VideoIcon,
  BarChart3,
  Pencil,
  Search,
  ChevronLeft,
  ChevronRight,
  Radio,
  Bell,
  Monitor,
  Smartphone,
  Tablet,
  Zap,
  Calendar,
  Play,
  X,
  RefreshCw,
  Crown,
  ArrowUpFromLine,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { uploadFile } from '@/lib/storage/upload-helper'
import { extractVideoMetadataAndThumbnail } from '@/lib/storage/thumbnail-helper'
import { toast } from 'sonner'

// ─── Types ───────────────────────────────────────────────────────────────────

type UploadStage = 'idle' | 'uploading' | 'processing' | 'success'
type PreviewMode = 'desktop' | 'tablet' | 'mobile'

// ─── Constants ───────────────────────────────────────────────────────────────

const STAT_COLORS = ['#ff1e1e', '#8b5cf6', '#10b981', '#ec4899', '#f97316']
const DONUT_COLORS = ['#3b82f6', '#f97316']

const thumbnailGradients = [
  'from-red-900/60 via-rose-800/40 to-pink-900/30',
  'from-emerald-900/60 via-teal-800/40 to-cyan-900/30',
  'from-amber-900/60 via-orange-800/40 to-yellow-900/30',
  'from-rose-900/60 via-pink-800/40 to-red-900/30',
  'from-cyan-900/60 via-sky-800/40 to-blue-900/30',
  'from-violet-900/60 via-purple-800/40 to-fuchsia-900/30',
  'from-lime-900/60 via-green-800/40 to-emerald-900/30',
  'from-orange-900/60 via-red-800/40 to-amber-900/30',
  'from-indigo-900/60 via-blue-800/40 to-sky-900/30',
  'from-pink-900/60 via-rose-800/40 to-fuchsia-900/30',
]

// ─── Mini Sparkline SVG ──────────────────────────────────────────────────────

function MiniSparkline({ color, index }: { color: string; index: number }) {
  const paths = [
    'M0,20 L8,16 L16,18 L24,10 L32,12 L40,6 L48,8 L56,2',
    'M0,18 L8,14 L16,16 L24,8 L32,10 L40,4 L48,6 L56,0',
    'M0,22 L8,18 L16,20 L24,12 L32,14 L40,8 L48,10 L56,4',
    'M0,16 L8,12 L16,14 L24,6 L32,8 L40,2 L48,4 L56,0',
    'M0,20 L8,16 L16,18 L24,10 L32,12 L40,6 L48,8 L56,2',
  ]
  return (
    <svg viewBox="0 0 56 24" className="mt-2 h-6 w-full opacity-40">
      <path
        d={paths[index % paths.length]}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  change,
  icon: Icon,
  color,
  delay,
  index,
}: {
  title: string
  value: string
  change: string
  icon: React.ElementType
  color: string
  delay: number
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group relative overflow-hidden rounded-xl border border-white/5 bg-[#0B0B0F]/80 p-3 lg:p-4 transition-all duration-300 hover:border-white/10 hover:shadow-lg"
    >
      <div className="absolute left-0 top-0 h-[2px] w-full" style={{ background: `linear-gradient(to right, ${color}, transparent)` }} />
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: color, filter: 'blur(40px)', opacity: 0.06 }} />

      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium uppercase tracking-wider text-white/40">{title}</p>
          <p className="text-xl font-bold text-white">{value}</p>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3 w-3 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400">{change}</span>
            <span className="text-[10px] text-white/25">from last 30 days</span>
          </div>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: `${color}15` }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
      </div>
      <MiniSparkline color={color} index={index} />
    </motion.div>
  )
}

// ─── Format helpers ──────────────────────────────────────────────────────────

function formatNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M'
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K'
  return num.toString()
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function HeroAdsPage() {
  // Realtime data hook - HERO ADS with full realtime
  const { ads: heroAds, loading, createAd: createHeroAd, deleteAd: deleteHeroAd, toggleAd: toggleHeroAd, refetch: refetchHeroAds } = useHeroAds()

  // Upload state
  const [uploadStage, setUploadStage] = useState<UploadStage>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadSpeed, setUploadSpeed] = useState('0 MB/s')
  const [uploadRemaining, setUploadRemaining] = useState('')
  const [uploadedSize, setUploadedSize] = useState('0 GB')
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedThumbnail, setSelectedThumbnail] = useState(0)

  // Real Upload states
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaUrl, setMediaUrl] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')

  // Form state
  const [adTitle, setAdTitle] = useState('')
  const [adDescription, setAdDescription] = useState('')
  const [adCategory, setAdCategory] = useState('')
  const [adType, setAdType] = useState('image')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [displayOrder, setDisplayOrder] = useState(0)
  const [statusActive, setStatusActive] = useState(true)
  const [saving, setSaving] = useState(false)

  // Preview state
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop')

  // Table state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Edit state
  const [editingAd, setEditingAd] = useState<HeroAdItem | null>(null)

  // Delete confirmation
  const [deletingAdId, setDeletingAdId] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ─── Computed KPI Values ───────────────────────────────────────────────

  const totalAds = heroAds.length
  const activeAds = heroAds.filter((ad) => ad.isActive).length
  const totalImpressions = heroAds.reduce((sum, ad) => sum + ad.impressions, 0)
  const avgCtr = totalAds > 0 ? heroAds.reduce((sum, ad) => sum + ad.ctr, 0) / totalAds : 0
  const totalClicks = heroAds.reduce((sum, ad) => sum + ad.clicks, 0)

  const imageCount = heroAds.filter((ad) => ad.adType === 'image').length
  const videoCount = heroAds.filter((ad) => ad.adType === 'video').length

  // ─── Donut data ────────────────────────────────────────────────────────

  const donutData = [
    { name: 'Image Ads', value: imageCount },
    { name: 'Video Ads', value: videoCount },
  ]

  // ─── Top performing ads (by CTR) ──────────────────────────────────────

  const topAds = [...heroAds].sort((a, b) => b.ctr - a.ctr).slice(0, 5)

  // ─── Real File Upload Process ──────────────────────────────────────────────

  const handleFileProcess = useCallback(async (file: File) => {
    if (!file) return
    setMediaFile(file)
    setUploadStage('idle')
    setUploadProgress(0)
    setUploadedSize('0 GB')
    setUploadSpeed('0 MB/s')

    // Determine type
    const isVideo = file.type.startsWith('video/')
    const type = isVideo ? 'video' : 'image'
    setAdType(type)

    setUploadStage('processing')

    try {
      let resolvedThumbnailUrl = ''
      let videoMeta = null

      if (isVideo) {
        try {
          videoMeta = await extractVideoMetadataAndThumbnail(file)
        } catch (err) {
          console.error('Failed to extract video thumbnail:', err)
        }
      }

      setUploadStage('uploading')

      const category = 'ad'
      const uploadRes = await uploadFile(file, category, file.name, (progress, speed, remaining) => {
        setUploadProgress(progress)
        setUploadSpeed(speed)
        setUploadRemaining(remaining)
        const uploaded = (progress / 100) * file.size
        const uploadedGB = uploaded / (1024 * 1024 * 1024)
        if (uploadedGB >= 0.1) {
          setUploadedSize(`${uploadedGB.toFixed(2)} GB`)
        } else {
          setUploadedSize(`${(uploaded / (1024 * 1024)).toFixed(1)} MB`)
        }
      })

      setMediaUrl(uploadRes.url)

      if (isVideo && videoMeta?.thumbnailBlob) {
        try {
          const thumbRes = await uploadFile(videoMeta.thumbnailBlob, 'thumbnail', 'thumbnail.jpg')
          resolvedThumbnailUrl = thumbRes.url
          setThumbnailUrl(thumbRes.url)
        } catch (thumbErr) {
          console.error('Failed to upload video ad thumbnail:', thumbErr)
        }
      } else if (!isVideo) {
        setThumbnailUrl(uploadRes.url)
      }

      setUploadStage('success')
      toast.success('Ad file uploaded successfully!')
    } catch (err) {
      console.error('Ad upload failed:', err)
      setUploadStage('idle')
      setMediaFile(null)
      toast.error(`Upload failed: ${err instanceof Error ? err.message : String(err)}`)
    }
  }, [])

  // ─── Drag & Drop ───────────────────────────────────────────────────────

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true) }, [])
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false) }, [])
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) handleFileProcess(files[0])
  }, [handleFileProcess])

  const handleResetUpload = useCallback(() => {
    setUploadStage('idle')
    setUploadProgress(0)
    setSelectedThumbnail(0)
    setMediaFile(null)
    setMediaUrl('')
    setThumbnailUrl('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  // ─── Create / Update Hero Ad ───────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!adTitle.trim()) return
    if (!mediaUrl && !editingAd) {
      toast.error('Please upload an ad media file first')
      return
    }
    setSaving(true)
    try {
      if (editingAd) {
        // Update existing ad
        const res = await fetch('/api/hero-ads', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingAd.id,
            title: adTitle,
            description: adDescription || null,
            category: adCategory || null,
            mediaUrl: mediaUrl || editingAd.mediaUrl,
            thumbnailUrl: thumbnailUrl || editingAd.thumbnailUrl,
            adType,
            isActive: statusActive,
            displayOrder,
            startDate: startDate || null,
            endDate: endDate || null,
          }),
        })
        if (res.ok) {
          setEditingAd(null)
          resetForm()
          await refetchHeroAds()
        }
      } else {
        // Create new ad via hook (realtime auto-updates)
        await createHeroAd({
          title: adTitle,
          description: adDescription || null,
          category: adCategory || null,
          mediaUrl,
          thumbnailUrl,
          adType,
          mediaFormat: adType === 'video' ? 'mp4' : 'jpg',
          isActive: statusActive,
          displayOrder,
          startDate: startDate || null,
          endDate: endDate || null,
        })
        resetForm()
        handleResetUpload()
      }
    } catch (err) {
      console.error('Error saving hero ad:', err)
    } finally {
      setSaving(false)
    }
  }, [adTitle, adDescription, adCategory, adType, statusActive, displayOrder, startDate, endDate, editingAd, mediaUrl, thumbnailUrl, createHeroAd, refetchHeroAds, handleResetUpload, resetForm])

  // ─── Delete Hero Ad ────────────────────────────────────────────────────

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteHeroAd(id)
      setDeletingAdId(null)
    } catch (err) {
      console.error('Error deleting hero ad:', err)
    }
  }, [deleteHeroAd])

  // ─── Toggle Active ─────────────────────────────────────────────────────

  const handleToggleActive = useCallback(async (ad: HeroAdItem) => {
    try {
      await toggleHeroAd(ad.id, !ad.isActive)
    } catch (err) {
      console.error('Error toggling hero ad active status:', err)
    }
  }, [toggleHeroAd])

  // ─── Edit Hero Ad ──────────────────────────────────────────────────────

  const handleEdit = useCallback((ad: HeroAdItem) => {
    setEditingAd(ad)
    setAdTitle(ad.title)
    setAdDescription(ad.description || '')
    setAdCategory(ad.category || '')
    setAdType(ad.adType)
    setStartDate(ad.startDate ? ad.startDate.split('T')[0] : '')
    setEndDate(ad.endDate ? ad.endDate.split('T')[0] : '')
    setDisplayOrder(ad.displayOrder)
    setStatusActive(ad.isActive)
    setMediaUrl(ad.mediaUrl)
    setThumbnailUrl(ad.thumbnailUrl || '')
    setUploadStage('success')
  }, [])

  // ─── Reset Form ────────────────────────────────────────────────────────

  const resetForm = useCallback(() => {
    setAdTitle('')
    setAdDescription('')
    setAdCategory('')
    setAdType('image')
    setStartDate('')
    setEndDate('')
    setDisplayOrder(0)
    setStatusActive(true)
    setEditingAd(null)
    setUploadStage('idle')
    setUploadProgress(0)
    setSelectedThumbnail(0)
    setMediaFile(null)
    setMediaUrl('')
    setThumbnailUrl('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])


  // ─── Filtered & Paginated Ads ──────────────────────────────────────────

  const filteredAds = heroAds.filter((ad) => {
    if (statusFilter !== 'all') {
      if (statusFilter === 'active' && !ad.isActive) return false
      if (statusFilter === 'paused' && ad.isActive) return false
    }
    if (searchQuery && !ad.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filteredAds.length / itemsPerPage))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedAds = filteredAds.slice(
    (safeCurrentPage - 1) * itemsPerPage,
    safeCurrentPage * itemsPerPage
  )

  const statusStyles: Record<string, string> = {
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    paused: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  }

  const typeStyles: Record<string, string> = {
    image: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    video: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  }

  // ─── Preview container width ───────────────────────────────────────────

  const getPreviewWidth = () => {
    if (previewMode === 'desktop') return '100%'
    if (previewMode === 'tablet') return '75%'
    return '45%'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      className="h-full overflow-y-auto no-scrollbar"
    >
      <div className="min-h-full p-3 lg:p-5 xl:p-6 space-y-4">
        {/* ═══════════════════════════════════════════════════════════════════
            TOP HEADER
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ff1e1e]/10">
              <ArrowUpFromLine className="h-5 w-5 text-[#ff1e1e]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white md:text-2xl">Hero Ads</h1>
              <p className="mt-0.5 text-sm text-white/40">Manage hero slider ads with realtime updates</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Realtime badge */}
            <div className="flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Live</span>
            </div>
            {/* Refresh */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => refetchHeroAds()}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0B0B0F]/60 px-3 py-2 text-xs font-medium text-white/60 transition-colors hover:border-white/20 hover:text-white"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </motion.button>
            {/* Notification bell */}
            <button className="relative flex items-center gap-2 rounded-xl border border-white/10 bg-[#0B0B0F]/60 px-2.5 py-2 text-white/60 transition-colors hover:border-white/20 hover:text-white">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#ff1e1e] text-[8px] font-bold text-white">12</span>
            </button>
            {/* Admin avatar */}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#ff1e1e] to-red-700 shadow-[0_0_12px_rgba(255,30,30,0.3)]">
              <span className="text-xs font-bold text-white">A</span>
            </div>
            {/* Create button */}
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: '0 0 25px rgba(255,30,30,0.4)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                resetForm()
                handleResetUpload()
              }}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff1e1e] to-[#cc181e] px-4 py-2 text-sm font-semibold text-white shadow-[0_0_15px_rgba(255,30,30,0.3)] transition-all hover:from-[#ff2e2e] hover:to-[#dd282e]"
            >
              <CloudUpload className="h-4 w-4" />
              Create Hero Ad
            </motion.button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            KPI ANALYTICS CARDS (5 cards)
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard title="Total Hero Ads" value={totalAds.toString()} change="+14.5%" icon={Megaphone} color={STAT_COLORS[0]} delay={0} index={0} />
          <StatCard title="Active Hero Ads" value={activeAds.toString()} change="+11.2%" icon={Radio} color={STAT_COLORS[1]} delay={0.05} index={1} />
          <StatCard title="Total Impressions" value={formatNumber(totalImpressions)} change="+22.7%" icon={Eye} color={STAT_COLORS[2]} delay={0.1} index={2} />
          <StatCard title="Average CTR" value={avgCtr.toFixed(2) + '%'} change="+8.4%" icon={MousePointer} color={STAT_COLORS[3]} delay={0.15} index={3} />
          <StatCard title="Total Clicks" value={formatNumber(totalClicks)} change="+19.6%" icon={TrendingUp} color={STAT_COLORS[4]} delay={0.2} index={4} />
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            THREE COLUMN LAYOUT
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr_300px] 2xl:grid-cols-[1fr_1fr_340px]">
          {/* ── LEFT: Create / Edit Hero Ad Form ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="overflow-hidden rounded-xl border border-white/5 bg-[#0B0B0F]/80"
          >
            <div className="p-3 lg:p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-bold text-white">
                  {editingAd ? 'Edit Hero Ad' : 'Create Hero Ad'}
                </h2>
                {(uploadStage === 'success' || editingAd) && (
                  <button onClick={() => { resetForm(); handleResetUpload() }} className="text-xs text-[#ff1e1e] hover:text-[#ff3e3e]">
                    {editingAd ? 'Cancel Edit' : 'Reset'}
                  </button>
                )}
              </div>

              {/* Upload Area */}
              <AnimatePresence mode="wait">
                {uploadStage === 'idle' && !editingAd ? (
                  <motion.div
                    key="upload-idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative flex min-h-[170px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-all duration-200 ${
                      isDragOver
                        ? 'border-[#ff1e1e] bg-[#ff1e1e]/5 shadow-[0_0_20px_rgba(255,30,30,0.15)]'
                        : 'border-white/10 bg-[#0a0a0a]/60 hover:border-white/20'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif,video/mp4,video/webm"
                      className="hidden"
                      onChange={(e) => { if (e.target.files?.length) handleFileProcess(e.target.files[0]) }}
                    />
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ff1e1e]/10">
                      <CloudUpload className="h-6 w-6 text-[#ff1e1e]" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-white">
                        Drag &amp; drop your hero ad here
                      </p>
                      <p className="mt-1 text-xs text-white/40">
                        or <span className="text-[#ff1e1e] underline underline-offset-2">browse files</span>
                      </p>
                    </div>
                    <p className="text-[10px] text-white/25">Max size: 5GB | JPG, PNG, WEBP, MP4, WEBM</p>
                    <p className="text-[10px] text-white/20">Cloudflare R2 Storage • Multipart Upload • Auto Retry</p>
                  </motion.div>
                ) : uploadStage === 'uploading' || uploadStage === 'processing' ? (
                  <motion.div
                    key="upload-progress"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="rounded-xl border border-white/5 bg-[#0a0a0a]/60 p-3 lg:p-4"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-white">
                        {uploadStage === 'processing' ? 'Processing...' : 'Uploading...'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#ff1e1e]">{Math.round(uploadProgress)}%</span>
                        {uploadStage === 'uploading' && (
                          <>
                            <button className="rounded px-2 py-0.5 text-[10px] text-white/40 hover:text-white/60 border border-white/10">Pause</button>
                            <button onClick={handleResetUpload} className="rounded px-2 py-0.5 text-[10px] text-red-400 hover:text-red-300 border border-red-500/20">Cancel</button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="relative mb-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3 }}
                        className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[#ff1e1e] to-red-500"
                      />
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3 }}
                        className="absolute left-0 top-0 h-full rounded-full bg-[#ff1e1e] blur-sm opacity-30"
                      />
                    </div>
                    {uploadStage === 'uploading' ? (
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <p className="text-[10px] text-white/25">Uploaded</p>
                          <p className="text-xs font-semibold text-white">{uploadedSize} / 5.00 GB</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-white/25">Speed</p>
                          <p className="text-xs font-semibold text-white">{uploadSpeed}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-white/25">Time Left</p>
                          <p className="text-xs font-semibold text-white">{uploadRemaining}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-amber-400">
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
                        <span>Optimizing &amp; generating thumbnails...</span>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="upload-success"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    {/* File success card */}
                    <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-white">
                          {editingAd ? editingAd.mediaUrl.split('/').pop() : 'hero_banner_2025.jpg'}
                        </p>
                        <p className="text-[10px] text-white/30">
                          {adType === 'video' ? '1920×1080 • MP4' : '1920×600 • JPG'}
                        </p>
                      </div>
                      {!editingAd && (
                        <button onClick={() => { handleResetUpload() }} className="text-xs text-[#ff1e1e] hover:text-[#ff3e3e]">Change</button>
                      )}
                    </div>

                    {/* Thumbnails */}
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-medium text-white/60">Thumbnails <span className="text-[#ff1e1e]">(10 auto-generated)</span></p>
                        <div className="flex items-center gap-2">
                          <button className="text-[10px] text-[#ff1e1e] hover:text-[#ff3e3e]">Upload Manually</button>
                        </div>
                      </div>
                      <div className="grid grid-cols-5 gap-1.5">
                        {thumbnailGradients.map((gradient, i) => (
                          <button
                            key={i}
                            onClick={() => setSelectedThumbnail(i)}
                            className={`relative aspect-video overflow-hidden rounded border-2 transition-all ${
                              selectedThumbnail === i
                                ? 'border-[#ff1e1e] shadow-[0_0_8px_rgba(255,30,30,0.3)]'
                                : 'border-transparent hover:border-white/20'
                            }`}
                          >
                            <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
                            <div className="absolute inset-0 flex items-center justify-center">
                              {adType === 'video' ? (
                                <VideoIcon className="h-2.5 w-2.5 text-white/15" />
                              ) : (
                                <ImageIcon className="h-2.5 w-2.5 text-white/15" />
                              )}
                            </div>
                            {selectedThumbnail === i && (
                              <div className="absolute top-0.5 right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-[#ff1e1e]">
                                <CheckCircle2 className="h-2 w-2 text-white" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Ad Settings */}
              <div className="mt-4 space-y-3 border-t border-white/5 pt-4">
                <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">Ad Settings</h3>

                {/* Ad Title */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-white/50">Ad Title</label>
                  <input
                    type="text"
                    value={adTitle}
                    onChange={(e) => setAdTitle(e.target.value)}
                    placeholder="Enter hero ad title"
                    className="h-8 w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 text-xs text-white placeholder:text-white/25 outline-none focus:border-[#ff1e1e]/40"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-white/50">Description</label>
                  <textarea
                    value={adDescription}
                    onChange={(e) => setAdDescription(e.target.value)}
                    placeholder="Enter ad description"
                    rows={2}
                    className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2 text-xs text-white placeholder:text-white/25 outline-none focus:border-[#ff1e1e]/40 resize-none"
                  />
                </div>

                {/* Category + Ad Type */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-white/50">Category</label>
                    <input
                      type="text"
                      value={adCategory}
                      onChange={(e) => setAdCategory(e.target.value)}
                      placeholder="e.g. promotion"
                      className="h-8 w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 text-xs text-white placeholder:text-white/25 outline-none focus:border-[#ff1e1e]/40"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-white/50">Ad Type</label>
                    <Select value={adType} onValueChange={setAdType}>
                      <SelectTrigger className="h-8 w-full rounded-lg border-white/10 bg-[#0a0a0a] text-xs text-white/70 [&_svg]:text-white/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-white/10 bg-[#111111]">
                        <SelectItem value="image" className="text-xs text-white focus:bg-white/5">Image</SelectItem>
                        <SelectItem value="video" className="text-xs text-white focus:bg-white/5">Video</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Start Date + End Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-white/50">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-8 w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 text-xs text-white/70 outline-none focus:border-[#ff1e1e]/40 [color-scheme:dark]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-white/50">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="h-8 w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 text-xs text-white/70 outline-none focus:border-[#ff1e1e]/40 [color-scheme:dark]"
                    />
                  </div>
                </div>

                {/* Display Order */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-white/50">Display Order</label>
                  <input
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                    min={0}
                    className="h-8 w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 text-xs text-white/70 outline-none focus:border-[#ff1e1e]/40"
                  />
                </div>

                {/* Active Status Toggle */}
                <div className="flex items-center justify-between rounded-lg bg-[#0a0a0a]/50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5 text-white/30" />
                    <span className="text-xs text-white/50">Active Status</span>
                  </div>
                  <button
                    onClick={() => setStatusActive(!statusActive)}
                    className={`relative flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
                      statusActive ? 'bg-[#ff1e1e]' : 'bg-white/10'
                    }`}
                  >
                    <motion.div
                      animate={{ x: statusActive ? 18 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="h-3.5 w-3.5 rounded-full bg-white shadow-sm"
                    />
                  </button>
                </div>

                {/* Save button */}
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: '0 0 25px rgba(255,30,30,0.4)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  disabled={saving || !adTitle.trim()}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff1e1e] to-[#cc181e] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_15px_rgba(255,30,30,0.3)] transition-all hover:from-[#ff2e2e] hover:to-[#dd282e] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <CloudUpload className="h-4 w-4" />
                  )}
                  {editingAd ? 'Update Hero Ad' : 'Save Hero Ad'}
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* ── CENTER: Ad Preview ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="space-y-4"
          >
            <div className="overflow-hidden rounded-xl border border-white/5 bg-[#0B0B0F]/80">
              <div className="p-3 lg:p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-bold text-white">Ad Preview</h2>
                  <div className="flex items-center gap-1">
                    {(['desktop', 'tablet', 'mobile'] as PreviewMode[]).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setPreviewMode(mode)}
                        className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
                          previewMode === mode
                            ? 'bg-[#ff1e1e]/10 text-[#ff1e1e] border border-[#ff1e1e]/20'
                            : 'text-white/30 hover:text-white/50 border border-transparent'
                        }`}
                      >
                        {mode === 'desktop' && <Monitor className="h-3 w-3" />}
                        {mode === 'tablet' && <Tablet className="h-3 w-3" />}
                        {mode === 'mobile' && <Smartphone className="h-3 w-3" />}
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview Area */}
                <div className="flex justify-center">
                  <motion.div
                    animate={{ width: getPreviewWidth() }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden rounded-lg border border-white/10 bg-[#080810]"
                  >
                    {/* Fake website header */}
                    <div className="border-b border-white/5 bg-[#0a0a12] px-3 py-1.5">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-red-500/60" />
                        <div className="h-2 w-2 rounded-full bg-yellow-500/60" />
                        <div className="h-2 w-2 rounded-full bg-green-500/60" />
                        <div className="ml-2 h-3 flex-1 rounded-sm bg-white/5" />
                      </div>
                    </div>

                    {/* Content with hero ad placement */}
                    <div className="relative">
                      {/* HERO SECTION AD PREVIEW */}
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative overflow-hidden"
                        style={{ aspectRatio: '1920/600' }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-[#1a0a2e] via-[#16213e] to-[#0f3460]" />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#ff1e1e]/10 to-transparent" />
                        <div className="absolute inset-0 flex items-center justify-center p-3 lg:p-4">
                          <div className="text-center">
                            <div className="text-[8px] font-bold tracking-[0.2em] text-white/30 uppercase">
                              {adCategory || 'Premium Collection'}
                            </div>
                            <p className="mt-1 text-lg font-bold text-white">
                              {adTitle || 'HERO AD PREVIEW'}
                            </p>
                            <p className="text-[9px] text-white/40 mt-0.5">
                              {adDescription || 'Your cinematic hero ad will appear here'}
                            </p>
                            {adType === 'video' && (
                              <div className="mt-2 flex items-center justify-center gap-1">
                                <Play className="h-3 w-3 text-white/50" />
                                <span className="text-[8px] text-white/50">Video Ad</span>
                              </div>
                            )}
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="mt-2 rounded bg-[#ff1e1e] px-4 py-1 text-[9px] font-bold text-white shadow-[0_0_10px_rgba(255,30,30,0.4)]"
                            >
                              LEARN MORE
                            </motion.button>
                          </div>
                        </div>
                        <div className="absolute top-2 right-2 rounded bg-black/50 px-1.5 py-0.5 text-[7px] text-white/40">
                          Ad • Hero Section
                        </div>
                      </motion.div>

                      {/* Fake content below hero */}
                      <div className="p-3 space-y-2">
                        <div className="h-2.5 w-2/3 rounded bg-white/5" />
                        <div className="h-2 w-full rounded bg-white/3" />
                        <div className="h-2 w-4/5 rounded bg-white/3" />
                        <div className="grid grid-cols-3 gap-1.5 mt-2">
                          <div className="aspect-video rounded bg-white/3" />
                          <div className="aspect-video rounded bg-white/3" />
                          <div className="aspect-video rounded bg-white/3" />
                        </div>
                        <div className="h-2 w-3/4 rounded bg-white/3" />
                        <div className="h-2 w-1/2 rounded bg-white/3" />
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Ad Details */}
                <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
                  {[
                    { label: 'Ad Type', value: adType === 'video' ? 'Video' : 'Image' },
                    { label: 'Category', value: adCategory || '—' },
                    { label: 'Display Order', value: displayOrder.toString() },
                    { label: 'Format', value: adType === 'video' ? 'MP4' : 'JPG' },
                    { label: 'Start Date', value: startDate || '—' },
                    { label: 'End Date', value: endDate || '—' },
                    { label: 'Status', value: statusActive ? 'Active' : 'Paused' },
                    { label: 'Dimensions', value: adType === 'video' ? '1920×1080' : '1920×600' },
                  ].map((detail) => (
                    <div key={detail.label} className="flex items-center justify-between rounded-lg bg-[#0a0a0a]/50 px-3 py-1.5">
                      <span className="text-[10px] text-white/30">{detail.label}</span>
                      <span className={`text-[10px] font-medium truncate ml-2 ${
                        detail.label === 'Status'
                          ? statusActive ? 'text-emerald-400' : 'text-amber-400'
                          : 'text-white/70'
                      }`}>{detail.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── RIGHT: Analytics Sidebar ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            className="space-y-4"
          >
            {/* Donut Chart: Image vs Video Distribution */}
            <div className="overflow-hidden rounded-xl border border-white/5 bg-[#0B0B0F]/80">
              <div className="p-3 lg:p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-white">Ad Distribution</h2>
                  <button className="text-[10px] text-white/30 hover:text-white/50">All Time</button>
                </div>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {donutData.map((_entry, index) => (
                          <Cell key={`donut-${index}`} fill={DONUT_COLORS[index]} />
                        ))}
                      </Pie>
                      <text x="50%" y="44%" textAnchor="middle" dominantBaseline="middle" className="fill-white text-sm font-bold">
                        {totalAds}
                      </text>
                      <text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle" className="fill-white/30 text-[8px]">
                        Total Ads
                      </text>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null
                          const d = payload[0]
                          const pct = totalAds > 0 ? ((d.value as number) / totalAds * 100).toFixed(0) : '0'
                          return (
                            <div className="rounded-lg border border-white/10 bg-[#111111]/95 px-3 py-2 shadow-xl">
                              <p className="text-xs font-semibold text-white">{d.name}</p>
                              <p className="text-[10px] text-white/40">{(d.value as number)} ads ({pct}%)</p>
                            </div>
                          )
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="mt-2 space-y-1.5">
                  {donutData.map((item, i) => {
                    const pct = totalAds > 0 ? ((item.value / totalAds) * 100).toFixed(0) : '0'
                    return (
                      <div key={item.name} className="flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ background: DONUT_COLORS[i] }} />
                          <span className="text-white/50">{item.name}</span>
                        </div>
                        <span className="font-medium text-white/70">{pct}% • {item.value}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Top Performing Ads */}
            <div className="overflow-hidden rounded-xl border border-white/5 bg-[#0B0B0F]/80">
              <div className="p-3 lg:p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-white">Top Performing</h2>
                  <Crown className="h-3.5 w-3.5 text-amber-400/50" />
                </div>
                {topAds.length === 0 ? (
                  <div className="py-6 text-center">
                    <BarChart3 className="h-8 w-8 text-white/10 mx-auto mb-2" />
                    <p className="text-xs text-white/30">No ads yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {topAds.map((ad, i) => (
                      <div key={ad.id} className="flex items-center gap-3 rounded-lg bg-[#0a0a0a]/50 p-2.5 transition-colors hover:bg-[#0a0a0a]">
                        <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white/30 bg-white/5">
                          {i + 1}
                        </div>
                        <div className="relative h-8 w-12 flex-shrink-0 overflow-hidden rounded">
                          <div className={`absolute inset-0 bg-gradient-to-br ${thumbnailGradients[i % thumbnailGradients.length]}`} />
                          <div className="absolute inset-0 flex items-center justify-center">
                            {ad.adType === 'video' ? (
                              <VideoIcon className="h-2.5 w-2.5 text-white/20" />
                            ) : (
                              <ImageIcon className="h-2.5 w-2.5 text-white/20" />
                            )}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11px] font-medium text-white">{ad.title}</p>
                          <p className="text-[9px] text-white/30">CTR: {ad.ctr.toFixed(2)}% • {formatNumber(ad.impressions)} imp</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="overflow-hidden rounded-xl border border-white/5 bg-[#0B0B0F]/80">
              <div className="p-3 lg:p-4">
                <h2 className="mb-3 text-sm font-bold text-white">Quick Stats</h2>
                <div className="space-y-2.5">
                  {[
                    { label: 'Avg. CTR', value: avgCtr.toFixed(2) + '%', icon: MousePointer, color: '#ec4899' },
                    { label: 'Avg. Impressions', value: totalAds > 0 ? formatNumber(Math.round(totalImpressions / totalAds)) : '0', icon: Eye, color: '#10b981' },
                    { label: 'Avg. Clicks', value: totalAds > 0 ? formatNumber(Math.round(totalClicks / totalAds)) : '0', icon: TrendingUp, color: '#f97316' },
                    { label: 'Active Rate', value: totalAds > 0 ? Math.round((activeAds / totalAds) * 100) + '%' : '0%', icon: Radio, color: '#8b5cf6' },
                  ].map((stat) => (
                    <div key={stat.label} className="flex items-center justify-between rounded-lg bg-[#0a0a0a]/50 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <stat.icon className="h-3.5 w-3.5" style={{ color: stat.color }} />
                        <span className="text-[11px] text-white/50">{stat.label}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-white/80">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            HERO ADS TABLE
            ═══════════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="overflow-hidden rounded-xl border border-white/5 bg-[#0B0B0F]/80"
        >
          <div className="p-3 lg:p-4">
            {/* Table header */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-base font-bold text-white">Hero Ads List</h2>
              <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1) }}>
                  <SelectTrigger className="h-8 w-28 rounded-lg border-white/10 bg-[#0a0a0a] text-xs text-white/60 [&_svg]:text-white/30">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#111111]">
                    <SelectItem value="all" className="text-xs text-white focus:bg-white/5">All</SelectItem>
                    <SelectItem value="active" className="text-xs text-white focus:bg-white/5">Active</SelectItem>
                    <SelectItem value="paused" className="text-xs text-white focus:bg-white/5">Paused</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
                    placeholder="Search ads..."
                    className="h-8 w-40 rounded-lg border border-white/10 bg-[#0a0a0a] pl-8 pr-3 text-xs text-white placeholder:text-white/25 outline-none focus:border-[#ff1e1e]/40"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={refetchHeroAds}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-[#0a0a0a] text-white/40 transition-colors hover:bg-white/5 hover:text-white"
                  title="Refresh"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </motion.button>
              </div>
            </div>

            {/* Loading state */}
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 animate-pulse">
                    <div className="h-10 w-20 rounded-lg bg-white/5" />
                    <div className="h-3 w-32 rounded bg-white/5" />
                    <div className="h-5 w-14 rounded bg-white/5" />
                    <div className="h-3 w-16 rounded bg-white/5" />
                    <div className="h-3 w-12 rounded bg-white/5" />
                    <div className="h-5 w-14 rounded bg-white/5" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px]">
                    <thead>
                      <tr className="border-b border-white/5">
                        {['Thumbnail', 'Title', 'Type', 'Impressions', 'CTR', 'Clicks', 'Status', 'Actions'].map((h) => (
                          <th key={h} className="pb-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-white/25">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {paginatedAds.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-10 text-center">
                            <BarChart3 className="h-10 w-10 text-white/10 mx-auto mb-2" />
                            <p className="text-sm text-white/30">No hero ads found</p>
                            <p className="text-xs text-white/20 mt-1">Create your first hero ad to get started</p>
                          </td>
                        </tr>
                      ) : (
                        paginatedAds.map((ad, i) => (
                          <motion.tr
                            key={ad.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.45 + i * 0.04, duration: 0.3 }}
                            className="group transition-colors hover:bg-white/[0.02]"
                          >
                            {/* Thumbnail */}
                            <td className="py-2 pr-3">
                              <div className="relative h-10 w-20 overflow-hidden rounded-lg">
                                <div className={`absolute inset-0 bg-gradient-to-br ${thumbnailGradients[i % thumbnailGradients.length]}`} />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  {ad.adType === 'video' ? (
                                    <VideoIcon className="h-3 w-3 text-white/20" />
                                  ) : (
                                    <ImageIcon className="h-3 w-3 text-white/20" />
                                  )}
                                </div>
                                <div className="absolute top-0.5 right-0.5 rounded bg-black/50 px-0.5 text-[5px] text-white/40">
                                  H
                                </div>
                              </div>
                            </td>
                            {/* Title */}
                            <td className="py-2 pr-3">
                              <p className="text-xs font-medium text-white">{ad.title}</p>
                              {ad.category && (
                                <p className="text-[10px] text-white/30">{ad.category}</p>
                              )}
                            </td>
                            {/* Type */}
                            <td className="py-2 pr-3">
                              <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${typeStyles[ad.adType] || 'bg-white/5 text-white/40 border-white/10'}`}>
                                {ad.adType === 'video' ? <VideoIcon className="h-2.5 w-2.5" /> : <ImageIcon className="h-2.5 w-2.5" />}
                                {ad.adType === 'video' ? 'Video' : 'Image'}
                              </span>
                            </td>
                            {/* Impressions */}
                            <td className="py-2 pr-3">
                              <span className="text-xs font-medium text-white/70">{formatNumber(ad.impressions)}</span>
                            </td>
                            {/* CTR */}
                            <td className="py-2 pr-3">
                              <span className="text-xs font-medium text-white/70">{ad.ctr.toFixed(2)}%</span>
                            </td>
                            {/* Clicks */}
                            <td className="py-2 pr-3">
                              <span className="text-xs font-medium text-white/70">{formatNumber(ad.clicks)}</span>
                            </td>
                            {/* Status */}
                            <td className="py-2 pr-3">
                              <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium ${ad.isActive ? statusStyles.active : statusStyles.paused}`}>
                                {ad.isActive ? (
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                ) : (
                                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                                )}
                                {ad.isActive ? 'Active' : 'Paused'}
                              </span>
                            </td>
                            {/* Actions */}
                            <td className="py-2">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleEdit(ad)}
                                  className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-white/10 hover:text-white"
                                  title="Edit"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleToggleActive(ad)}
                                  className={`rounded-md p-1.5 transition-colors ${
                                    ad.isActive
                                      ? 'text-amber-400/50 hover:bg-amber-500/10 hover:text-amber-400'
                                      : 'text-emerald-400/50 hover:bg-emerald-500/10 hover:text-emerald-400'
                                  }`}
                                  title={ad.isActive ? 'Pause' : 'Activate'}
                                >
                                  <Zap className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeletingAdId(ad.id)}
                                  className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-red-500/10 hover:text-red-400"
                                  title="Delete"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {filteredAds.length > 0 && (
                  <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-white/30">Rows per page:</span>
                      <span className="text-[10px] text-white/50">{itemsPerPage}</span>
                      <span className="text-[10px] text-white/30 ml-2">
                        {((safeCurrentPage - 1) * itemsPerPage) + 1}–{Math.min(safeCurrentPage * itemsPerPage, filteredAds.length)} of {filteredAds.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, safeCurrentPage - 1))}
                        disabled={safeCurrentPage <= 1}
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 text-white/40 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-30"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                      {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium transition-colors ${
                            safeCurrentPage === page
                              ? 'bg-[#ff1e1e] text-white'
                              : 'border border-white/10 text-white/40 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, safeCurrentPage + 1))}
                        disabled={safeCurrentPage >= totalPages}
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 text-white/40 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-30"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════════
            DELETE CONFIRMATION DIALOG
            ═══════════════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {deletingAdId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
              onClick={() => setDeletingAdId(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="mx-4 w-full max-w-sm overflow-hidden rounded-xl border border-white/10 bg-[#0B0B0F] p-5 shadow-2xl"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
                    <Trash2 className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Delete Hero Ad</h3>
                    <p className="text-xs text-white/40">This action cannot be undone</p>
                  </div>
                </div>
                <p className="text-xs text-white/50 mb-5">
                  Are you sure you want to delete this hero ad? All associated analytics data will be permanently removed.
                </p>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setDeletingAdId(null)}
                    className="rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleDelete(deletingAdId)}
                    className="rounded-lg bg-red-500 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-600"
                  >
                    Delete Ad
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
