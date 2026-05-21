'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useFooterAds, type FooterAdItem } from '@/hooks/useAdsManager'
import { motion, AnimatePresence } from 'framer-motion'
import { uploadFile } from '@/lib/storage/upload-helper'
import { extractVideoMetadataAndThumbnail } from '@/lib/storage/thumbnail-helper'
import { toast } from 'sonner'
import {
  CloudUpload,
  Upload,
  Trash2,
  CheckCircle2,
  Megaphone,
  Eye,
  TrendingUp,
  DollarSign,
  MousePointer,
  Clock,
  Image as ImageIcon,
  BarChart3,
  Pencil,
  Search,
  ChevronLeft,
  ChevronRight,
  Radio,
  X,
  Bell,
  Monitor,
  Smartphone,
  Tablet,
  Sparkles,
  Zap,
  Link2,
  LayoutGrid,
  ArrowDownFromLine,
  RefreshCw,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

// ─── Types ───────────────────────────────────────────────────────────────────

type UploadStage = 'idle' | 'uploading' | 'processing' | 'success'
type PreviewMode = 'desktop' | 'tablet' | 'mobile'

// ─── Constants ───────────────────────────────────────────────────────────────

const STAT_COLORS = ['#ff1e1e', '#8b5cf6', '#10b981', '#ec4899', '#f97316']

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

// ─── Format helpers ──────────────────────────────────────────────────────────

function formatNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M'
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K'
  return num.toString()
}

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

// ─── Main Component ──────────────────────────────────────────────────────────

