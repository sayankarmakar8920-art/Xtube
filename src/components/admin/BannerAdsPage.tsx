'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useAdsManager } from '@/hooks/useAdsManager'
import { motion, AnimatePresence } from 'framer-motion'
import { uploadFile } from '@/lib/storage/upload-helper'
import { extractVideoMetadataAndThumbnail } from '@/lib/storage/thumbnail-helper'
import { toast } from 'sonner'
import {
  Play,
  Pause,
  Volume2,
  Settings,
  Maximize,
  CloudUpload,
  Upload,
  Trash2,
  CheckCircle2,
  Film,
  Megaphone,
  Eye,
  TrendingUp,
  DollarSign,
  MousePointer,
  Clock,
  AlertCircle,
  Image as ImageIcon,
  BarChart3,
  Pencil,
  Copy,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Radio,
  X,
  Bell,
  Timer,
  Monitor,
  Smartphone,
  Tablet,
  LayoutGrid,
  Type,
  Sparkles,
  Zap,
  Target,
  Calendar,
  Link2,
  ToggleLeft,
  ImagePlus,
  Maximize2,
  RectangleHorizontal,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

// ─── Types ───────────────────────────────────────────────────────────────────

type UploadStage = 'idle' | 'uploading' | 'processing' | 'success'
type AdTab = 'image' | 'video' | 'animated'
type PreviewMode = 'desktop' | 'tablet' | 'mobile'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toString()
}

