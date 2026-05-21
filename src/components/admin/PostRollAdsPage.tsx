'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  Volume2,
  Settings,
  Maximize,
  CloudUpload,
  Upload,
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
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Radio,
  Trash2,
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
import { useAdsManager } from '@/hooks/useAdsManager'

// ─── Types ───────────────────────────────────────────────────────────────────

type UploadStage = 'idle' | 'uploading' | 'processing' | 'success'
type AdTab = 'video' | 'image'

interface PostRollAd {
  id: string
  name: string
  type: 'Video' | 'Image'
  placement: string
  duration: string
  impressions: string
  ctr: string
  revenue: string
  status: 'Active' | 'Paused' | 'Draft'
  gradient: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STAT_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#EC4899', '#F59E0B']
const DONUT_COLORS = ['#3B82F6', '#10B981']

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

const thumbnailTimecodes = [
  '00:02', '00:04', '00:06', '00:08', '00:10',
  '00:02', '00:04', '00:06', '00:08', '00:10',
]

const mockAds: PostRollAd[] = [
  {
    id: '1',
    name: 'Nike Sneakers Post-Roll Ad',
    type: 'Video',
    placement: 'Post-Roll (After Video)',
    duration: '00:12',
    impressions: '645.2K',
    ctr: '7.24%',
    revenue: '$2,845.30',
    status: 'Active',
    gradient: 'from-orange-900/60 via-red-800/40 to-amber-900/30',
  },
  {
    id: '2',
    name: 'Samsung Galaxy Post-Roll',
    type: 'Video',
    placement: 'Post-Roll (After Video)',
    duration: '00:15',
    impressions: '512.8K',
    ctr: '6.58%',
    revenue: '$2,350.40',
    status: 'Active',
    gradient: 'from-blue-900/60 via-indigo-800/40 to-violet-900/30',
  },
  {
    id: '3',
    name: 'BMW Car Post-Roll Ad',
    type: 'Video',
    placement: 'Post-Roll (After Video)',
    duration: '00:20',
    impressions: '428.6K',
    ctr: '5.92%',
    revenue: '$1,845.60',
    status: 'Active',
    gradient: 'from-cyan-900/60 via-sky-800/40 to-blue-900/30',
  },
  {
    id: '4',
    name: 'Summer Collection Banner',
    type: 'Image',
    placement: 'Post-Roll (After Video)',
    duration: '—',
    impressions: '861.4K',
    ctr: '8.12%',
    revenue: '$2,604.00',
    status: 'Active',
    gradient: 'from-emerald-900/60 via-teal-800/40 to-cyan-900/30',
  },
  {
    id: '5',
    name: 'Adidas Sport Post-Roll',
    type: 'Video',
    placement: 'Post-Roll (After Video)',
    duration: '00:10',
    impressions: '298.5K',
    ctr: '6.34%',
    revenue: '$1,124.50',
    status: 'Paused',
    gradient: 'from-rose-900/60 via-pink-800/40 to-red-900/30',
  },
  {
    id: '6',
    name: 'Apple iPhone Post-Roll',
    type: 'Video',
    placement: 'Post-Roll (After Video)',
    duration: '00:08',
    impressions: '124.5K',
    ctr: '5.68%',
    revenue: '$875.40',
    status: 'Draft',
    gradient: 'from-violet-900/60 via-purple-800/40 to-fuchsia-900/30',
  },
]

const donutData = [
  { name: 'Video Ads', value: 2009000 },
  { name: 'Image Ads', value: 861000 },
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
      <path d={paths[index % paths.length]} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
      className="group relative overflow-hidden rounded-[18px] border border-[#1A1A1A] bg-[#0B0B0F] p-3 lg:p-4 transition-all duration-300 hover:border-white/10 hover:shadow-lg"
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
            <TrendingUp className="h-3 w-3 text-[#00FF85]" />
            <span className="text-xs font-semibold text-[#00FF85]">{change}</span>
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

export function PostRollAdsPage() {
  const { deleteAd, toggleAd } = useAdsManager({ position: 'post-roll' })

  // Upload state
  const [uploadStage, setUploadStage] = useState<UploadStage>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadSpeed, setUploadSpeed] = useState('0 MB/s')
  const [uploadRemaining, setUploadRemaining] = useState('')
  const [uploadedSize, setUploadedSize] = useState('0 GB')
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedQuality, setSelectedQuality] = useState('auto')
  const [selectedThumbnail, setSelectedThumbnail] = useState(0)
  const [adTab, setAdTab] = useState<AdTab>('video')
  const [isPlaying, setIsPlaying] = useState(false)

