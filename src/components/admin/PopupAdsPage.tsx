'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  MousePointerClick,
  LayoutGrid,
  Type,
  Move,
  XCircle,
  ChevronDown,
  Sparkles,
  Zap,
  Target,
  PieChart as PieChartIcon,
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
import { useAdsManager, type AdItem } from '@/hooks/useAdsManager'
import { uploadFile } from '@/lib/storage/upload-helper'
import { extractVideoMetadataAndThumbnail } from '@/lib/storage/thumbnail-helper'
import { toast } from 'sonner'

// ─── Types ───────────────────────────────────────────────────────────────────

type UploadStage = 'idle' | 'uploading' | 'processing' | 'success'
type AdTab = 'image' | 'video' | 'text'

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

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(2)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}

function formatCurrency(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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
      className="group relative overflow-hidden rounded-xl border border-white/5 bg-[#111111]/80 p-3 lg:p-4 transition-all duration-300 hover:border-white/10 hover:shadow-lg"
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

export function PopupAdsPage() {
  const { ads, loading, createAd, updateAd, deleteAd, toggleAd } = useAdsManager({ type: 'popup' })

  // Upload state
  const [uploadStage, setUploadStage] = useState<UploadStage>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadSpeed, setUploadSpeed] = useState('0 MB/s')
  const [uploadRemaining, setUploadRemaining] = useState('')
  const [uploadedSize, setUploadedSize] = useState('0 GB')
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedThumbnail, setSelectedThumbnail] = useState(0)
  const [adTab, setAdTab] = useState<AdTab>('image')
  const [isPlaying, setIsPlaying] = useState(false)

  // Popup settings state
  const [triggerType, setTriggerType] = useState('time-delay')
  const [timeDelay, setTimeDelay] = useState('5')
  const [displayFrequency, setDisplayFrequency] = useState('once-per-session')
  const [popupSize, setPopupSize] = useState('medium')
  const [popupPosition, setPopupPosition] = useState('center')
  const [closeButton, setCloseButton] = useState(true)
  const [deviceDesktop, setDeviceDesktop] = useState(true)
  const [deviceTablet, setDeviceTablet] = useState(true)
  const [deviceMobile, setDeviceMobile] = useState(false)

  // Table state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [popupVisible, setPopupVisible] = useState(true)
  const [newAdTitle, setNewAdTitle] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const createSectionRef = useRef<HTMLDivElement>(null)

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
    setNewAdTitle('')
    setTriggerType('time-delay')
    setTimeDelay('5')
    setDisplayFrequency('once-per-session')
    setPopupSize('medium')
    setPopupPosition('center')
    setCloseButton(true)
    setDeviceDesktop(true)
    setDeviceTablet(true)
    setDeviceMobile(false)
    setEditingAd(null)
    handleResetUpload()
  }, [handleResetUpload])

  // ─── Edit Callback ─────────────────────────────────────────────────────

  const handleEdit = useCallback((ad: AdItem) => {
    setEditingAd(ad)
    setNewAdTitle(ad.title)
    setPopupPosition(ad.position)
    setAdTab(ad.mediaFormat === 'mp4' ? 'video' : ad.mediaFormat === 'text' ? 'text' : 'image')
    setDisplayFrequency(ad.frequency === 1 ? 'once-per-session' : ad.frequency === 2 ? 'once-per-page' : ad.frequency === 3 ? 'every-visit' : 'daily')
    setTimeDelay(String(ad.skipAfter || 5))
    setMediaUrl(ad.mediaUrl || '')
    setThumbnailUrl(ad.imageUrl || '')
    setUploadStage('success')
  }, [])

  // ─── Save Callback ─────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!newAdTitle.trim()) {
      toast.error('Please enter an ad title')
      return
    }
    if (!mediaUrl && adTab !== 'text' && !editingAd) {
      toast.error('Please upload an ad image or video first')
      return
    }
    setSaving(true)
    try {
      const isVideo = mediaFile ? mediaFile.type.startsWith('video/') : (mediaUrl ? mediaUrl.endsWith('.mp4') : false)
      const targetFormat = adTab === 'text' ? 'text' : (isVideo ? 'mp4' : 'jpg')
      const adData = {
        type: 'popup',
        position: popupPosition,
        title: newAdTitle.trim(),
        imageUrl: thumbnailUrl || mediaUrl || '',
        mediaUrl: mediaUrl || '',
        mediaFormat: targetFormat,
        frequency: displayFrequency === 'once-per-session' ? 1 : displayFrequency === 'once-per-page' ? 2 : displayFrequency === 'every-visit' ? 3 : 4,
        skipAfter: parseInt(timeDelay) || 5,
        isActive: editingAd ? editingAd.isActive : true,
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
      console.error('Error saving popup ad:', err)
      toast.error('Failed to save popup ad')
    } finally {
      setSaving(false)
    }
  }, [newAdTitle, mediaUrl, mediaFile, adTab, popupPosition, thumbnailUrl, displayFrequency, timeDelay, editingAd, updateAd, createAd, resetForm])

  // ─── Computed Data from Real Ads ──────────────────────────────────────

  const displayAds = useMemo(() => ads.map((ad) => ({
    ...ad,
    name: ad.title,
    type: (ad.mediaFormat === 'mp4' ? 'Video' : ad.mediaFormat === 'text' ? 'Text' : 'Image') as 'Image' | 'Video' | 'Text',
    trigger: ad.skipAfter ? `Time Delay (${ad.skipAfter}s)` : 'Time Delay (5s)',
    displayOn: ad.position || 'All Pages',
    impressions: formatNumber(ad.impressions),
    ctr: ad.impressions > 0 ? `${(ad.clicks / ad.impressions * 100).toFixed(2)}%` : '0.00%',
    revenue: formatCurrency(ad.revenue),
    status: (ad.isActive ? 'Active' : 'Paused') as 'Active' | 'Paused',
  })), [ads])

  const filteredAds = displayAds.filter((ad) => {
    if (statusFilter !== 'all' && ad.status.toLowerCase() !== statusFilter) return false
    if (searchQuery && !ad.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const pageSize = 10
  const totalPages = Math.max(1, Math.ceil(filteredAds.length / pageSize))
  const paginatedAds = filteredAds.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // Donut chart data from real ads
  const donutData = useMemo(() => {
    const imageImpressions = ads.filter(a => a.mediaFormat !== 'mp4' && a.mediaFormat !== 'text').reduce((s, a) => s + a.impressions, 0)
    const videoImpressions = ads.filter(a => a.mediaFormat === 'mp4').reduce((s, a) => s + a.impressions, 0)
    return [
      { name: 'Image Ads', value: imageImpressions || 1 },
      { name: 'Video Ads', value: videoImpressions || 1 },
    ]
  }, [ads])

  // Stat values from real ads
  const totalAds = ads.length
  const activeAdsCount = ads.filter(a => a.isActive).length
  const totalImpressions = ads.reduce((s, a) => s + a.impressions, 0)
  const totalClicks = ads.reduce((s, a) => s + a.clicks, 0)
  const overallCtr = totalImpressions > 0 ? (totalClicks / totalImpressions * 100).toFixed(2) : '0.00'
  const totalRevenue = ads.reduce((s, a) => s + a.revenue, 0)

  const statusStyles: Record<string, string> = {
    Active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Paused: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Draft: 'bg-white/5 text-white/40 border-white/10',
  }

  const typeStyles: Record<string, string> = {
    Image: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Video: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    Text: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  }

  // ─── Get accept types for upload ───────────────────────────────────────

  const getAcceptTypes = () => {
    if (adTab === 'image') return 'image/jpeg,image/png,image/gif,image/webp'
    if (adTab === 'video') return 'video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.avi,.mkv'
    return 'text/html,.html'
  }

  const getSupportedText = () => {
    if (adTab === 'image') return 'Max file size: 5GB | Supported: JPG, PNG, GIF, WEBP'
    if (adTab === 'video') return 'Max file size: 5GB | Supported: MP4, WebM, MOV, AVI, MKV'
    return 'Max file size: 5GB | Supported: HTML, Text'
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
              <LayoutGrid className="h-5 w-5 text-[#ff1e1e]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white md:text-2xl">Popup Ads</h1>
              <p className="mt-0.5 text-sm text-white/40">Create and manage popup ads for your platform</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Date range picker */}
            <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#111111]/60 px-3 py-2 text-xs font-medium text-white/60 transition-colors hover:border-white/20 hover:text-white">
              <Clock className="h-3.5 w-3.5" />
              May 10 – Jun 10, 2025
            </button>
            {/* Export */}
            <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#111111]/60 px-3 py-2 text-xs font-medium text-white/60 transition-colors hover:border-white/20 hover:text-white">
              <Upload className="h-3.5 w-3.5" />
              Export Report
            </button>
            {/* Notification bell */}
            <button className="relative flex items-center gap-2 rounded-xl border border-white/10 bg-[#111111]/60 px-2.5 py-2 text-white/60 transition-colors hover:border-white/20 hover:text-white">
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
              onClick={() => createSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff1e1e] to-[#cc181e] px-4 py-2 text-sm font-semibold text-white shadow-[0_0_15px_rgba(255,30,30,0.3)] transition-all hover:from-[#ff2e2e] hover:to-[#dd282e]"
            >
              <CloudUpload className="h-4 w-4" />
              Create Popup Ad
            </motion.button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            TOP ANALYTICS CARDS (5 cards)
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard title="Total Popup Ads" value={String(totalAds)} change={totalAds > 0 ? `+${totalAds} ads` : 'No ads'} icon={Megaphone} color={STAT_COLORS[0]} delay={0} index={0} />
          <StatCard title="Active Ads" value={String(activeAdsCount)} change={activeAdsCount > 0 ? `${activeAdsCount} active` : 'None active'} icon={Radio} color={STAT_COLORS[1]} delay={0.05} index={1} />
          <StatCard title="Impressions" value={formatNumber(totalImpressions)} change={totalImpressions > 0 ? 'Live data' : 'No data'} icon={Eye} color={STAT_COLORS[2]} delay={0.1} index={2} />
          <StatCard title="CTR" value={`${overallCtr}%`} change={totalClicks > 0 ? 'Live data' : 'No data'} icon={MousePointer} color={STAT_COLORS[3]} delay={0.15} index={3} />
          <StatCard title="Revenue" value={formatCurrency(totalRevenue)} change={totalRevenue > 0 ? 'Live data' : 'No data'} icon={DollarSign} color={STAT_COLORS[4]} delay={0.2} index={4} />
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            THREE COLUMN LAYOUT
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr_300px] 2xl:grid-cols-[1fr_1fr_340px]">
          {/* ── LEFT: Create Popup Ad ── */}
          <motion.div
            ref={createSectionRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="overflow-hidden rounded-xl border border-white/5 bg-[#0B0B0F]/80"
          >
            <div className="p-3 lg:p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-bold text-white">Create Popup Ad</h2>
                {uploadStage === 'success' && (
                  <button onClick={handleResetUpload} className="text-xs text-[#ff1e1e] hover:text-[#ff3e3e]">Reset</button>
                )}
              </div>

              {/* Ad Title */}
              <div className="mb-4 space-y-1.5">
                <label className="text-[11px] font-medium text-white/50">Ad Title</label>
                <input
                  type="text"
                  value={newAdTitle}
                  onChange={(e) => setNewAdTitle(e.target.value)}
                  className="h-8 w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 text-xs text-white/70 outline-none focus:border-[#ff1e1e]/40"
                  placeholder="Enter popup ad title..."
                />
              </div>

              {/* Tabs: Image Ad / Video Upload / Text Ad */}
              <div className="mb-4 flex items-center gap-0 border-b border-white/5">
                <button
                  onClick={() => setAdTab('image')}
                  className={`relative flex items-center gap-2 px-4 pb-2.5 text-sm font-medium transition-colors ${
                    adTab === 'image' ? 'text-white' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  Image Ad
                  {adTab === 'image' && (
                    <motion.div
                      layoutId="popup-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[#ff1e1e]"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
                <button
                  onClick={() => setAdTab('video')}
                  className={`relative flex items-center gap-2 px-4 pb-2.5 text-sm font-medium transition-colors ${
                    adTab === 'video' ? 'text-white' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  <Film className="h-3.5 w-3.5" />
                  Video Upload
                  {adTab === 'video' && (
                    <motion.div
                      layoutId="popup-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[#ff1e1e]"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
                <button
                  onClick={() => setAdTab('text')}
                  className={`relative flex items-center gap-2 px-4 pb-2.5 text-sm font-medium transition-colors ${
                    adTab === 'text' ? 'text-white' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  <Type className="h-3.5 w-3.5" />
                  Text Ad
                  {adTab === 'text' && (
                    <motion.div
                      layoutId="popup-tab-indicator"
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
                    className={`relative flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-all duration-200 ${
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
                        Drag &amp; drop your {adTab === 'image' ? 'image' : adTab === 'video' ? 'video' : 'text'} here
                      </p>
                      <p className="mt-1 text-xs text-white/40">
                        or <span className="text-[#ff1e1e] underline underline-offset-2">browse files</span>
                      </p>
                    </div>
                    <p className="text-[10px] text-white/25">
                      {getSupportedText()}
                    </p>
                    <p className="text-[10px] text-white/20">Cloudflare R2 Storage • Chunk Upload • Auto Retry</p>
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
                      {/* Glow */}
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
                        <span>Generating thumbnails &amp; optimizing...</span>
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
                          {mediaFile ? mediaFile.name : editingAd ? editingAd.title : 'Popup_Ad.png'}
                        </p>
                        <p className="text-[10px] text-white/30">
                          {mediaFile ? `${(mediaFile.size / (1024 * 1024)).toFixed(2)}MB` : '2.25MB'} • {mediaFile ? (mediaFile.type.startsWith('video/') ? 'Video' : 'Image') : editingAd ? editingAd.mediaFormat : 'PNG'}
                        </p>
                      </div>
                      <button onClick={handleResetUpload} className="text-xs text-[#ff1e1e] hover:text-[#ff3e3e]">Change</button>
                    </div>

                    {/* Thumbnails */}
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-medium text-white/60">Thumbnail <span className="text-[#ff1e1e]">(10 auto-generated)</span></p>
                        <button className="text-[10px] text-[#ff1e1e] hover:text-[#ff3e3e]">Upload Manually</button>
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
                        <span className="flex items-center gap-1">16:9</span>
                        <span className="flex items-center gap-1">1:1</span>
                        <span className="flex items-center gap-1">9:16</span>
                        <span className="text-[#ff1e1e] cursor-pointer">Crop</span>
                        <span className="text-[#ff1e1e] cursor-pointer">AI Auto</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Popup Settings */}
              <div className="mt-4 space-y-3 border-t border-white/5 pt-4">
                <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">Popup Settings</h3>

                {/* Trigger Type */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-white/50">Trigger Type</label>
                    <Select value={triggerType} onValueChange={setTriggerType}>
                      <SelectTrigger className="h-8 w-full rounded-lg border-white/10 bg-[#0a0a0a] text-xs text-white/70 [&_svg]:text-white/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-white/10 bg-[#111111]">
                        <SelectItem value="time-delay" className="text-xs text-white focus:bg-white/5">Time Delay</SelectItem>
                        <SelectItem value="exit-intent" className="text-xs text-white focus:bg-white/5">Exit Intent</SelectItem>
                        <SelectItem value="scroll" className="text-xs text-white focus:bg-white/5">Scroll</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-white/50">Time Delay (sec)</label>
                    <input
                      type="number"
                      value={timeDelay}
                      onChange={(e) => setTimeDelay(e.target.value)}
                      className="h-8 w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 text-xs text-white/70 outline-none focus:border-[#ff1e1e]/40"
                      placeholder="5"
                    />
                  </div>
                </div>

                {/* Display Frequency + Popup Size */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-white/50">Display Frequency</label>
                    <Select value={displayFrequency} onValueChange={setDisplayFrequency}>
                      <SelectTrigger className="h-8 w-full rounded-lg border-white/10 bg-[#0a0a0a] text-xs text-white/70 [&_svg]:text-white/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-white/10 bg-[#111111]">
                        <SelectItem value="once-per-session" className="text-xs text-white focus:bg-white/5">Once Per Session</SelectItem>
                        <SelectItem value="once-per-page" className="text-xs text-white focus:bg-white/5">Once Per Page</SelectItem>
                        <SelectItem value="every-visit" className="text-xs text-white focus:bg-white/5">Every Visit</SelectItem>
                        <SelectItem value="daily" className="text-xs text-white focus:bg-white/5">Daily</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-white/50">Popup Size</label>
                    <Select value={popupSize} onValueChange={setPopupSize}>
                      <SelectTrigger className="h-8 w-full rounded-lg border-white/10 bg-[#0a0a0a] text-xs text-white/70 [&_svg]:text-white/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-white/10 bg-[#111111]">
                        <SelectItem value="small" className="text-xs text-white focus:bg-white/5">Small</SelectItem>
                        <SelectItem value="medium" className="text-xs text-white focus:bg-white/5">Medium</SelectItem>
                        <SelectItem value="large" className="text-xs text-white focus:bg-white/5">Large</SelectItem>
                        <SelectItem value="fullscreen" className="text-xs text-white focus:bg-white/5">Fullscreen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Position + Close Button */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-white/50">Position</label>
                    <Select value={popupPosition} onValueChange={setPopupPosition}>
                      <SelectTrigger className="h-8 w-full rounded-lg border-white/10 bg-[#0a0a0a] text-xs text-white/70 [&_svg]:text-white/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-white/10 bg-[#111111]">
                        <SelectItem value="center" className="text-xs text-white focus:bg-white/5">Center</SelectItem>
                        <SelectItem value="bottom-right" className="text-xs text-white focus:bg-white/5">Bottom Right</SelectItem>
                        <SelectItem value="bottom-left" className="text-xs text-white focus:bg-white/5">Bottom Left</SelectItem>
                        <SelectItem value="top-right" className="text-xs text-white focus:bg-white/5">Top Right</SelectItem>
                        <SelectItem value="top-left" className="text-xs text-white focus:bg-white/5">Top Left</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-white/50">Close Button</label>
                    <div className="flex items-center gap-3 h-8">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={closeButton}
                          onCheckedChange={(checked) => setCloseButton(checked as boolean)}
                          className="border-white/20 data-[state=checked]:bg-[#ff1e1e] data-[state=checked]:border-[#ff1e1e]"
                        />
                        <span className="text-xs text-white/50">Show Close</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Device Target */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-white/50">Device Target</label>
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

                {/* Save button */}
                <motion.button
                  whileHover={saving ? {} : { scale: 1.02, boxShadow: '0 0 25px rgba(255,30,30,0.4)' }}
                  whileTap={saving ? {} : { scale: 0.98 }}
                  disabled={saving}
                  onClick={handleSave}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff1e1e] to-[#cc181e] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_15px_rgba(255,30,30,0.3)] transition-all hover:from-[#ff2e2e] hover:to-[#dd282e] disabled:opacity-50"
                >
                  <CloudUpload className="h-4 w-4" />
                  {saving ? 'Saving...' : editingAd ? 'Update Popup Ad' : 'Save Popup Ad'}
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
            {/* Popup Preview */}
            <div className="overflow-hidden rounded-xl border border-white/5 bg-[#0B0B0F]/80">
              <div className="p-3 lg:p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-bold text-white">Ad Preview</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/30">Live Preview</span>
                    <button
                      onClick={() => setPopupVisible(!popupVisible)}
                      className="text-[10px] text-[#ff1e1e] hover:text-[#ff3e3e]"
                    >
                      {popupVisible ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                {/* Simulated Website Background with Popup */}
                <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-[#0f1629] via-[#0d1b2a] to-[#0a1628]" style={{ minHeight: '280px' }}>
                  {/* Fake website background */}
                  <div className="absolute inset-0 opacity-20">
                    <div className="h-8 bg-white/5 border-b border-white/10" />
                    <div className="p-3 lg:p-4 space-y-3">
                      <div className="h-3 w-2/3 rounded bg-white/10" />
                      <div className="h-2 w-full rounded bg-white/5" />
                      <div className="h-2 w-4/5 rounded bg-white/5" />
                      <div className="h-2 w-3/5 rounded bg-white/5" />
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <div className="aspect-video rounded bg-white/5" />
                        <div className="aspect-video rounded bg-white/5" />
                        <div className="aspect-video rounded bg-white/5" />
                      </div>
                    </div>
                  </div>

                  {/* Animated Popup */}
                  <AnimatePresence>
                    {popupVisible && (
                      <motion.div
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <div className="relative w-[70%] max-w-[280px] overflow-hidden rounded-lg border border-white/20 bg-[#111118] shadow-2xl shadow-black/50">
                          {/* Close button */}
                          {closeButton && (
                            <button
                              onClick={() => setPopupVisible(false)}
                              className="absolute top-2 right-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-white/60 transition-colors hover:bg-white/20 hover:text-white"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}

                          {/* Popup Ad Image Area */}
                          <div className="relative aspect-[16/10] overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a3e] via-[#16213e] to-[#0f3460]" />
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-center p-3">
                              <div className="mb-0.5 text-[8px] font-bold tracking-[0.2em] text-white/30 uppercase">Summer Sale</div>
                              <p className="text-sm font-bold text-white leading-tight">UP TO 50% OFF</p>
                              <p className="text-[8px] text-white/40">Limited Time Offer</p>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="mt-1 rounded bg-[#ff1e1e] px-3 py-1 text-[8px] font-bold text-white"
                              >
                                SHOP NOW
                              </motion.button>
                            </div>
                          </div>

                          {/* Countdown timer */}
                          <div className="flex items-center justify-center gap-2 border-t border-white/5 bg-black/20 px-3 py-1.5">
                            <Timer className="h-2.5 w-2.5 text-white/30" />
                            <span className="text-[8px] text-white/40">Closes in</span>
                            <div className="flex gap-1">
                              {['02', '14', '36'].map((t, i) => (
                                <span key={i} className="flex items-center">
                                  <span className="rounded bg-[#ff1e1e]/10 px-1 py-0.5 text-[8px] font-bold text-[#ff1e1e]">{t}</span>
                                  {i < 2 && <span className="mx-0.5 text-[8px] text-white/20">:</span>}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Show popup button when hidden */}
                  {!popupVisible && (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => setPopupVisible(true)}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="flex items-center gap-2 rounded-xl bg-[#ff1e1e]/10 px-4 py-2 text-xs font-medium text-[#ff1e1e] border border-[#ff1e1e]/20">
                        <LayoutGrid className="h-4 w-4" />
                        Show Popup Preview
                      </div>
                    </motion.button>
                  )}
                </div>

                {/* Ad Details */}
                <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
                  {[
                    { label: 'Placement', value: 'Popup (Center)' },
                    { label: 'File Name', value: 'Popup_Banner_Ad.png' },
                    { label: 'Resolution', value: '1920 × 1080' },
                    { label: 'File Size', value: '1.85 MB' },
                    { label: 'Format', value: 'PNG' },
                    { label: 'Trigger Type', value: 'Time Delay (5s)' },
                  ].map((detail) => (
                    <div key={detail.label} className="flex items-center justify-between rounded-lg bg-[#0a0a0a]/50 px-3 py-1.5">
                      <span className="text-[10px] text-white/30">{detail.label}</span>
                      <span className="text-[10px] font-medium text-white/70 truncate ml-2">{detail.value}</span>
                    </div>
                  ))}
                </div>

                {/* Display Devices */}
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[10px] text-white/30">Display Devices:</span>
                  <div className="flex items-center gap-2">
                    {deviceDesktop && (
                      <div className="flex items-center gap-1 rounded bg-blue-500/10 px-1.5 py-0.5 text-[9px] text-blue-400 border border-blue-500/20">
                        <Monitor className="h-2.5 w-2.5" /> Desktop
                      </div>
                    )}
                    {deviceTablet && (
                      <div className="flex items-center gap-1 rounded bg-purple-500/10 px-1.5 py-0.5 text-[9px] text-purple-400 border border-purple-500/20">
                        <Tablet className="h-2.5 w-2.5" /> Tablet
                      </div>
                    )}
                    {deviceMobile && (
                      <div className="flex items-center gap-1 rounded bg-orange-500/10 px-1.5 py-0.5 text-[9px] text-orange-400 border border-orange-500/20">
                        <Smartphone className="h-2.5 w-2.5" /> Mobile
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── RIGHT: Quick Actions + Performance ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            className="space-y-4"
          >
            {/* Quick Actions */}
            <div className="overflow-hidden rounded-xl border border-white/5 bg-[#0B0B0F]/80">
              <div className="p-3 lg:p-4">
                <h2 className="mb-4 text-base font-bold text-white">Quick Actions</h2>
                <div className="space-y-2.5">
                  {[
                    { icon: ImageIcon, label: 'Create Image Popup Ad', desc: 'Upload an image ad up to 5GB', color: '#3b82f6', glowColor: 'rgba(59,130,246,0.15)', bgColor: 'from-blue-500/10 to-blue-600/5' },
                    { icon: Film, label: 'Create Video Popup Ad', desc: 'Upload a video ad up to 5GB', color: '#8b5cf6', glowColor: 'rgba(139,92,246,0.15)', bgColor: 'from-purple-500/10 to-purple-600/5' },
                    { icon: Megaphone, label: 'Manage Popup Ads', desc: 'View, edit and manage ads', color: '#10b981', glowColor: 'rgba(16,185,129,0.15)', bgColor: 'from-emerald-500/10 to-emerald-600/5' },
                    { icon: BarChart3, label: 'Ad Performance', desc: 'View analytics and reports', color: '#8b5cf6', glowColor: 'rgba(139,92,246,0.15)', bgColor: 'from-purple-500/10 to-purple-600/5' },
                  ].map((action, i) => (
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

            {/* Ad Performance Overview */}
            <div className="overflow-hidden rounded-xl border border-white/5 bg-[#0B0B0F]/80">
              <div className="p-3 lg:p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-white">Ad Performance Overview</h2>
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
                        {formatNumber(totalImpressions)}
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
            POPUP ADS LIST TABLE
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
              <h2 className="text-base font-bold text-white">Popup Ads List</h2>
              <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1) }}>
                  <SelectTrigger className="h-8 w-28 rounded-lg border-white/10 bg-[#0a0a0a] text-xs text-white/60 [&_svg]:text-white/30">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#111111]">
                    <SelectItem value="all" className="text-xs text-white focus:bg-white/5">All Status</SelectItem>
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
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Preview', 'Ad Name', 'Type', 'Trigger', 'Display On', 'Impressions', 'CTR', 'Revenue', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="pb-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-white/25">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={`loading-${i}`} className="border-b border-white/5">
                        {Array.from({ length: 10 }).map((_, j) => (
                          <td key={j} className="py-2 pr-3">
                            <div className="h-4 w-16 animate-pulse rounded bg-white/5" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : paginatedAds.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-xs text-white/30">
                        No popup ads found. Create your first popup ad!
                      </td>
                    </tr>
                  ) : (
                    paginatedAds.map((ad, i) => (
                      <motion.tr
                        key={ad.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 + i * 0.04, duration: 0.3 }}
                        className="group transition-colors hover:bg-white/[0.02]"
                      >
                        {/* Preview */}
                        <td className="py-2 pr-3">
                          <div className="relative h-10 w-16 overflow-hidden rounded-lg">
                            <div className={`absolute inset-0 bg-gradient-to-br ${thumbnailGradients[i % thumbnailGradients.length]}`} />
                            <div className="absolute inset-0 flex items-center justify-center">
                              {ad.type === 'Image' ? (
                                <ImageIcon className="h-3 w-3 text-white/20" />
                              ) : ad.type === 'Video' ? (
                                <Film className="h-3 w-3 text-white/20" />
                              ) : (
                                <Type className="h-3 w-3 text-white/20" />
                              )}
                            </div>
                          </div>
                        </td>
                        {/* Ad Name */}
                        <td className="py-2 pr-3">
                          <p className="text-xs font-medium text-white">{ad.name}</p>
                        </td>
                        {/* Type */}
                        <td className="py-2 pr-3">
                          <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${typeStyles[ad.type]}`}>
                            {ad.type === 'Image' && <ImageIcon className="h-2.5 w-2.5" />}
                            {ad.type === 'Video' && <Film className="h-2.5 w-2.5" />}
                            {ad.type === 'Text' && <Type className="h-2.5 w-2.5" />}
                            {ad.type}
                          </span>
                        </td>
                        {/* Trigger */}
                        <td className="py-2 pr-3">
                          <span className="text-xs text-white/50">{ad.trigger}</span>
                        </td>
                        {/* Display On */}
                        <td className="py-2 pr-3">
                          <span className="text-xs text-white/50">{ad.displayOn}</span>
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
                            {ad.status}
                          </span>
                        </td>
                        {/* Actions */}
                        <td className="py-2">
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleEdit(ad)} className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-white/10 hover:text-white" title="Edit">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => toggleAd(ad.id)} className={`rounded-md p-1.5 transition-colors ${ad.isActive ? 'text-amber-400/50 hover:bg-amber-500/10 hover:text-amber-400' : 'text-emerald-400/50 hover:bg-emerald-500/10 hover:text-emerald-400'}`} title={ad.isActive ? 'Pause' : 'Activate'}>
                              <Zap className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => { if (confirm('Delete this ad?')) deleteAd(ad.id) }} className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-red-500/10 hover:text-red-400" title="Delete">
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
                <span className="text-[10px] text-white/30">{(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredAds.length)} of {filteredAds.length}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, idx) => idx + 1).map((page) => (
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
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
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