function formatCurrency(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STAT_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#ec4899', '#f97316']
const DONUT_COLORS = ['#3b82f6', '#f97316']

const thumbnailGradients = [
  'from-blue-900/60 via-indigo-800/40 to-violet-900/30',
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

// donutData computed from real data inside component

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
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden rounded-xl border border-white/5 bg-[#0B0B0F]/80 p-3 lg:p-4 transition-all duration-300 hover:border-white/10 hover:shadow-lg"
    >
      {/* Top accent line */}
      <div className="absolute left-0 top-0 h-[2px] w-full" style={{ background: `linear-gradient(to right, ${color}, transparent)` }} />
      {/* Corner glow */}
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

export function BannerAdsPage() {
  // Real data from Supabase
  const { ads: realAds, loading: adsLoading, deleteAd, toggleAd, createAd, updateAd } = useAdsManager({ type: 'banner' })

  // Computed stats from real data
  const totalAds = realAds.length
  const activeAds = realAds.filter(a => a.isActive).length
  const totalImpressions = realAds.reduce((s, a) => s + a.impressions, 0)
  const totalClicks = realAds.reduce((s, a) => s + a.clicks, 0)
  const totalRevenue = realAds.reduce((s, a) => s + a.revenue, 0)
  const overallCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) + '%' : '0%'

  const donutData = useMemo(() => {
    const activeImpressions = realAds.filter(a => a.isActive).reduce((s, a) => s + a.impressions, 0)
    const pausedImpressions = realAds.filter(a => !a.isActive).reduce((s, a) => s + a.impressions, 0)
    return [
      { name: 'Active Banners', value: activeImpressions || 1 },
      { name: 'Paused Banners', value: pausedImpressions || 0 },
    ]
  }, [realAds])

  // Upload state
  const [uploadStage, setUploadStage] = useState<UploadStage>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadSpeed, setUploadSpeed] = useState('0 MB/s')
  const [uploadRemaining, setUploadRemaining] = useState('')
  const [uploadedSize, setUploadedSize] = useState('0 GB')
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedThumbnail, setSelectedThumbnail] = useState(0)
  const [adTab, setAdTab] = useState<AdTab>('image')

  // Banner settings state
  const [bannerName, setBannerName] = useState('')
  const [bannerLink, setBannerLink] = useState('')
  const [bannerSize, setBannerSize] = useState('970x250')
  const [bannerPosition, setBannerPosition] = useState('top-header')
  const [deviceDesktop, setDeviceDesktop] = useState(true)
  const [deviceTablet, setDeviceTablet] = useState(true)
  const [deviceMobile, setDeviceMobile] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [statusActive, setStatusActive] = useState(true)

  // Preview state
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop')

  // Table state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Real Upload states
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaUrl, setMediaUrl] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingAd, setEditingAd] = useState<AdItem | null>(null)

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

  // ─── Reset Form ────────────────────────────────────────────────────────

  const resetForm = useCallback(() => {
    setBannerName('')
    setBannerLink('')
    setBannerSize('970x250')
    setBannerPosition('top-header')
    setDeviceDesktop(true)
    setDeviceTablet(true)
    setDeviceMobile(true)
    setStartDate('')
    setEndDate('')
    setStatusActive(true)
    setEditingAd(null)
    handleResetUpload()
  }, [handleResetUpload])

  // ─── Edit Callback ─────────────────────────────────────────────────────

  const handleEdit = useCallback((ad: AdItem) => {
    setEditingAd(ad)
    setBannerName(ad.title)
    setBannerLink(ad.linkUrl || '')
    setBannerPosition(ad.position)
    setStartDate(ad.startDate ? ad.startDate.split('T')[0] : '')
    setEndDate(ad.endDate ? ad.endDate.split('T')[0] : '')
    setStatusActive(ad.isActive)
    setMediaUrl(ad.mediaUrl || '')
    setThumbnailUrl(ad.imageUrl || '')
    setUploadStage('success')
  }, [])

  // ─── Save Callback ─────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!bannerName.trim()) {
      toast.error('Please enter a banner name')
      return
    }
    if (!mediaUrl && !editingAd) {
      toast.error('Please upload a banner ad image or video first')
      return
    }
    setSaving(true)
    try {
      const isVideo = mediaFile ? mediaFile.type.startsWith('video/') : (mediaUrl ? mediaUrl.endsWith('.mp4') : false)
      const targetFormat = isVideo ? 'mp4' : 'jpg'
      const adData = {
        type: 'banner',
        position: bannerPosition,
        title: bannerName,
        imageUrl: thumbnailUrl || mediaUrl || '',
        mediaUrl: mediaUrl || '',
        mediaFormat: targetFormat,
        linkUrl: bannerLink || null,
        startDate: startDate ? new Date(startDate).toISOString() : null,
        endDate: endDate ? new Date(endDate).toISOString() : null,
        isActive: statusActive,
        frequency: 1,
      }

      let success = false
      if (editingAd) {
        success = await updateAd(editingAd.id, adData)
      } else {
        success = await createAd(adData)
      }

      if (success) {
        resetForm()
      }
    } catch (err) {
      console.error('Error saving banner ad:', err)
      toast.error('Failed to save banner ad')
    } finally {
      setSaving(false)
    }
  }, [bannerName, mediaUrl, mediaFile, bannerPosition, thumbnailUrl, bannerLink, startDate, endDate, statusActive, editingAd, updateAd, createAd, resetForm])

  // ─── Filtered Ads ──────────────────────────────────────────────────────

  const filteredAds = realAds.filter((ad) => {
    const statusStr = ad.isActive ? 'active' : 'paused'
    if (statusFilter !== 'all' && statusStr !== statusFilter) return false
    if (searchQuery && !ad.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  }).map((ad, idx) => {
    const isVideo = ad.mediaFormat === 'mp4' || ad.mediaFormat === 'webm' || ad.mediaFormat === 'mov'
    const isAnimated = ad.mediaFormat === 'gif'
    const typeLabel = isVideo ? 'Video' : (isAnimated ? 'Animated' : 'Image')
    const ctrValue = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) + '%' : '0.00%'

    return {
      ...ad,
      name: ad.title,
      type: typeLabel,
      size: ad.imageUrl && ad.imageUrl.includes('x') ? ad.imageUrl.split('_').pop()?.split('.')[0] || '970x250' : '970x250',
      status: ad.isActive ? 'Active' : 'Paused',
      ctr: ctrValue,
      gradient: thumbnailGradients[idx % thumbnailGradients.length],
    }
  })

  const statusStyles: Record<string, string> = {
    Active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Paused: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Draft: 'bg-white/5 text-white/40 border-white/10',
  }

  const typeStyles: Record<string, string> = {
    Image: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Video: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    Animated: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  }

  // ─── Get accept types ──────────────────────────────────────────────────

  const getAcceptTypes = () => {
    if (adTab === 'image') return 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml'
    if (adTab === 'video') return 'video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.avi,.mkv'
    return 'image/gif,image/webp,video/mp4,video/webm'
  }

  const getSupportedText = () => {
    if (adTab === 'image') return 'Max size: 5GB | JPG, PNG, GIF, WEBP, SVG'
    if (adTab === 'video') return 'Max size: 5GB | Supported: MP4, WebM, MOV, AVI, MKV'
    return 'Max size: 5GB | GIF, WebP, MP4, WebM'
  }

  const getTabLabel = () => {
    if (adTab === 'image') return 'image banner'
    if (adTab === 'video') return 'video banner'
    return 'animated banner'
  }

  // ─── Preview container width ───────────────────────────────────────────

  const getPreviewWidth = () => {
    if (previewMode === 'desktop') return '100%'
    if (previewMode === 'tablet') return '75%'
    return '50%'
  }

  return (
    <motion.div
      initial={{ opacity: 1, y: 0 }}
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
              <RectangleHorizontal className="h-5 w-5 text-[#ff1e1e]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white md:text-2xl">Banner Ads</h1>
              <p className="mt-0.5 text-sm text-white/40">Create and manage banner ads for your platform</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Date range picker */}
            <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0B0B0F]/60 px-3 py-2 text-xs font-medium text-white/60 transition-colors hover:border-white/20 hover:text-white">
              <Clock className="h-3.5 w-3.5" />
              May 10 – Jun 10, 2025
            </button>
            {/* Export */}
            <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0B0B0F]/60 px-3 py-2 text-xs font-medium text-white/60 transition-colors hover:border-white/20 hover:text-white">
              <Upload className="h-3.5 w-3.5" />
              Export Report
            </button>
            {/* Notification bell */}
            <button className="relative flex items-center gap-2 rounded-xl border border-white/10 bg-[#0B0B0F]/60 px-2.5 py-2 text-white/60 transition-colors hover:border-white/20 hover:text-white">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#ff1e1e] text-[8px] font-bold text-white">5</span>
            </button>
            {/* Admin avatar */}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#ff1e1e] to-red-700 shadow-[0_0_12px_rgba(255,30,30,0.3)]">
              <span className="text-xs font-bold text-white">A</span>
            </div>
            {/* Create button */}
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: '0 0 25px rgba(255,30,30,0.4)' }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff1e1e] to-[#cc181e] px-4 py-2 text-sm font-semibold text-white shadow-[0_0_15px_rgba(255,30,30,0.3)] transition-all hover:from-[#ff2e2e] hover:to-[#dd282e]"
            >
              <CloudUpload className="h-4 w-4" />
              Create Banner Ad
            </motion.button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            TOP ANALYTICS CARDS (5 cards)
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard title="Total Banner Ads" value={String(totalAds)} change={totalAds > 0 ? '+' + totalAds : '0'} icon={Megaphone} color={STAT_COLORS[0]} delay={0} index={0} />
          <StatCard title="Active Ads" value={String(activeAds)} change={activeAds > 0 ? '+' + activeAds : '0'} icon={Radio} color={STAT_COLORS[1]} delay={0.05} index={1} />
          <StatCard title="Impressions" value={formatNumber(totalImpressions)} change={totalImpressions > 0 ? '+' + formatNumber(totalImpressions) : '0'} icon={Eye} color={STAT_COLORS[2]} delay={0.1} index={2} />
          <StatCard title="CTR" value={overallCtr} change={overallCtr !== '0%' ? '+' + overallCtr : '0'} icon={MousePointer} color={STAT_COLORS[3]} delay={0.15} index={3} />
          <StatCard title="Revenue" value={formatCurrency(totalRevenue)} change={totalRevenue > 0 ? '+' + formatCurrency(totalRevenue) : '0'} icon={DollarSign} color={STAT_COLORS[4]} delay={0.2} index={4} />
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            THREE COLUMN LAYOUT
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr_300px] 2xl:grid-cols-[1fr_1fr_340px]">
          {/* ── LEFT: Create Banner Ad ── */}
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-xl border border-white/5 bg-[#0B0B0F]/80"
          >
            <div className="p-3 lg:p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-bold text-white">Create Banner Ad</h2>
                {uploadStage === 'success' && (
                  <button onClick={handleResetUpload} className="text-xs text-[#ff1e1e] hover:text-[#ff3e3e]">Reset</button>
                )}
              </div>

              {/* Tabs: Image Banner / Video Upload / Animated Banner */}
              <div className="mb-4 flex items-center gap-0 border-b border-white/5">
                <button
                  onClick={() => setAdTab('image')}
                  className={`relative flex items-center gap-2 px-3 pb-2.5 text-sm font-medium transition-colors ${
                    adTab === 'image' ? 'text-white' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  Image
                  {adTab === 'image' && (
                    <motion.div
                      layoutId="banner-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[#ff1e1e]"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
                <button
                  onClick={() => setAdTab('video')}
                  className={`relative flex items-center gap-2 px-3 pb-2.5 text-sm font-medium transition-colors ${
                    adTab === 'video' ? 'text-white' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  <Film className="h-3.5 w-3.5" />
                  Video Upload
                  {adTab === 'video' && (
                    <motion.div
                      layoutId="banner-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[#ff1e1e]"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
                <button
                  onClick={() => setAdTab('animated')}
                  className={`relative flex items-center gap-2 px-3 pb-2.5 text-sm font-medium transition-colors ${
                    adTab === 'animated' ? 'text-white' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Animated
                  {adTab === 'animated' && (
                    <motion.div
                      layoutId="banner-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[#ff1e1e]"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              </div>

              {/* Upload Area */}
              <AnimatePresence mode="wait">
                {uploadStage === 'idle' ? (
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
                      accept={getAcceptTypes()}
                      className="hidden"
                      onChange={(e) => { if (e.target.files?.length) handleFileProcess(e.target.files[0]) }}
                    />
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ff1e1e]/10">
                      <CloudUpload className="h-6 w-6 text-[#ff1e1e]" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-white">
                        Drag &amp; drop your {getTabLabel()} here
                      </p>
                      <p className="mt-1 text-xs text-white/40">
                        or <span className="text-[#ff1e1e] underline underline-offset-2">browse files</span>
                      </p>
                    </div>
                    <p className="text-[10px] text-white/25">{getSupportedText()}</p>
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
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-white">
                          {uploadStage === 'processing' ? 'Processing...' : 'Uploading...'}
                        </span>
                      </div>
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
                        <p className="truncate text-xs font-medium text-white">Banner_Ad_Design.jpg</p>
                        <p className="text-[10px] text-white/30">2.25MB • 970×250 • JPG</p>
                      </div>
                      <button onClick={handleResetUpload} className="text-xs text-[#ff1e1e] hover:text-[#ff3e3e]">Change</button>
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
                        <span>16:9</span>
                        <span>1:1</span>
                        <span>9:16</span>
                        <span>970×250</span>
                        <span>728×90</span>
                        <span>300×250</span>
                        <span className="text-[#ff1e1e] cursor-pointer">Crop</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Banner Settings */}
              <div className="mt-4 space-y-3 border-t border-white/5 pt-4">
                <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">Banner Settings</h3>

                {/* Banner Name + Link */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-white/50">Banner Name</label>
                    <input
                      type="text"
                      value={bannerName}
                      onChange={(e) => setBannerName(e.target.value)}
                      placeholder="Enter banner name"
                      className="h-8 w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 text-xs text-white placeholder:text-white/25 outline-none focus:border-[#ff1e1e]/40"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-white/50">Banner Link</label>
                    <div className="relative">
                      <input
                        type="url"
                        value={bannerLink}
                        onChange={(e) => setBannerLink(e.target.value)}
                        placeholder="https://example.com"
                        className="h-8 w-full rounded-lg border border-white/10 bg-[#0a0a0a] pl-8 pr-3 text-xs text-white placeholder:text-white/25 outline-none focus:border-[#ff1e1e]/40"
                      />
                      <Link2 className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-white/25" />
                    </div>
                  </div>
                </div>

                {/* Banner Size + Position */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-white/50">Banner Size</label>
                    <Select value={bannerSize} onValueChange={setBannerSize}>
                      <SelectTrigger className="h-8 w-full rounded-lg border-white/10 bg-[#0a0a0a] text-xs text-white/70 [&_svg]:text-white/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-white/10 bg-[#111111]">
                        <SelectItem value="970x250" className="text-xs text-white focus:bg-white/5">970×250 (Leaderboard)</SelectItem>
                        <SelectItem value="728x90" className="text-xs text-white focus:bg-white/5">728×90 (Banner)</SelectItem>
                        <SelectItem value="300x250" className="text-xs text-white focus:bg-white/5">300×250 (Medium Rect)</SelectItem>
                        <SelectItem value="320x50" className="text-xs text-white focus:bg-white/5">320×50 (Mobile)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-white/50">Position</label>
                    <Select value={bannerPosition} onValueChange={setBannerPosition}>
                      <SelectTrigger className="h-8 w-full rounded-lg border-white/10 bg-[#0a0a0a] text-xs text-white/70 [&_svg]:text-white/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-white/10 bg-[#111111]">
                        <SelectItem value="top-header" className="text-xs text-white focus:bg-white/5">Top Header</SelectItem>
                        <SelectItem value="middle-content" className="text-xs text-white focus:bg-white/5">Middle Content</SelectItem>
                        <SelectItem value="bottom-footer" className="text-xs text-white focus:bg-white/5">Bottom Footer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Device Targeting */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-white/50">Device Targeting</label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={deviceDesktop}
                        onCheckedChange={(checked) => setDeviceDesktop(checked as boolean)}
                        className="border-white/20 data-[state=checked]:bg-[#ff1e1e] data-[state=checked]:border-[#ff1e1e]"
                      />
                      <Monitor className="h-3.5 w-3.5 text-white/30" />
                      <span className="text-xs text-white/50">Desktop</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={deviceTablet}
                        onCheckedChange={(checked) => setDeviceTablet(checked as boolean)}
                        className="border-white/20 data-[state=checked]:bg-[#ff1e1e] data-[state=checked]:border-[#ff1e1e]"
                      />
                      <Tablet className="h-3.5 w-3.5 text-white/30" />
                      <span className="text-xs text-white/50">Tablet</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={deviceMobile}
                        onCheckedChange={(checked) => setDeviceMobile(checked as boolean)}
                        className="border-white/20 data-[state=checked]:bg-[#ff1e1e] data-[state=checked]:border-[#ff1e1e]"
                      />
                      <Smartphone className="h-3.5 w-3.5 text-white/30" />
                      <span className="text-xs text-white/50">Mobile</span>
                    </label>
                  </div>
                </div>

                {/* Schedule Start/End Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-white/50">Start Date</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="h-8 w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 text-xs text-white/70 outline-none focus:border-[#ff1e1e]/40 [color-scheme:dark]"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-white/50">End Date</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="h-8 w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 text-xs text-white/70 outline-none focus:border-[#ff1e1e]/40 [color-scheme:dark]"
                      />
                    </div>
                  </div>
                </div>

                {/* Status Toggle */}
                <div className="flex items-center justify-between rounded-lg bg-[#0a0a0a]/50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5 text-white/30" />
                    <span className="text-xs text-white/50">Status</span>
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
                  onClick={handleSave}
                  disabled={saving || uploadStage === 'uploading' || uploadStage === 'processing'}
                  whileHover={{ scale: 1.02, boxShadow: '0 0 25px rgba(255,30,30,0.4)' }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff1e1e] to-[#cc181e] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_15px_rgba(255,30,30,0.3)] transition-all hover:from-[#ff2e2e] hover:to-[#dd282e] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <CloudUpload className="h-4 w-4" />
                  )}
                  {saving ? 'Saving...' : editingAd ? 'Update Banner Ad' : 'Save Banner Ad'}
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* ── CENTER: Banner Preview ── */}
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="overflow-hidden rounded-xl border border-white/5 bg-[#0B0B0F]/80">
              <div className="p-3 lg:p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-bold text-white">Banner Preview</h2>
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

                {/* Preview Area with device frame */}
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

                    {/* Banner placement preview */}
                    <div className="p-2 space-y-2">
                      {/* Top banner placement */}
                      {bannerPosition === 'top-header' && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="relative overflow-hidden rounded border border-[#ff1e1e]/20"
                          style={{ aspectRatio: bannerSize === '970x250' ? '970/250' : bannerSize === '728x90' ? '728/90' : bannerSize === '300x250' ? '300/250' : '320/50' }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a3e] via-[#16213e] to-[#0f3460]" />
                          <div className="absolute inset-0 flex items-center justify-center gap-3 p-3">
                            <div className="text-center">
                              <div className="text-[8px] font-bold tracking-[0.15em] text-white/30 uppercase">Summer Sale</div>
                              <p className="text-sm font-bold text-white">UP TO 50% OFF</p>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="mt-1 rounded bg-[#ff1e1e] px-3 py-0.5 text-[8px] font-bold text-white"
                              >
                                SHOP NOW
                              </motion.button>
                            </div>
                          </div>
                          <div className="absolute top-1 right-1 rounded bg-black/40 px-1 text-[6px] text-white/40">Ad</div>
                        </motion.div>
                      )}

                      {/* Fake content blocks */}
                      <div className="space-y-1.5">
                        <div className="h-2 w-3/4 rounded bg-white/5" />
                        <div className="h-2 w-full rounded bg-white/3" />
                        <div className="h-2 w-2/3 rounded bg-white/3" />
                      </div>

                      {/* Middle banner placement */}
                      {bannerPosition === 'middle-content' && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="relative overflow-hidden rounded border border-[#ff1e1e]/20"
                          style={{ aspectRatio: bannerSize === '970x250' ? '970/250' : bannerSize === '728x90' ? '728/90' : bannerSize === '300x250' ? '300/250' : '320/50' }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-[#1a2a3e] via-[#16213e] to-[#0f3460]" />
                          <div className="absolute inset-0 flex items-center justify-center gap-3 p-3">
                            <div className="text-center">
                              <div className="text-[8px] font-bold tracking-[0.15em] text-white/30 uppercase">New Collection</div>
                              <p className="text-sm font-bold text-white">FASHION WEEK 2025</p>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="mt-1 rounded bg-white px-3 py-0.5 text-[8px] font-bold text-black"
                              >
                                EXPLORE
                              </motion.button>
                            </div>
                          </div>
                          <div className="absolute top-1 right-1 rounded bg-black/40 px-1 text-[6px] text-white/40">Ad</div>
                        </motion.div>
                      )}

                      <div className="grid grid-cols-3 gap-1">
                        <div className="aspect-video rounded bg-white/3" />
                        <div className="aspect-video rounded bg-white/3" />
                        <div className="aspect-video rounded bg-white/3" />
                      </div>

                      {/* Bottom banner placement */}
                      {bannerPosition === 'bottom-footer' && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="relative overflow-hidden rounded border border-[#ff1e1e]/20"
                          style={{ aspectRatio: bannerSize === '970x250' ? '970/250' : bannerSize === '728x90' ? '728/90' : bannerSize === '300x250' ? '300/250' : '320/50' }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-[#1a3a2e] via-[#163e21] to-[#0f6034]" />
                          <div className="absolute inset-0 flex items-center justify-center gap-3 p-3">
                            <div className="text-center">
                              <div className="text-[8px] font-bold tracking-[0.15em] text-white/30 uppercase">Electronics</div>
                              <p className="text-sm font-bold text-white">MEGA DEALS</p>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="mt-1 rounded bg-[#ff1e1e] px-3 py-0.5 text-[8px] font-bold text-white"
                              >
                                BUY NOW
                              </motion.button>
                            </div>
                          </div>
                          <div className="absolute top-1 right-1 rounded bg-black/40 px-1 text-[6px] text-white/40">Ad</div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* Banner Details */}
                <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
                  {[
                    { label: 'File Name', value: 'Banner_Ad_Design.jpg' },
                    { label: 'Banner Size', value: '970×250' },
                    { label: 'File Size', value: '2.25 MB' },
                    { label: 'Format', value: 'JPG' },
                    { label: 'Position', value: 'Top Header' },
                    { label: 'Display On', value: 'All Pages' },
                    { label: 'Start Date', value: 'Jun 15, 2025' },
                    { label: 'End Date', value: 'Jul 15, 2025' },
                  ].map((detail) => (
                    <div key={detail.label} className="flex items-center justify-between rounded-lg bg-[#0a0a0a]/50 px-3 py-1.5">
                      <span className="text-[10px] text-white/30">{detail.label}</span>
                      <span className="text-[10px] font-medium text-white/70 truncate ml-2">{detail.value}</span>
                    </div>
                  ))}
                </div>

                {/* Status indicator */}
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[10px] text-white/30">Status:</span>
                  <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium ${
                    statusActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${statusActive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    {statusActive ? 'Active' : 'Paused'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── RIGHT: Quick Actions + Performance ── */}
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Quick Actions */}
            <div className="overflow-hidden rounded-xl border border-white/5 bg-[#0B0B0F]/80">
              <div className="p-3 lg:p-4">
                <h2 className="mb-4 text-base font-bold text-white">Quick Actions</h2>
                <div className="space-y-2.5">
                  {[
                    { icon: ImageIcon, label: 'Create Image Banner', desc: 'Upload image banners up to 5GB', color: '#3b82f6', glowColor: 'rgba(59,130,246,0.15)', bgColor: 'from-blue-500/10 to-blue-600/5' },
                    { icon: Film, label: 'Create Video Banner', desc: 'Upload video banners up to 5GB', color: '#8b5cf6', glowColor: 'rgba(139,92,246,0.15)', bgColor: 'from-purple-500/10 to-purple-600/5' },
                    { icon: Megaphone, label: 'Manage Banner Ads', desc: 'View, edit and manage ads', color: '#10b981', glowColor: 'rgba(16,185,129,0.15)', bgColor: 'from-emerald-500/10 to-emerald-600/5' },
                    { icon: BarChart3, label: 'Ad Performance', desc: 'View analytics and reports', color: '#8b5cf6', glowColor: 'rgba(139,92,246,0.15)', bgColor: 'from-purple-500/10 to-purple-600/5' },
                  ].map((action) => (
                    <motion.button
                      key={action.label}
                      whileHover={{ scale: 1.02, x: 2, boxShadow: `0 0 15px ${action.glowColor}` }}
                      whileTap={{ scale: 0.98 }}
                      className={`group flex w-full items-center gap-3 rounded-xl border border-white/5 bg-gradient-to-r ${action.bgColor} p-3 text-left transition-all hover:border-white/10`}
                    >
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: `${action.color}15` }}>
                        <action.icon className="h-4 w-4" style={{ color: action.color }} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-white">{action.label}</p>
                        <p className="text-[10px] text-white/30">{action.desc}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            {/* Banner Performance Overview */}
            <div className="overflow-hidden rounded-xl border border-white/5 bg-[#0B0B0F]/80">
              <div className="p-3 lg:p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-white">Banner Performance Overview</h2>
                  <button className="text-[10px] text-white/30 hover:text-white/50">Last 30 Days</button>
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
                        6.42M
                      </text>
                      <text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle" className="fill-white/30 text-[8px]">
                        Impressions
                      </text>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null
                          const d = payload[0]
                          const total = donutData.reduce((s, e) => s + e.value, 0)
                          const pct = ((d.value as number) / total * 100).toFixed(0)
                          return (
                            <div className="rounded-lg border border-white/10 bg-[#111111]/95 px-3 py-2 shadow-xl">
                              <p className="text-xs font-semibold text-white">{d.name}</p>
                              <p className="text-[10px] text-white/40">{(d.value as number).toLocaleString()} ({pct}%)</p>
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
                    const total = donutData.reduce((s, e) => s + e.value, 0)
                    const pct = ((item.value / total) * 100).toFixed(0)
                    return (
                      <div key={item.name} className="flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ background: DONUT_COLORS[i] }} />
                          <span className="text-white/50">{item.name}</span>
                        </div>
                        <span className="font-medium text-white/70">{pct}% • {(item.value / 1000000).toFixed(2)}M</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            BANNER ADS LIST TABLE
            ═══════════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-xl border border-white/5 bg-[#0B0B0F]/80"
        >
          <div className="p-3 lg:p-4">
            {/* Table header */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-base font-bold text-white">Banner Ads List</h2>
              <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1) }}>
                  <SelectTrigger className="h-8 w-28 rounded-lg border-white/10 bg-[#0a0a0a] text-xs text-white/60 [&_svg]:text-white/30">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#111111]">
                    <SelectItem value="all" className="text-xs text-white focus:bg-white/5">All Status</SelectItem>
                    <SelectItem value="active" className="text-xs text-white focus:bg-white/5">Active</SelectItem>
                    <SelectItem value="paused" className="text-xs text-white focus:bg-white/5">Paused</SelectItem>
                    <SelectItem value="draft" className="text-xs text-white focus:bg-white/5">Draft</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
                    placeholder="Search banners..."
                    className="h-8 w-40 rounded-lg border border-white/10 bg-[#0a0a0a] pl-8 pr-3 text-xs text-white placeholder:text-white/25 outline-none focus:border-[#ff1e1e]/40"
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Preview', 'Banner Name', 'Type', 'Size', 'Position', 'Impressions', 'CTR', 'Revenue', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="pb-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-white/25">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredAds.map((ad, i) => (
                    <motion.tr
                      key={ad.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.45 + i * 0.04, duration: 0.3 }}
                      className="group transition-colors hover:bg-white/[0.02]"
                    >
                      {/* Preview */}
                      <td className="py-2 pr-3">
                        <div className="relative h-8 w-20 overflow-hidden rounded-lg">
                          <div className={`absolute inset-0 bg-gradient-to-br ${ad.gradient}`} />
                          <div className="absolute inset-0 flex items-center justify-center">
                            {ad.type === 'Image' ? (
                              <ImageIcon className="h-3 w-3 text-white/20" />
                            ) : ad.type === 'Video' ? (
                              <Film className="h-3 w-3 text-white/20" />
                            ) : (
                              <Sparkles className="h-3 w-3 text-white/20" />
                            )}
                          </div>
                          <div className="absolute top-0.5 right-0.5 rounded bg-black/50 px-0.5 text-[5px] text-white/40">Ad</div>
                        </div>
                      </td>
                      {/* Banner Name */}
                      <td className="py-2 pr-3">
                        <p className="text-xs font-medium text-white">{ad.name}</p>
                      </td>
                      {/* Type */}
                      <td className="py-2 pr-3">
                        <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${typeStyles[ad.type]}`}>
                          {ad.type === 'Image' && <ImageIcon className="h-2.5 w-2.5" />}
                          {ad.type === 'Video' && <Film className="h-2.5 w-2.5" />}
                          {ad.type === 'Animated' && <Sparkles className="h-2.5 w-2.5" />}
                          {ad.type}
                        </span>
                      </td>
                      {/* Size */}
                      <td className="py-2 pr-3">
                        <span className="text-xs text-white/50">{ad.size}</span>
                      </td>
                      {/* Position */}
                      <td className="py-2 pr-3">
                        <span className="text-xs text-white/50">{ad.position}</span>
                      </td>
                      {/* Impressions */}
                      <td className="py-2 pr-3">
                        <span className="text-xs font-medium text-white/70">{ad.impressions}</span>
                      </td>
                      {/* CTR */}
                      <td className="py-2 pr-3">
                        <span className="text-xs font-medium text-white/70">{ad.ctr}</span>
                      </td>
                      {/* Revenue */}
                      <td className="py-2 pr-3">
                        <span className="text-xs font-semibold text-emerald-400">{ad.revenue}</span>
                      </td>
                      {/* Status */}
                      <td className="py-2 pr-3">
                        <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium ${statusStyles[ad.status]}`}>
                          {ad.status === 'Active' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
                          {ad.status === 'Paused' && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />}
                          {ad.status === 'Draft' && <span className="h-1.5 w-1.5 rounded-full bg-white/30" />}
                          {ad.status}
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
                            onClick={() => toggleAd(ad.id)}
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
                            onClick={() => { if (confirm('Delete this ad?')) deleteAd(ad.id) }}
                            className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-red-500/10 hover:text-red-400"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/30">Rows per page:</span>
                <Select value="10" onValueChange={() => {}}>
                  <SelectTrigger className="h-6 w-16 rounded border-white/10 bg-[#0a0a0a] text-[10px] text-white/50 [&_svg]:text-white/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#111111]">
                    <SelectItem value="10" className="text-[10px] text-white focus:bg-white/5">10</SelectItem>
                    <SelectItem value="25" className="text-[10px] text-white focus:bg-white/5">25</SelectItem>
                    <SelectItem value="50" className="text-[10px] text-white focus:bg-white/5">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-[10px] text-white/30">1–6 of 42</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                {[1, 2, 3, 4, 5].map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-[#ff1e1e] text-white'
                        : 'border border-white/10 text-white/40 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(Math.min(5, currentPage + 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