  // Table state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ─── Simulated Upload ──────────────────────────────────────────────────

  const simulateUpload = useCallback((fileName: string) => {
    setUploadStage('uploading')
    setUploadProgress(0)
    setUploadedSize('0 GB')

    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)

    let progress = 0
    const totalSize = 5.0

    progressIntervalRef.current = setInterval(() => {
      const increment = Math.random() * 4 + 1
      progress = Math.min(progress + increment, 100)
      setUploadProgress(progress)

      const uploaded = (progress / 100) * totalSize
      setUploadedSize(`${uploaded.toFixed(2)} GB`)
      setUploadSpeed(`${(Math.random() * 2 + 1.5).toFixed(1)} MB/s`)

      const remaining = ((100 - progress) / increment) * 0.15
      setUploadRemaining(remaining > 60 ? `${Math.ceil(remaining / 60)} mins left` : `${Math.ceil(remaining)} secs left`)

      if (progress >= 100) {
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
        setUploadStage('processing')
        setTimeout(() => setUploadStage('success'), 1500)
      }
    }, 150)
  }, [])

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
    }
  }, [])

  // ─── Drag & Drop ───────────────────────────────────────────────────────

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true) }, [])
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false) }, [])
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) simulateUpload(files[0].name)
  }, [simulateUpload])

  const handleResetUpload = useCallback(() => {
    setUploadStage('idle')
    setUploadProgress(0)
    setSelectedThumbnail(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  // ─── Filtered Ads ──────────────────────────────────────────────────────

  const filteredAds = mockAds.filter((ad) => {
    if (statusFilter !== 'all' && ad.status.toLowerCase() !== statusFilter) return false
    if (searchQuery && !ad.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const statusStyles: Record<string, string> = {
    Active: 'bg-[#00FF85]/10 text-[#00FF85] border-[#00FF85]/20',
    Paused: 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20',
    Draft: 'bg-white/5 text-white/40 border-white/10',
  }

  const typeStyles: Record<string, string> = {
    Video: 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20',
    Image: 'bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/20',
  }

  // Pagination
  const adsPerPage = 10
  const totalPages = Math.ceil(filteredAds.length / adsPerPage)
  const paginatedAds = filteredAds.slice((currentPage - 1) * adsPerPage, currentPage * adsPerPage)

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
          <div>
            <h1 className="text-xl font-bold text-white md:text-2xl">Post-Roll Ads</h1>
            <p className="mt-1 text-sm text-white/40">Create, preview and manage post-roll video &amp; image ads</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Date range */}
            <button className="flex items-center gap-2 rounded-[18px] border border-[#1A1A1A] bg-[#0B0B0F] px-3 py-2 text-xs font-medium text-white/60 transition-colors hover:border-white/20 hover:text-white">
              <Clock className="h-3.5 w-3.5" />
              May 10 – Jun 10, 2025
            </button>
            {/* Export */}
            <button className="flex items-center gap-2 rounded-[18px] border border-[#1A1A1A] bg-[#0B0B0F] px-3 py-2 text-xs font-medium text-white/60 transition-colors hover:border-white/20 hover:text-white">
              <Upload className="h-3.5 w-3.5" />
              Export Report
            </button>
            {/* Create button */}
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: '0 0 25px rgba(255,0,0,0.4)' }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 rounded-[18px] bg-[#FF0000] px-4 py-2 text-sm font-semibold text-white shadow-[0_0_15px_rgba(255,0,0,0.3)] transition-all hover:bg-red-600"
            >
              <CloudUpload className="h-4 w-4" />
              + Create Post-Roll Ad
            </motion.button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            TOP ANALYTICS CARDS (5 cards)
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard title="Total Post-Roll Ads" value="32" change="+14.8%" icon={Megaphone} color={STAT_COLORS[0]} delay={0} index={0} />
          <StatCard title="Active Ads" value="25" change="+11.5%" icon={Radio} color={STAT_COLORS[1]} delay={0.05} index={1} />
          <StatCard title="Impressions" value="2.87M" change="+17.6%" icon={Eye} color={STAT_COLORS[2]} delay={0.1} index={2} />
          <StatCard title="CTR" value="6.82%" change="+8.9%" icon={MousePointer} color={STAT_COLORS[3]} delay={0.15} index={3} />
          <StatCard title="Revenue" value="$9,645.20" change="+15.2%" icon={DollarSign} color={STAT_COLORS[4]} delay={0.2} index={4} />
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            THREE COLUMN LAYOUT
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr_300px] 2xl:grid-cols-[1fr_1fr_340px]">
          {/* ── LEFT: Create Post-Roll Ad ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="overflow-hidden rounded-[18px] border border-[#1A1A1A] bg-[#0B0B0F]"
          >
            <div className="p-3 lg:p-4">
              <h2 className="mb-4 text-base font-bold text-white">Create Post-Roll Ad</h2>

              {/* Tabs */}
              <div className="mb-4 flex items-center gap-0 border-b border-[#1A1A1A]">
                <button
                  onClick={() => setAdTab('video')}
                  className={`relative flex items-center gap-2 px-4 pb-2.5 text-sm font-medium transition-colors ${
                    adTab === 'video' ? 'text-white' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  <Film className="h-3.5 w-3.5" />
                  Video Ad
                  {adTab === 'video' && (
                    <motion.div layoutId="postroll-tab-indicator" className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[#FF0000]" transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
                  )}
                </button>
                <button
                  onClick={() => setAdTab('image')}
                  className={`relative flex items-center gap-2 px-4 pb-2.5 text-sm font-medium transition-colors ${
                    adTab === 'image' ? 'text-white' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  Image Ad
                  {adTab === 'image' && (
                    <motion.div layoutId="postroll-tab-indicator" className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[#FF0000]" transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
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
                    className={`relative flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-3 rounded-[18px] border-2 border-dashed transition-all duration-200 ${
                      isDragOver
                        ? 'border-[#FF0000] bg-[#FF0000]/5 shadow-[0_0_20px_rgba(255,0,0,0.15)]'
                        : 'border-[#1A1A1A] bg-[#050505]/60 hover:border-white/20'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/mp4,video/mov,video/webm,video/x-mpegURL,application/x-mpegURL,image/*"
                      className="hidden"
                      onChange={(e) => { if (e.target.files?.length) simulateUpload(e.target.files[0].name) }}
                    />
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF0000]/10">
                      <CloudUpload className="h-6 w-6 text-[#FF0000]" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-white">Drag &amp; drop your {adTab === 'video' ? 'video' : 'image'} here</p>
                      <p className="mt-1 text-xs text-white/40">
                        or <span className="text-[#FF0000] underline underline-offset-2">click to browse files</span>
                      </p>
                    </div>
                    <p className="text-[10px] text-white/25">
                      Max file size: 5GB | Supported: {adTab === 'video' ? 'MP4, MOV, WebM, HLS' : 'PNG, JPG, WebP'}
                    </p>
                  </motion.div>
                ) : uploadStage === 'uploading' || uploadStage === 'processing' ? (
                  <motion.div
                    key="upload-progress"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="rounded-[18px] border border-[#1A1A1A] bg-[#050505]/60 p-3 lg:p-4"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-white truncate mr-2">
                        {uploadStage === 'processing' ? 'Processing...' : 'Postroll_Sneakers_Ad.mp4'}
                      </span>
                      <span className="text-xs font-bold text-[#FF0000]">{Math.round(uploadProgress)}%</span>
                    </div>
                    {/* Progress bar */}
                    <div className="relative mb-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3 }}
                        className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[#FF0000] to-red-500"
                      />
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3 }}
                        className="absolute left-0 top-0 h-full rounded-full bg-[#FF0000] blur-sm opacity-40"
                      />
                    </div>
                    {uploadStage === 'uploading' ? (
                      <>
                        <div className="grid grid-cols-3 gap-3 text-center mb-3">
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
                        <div className="flex items-center gap-2">
                          <button className="flex-1 rounded-lg border border-[#1A1A1A] bg-white/5 py-1.5 text-[10px] font-medium text-white/50 hover:bg-white/10 hover:text-white transition-colors">Pause</button>
                          <button onClick={handleResetUpload} className="flex-1 rounded-lg border border-[#1A1A1A] bg-[#FF0000]/5 py-1.5 text-[10px] font-medium text-[#FF0000] hover:bg-[#FF0000]/15 transition-colors">Cancel</button>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-[#F59E0B]">
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-[#F59E0B] border-t-transparent" />
                        <span>Generating thumbnails and detecting quality...</span>
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
                    <div className="flex items-center gap-3 rounded-[18px] border border-[#00FF85]/20 bg-[#00FF85]/5 p-3">
                      <CheckCircle2 className="h-5 w-5 text-[#00FF85]" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-white">Postroll_Sneakers_Ad.mp4</p>
                        <p className="text-[10px] text-white/30">5.00 GB • 1920×1080 • MP4</p>
                      </div>
                      <button onClick={handleResetUpload} className="text-xs text-[#FF0000] hover:text-red-400">Change</button>
                    </div>

                    {/* Quality options */}
                    <div>
                      <p className="mb-2 text-xs font-medium text-white/60">Upload Quality</p>
                      <div className="flex gap-2">
                        {[
                          { value: 'auto', label: 'Auto', desc: 'Recommended' },
                          { value: '1080p', label: '1080p', desc: '' },
                          { value: '2k', label: '2K', desc: '' },
                          { value: '4k', label: '4K', desc: '' },
                        ].map((q) => (
                          <button
                            key={q.value}
                            onClick={() => setSelectedQuality(q.value)}
                            className={`flex-1 rounded-lg border px-2 py-1.5 text-center text-xs transition-all ${
                              selectedQuality === q.value
                                ? 'border-[#FF0000]/40 bg-[#FF0000]/10 text-white'
                                : 'border-[#1A1A1A] bg-white/[0.02] text-white/40 hover:border-white/20'
                            }`}
                          >
                            <span className="font-semibold">{q.label}</span>
                            {q.desc && <span className="ml-0.5 text-[9px] text-[#FF0000]">{q.desc}</span>}
                          </button>
                        ))}
                      </div>
                      {selectedQuality === 'auto' && (
                        <p className="mt-1.5 text-[10px] text-white/25">Auto quality will deliver best experience across all devices.</p>
                      )}
                    </div>

                    {/* Thumbnails */}
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-medium text-white/60">Thumbnail <span className="text-[#FF0000]">(10 auto-generated)</span></p>
                        <button className="text-[10px] text-[#FF0000] hover:text-red-400">Upload Manually</button>
                      </div>
                      <div className="grid grid-cols-5 gap-1.5">
                        {thumbnailGradients.map((gradient, i) => (
                          <button
                            key={i}
                            onClick={() => setSelectedThumbnail(i)}
                            className={`relative aspect-video overflow-hidden rounded border-2 transition-all ${
                              selectedThumbnail === i
                                ? 'border-[#FF0000] shadow-[0_0_8px_rgba(255,0,0,0.3)]'
                                : 'border-transparent hover:border-white/20'
                            }`}
                          >
                            <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Film className="h-2.5 w-2.5 text-white/15" />
                            </div>
                            <div className="absolute bottom-0 right-0.5 rounded bg-black/70 px-0.5 text-[6px] font-semibold text-white">
                              {thumbnailTimecodes[i]}
                            </div>
                            {selectedThumbnail === i && (
                              <div className="absolute top-0.5 right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-[#FF0000]">
                                <CheckCircle2 className="h-2 w-2 text-white" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                      <div className="mt-2 flex items-start gap-1.5">
                        <AlertCircle className="mt-0.5 h-3 w-3 flex-shrink-0 text-white/20" />
                        <p className="text-[10px] text-white/25">Thumbnails are auto-generated from your video. You can select or upload manually.</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* ── CENTER: Ad Preview ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="space-y-4"
          >
            <div className="overflow-hidden rounded-[18px] border border-[#1A1A1A] bg-[#0B0B0F]">
              <div className="p-3 lg:p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-bold text-white">Ad Preview</h2>
                  <span className="text-xs text-white/30">Nike Sneakers Commercial</span>
                </div>

                {/* Player */}
                <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
                  {/* Nike-style ad scene */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]" />
                  {/* Ad content overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
                    <div className="mb-1 text-xs font-bold tracking-wider text-white/40">NIKE</div>
                    <p className="text-lg font-bold text-white md:text-xl">JUST DO IT</p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="mt-1 rounded-md bg-[#FF0000] px-4 py-1.5 text-xs font-bold text-white shadow-[0_0_10px_rgba(255,0,0,0.3)]"
                    >
                      LEARN MORE
                    </motion.button>
                  </div>

                  {/* Countdown timer */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded-md bg-[#FF0000]/20 px-2 py-1 border border-[#FF0000]/30">
                    <span className="text-[9px] font-bold text-white">Ad</span>
                    <span className="text-[9px] text-white/60">00:05</span>
                  </div>

                  {/* Bottom controls */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-2 pt-6">
                    <div className="group/progress relative mb-1.5 h-1 cursor-pointer rounded-full bg-white/20">
                      <div className="absolute left-0 top-0 h-full w-[40%] rounded-full bg-[#FF0000]" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setIsPlaying(!isPlaying)} className="text-white/70 hover:text-white">
                          {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                        </button>
                        <button className="text-white/70 hover:text-white"><Volume2 className="h-3.5 w-3.5" /></button>
                        <span className="text-[10px] text-white/50">00:05/00:12</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="text-white/70 hover:text-white"><Settings className="h-3.5 w-3.5" /></button>
                        <button className="text-white/70 hover:text-white"><Maximize className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  </div>

                  {/* Learn More link */}
                  <div className="absolute top-2 right-2">
                    <button className="flex items-center gap-1 rounded-md bg-black/40 px-2 py-0.5 text-[9px] text-white/60 hover:text-white">
                      Learn More <ExternalLink className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>

                {/* Ad Details */}
                <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
                  {[
                    { label: 'Placement', value: 'Post-Roll (After Video)' },
                    { label: 'Duration', value: '00:12 sec' },
                    { label: 'File', value: 'Postroll_Sneakers_Ad.mp4' },
                    { label: 'Resolution', value: '1920 × 1080' },
                    { label: 'File Size', value: '5GB' },
                    { label: 'Format', value: 'MP4' },
                  ].map((detail) => (
                    <div key={detail.label} className="flex items-center justify-between rounded-lg bg-[#050505]/50 px-3 py-1.5 border border-[#1A1A1A]/50">
                      <span className="text-[10px] text-white/30">{detail.label}</span>
                      <span className="text-[10px] font-medium text-white/70 truncate ml-2">{detail.value}</span>
                    </div>
                  ))}
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
            <div className="overflow-hidden rounded-[18px] border border-[#1A1A1A] bg-[#0B0B0F]">
              <div className="p-3 lg:p-4">
                <h2 className="mb-4 text-base font-bold text-white">Quick Actions</h2>
                <div className="space-y-2.5">
                  {[
                    { icon: Film, label: 'Create Video Post-Roll Ad', desc: 'Upload video ad up to 5GB', color: '#FF0000', bgColor: 'from-red-500/10 to-red-600/5' },
                    { icon: ImageIcon, label: 'Create Image Post-Roll Ad', desc: 'Upload image ad', color: '#F59E0B', bgColor: 'from-orange-500/10 to-orange-600/5' },
                    { icon: Megaphone, label: 'Manage Post-Roll Ads', desc: 'View, edit and manage ads', color: '#00FF85', bgColor: 'from-emerald-500/10 to-emerald-600/5' },
                    { icon: BarChart3, label: 'Ad Performance', desc: 'View analytics and reports', color: '#8B5CF6', bgColor: 'from-purple-500/10 to-purple-600/5' },
                  ].map((action) => (
                    <motion.button
                      key={action.label}
                      whileHover={{ scale: 1.02, x: 2 }}
                      whileTap={{ scale: 0.98 }}
                      className={`group flex w-full items-center gap-3 rounded-[18px] border border-[#1A1A1A] bg-gradient-to-r ${action.bgColor} p-3 text-left transition-all hover:border-white/10 hover:shadow-lg`}
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
            <div className="overflow-hidden rounded-[18px] border border-[#1A1A1A] bg-[#0B0B0F]">
              <div className="p-3 lg:p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-white">Ad Performance Overview</h2>
                  <button className="text-[10px] text-white/30 hover:text-white/50">Last 30 Days</button>
                </div>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={donutData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value" stroke="none">
                        {donutData.map((_entry, index) => (
                          <Cell key={`donut-${index}`} fill={DONUT_COLORS[index]} />
                        ))}
                      </Pie>
                      <text x="50%" y="44%" textAnchor="middle" dominantBaseline="middle" className="fill-white text-sm font-bold">
                        2.87M
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
                            <div className="rounded-lg border border-[#1A1A1A] bg-[#0B0B0F]/95 px-3 py-2 shadow-xl">
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
            POST-ROLL ADS LIST TABLE
            ═══════════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="overflow-hidden rounded-[18px] border border-[#1A1A1A] bg-[#0B0B0F]"
        >
          <div className="p-3 lg:p-4">
            {/* Table header */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-base font-bold text-white">Post-Roll Ads List</h2>
              <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1) }}>
                  <SelectTrigger className="h-8 w-28 rounded-[18px] border-[#1A1A1A] bg-[#050505] text-xs text-white/60 [&_svg]:text-white/30">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent className="border-[#1A1A1A] bg-[#0B0B0F]">
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
                    placeholder="Search ads..."
                    className="h-8 w-40 rounded-[18px] border border-[#1A1A1A] bg-[#050505] pl-8 pr-3 text-xs text-white placeholder:text-white/25 outline-none focus:border-[#FF0000]/40"
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-[#1A1A1A]">
                    {['Preview', 'Ad Name', 'Type', 'Placement', 'Duration', 'Impressions', 'CTR', 'Revenue', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="pb-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-white/25">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1A]">
                  {paginatedAds.map((ad, i) => (
                    <motion.tr
                      key={ad.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.45 + i * 0.04, duration: 0.3 }}
                      className="group transition-colors hover:bg-white/[0.02]"
                    >
                      {/* Preview */}
                      <td className="py-2 pr-3">
                        <div className={`relative h-10 w-16 overflow-hidden rounded-md bg-gradient-to-br ${ad.gradient}`}>
                          <div className="absolute inset-0 flex items-center justify-center">
                            {ad.type === 'Video' ? (
                              <Film className="h-3.5 w-3.5 text-white/20" />
                            ) : (
                              <ImageIcon className="h-3.5 w-3.5 text-white/20" />
                            )}
                          </div>
                          {ad.type === 'Video' && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play className="h-3 w-3 text-white fill-white" />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Ad Name */}
                      <td className="py-2 pr-3">
                        <span className="text-xs font-medium text-white">{ad.name}</span>
                      </td>

                      {/* Type */}
                      <td className="py-2 pr-3">
                        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ${typeStyles[ad.type]}`}>
                          {ad.type}
                        </span>
                      </td>

                      {/* Placement */}
                      <td className="py-2 pr-3">
                        <span className="text-[10px] text-white/50">{ad.placement}</span>
                      </td>

                      {/* Duration */}
                      <td className="py-2 pr-3">
                        <span className="text-xs text-white/60">{ad.duration}</span>
                      </td>

                      {/* Impressions */}
                      <td className="py-2 pr-3">
                        <span className="text-xs font-medium text-white/80">{ad.impressions}</span>
                      </td>

                      {/* CTR */}
                      <td className="py-2 pr-3">
                        <span className="text-xs font-medium text-[#00FF85]">{ad.ctr}</span>
                      </td>

                      {/* Revenue */}
                      <td className="py-2 pr-3">
                        <span className="text-xs font-semibold text-white">{ad.revenue}</span>
                      </td>

                      {/* Status */}
                      <td className="py-2 pr-3">
                        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ${statusStyles[ad.status]}`}>
                          <span className={`mr-1 h-1.5 w-1.5 rounded-full ${
                            ad.status === 'Active' ? 'bg-[#00FF85]' : ad.status === 'Paused' ? 'bg-[#F59E0B]' : 'bg-white/30'
                          }`} />
                          {ad.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-2">
                        <div className="flex items-center gap-1">
                          <button onClick={() => toggleAd(ad.id)} className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-white/5 hover:text-white" title="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-white/5 hover:text-[#3B82F6]" title="Analytics">
                            <BarChart3 className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => { if (confirm('Delete this ad?')) deleteAd(ad.id) }} className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-[#FF0000]/10 hover:text-[#FF0000]" title="Delete">
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
            <div className="mt-4 flex items-center justify-between border-t border-[#1A1A1A] pt-4">
              <p className="text-[10px] text-white/30">
                Showing {((currentPage - 1) * adsPerPage) + 1}–{Math.min(currentPage * adsPerPage, filteredAds.length)} of {filteredAds.length} ads
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-[#1A1A1A] bg-transparent text-white/40 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`flex h-7 w-7 items-center justify-center rounded-md border text-xs font-medium transition-colors ${
                      currentPage === page
                        ? 'border-[#FF0000]/40 bg-[#FF0000]/10 text-white'
                        : 'border-[#1A1A1A] bg-transparent text-white/40 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-[#1A1A1A] bg-transparent text-white/40 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <Select value={String(adsPerPage)} onValueChange={() => {}}>
                <SelectTrigger className="h-7 w-20 rounded-[18px] border-[#1A1A1A] bg-[#050505] text-[10px] text-white/60 [&_svg]:text-white/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-[#1A1A1A] bg-[#0B0B0F]">
                  <SelectItem value="10" className="text-[10px] text-white focus:bg-white/5">10/page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
