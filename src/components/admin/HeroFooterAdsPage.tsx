'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useHeroAds, useFooterAds, type HeroAdItem, type FooterAdItem } from '@/hooks/useAdsManager'
import { motion, AnimatePresence } from 'framer-motion'
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
  Code2,
  Sparkles,
  Zap,
  Link2,
  Calendar,
  LayoutGrid,
  ArrowDownFromLine,
  ArrowUpFromLine,
  RefreshCw,
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
type SectionTab = 'hero' | 'footer'
type PreviewMode = 'desktop' | 'tablet' | 'mobile'

// ─── Constants ───────────────────────────────────────────────────────────────

const STAT_COLORS = ['#ff1e1e', '#8b5cf6', '#10b981', '#ec4899', '#f97316']
const DONUT_COLORS = ['#ff1e1e', '#8b5cf6']

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

export function HeroFooterAdsPage() {
  // Real data hooks
  const { ads: heroAds, loading: heroLoading, createAd: createHeroAd, deleteAd: deleteHeroAd, toggleAd: toggleHeroAd } = useHeroAds()
  const { ads: footerAds, loading: footerLoading, createAd: createFooterAd, deleteAd: deleteFooterAd, toggleAd: toggleFooterAd } = useFooterAds()

  // Upload state
  const [uploadStage, setUploadStage] = useState<UploadStage>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadSpeed, setUploadSpeed] = useState('0 MB/s')
  const [uploadRemaining, setUploadRemaining] = useState('')
  const [uploadedSize, setUploadedSize] = useState('0 GB')
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedThumbnail, setSelectedThumbnail] = useState(0)
  const [sectionTab, setSectionTab] = useState<SectionTab>('hero')
  const [saving, setSaving] = useState(false)

  // Ad settings state
  const [adTitle, setAdTitle] = useState('')
  const [adLink, setAdLink] = useState('')
  const [deviceDesktop, setDeviceDesktop] = useState(true)
  const [deviceTablet, setDeviceTablet] = useState(true)
  const [deviceMobile, setDeviceMobile] = useState(false)
  const [position, setPosition] = useState('hero-top')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [autoRotate, setAutoRotate] = useState(false)
  const [statusActive, setStatusActive] = useState(true)

  // Preview state
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop')

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

  const allAds = sectionTab === 'hero' ? heroAds : footerAds
  const filteredAds = allAds.filter((ad) => {
    if (statusFilter !== 'all' && (ad.isActive ? 'active' : 'paused') !== statusFilter) return false
    if (searchQuery && !ad.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const statusStyles: Record<string, string> = {
    Active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Paused: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Draft: 'bg-white/5 text-white/40 border-white/10',
  }

  const typeStyles: Record<string, string> = {
    Image: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    HTML5: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  }

  // ─── Section label helper ──────────────────────────────────────────────

  const sectionLabel = sectionTab === 'hero' ? 'Hero Section' : 'Footer Section'

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
              <LayoutGrid className="h-5 w-5 text-[#ff1e1e]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white md:text-2xl">Hero / Footer Ads</h1>
              <p className="mt-0.5 text-sm text-white/40">Create and manage hero &amp; footer ads for your platform</p>
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
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff1e1e] to-[#cc181e] px-4 py-2 text-sm font-semibold text-white shadow-[0_0_15px_rgba(255,30,30,0.3)] transition-all hover:from-[#ff2e2e] hover:to-[#dd282e]"
            >
              <CloudUpload className="h-4 w-4" />
              Create Hero/Footer Ad
            </motion.button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            TOP ANALYTICS CARDS (5 cards)
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard title="Total Ads" value="28" change="+14.5%" icon={Megaphone} color={STAT_COLORS[0]} delay={0} index={0} />
          <StatCard title="Active Ads" value="21" change="+11.2%" icon={Radio} color={STAT_COLORS[1]} delay={0.05} index={1} />
          <StatCard title="Impressions" value="5.42M" change="+22.7%" icon={Eye} color={STAT_COLORS[2]} delay={0.1} index={2} />
          <StatCard title="CTR" value="4.59%" change="+8.4%" icon={MousePointer} color={STAT_COLORS[3]} delay={0.15} index={3} />
          <StatCard title="Revenue" value="$15,425.80" change="+19.6%" icon={DollarSign} color={STAT_COLORS[4]} delay={0.2} index={4} />
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            THREE COLUMN LAYOUT
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr_300px] 2xl:grid-cols-[1fr_1fr_340px]">
          {/* ── LEFT: Create Hero / Footer Ad ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="overflow-hidden rounded-xl border border-white/5 bg-[#0B0B0F]/80"
          >
            <div className="p-3 lg:p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-bold text-white">Create Hero / Footer Ad</h2>
                {uploadStage === 'success' && (
                  <button onClick={handleResetUpload} className="text-xs text-[#ff1e1e] hover:text-[#ff3e3e]">Reset</button>
                )}
              </div>

              {/* Section Tabs: Hero Section / Footer Section */}
              <div className="mb-4 flex items-center gap-0 border-b border-white/5">
                <button
                  onClick={() => { setSectionTab('hero'); setPosition('hero-top') }}
                  className={`relative flex items-center gap-2 px-4 pb-2.5 text-sm font-medium transition-colors ${
                    sectionTab === 'hero' ? 'text-white' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  <ArrowUpFromLine className="h-3.5 w-3.5" />
                  Hero Section
                  {sectionTab === 'hero' && (
                    <motion.div
                      layoutId="hero-footer-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[#ff1e1e]"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
                <button
                  onClick={() => { setSectionTab('footer'); setPosition('footer-top') }}
                  className={`relative flex items-center gap-2 px-4 pb-2.5 text-sm font-medium transition-colors ${
                    sectionTab === 'footer' ? 'text-white' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  <ArrowDownFromLine className="h-3.5 w-3.5" />
                  Footer Section
                  {sectionTab === 'footer' && (
                    <motion.div
                      layoutId="hero-footer-tab-indicator"
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
                      accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif,.zip,application/zip"
                      className="hidden"
                      onChange={(e) => { if (e.target.files?.length) simulateUpload(e.target.files[0].name) }}
                    />
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ff1e1e]/10">
                      <CloudUpload className="h-6 w-6 text-[#ff1e1e]" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-white">
                        Drag &amp; drop your {sectionLabel.toLowerCase()} ad here
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
                        <p className="truncate text-xs font-medium text-white">hero_banner_2025.jpg</p>
                        <p className="text-[10px] text-white/30">2.35MB • 1920×600 • JPG</p>
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
                        <span>1920×600</span>
                        <span>1600×300</span>
                        <span>970×250</span>
                        <span>728×90</span>
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
                        <SelectItem value="hero-top" className="text-xs text-white focus:bg-white/5">Hero Section - Top</SelectItem>
                        <SelectItem value="hero-bottom" className="text-xs text-white focus:bg-white/5">Hero Section - Bottom</SelectItem>
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
                    const data: Record<string, unknown> = {
                      title: adTitle,
                      linkUrl: adLink || undefined,
                      adType: 'image',
                      mediaUrl: 'https://placehold.co/1920x600/1a0a2e/ffffff?text=' + encodeURIComponent(adTitle),
                      mediaFormat: 'image/jpeg',
                      isActive: statusActive,
                      startDate: startDate || null,
                      endDate: endDate || null,
                      displayOrder: 0,
                    }
                    try {
                      if (sectionTab === 'hero') {
                        await createHeroAd(data)
                      } else {
                        await createFooterAd(data)
                      }
                      setAdTitle('')
                      setAdLink('')
                      setStartDate('')
                      setEndDate('')
                      setStatusActive(true)
                    } finally {
                      setSaving(false)
                    }
                  }}
                  disabled={saving || !adTitle.trim()}
                  className={`mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff1e1e] to-[#cc181e] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_15px_rgba(255,30,30,0.3)] transition-all hover:from-[#ff2e2e] hover:to-[#dd282e] disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <CloudUpload className="h-4 w-4" />
                  {saving ? 'Saving...' : `Save ${sectionLabel} Ad`}
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
                      {/* HERO SECTION AD */}
                      {(position === 'hero-top' || position === 'hero-bottom') && (
                        <>
                          {position === 'hero-top' && (
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
                                  <div className="text-[8px] font-bold tracking-[0.2em] text-white/30 uppercase">Summer Collection 2025</div>
                                  <p className="mt-1 text-lg font-bold text-white">SUMMER MEGA SALE</p>
                                  <p className="text-[9px] text-white/40 mt-0.5">Up to 50% Off • Limited Time</p>
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="mt-2 rounded bg-[#ff1e1e] px-4 py-1 text-[9px] font-bold text-white shadow-[0_0_10px_rgba(255,30,30,0.4)]"
                                  >
                                    SHOP NOW
                                  </motion.button>
                                </div>
                              </div>
                              <div className="absolute top-2 right-2 rounded bg-black/50 px-1.5 py-0.5 text-[7px] text-white/40">Ad • Hero Top</div>
                            </motion.div>
                          )}

                          {/* Fake content */}
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

                          {position === 'hero-bottom' && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="relative overflow-hidden"
                              style={{ aspectRatio: '1600/300' }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-[#0f2027] via-[#203a43] to-[#2c5364]" />
                              <div className="absolute inset-0 flex items-center justify-center p-3">
                                <div className="text-center">
                                  <p className="text-sm font-bold text-white">NEW RELEASES THIS WEEK</p>
                                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="mt-1 rounded bg-white px-3 py-0.5 text-[8px] font-bold text-black">EXPLORE</motion.button>
                                </div>
                              </div>
                              <div className="absolute top-1.5 right-1.5 rounded bg-black/50 px-1.5 py-0.5 text-[7px] text-white/40">Ad • Hero Bottom</div>
                            </motion.div>
                          )}
                        </>
                      )}

                      {/* FOOTER SECTION AD */}
                      {(position === 'footer-top' || position === 'footer-bottom') && (
                        <>
                          {/* Fake content */}
                          <div className="p-3 space-y-2">
                            <div className="h-2.5 w-2/3 rounded bg-white/5" />
                            <div className="h-2 w-full rounded bg-white/3" />
                            <div className="h-2 w-4/5 rounded bg-white/3" />
                            <div className="grid grid-cols-3 gap-1.5 mt-2">
                              <div className="aspect-video rounded bg-white/3" />
                              <div className="aspect-video rounded bg-white/3" />
                              <div className="aspect-video rounded bg-white/3" />
                            </div>
                          </div>

                          {position === 'footer-top' && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="relative overflow-hidden border-t border-white/5"
                              style={{ aspectRatio: '970/250' }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a2e] via-[#1e3a5f] to-[#0f3460]" />
                              <div className="absolute inset-0 flex items-center justify-center p-3">
                                <div className="text-center">
                                  <p className="text-sm font-bold text-white">SUBSCRIBE & SAVE 30%</p>
                                  <p className="text-[8px] text-white/40 mt-0.5">Premium plans from $4.99/mo</p>
                                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="mt-1 rounded bg-[#ff1e1e] px-3 py-0.5 text-[8px] font-bold text-white">GET STARTED</motion.button>
                                </div>
                              </div>
                              <div className="absolute top-1.5 right-1.5 rounded bg-black/50 px-1.5 py-0.5 text-[7px] text-white/40">Ad • Footer Top</div>
                            </motion.div>
                          )}

                          {/* Fake footer */}
                          <div className="border-t border-white/5 bg-[#060610] p-2">
                            <div className="flex justify-between">
                              <div className="space-y-1">
                                <div className="h-1.5 w-16 rounded bg-white/5" />
                                <div className="h-1 w-12 rounded bg-white/3" />
                                <div className="h-1 w-14 rounded bg-white/3" />
                              </div>
                              <div className="space-y-1">
                                <div className="h-1.5 w-12 rounded bg-white/5" />
                                <div className="h-1 w-10 rounded bg-white/3" />
                              </div>
                            </div>
                          </div>

                          {position === 'footer-bottom' && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="relative overflow-hidden border-t border-white/5"
                              style={{ aspectRatio: '728/90' }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-[#1a0a2e] via-[#2d1b69] to-[#1a0a2e]" />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <p className="text-xs font-bold text-white">DOWNLOAD OUR APP — FREE TRIAL</p>
                              </div>
                              <div className="absolute top-1 right-1 rounded bg-black/50 px-1 py-0.5 text-[6px] text-white/40">Ad • Footer Bottom</div>
                            </motion.div>
                          )}
                        </>
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* Ad Details */}
                <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
                  {[
                    { label: 'Placement', value: position === 'hero-top' ? 'Hero Section - Top' : position === 'hero-bottom' ? 'Hero Section - Bottom' : position === 'footer-top' ? 'Footer Top' : 'Footer Bottom' },
                    { label: 'File Name', value: 'hero_banner_2025.jpg' },
                    { label: 'File Size', value: '2.35 MB' },
                    { label: 'Dimensions', value: '1920 × 600 px' },
                    { label: 'Format', value: 'JPG' },
                    { label: 'Display On', value: 'Desktop, Tablet' },
                    { label: 'Start Date', value: 'May 10, 2025' },
                    { label: 'End Date', value: 'Jun 10, 2025' },
                    { label: 'Status', value: statusActive ? 'Active' : 'Paused' },
                    { label: 'Ad Link', value: 'xtube.com/summer-sale' },
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
                    { icon: ArrowUpFromLine, label: 'Create Hero Ad', desc: 'Hero section banner ads', color: '#ff1e1e', glowColor: 'rgba(255,30,30,0.15)', bgColor: 'from-red-500/10 to-red-600/5' },
                    { icon: ArrowDownFromLine, label: 'Create Footer Ad', desc: 'Footer section banner ads', color: '#f97316', glowColor: 'rgba(249,115,22,0.15)', bgColor: 'from-orange-500/10 to-orange-600/5' },
                    { icon: Megaphone, label: 'Manage Ads', desc: 'View, edit and manage ads', color: '#10b981', glowColor: 'rgba(16,185,129,0.15)', bgColor: 'from-emerald-500/10 to-emerald-600/5' },
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

            {/* Performance Overview */}
            <div className="overflow-hidden rounded-xl border border-white/5 bg-[#0B0B0F]/80">
              <div className="p-3 lg:p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-white">Performance Overview</h2>
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
                        5.42M
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
            HERO / FOOTER ADS LIST TABLE
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
              <h2 className="text-base font-bold text-white">Hero / Footer Ads List</h2>
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
                    {['Preview', 'Ad Title', 'Type', 'Placement', 'Size', 'Impressions', 'CTR', 'Revenue', 'Status', 'Actions'].map((h) => (
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
                          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/[0.02]" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            {ad.adType === 'image' ? (
                              <ImageIcon className="h-3 w-3 text-white/20" />
                            ) : (
                              <Code2 className="h-3 w-3 text-white/20" />
                            )}
                          </div>
                          <div className="absolute top-0.5 right-0.5 rounded bg-black/50 px-0.5 text-[5px] text-white/40">
                            {sectionTab === 'hero' ? 'H' : 'F'}
                          </div>
                        </div>
                      </td>
                      {/* Ad Title */}
                      <td className="py-2 pr-3">
                        <p className="text-xs font-medium text-white">{ad.title}</p>
                      </td>
                      {/* Type */}
                      <td className="py-2 pr-3">
                        <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${ad.adType === 'image' ? typeStyles.Image : typeStyles.HTML5}`}>
                          {ad.adType === 'image' ? <ImageIcon className="h-2.5 w-2.5" /> : <Code2 className="h-2.5 w-2.5" />}
                          {ad.adType === 'image' ? 'Image' : 'HTML5'}
                        </span>
                      </td>
                      {/* Placement */}
                      <td className="py-2 pr-3">
                        <span className={`inline-flex items-center gap-1 text-xs ${sectionTab === 'hero' ? 'text-red-400/70' : 'text-purple-400/70'}`}>
                          {sectionTab === 'hero' ? <ArrowUpFromLine className="h-2.5 w-2.5" /> : <ArrowDownFromLine className="h-2.5 w-2.5" />}
                          {sectionTab === 'hero' ? 'Hero' : 'Footer'}
                        </span>
                      </td>
                      {/* Size */}
                      <td className="py-2 pr-3">
                        <span className="text-xs text-white/50">{ad.adType || '—'}</span>
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
                        <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium ${ad.isActive ? statusStyles.Active : statusStyles.Paused}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${ad.isActive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                          {ad.isActive ? 'Active' : 'Paused'}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="py-2">
                        <div className="flex items-center gap-1">
                          <button onClick={() => (sectionTab === 'hero' ? toggleHeroAd : toggleFooterAd)(ad.id)} className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-white/10 hover:text-white" title={ad.isActive ? 'Pause' : 'Activate'}>
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-white/10 hover:text-white" title="Analytics">
                            <BarChart3 className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => { if (confirm('Delete this ad?')) (sectionTab === 'hero' ? deleteHeroAd : deleteFooterAd)(ad.id) }} className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-red-500/10 hover:text-red-400" title="Delete">
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
                <span className="text-[10px] text-white/30">1–6 of 28</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                {[1, 2, 3].map((page) => (
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
                  onClick={() => setCurrentPage(Math.min(3, currentPage + 1))}
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