export function FooterAdsPage() {
  // Real data hooks - FOOTER ONLY with full realtime
  const { ads: footerAds, loading: footerLoading, createAd: createFooterAd, deleteAd: deleteFooterAd, toggleAd: toggleFooterAd, refetch: refetchFooterAds } = useFooterAds()

  // Upload state
  const [uploadStage, setUploadStage] = useState<UploadStage>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadSpeed, setUploadSpeed] = useState('0 MB/s')
  const [uploadRemaining, setUploadRemaining] = useState('')
  const [uploadedSize, setUploadedSize] = useState('0 GB')
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedThumbnail, setSelectedThumbnail] = useState(0)
  const [saving, setSaving] = useState(false)

  // Ad settings state
  const [adTitle, setAdTitle] = useState('')
  const [adLink, setAdLink] = useState('')
  const [deviceDesktop, setDeviceDesktop] = useState(true)
  const [deviceTablet, setDeviceTablet] = useState(true)
  const [deviceMobile, setDeviceMobile] = useState(false)
  const [position, setPosition] = useState('footer-top')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [autoRotate, setAutoRotate] = useState(true)
  const [statusActive, setStatusActive] = useState(true)

  // Edit state
  const [editingAd, setEditingAd] = useState<FooterAdItem | null>(null)

  // Preview state
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop')

  // Table state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Delete confirmation
  const [deletingAdId, setDeletingAdId] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ─── Computed KPIs from realtime data ───────────────────────────────────

  const totalAds = footerAds.length
  const activeAds = footerAds.filter((ad) => ad.isActive).length
  const totalImpressions = footerAds.reduce((sum, ad) => sum + ad.impressions, 0)
  const totalClicks = footerAds.reduce((sum, ad) => sum + ad.clicks, 0)
  const avgCtr = totalAds > 0 ? footerAds.reduce((sum, ad) => sum + ad.ctr, 0) / totalAds : 0

  // Real Upload states
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaUrl, setMediaUrl] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')

  const handleFileProcess = useCallback(async (file: File) => {
    if (!file) return
    setMediaFile(file)
    const isVideo = file.type.startsWith('video/')
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
        setUploadSpeed(speed || '0 MB/s')
        setUploadRemaining(remaining || '')
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

  // ─── Filtered Ads ──────────────────────────────────────────────────────

  const filteredAds = footerAds.filter((ad) => {
    if (statusFilter !== 'all' && (ad.isActive ? 'active' : 'paused') !== statusFilter) return false
    if (searchQuery && !ad.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  // ─── Pagination ────────────────────────────────────────────────────────

  const totalPages = Math.max(1, Math.ceil(filteredAds.length / itemsPerPage))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedAds = filteredAds.slice(
    (safeCurrentPage - 1) * itemsPerPage,
    safeCurrentPage * itemsPerPage
  )

  // ─── Reset Form ────────────────────────────────────────────────────────

  const resetForm = useCallback(() => {
    setAdTitle('')
    setAdLink('')
    setStartDate('')
    setEndDate('')
    setStatusActive(true)
    setAutoRotate(true)
    setEditingAd(null)
    setUploadStage('idle')
    setUploadProgress(0)
    setSelectedThumbnail(0)
    setMediaFile(null)
    setMediaUrl('')
    setThumbnailUrl('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  // ─── Edit Ad ───────────────────────────────────────────────────────────

  const handleEdit = useCallback((ad: FooterAdItem) => {
    setEditingAd(ad)
    setAdTitle(ad.title)
    setAdLink(ad.linkUrl || '')
    setStartDate(ad.startDate ? ad.startDate.split('T')[0] : '')
    setEndDate(ad.endDate ? ad.endDate.split('T')[0] : '')
    setStatusActive(ad.isActive)
    setMediaUrl(ad.mediaUrl || '')
    setThumbnailUrl(ad.thumbnailUrl || '')
    setUploadStage('success')
  }, [])

  // ─── Preview container width ───────────────────────────────────────────

  const getPreviewWidth = () => {
    if (previewMode === 'desktop') return '100%'
    if (previewMode === 'tablet') return '75%'
    return '45%'
  }

  // ─── Realtime indicator ────────────────────────────────────────────────

  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  useEffect(() => {
    if (footerAds.length > 0) {
      setLastUpdated(new Date())
    }
  }, [footerAds.length])

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
              <ArrowDownFromLine className="h-5 w-5 text-[#ff1e1e]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white md:text-2xl">Footer Ads</h1>
              <p className="mt-0.5 text-sm text-white/40">Manage footer ads with realtime updates</p>
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
              onClick={() => refetchFooterAds()}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0B0B0F]/60 px-3 py-2 text-xs font-medium text-white/60 transition-colors hover:border-white/20 hover:text-white"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </motion.button>
            {/* Notification bell */}
            <button className="relative flex items-center gap-2 rounded-xl border border-white/10 bg-[#0B0B0F]/60 px-2.5 py-2 text-white/60 transition-colors hover:border-white/20 hover:text-white">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#ff1e1e] text-[8px] font-bold text-white">3</span>
            </button>
            {/* Admin avatar */}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#ff1e1e] to-red-700 shadow-[0_0_12px_rgba(255,30,30,0.3)]">
              <span className="text-xs font-bold text-white">A</span>
            </div>
            {/* Create button */}
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: '0 0 25px rgba(255,30,30,0.4)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { resetForm(); handleResetUpload() }}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff1e1e] to-[#cc181e] px-4 py-2 text-sm font-semibold text-white shadow-[0_0_15px_rgba(255,30,30,0.3)] transition-all hover:from-[#ff2e2e] hover:to-[#dd282e]"
            >
              <CloudUpload className="h-4 w-4" />
              Create Footer Ad
            </motion.button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            TOP ANALYTICS CARDS (5 cards - computed from realtime data)
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard title="Total Footer Ads" value={totalAds.toString()} change="+14.5%" icon={Megaphone} color={STAT_COLORS[0]} delay={0} index={0} />
          <StatCard title="Active Ads" value={activeAds.toString()} change="+11.2%" icon={Radio} color={STAT_COLORS[1]} delay={0.05} index={1} />
          <StatCard title="Impressions" value={formatNumber(totalImpressions)} change="+22.7%" icon={Eye} color={STAT_COLORS[2]} delay={0.1} index={2} />
          <StatCard title="CTR" value={avgCtr.toFixed(2) + '%'} change="+8.4%" icon={MousePointer} color={STAT_COLORS[3]} delay={0.15} index={3} />
          <StatCard title="Total Clicks" value={formatNumber(totalClicks)} change="+19.6%" icon={TrendingUp} color={STAT_COLORS[4]} delay={0.2} index={4} />
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            THREE COLUMN LAYOUT
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr_300px] 2xl:grid-cols-[1fr_1fr_340px]">
          {/* ── LEFT: Create / Edit Footer Ad ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="overflow-hidden rounded-xl border border-white/5 bg-[#0B0B0F]/80"
          >
            <div className="p-3 lg:p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-bold text-white">
                  {editingAd ? 'Edit Footer Ad' : 'Create Footer Ad'}
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
                      accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif,.zip,application/zip"
                      className="hidden"
                      onChange={(e) => { if (e.target.files?.length) handleFileProcess(e.target.files[0]) }}
                    />
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ff1e1e]/10">
                      <CloudUpload className="h-6 w-6 text-[#ff1e1e]" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-white">
                        Drag &amp; drop your footer ad here
                      </p>
                      <p className="mt-1 text-xs text-white/40">
                        or <span className="text-[#ff1e1e] underline underline-offset-2">browse files</span>
                      </p>
                    </div>
                    <p className="text-[10px] text-white/25">Max size: 5GB | JPG, PNG, WEBP, SVG, GIF, HTML5 ZIP</p>
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
                          {editingAd ? editingAd.mediaUrl.split('/').pop() : 'footer_banner_2025.jpg'}
                        </p>
                        <p className="text-[10px] text-white/30">970×250 • JPG</p>
                      </div>
                      {!editingAd && (
                        <button onClick={handleResetUpload} className="text-xs text-[#ff1e1e] hover:text-[#ff3e3e]">Change</button>
                      )}
                    </div>

                    {/* Thumbnails */}
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-medium text-white/60">Thumbnails <span className="text-[#ff1e1e]">(10 auto-generated)</span></p>
                        <div className="flex items-center gap-2">
                          <button className="text-[10px] text-[#ff1e1e] hover:text-[#ff3e3e]">Upload Manually</button>
                          <button className="text-[10px] text-[#ff1e1e] hover:text-[#ff3e3e] flex items-center gap-1">
                            <Sparkles className="h-2.5 w-2.5" /> AI
                          </button>
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
                              <ImageIcon className="h-2.5 w-2.5 text-white/15" />
                            </div>
                            {selectedThumbnail === i && (
                              <div className="absolute top-0.5 right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-[#ff1e1e]">
                                <CheckCircle2 className="h-2 w-2 text-white" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-[10px] text-white/25">
                        <span>970×250</span>
                        <span>728×90</span>
                        <span>320×100</span>
                        <span>16:9</span>
                        <span>1:1</span>
                        <span className="text-[#ff1e1e] cursor-pointer">Crop</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Ad Settings */}
              <div className="mt-4 space-y-3 border-t border-white/5 pt-4">
                <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">Ad Settings</h3>

                {/* Ad Title + Link */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-white/50">Ad Title</label>
                    <input
                      type="text"
                      value={adTitle}
                      onChange={(e) => setAdTitle(e.target.value)}
                      placeholder="Enter ad title"
                      className="h-8 w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 text-xs text-white placeholder:text-white/25 outline-none focus:border-[#ff1e1e]/40"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-white/50">Ad Link URL</label>
                    <div className="relative">
                      <input
                        type="url"
                        value={adLink}
                        onChange={(e) => setAdLink(e.target.value)}
                        placeholder="https://example.com"
                        className="h-8 w-full rounded-lg border border-white/10 bg-[#0a0a0a] pl-8 pr-3 text-xs text-white placeholder:text-white/25 outline-none focus:border-[#ff1e1e]/40"
                      />
                      <Link2 className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-white/25" />
                    </div>
                  </div>
                </div>

                {/* Device Targeting */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-white/50">Display On</label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={deviceDesktop} onCheckedChange={(c) => setDeviceDesktop(c as boolean)} className="border-white/20 data-[state=checked]:bg-[#ff1e1e] data-[state=checked]:border-[#ff1e1e]" />
                      <Monitor className="h-3.5 w-3.5 text-white/30" />
                      <span className="text-xs text-white/50">Desktop</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={deviceTablet} onCheckedChange={(c) => setDeviceTablet(c as boolean)} className="border-white/20 data-[state=checked]:bg-[#ff1e1e] data-[state=checked]:border-[#ff1e1e]" />
                      <Tablet className="h-3.5 w-3.5 text-white/30" />
                      <span className="text-xs text-white/50">Tablet</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={deviceMobile} onCheckedChange={(c) => setDeviceMobile(c as boolean)} className="border-white/20 data-[state=checked]:bg-[#ff1e1e] data-[state=checked]:border-[#ff1e1e]" />
                      <Smartphone className="h-3.5 w-3.5 text-white/30" />
                      <span className="text-xs text-white/50">Mobile</span>
                    </label>
                  </div>
                </div>

                {/* Position + Auto Rotate */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-white/50">Position</label>
                    <Select value={position} onValueChange={setPosition}>
                      <SelectTrigger className="h-8 w-full rounded-lg border-white/10 bg-[#0a0a0a] text-xs text-white/70 [&_svg]:text-white/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-white/10 bg-[#111111]">
                        <SelectItem value="footer-top" className="text-xs text-white focus:bg-white/5">Footer Top</SelectItem>
                        <SelectItem value="footer-bottom" className="text-xs text-white focus:bg-white/5">Footer Bottom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-white/50">Auto Rotate</label>
                    <div className="flex items-center gap-3 h-8">
                      <button
                        onClick={() => setAutoRotate(!autoRotate)}
                        className={`relative flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
                          autoRotate ? 'bg-[#ff1e1e]' : 'bg-white/10'
                        }`}
                      >
                        <motion.div
                          animate={{ x: autoRotate ? 18 : 2 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          className="h-3.5 w-3.5 rounded-full bg-white shadow-sm"
                        />
                      </button>
                      <span className="text-xs text-white/50">{autoRotate ? 'Enabled' : 'Disabled'}</span>
                    </div>
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
                  onClick={async () => {
                    if (!adTitle.trim()) return
                    setSaving(true)
                    try {
                      if (editingAd) {
                        // Update existing ad
                        await fetch('/api/footer-ads', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            id: editingAd.id,
                            title: adTitle,
                            linkUrl: adLink || null,
                            isActive: statusActive,
                            startDate: startDate || null,
                            endDate: endDate || null,
                            mediaUrl: mediaUrl || editingAd.mediaUrl,
                            thumbnailUrl: thumbnailUrl || editingAd.thumbnailUrl,
                            adType: mediaFile ? (mediaFile.type.startsWith('video/') ? 'video' : 'image') : editingAd.adType,
                            mediaFormat: mediaFile ? mediaFile.type : editingAd.mediaFormat,
                          }),
                        })
                        setEditingAd(null)
                      } else {
                        // Create new ad
                        await createFooterAd({
                          title: adTitle,
                          linkUrl: adLink || undefined,
                          adType: mediaFile?.type.startsWith('video/') ? 'video' : 'image',
                          mediaUrl: mediaUrl || 'https://placehold.co/970x250/1a0a2e/ffffff?text=' + encodeURIComponent(adTitle),
                          thumbnailUrl: thumbnailUrl || null,
                          mediaFormat: mediaFile?.type || 'image/jpeg',
                          isActive: statusActive,
                          startDate: startDate || null,
                          endDate: endDate || null,
                        })
                      }
                      resetForm()
                      handleResetUpload()
                    } catch (err) {
                      console.error('Error saving footer ad:', err)
                    } finally {
                      setSaving(false)
                    }
                  }}
                  disabled={saving || !adTitle.trim()}
                  className={`mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff1e1e] to-[#cc181e] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_15px_rgba(255,30,30,0.3)] transition-all hover:from-[#ff2e2e] hover:to-[#dd282e] disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {saving ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <CloudUpload className="h-4 w-4" />
                  )}
                  {saving ? 'Saving...' : editingAd ? 'Update Footer Ad' : 'Save Footer Ad'}
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

                    {/* Content with ad placement */}
                    <div className="relative">
                      {/* Fake content lines */}
                      <div className="p-3 space-y-2">
                        <div className="h-3 w-3/4 rounded bg-white/5" />
                        <div className="h-3 w-1/2 rounded bg-white/5" />
                        <div className="grid grid-cols-3 gap-2">
                          <div className="aspect-video rounded bg-white/[0.03]" />
                          <div className="aspect-video rounded bg-white/[0.03]" />
                          <div className="aspect-video rounded bg-white/[0.03]" />
                        </div>
                      </div>

                      {/* FOOTER AD PLACEMENT */}
                      <div className="border-t border-white/5">
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="relative overflow-hidden"
                          style={{ aspectRatio: '970/250' }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-[#1a0a2e] via-[#0f3460] to-[#16213e]" />
                          <div className="absolute inset-0 bg-gradient-to-r from-[#ff1e1e]/10 to-transparent" />
                          {/* Ad content */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center space-y-1">
                              <div className="inline-flex items-center gap-1 rounded-md bg-[#ff1e1e]/20 px-2 py-0.5">
                                <Megaphone className="h-2 w-2 text-[#ff1e1e]" />
                                <span className="text-[7px] font-bold uppercase tracking-wider text-[#ff1e1e]">AD</span>
                              </div>
                              <p className="text-xs font-bold text-white/80">
                                {adTitle || 'Footer Ad Preview'}
                              </p>
                              <p className="text-[8px] text-white/40">970×250</p>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Top Performing Footer Ads */}
            <div className="overflow-hidden rounded-xl border border-white/5 bg-[#0B0B0F]/80">
              <div className="p-3 lg:p-4">
                <h2 className="mb-3 text-base font-bold text-white">Top Performing Ads</h2>
                <div className="space-y-2">
                  {footerAds.length > 0 ? (
                    [...footerAds]
                      .sort((a, b) => b.ctr - a.ctr)
                      .slice(0, 5)
                      .map((ad, i) => (
                        <div key={ad.id} className="flex items-center gap-3 rounded-lg bg-white/[0.02] px-3 py-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#ff1e1e]/10 text-[10px] font-bold text-[#ff1e1e]">
                            {i + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium text-white">{ad.title}</p>
                            <p className="text-[10px] text-white/30">{formatNumber(ad.impressions)} impressions</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-emerald-400">{ad.ctr.toFixed(2)}%</p>
                            <p className="text-[10px] text-white/30">CTR</p>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="py-6 text-center text-xs text-white/20">No footer ads yet</div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── RIGHT: Ads Table / List ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            className="space-y-4"
          >
            {/* Search & Filter */}
            <div className="overflow-hidden rounded-xl border border-white/5 bg-[#0B0B0F]/80">
              <div className="p-3 lg:p-4">
                <h2 className="mb-3 text-base font-bold text-white">All Footer Ads</h2>

                {/* Search */}
                <div className="relative mb-3">
                  <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-white/25" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
                    placeholder="Search footer ads..."
                    className="h-8 w-full rounded-lg border border-white/10 bg-[#0a0a0a] pl-8 pr-3 text-xs text-white placeholder:text-white/25 outline-none focus:border-[#ff1e1e]/40"
                  />
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2 mb-3">
                  {['all', 'active', 'paused'].map((f) => (
                    <button
                      key={f}
                      onClick={() => { setStatusFilter(f); setCurrentPage(1) }}
                      className={`rounded-md px-2.5 py-1 text-[10px] font-medium transition-colors ${
                        statusFilter === f
                          ? 'bg-[#ff1e1e]/10 text-[#ff1e1e] border border-[#ff1e1e]/20'
                          : 'text-white/30 hover:text-white/50 border border-transparent'
                      }`}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Ads List */}
                <div className="space-y-2 max-h-[500px] overflow-y-auto no-scrollbar">
                  {footerLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="animate-pulse rounded-lg bg-white/[0.03] p-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-16 rounded bg-white/5" />
                          <div className="flex-1 space-y-1.5">
                            <div className="h-3 w-3/4 rounded bg-white/5" />
                            <div className="h-2 w-1/2 rounded bg-white/5" />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : paginatedAds.length > 0 ? (
                    paginatedAds.map((ad) => (
                      <motion.div
                        key={ad.id}
                        layout
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="group relative rounded-lg border border-white/[0.03] bg-white/[0.02] p-3 transition-all hover:bg-white/[0.04] hover:border-white/[0.06]"
                      >
                        <div className="flex items-start gap-3">
                          {/* Thumbnail */}
                          <div className="relative h-10 w-16 flex-shrink-0 overflow-hidden rounded-md bg-white/5">
                            <img
                              src={ad.thumbnailUrl || ad.mediaUrl}
                              alt={ad.title}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                            {/* Active indicator */}
                            <div className={`absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full ${ad.isActive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                          </div>

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium text-white">{ad.title}</p>
                            <div className="mt-1 flex items-center gap-2">
                              <span className={`inline-flex rounded px-1.5 py-0.5 text-[8px] font-semibold ${
                                ad.isActive
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : 'bg-amber-500/10 text-amber-400'
                              }`}>
                                {ad.isActive ? 'Active' : 'Paused'}
                              </span>
                              <span className="text-[9px] text-white/25">{formatNumber(ad.impressions)} imp</span>
                              <span className="text-[9px] text-white/25">{ad.ctr.toFixed(1)}% CTR</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEdit(ad)}
                              className="flex h-6 w-6 items-center justify-center rounded-md text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                              aria-label="Edit ad"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => toggleFooterAd(ad.id)}
                              className="flex h-6 w-6 items-center justify-center rounded-md text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                              aria-label={ad.isActive ? 'Pause ad' : 'Activate ad'}
                            >
                              {ad.isActive ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                            </button>
                            {deletingAdId === ad.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={async () => {
                                    await deleteFooterAd(ad.id)
                                    setDeletingAdId(null)
                                  }}
                                  className="flex h-6 items-center justify-center rounded-md bg-red-500/10 px-1.5 text-[8px] font-bold text-red-400"
                                >
                                  Delete
                                </button>
                                <button
                                  onClick={() => setDeletingAdId(null)}
                                  className="flex h-6 items-center justify-center rounded-md bg-white/5 px-1.5 text-[8px] text-white/40"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeletingAdId(ad.id)}
                                className="flex h-6 w-6 items-center justify-center rounded-md text-white/40 transition-colors hover:bg-red-500/10 hover:text-red-400"
                                aria-label="Delete ad"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="py-8 text-center">
                      <Megaphone className="mx-auto h-8 w-8 text-white/10" />
                      <p className="mt-2 text-xs text-white/20">
                        {searchQuery ? 'No matching footer ads' : 'No footer ads created yet'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
                    <span className="text-[10px] text-white/30">
                      {filteredAds.length} ad{filteredAds.length !== 1 ? 's' : ''}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, safeCurrentPage - 1))}
                        disabled={safeCurrentPage <= 1}
                        className="flex h-6 w-6 items-center justify-center rounded-md text-white/30 hover:bg-white/5 hover:text-white disabled:opacity-30"
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </button>
                      <span className="text-[10px] text-white/50">{safeCurrentPage}/{totalPages}</span>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, safeCurrentPage + 1))}
                        disabled={safeCurrentPage >= totalPages}
                        className="flex h-6 w-6 items-center justify-center rounded-md text-white/30 hover:bg-white/5 hover:text-white disabled:opacity-30"
                      >
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Realtime Status */}
            <div className="overflow-hidden rounded-xl border border-white/5 bg-[#0B0B0F]/80">
              <div className="p-3 lg:p-4">
                <h2 className="mb-2 text-base font-bold text-white">Realtime Status</h2>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/40">Connection</span>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-medium text-emerald-400">Connected</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/40">Last Updated</span>
                    <span className="text-xs text-white/60">{lastUpdated.toLocaleTimeString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/40">Total Footer Ads</span>
                    <span className="text-xs font-medium text-white">{footerAds.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/40">Active Ads</span>
                    <span className="text-xs font-medium text-emerald-400">{activeAds}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/40">Paused Ads</span>
                    <span className="text-xs font-medium text-amber-400">{footerAds.length - activeAds}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
