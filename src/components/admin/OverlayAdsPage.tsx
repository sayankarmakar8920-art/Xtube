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
  Monitor,
  Tablet,
  Smartphone,
  Code,
  Type,
  Zap,
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
import { useAdsManager, type AdItem } from '@/hooks/useAdsManager'
import { uploadFile } from '@/lib/storage/upload-helper'
import { toast } from 'sonner'

// ─── Types ───────────────────────────────────────────────────────────────────

type UploadStage = 'idle' | 'uploading' | 'processing' | 'success'
type AdTab = 'image' | 'html5' | 'text'
type OverlayPosition = 'top-left' | 'top-center' | 'top-right' | 'middle-left' | 'center' | 'middle-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'

interface OverlayAd {
  id: string
  name: string
  type: 'Image' | 'HTML5'
  placement: string
  impressions: string
  ctr: string
  revenue: string
  status: 'Active' | 'Paused' | 'Draft'
  gradient: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STAT_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#EC4899', '#F59E0B']
const DONUT_COLORS = ['#3B82F6', '#8B5CF6']

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
  '00:01', '00:02', '00:03', '00:04', '00:05',
  '00:06', '00:07', '00:08', '00:09', '00:10',
]

const positionOptions: { id: OverlayPosition; label: string }[] = [
  { id: 'top-left', label: 'TL' },
  { id: 'top-center', label: 'TC' },
  { id: 'top-right', label: 'TR' },
  { id: 'middle-left', label: 'ML' },
  { id: 'center', label: 'C' },
  { id: 'middle-right', label: 'MR' },
  { id: 'bottom-left', label: 'BL' },
  { id: 'bottom-center', label: 'BC' },
  { id: 'bottom-right', label: 'BR' },
]

const positionLabels: Record<OverlayPosition, string> = {
  'top-left': 'Top Left',
  'top-center': 'Top Center',
  'top-right': 'Top Right',
  'middle-left': 'Middle Left',
  'center': 'Center',
  'middle-right': 'Middle Right',
  'bottom-left': 'Bottom Left',
  'bottom-center': 'Bottom Center',
  'bottom-right': 'Bottom Right',
}

const mockAds: OverlayAd[] = [
  {
    id: '1',
    name: 'Nike Air Max Overlay Ad',
    type: 'Image',
    placement: 'Overlay (Bottom Center)',
    impressions: '1.24M',
    ctr: '5.82%',
    revenue: '$3,845.20',
    status: 'Active',
    gradient: 'from-orange-900/60 via-red-800/40 to-amber-900/30',
  },
  {
    id: '2',
    name: 'Samsung Galaxy Overlay',
    type: 'HTML5',
    placement: 'Overlay (Bottom Right)',
    impressions: '986.5K',
    ctr: '4.92%',
    revenue: '$2,950.30',
    status: 'Active',
    gradient: 'from-blue-900/60 via-indigo-800/40 to-violet-900/30',
  },
  {
    id: '3',
    name: 'BMW Car Overlay Ad',
    type: 'Image',
    placement: 'Overlay (Top Right)',
    impressions: '845.2K',
    ctr: '5.14%',
    revenue: '$2,650.10',
    status: 'Active',
    gradient: 'from-cyan-900/60 via-sky-800/40 to-blue-900/30',
  },
  {
    id: '4',
    name: 'Summer Sale Overlay',
    type: 'Image',
    placement: 'Overlay (Center)',
    impressions: '1.12M',
    ctr: '6.24%',
    revenue: '$3,800.00',
    status: 'Active',
    gradient: 'from-emerald-900/60 via-teal-800/40 to-cyan-900/30',
  },
  {
    id: '5',
    name: 'Adidas Sport Overlay',
    type: 'HTML5',
    placement: 'Overlay (Bottom Left)',
    impressions: '424.8K',
    ctr: '4.36%',
    revenue: '$1,424.50',
    status: 'Paused',
    gradient: 'from-rose-900/60 via-pink-800/40 to-red-900/30',
  },
  {
    id: '6',
    name: 'Apple iPhone Overlay Ad',
    type: 'Image',
    placement: 'Overlay (Top Left)',
    impressions: '299.5K',
    ctr: '5.68%',
    revenue: '$1,575.50',
    status: 'Draft',
    gradient: 'from-violet-900/60 via-purple-800/40 to-fuchsia-900/30',
  },
]

const donutData = [
  { name: 'Image Ads', value: 3440000 },
  { name: 'HTML5 Ads', value: 1480000 },
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
      <div className="absolute left-0 top-0 h-[2px] w-full" style={{ background: `linear-gradient(to right, ${color}, transparent)` }} />
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

// ─── Position Selector ───────────────────────────────────────────────────────

function PositionSelector({
  selected,
  onSelect,
}: {
  selected: OverlayPosition
  onSelect: (pos: OverlayPosition) => void
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-white/60">Position</p>
      <div className="grid grid-cols-3 gap-1.5">
        {positionOptions.map((pos) => (
          <motion.button
            key={pos.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(pos.id)}
            className={`relative flex h-9 items-center justify-center rounded-lg border text-[10px] font-semibold transition-all ${
              selected === pos.id
                ? 'border-[#FF0000]/40 bg-[#FF0000]/10 text-white shadow-[0_0_8px_rgba(255,0,0,0.15)]'
                : 'border-[#1A1A1A] bg-white/[0.02] text-white/40 hover:border-white/20 hover:text-white/60'
            }`}
          >
            {pos.label}
            {selected === pos.id && (
              <motion.div
                layoutId="position-indicator"
                className="absolute inset-0 rounded-lg border border-[#FF0000]/30"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        ))}
      </div>
      <p className="mt-1.5 text-[10px] text-white/25">
        Selected: <span className="text-white/50">{positionLabels[selected]}</span>
      </p>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function OverlayAdsPage() {
  const { ads, loading, createAd, updateAd, deleteAd, toggleAd } = useAdsManager({ type: 'overlay' })

  // Upload state
  const [uploadStage, setUploadStage] = useState<UploadStage>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadSpeed, setUploadSpeed] = useState('0 MB/s')
  const [uploadRemaining, setUploadRemaining] = useState('')
  const [uploadedSize, setUploadedSize] = useState('0 MB')
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedThumbnail, setSelectedThumbnail] = useState(0)
  const [adTab, setAdTab] = useState<AdTab>('image')
  const [isPlaying, setIsPlaying] = useState(false)

  // Overlay-specific state
  const [selectedPosition, setSelectedPosition] = useState<OverlayPosition>('bottom-center')
  const [adSize, setAdSize] = useState('medium')
  const [autoClose, setAutoClose] = useState('10')
  const [displayDesktop, setDisplayDesktop] = useState(true)
  const [displayTablet, setDisplayTablet] = useState(true)
  const [displayMobile, setDisplayMobile] = useState(false)

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
  const [newAdTitle, setNewAdTitle] = useState('')
  const [linkUrl, setLinkUrl] = useState('')

  const handleFileProcess = useCallback(async (file: File) => {
    if (!file) return
    setMediaFile(file)
    setUploadStage('uploading')
    setUploadProgress(0)

    try {
      const category = 'ad'
      const uploadRes = await uploadFile(file, category, file.name, (progress, speed, remaining) => {
        setUploadProgress(progress)
        setUploadSpeed(speed || '0 MB/s')
        setUploadRemaining(remaining || '')
        const uploaded = (progress / 100) * file.size
        setUploadedSize(`${(uploaded / (1024 * 1024)).toFixed(1)} MB`)
      })

      setMediaUrl(uploadRes.url)
      setThumbnailUrl(uploadRes.url)
      setUploadStage('success')
      toast.success('Ad file uploaded successfully!')
    } catch (err) {
      console.error('Ad upload failed:', err)
      setUploadStage('idle')
      setMediaFile(null)
      toast.error(`Upload failed: ${err instanceof Error ? err.message : String(err)}`)
    }
  }, [])

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

  const resetForm = useCallback(() => {
    setNewAdTitle('')
    setLinkUrl('')
    setSelectedPosition('bottom-center')
    setAdSize('medium')
    setAutoClose('10')
    setDisplayDesktop(true)
    setDisplayTablet(true)
    setDisplayMobile(false)
    setEditingAd(null)
    handleResetUpload()
  }, [handleResetUpload])

  const handleEdit = useCallback((ad: AdItem) => {
    setEditingAd(ad)
    setNewAdTitle(ad.title)
    setLinkUrl(ad.linkUrl || '')
    setSelectedPosition(ad.position as OverlayPosition)
    setAdTab(ad.mediaFormat === 'html5' ? 'html5' : ad.mediaFormat === 'text' ? 'text' : 'image')
    setMediaUrl(ad.mediaUrl || '')
    setThumbnailUrl(ad.imageUrl || '')
    setUploadStage('success')
  }, [])

  const handleSave = useCallback(async () => {
    if (!newAdTitle.trim()) {
      toast.error('Please enter an ad title')
      return
    }
    if (!mediaUrl && adTab !== 'text' && !editingAd) {
      toast.error('Please upload an ad media file first')
      return
    }
    setSaving(true)
    try {
      const targetFormat = adTab === 'html5' ? 'html5' : adTab === 'text' ? 'text' : 'jpg'
      const adData = {
        type: 'overlay',
        position: selectedPosition,
        title: newAdTitle.trim(),
        imageUrl: thumbnailUrl || mediaUrl || '',
        mediaUrl: mediaUrl || '',
        mediaFormat: targetFormat,
        linkUrl: linkUrl.trim() || null,
        skipAfter: parseInt(autoClose) || 10,
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
      console.error('Error saving overlay ad:', err)
      toast.error('Failed to save overlay ad')
    } finally {
      setSaving(false)
    }
  }, [newAdTitle, mediaUrl, adTab, selectedPosition, thumbnailUrl, linkUrl, autoClose, editingAd, updateAd, createAd, resetForm])

  // Filtered & display computed ads
  const displayAds = useMemo(() => ads.map((ad) => ({
    ...ad,
    name: ad.title,
    type: (ad.mediaFormat === 'html5' ? 'HTML5' : ad.mediaFormat === 'text' ? 'Text' : 'Image') as 'Image' | 'HTML5' | 'Text',
    placement: `Overlay (${positionLabels[ad.position as OverlayPosition] || ad.position})`,
    impressions: formatNumber(ad.impressions),
    ctr: ad.impressions > 0 ? `${((ad.clicks / ad.impressions) * 100).toFixed(2)}%` : '0.00%',
    revenue: formatCurrency(ad.revenue),
    status: (ad.isActive ? 'Active' : 'Paused') as 'Active' | 'Paused',
    gradient: thumbnailGradients[ad.title.length % thumbnailGradients.length],
  })), [ads])

  const filteredAds = displayAds.filter((ad) => {
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
    Image: 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20',
    HTML5: 'bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/20',
  }

  // Pagination
  const adsPerPage = 10
  const totalPages = Math.max(1, Math.ceil(filteredAds.length / adsPerPage))
  const paginatedAds = filteredAds.slice((currentPage - 1) * adsPerPage, currentPage * adsPerPage)

  // Position styles for the preview overlay
  const positionClasses: Record<OverlayPosition, string> = {
    'top-left': 'top-2 left-2',
    'top-center': 'top-2 left-1/2 -translate-x-1/2',
    'top-right': 'top-2 right-2',
    'middle-left': 'top-1/2 -translate-y-1/2 left-2',
    'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
    'middle-right': 'top-1/2 -translate-y-1/2 right-2',
    'bottom-left': 'bottom-12 left-2',
    'bottom-center': 'bottom-12 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-12 right-2',
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
          <div>
            <h1 className="text-xl font-bold text-white md:text-2xl">Overlay Ads</h1>
            <p className="mt-1 text-sm text-white/40">Create, preview and manage overlay ads for video content</p>
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
              + Create Overlay Ad
            </motion.button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            TOP ANALYTICS CARDS (5 cards)
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard title="Total Overlay Ads" value="41" change="+13.6%" icon={Megaphone} color={STAT_COLORS[0]} delay={0} index={0} />
          <StatCard title="Active Ads" value="33" change="+12.3%" icon={Radio} color={STAT_COLORS[1]} delay={0.05} index={1} />
          <StatCard title="Impressions" value="4.92M" change="+19.4%" icon={Eye} color={STAT_COLORS[2]} delay={0.1} index={2} />
          <StatCard title="CTR" value="5.23%" change="+7.8%" icon={MousePointer} color={STAT_COLORS[3]} delay={0.15} index={3} />
          <StatCard title="Revenue" value="$13,245.60" change="+16.1%" icon={DollarSign} color={STAT_COLORS[4]} delay={0.2} index={4} />
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            THREE COLUMN LAYOUT
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr_300px] 2xl:grid-cols-[1fr_1fr_340px]">
          {/* ── LEFT: Create Overlay Ad ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="overflow-hidden rounded-[18px] border border-[#1A1A1A] bg-[#0B0B0F]"
          >
            <div className="p-3 lg:p-4">
              <h2 className="mb-4 text-base font-bold text-white">Create Overlay Ad</h2>

              {/* Ad Title */}
              <div className="mb-4">
                <p className="mb-1.5 text-xs font-medium text-white/60">Ad Title</p>
                <input
                  type="text"
                  value={newAdTitle}
                  onChange={(e) => setNewAdTitle(e.target.value)}
                  placeholder="Enter overlay ad title..."
                  className="h-8 w-full rounded-[12px] border border-[#1A1A1A] bg-[#050505] px-3 text-xs text-white placeholder:text-white/25 outline-none focus:border-[#FF0000]/40"
                />
              </div>

              {/* Tabs */}
              <div className="mb-4 flex items-center gap-0 border-b border-[#1A1A1A]">
                <button
                  onClick={() => setAdTab('image')}
                  className={`relative flex items-center gap-2 px-3 pb-2.5 text-sm font-medium transition-colors ${
                    adTab === 'image' ? 'text-white' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  Image Ad
                  {adTab === 'image' && (
                    <motion.div layoutId="overlay-tab-indicator" className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[#FF0000]" transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
                  )}
                </button>
                <button
                  onClick={() => setAdTab('html5')}
                  className={`relative flex items-center gap-2 px-3 pb-2.5 text-sm font-medium transition-colors ${
                    adTab === 'html5' ? 'text-white' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  <Code className="h-3.5 w-3.5" />
                  HTML5 Ad
                  {adTab === 'html5' && (
                    <motion.div layoutId="overlay-tab-indicator" className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[#FF0000]" transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
                  )}
                </button>
                <button
                  onClick={() => setAdTab('text')}
                  className={`relative flex items-center gap-2 px-3 pb-2.5 text-sm font-medium transition-colors ${
                    adTab === 'text' ? 'text-white' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  <Type className="h-3.5 w-3.5" />
                  Text Ad
                  {adTab === 'text' && (
                    <motion.div layoutId="overlay-tab-indicator" className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[#FF0000]" transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
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
                    className={`relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-3 rounded-[18px] border-2 border-dashed transition-all duration-200 ${
                      isDragOver
                        ? 'border-[#FF0000] bg-[#FF0000]/5 shadow-[0_0_20px_rgba(255,0,0,0.15)]'
                        : 'border-[#1A1A1A] bg-[#050505]/60 hover:border-white/20'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={adTab === 'image' ? 'image/png,image/jpeg,image/gif,image/webp' : adTab === 'html5' ? '.html,.htm' : 'text/plain,.txt'}
                      className="hidden"
                      onChange={(e) => { if (e.target.files?.length) handleFileProcess(e.target.files[0]) }}
                    />
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF0000]/10">
                      <CloudUpload className="h-6 w-6 text-[#FF0000]" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-white">Drag &amp; drop your {adTab === 'image' ? 'image' : adTab === 'html5' ? 'HTML5' : 'text'} here</p>
                      <p className="mt-1 text-xs text-white/40">
                        or <span className="text-[#FF0000] underline underline-offset-2">click to browse files</span>
                      </p>
                    </div>
                    <p className="text-[10px] text-white/25">
                      Max: 5GB | Supported: {adTab === 'image' ? 'JPG, PNG, GIF, WebP' : adTab === 'html5' ? 'HTML5' : 'Plain Text'}
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
                        {uploadStage === 'processing' ? 'Processing...' : (mediaFile?.name || 'Overlay_Banner_Ad.png')}
                      </span>
                      <span className="text-xs font-bold text-[#FF0000]">{Math.round(uploadProgress)}%</span>
                    </div>
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
                            <p className="text-xs font-semibold text-white">{uploadedSize} / 5.00 MB</p>
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
                        <span>Generating thumbnails and processing overlay...</span>
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
                        <p className="truncate text-xs font-medium text-white">
                          {mediaFile?.name || editingAd?.title || 'Ad File Uploaded'}
                        </p>
                        <p className="text-[10px] text-white/30">
                          {mediaFile
                            ? `${(mediaFile.size / (1024 * 1024)).toFixed(2)} MB • ${mediaFile.type}`
                            : editingAd
                            ? `Existing Ad • Format: ${editingAd.mediaFormat}`
                            : '2.25 MB • PNG'}
                        </p>
                      </div>
                      <button onClick={handleResetUpload} className="text-xs text-[#FF0000] hover:text-red-400">Change</button>
                    </div>

                    {/* Thumbnails */}
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-medium text-white/60">Thumbnail <span className="text-[#FF0000]">(10 auto-generated)</span></p>
                        <button className="text-[10px] text-[#FF0000] hover:text-red-400">Upload Manually</button>
                      </div>
                      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                        {thumbnailGradients.map((gradient, i) => (
                          <button
                            key={i}
                            onClick={() => setSelectedThumbnail(i)}
                            className={`relative flex-shrink-0 h-12 w-16 overflow-hidden rounded border-2 transition-all ${
                              selectedThumbnail === i
                                ? 'border-[#FF0000] shadow-[0_0_8px_rgba(255,0,0,0.3)]'
                                : 'border-transparent hover:border-white/20'
                            }`}
                          >
                            <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <ImageIcon className="h-3 w-3 text-white/15" />
                            </div>
                            {selectedThumbnail === i && (
                              <div className="absolute top-0.5 right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-[#FF0000]">
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

              {/* Position Selector */}
              <div className="mt-4">
                <PositionSelector selected={selectedPosition} onSelect={setSelectedPosition} />
              </div>

              {/* Size + Auto Close Row */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="mb-1.5 text-xs font-medium text-white/60">Size</p>
                  <Select value={adSize} onValueChange={setAdSize}>
                    <SelectTrigger className="h-8 w-full rounded-[12px] border-[#1A1A1A] bg-[#050505] text-xs text-white/60 [&_svg]:text-white/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-[#1A1A1A] bg-[#0B0B0F]">
                      <SelectItem value="small" className="text-xs text-white focus:bg-white/5">Small (180×150)</SelectItem>
                      <SelectItem value="medium" className="text-xs text-white focus:bg-white/5">Medium (300×250)</SelectItem>
                      <SelectItem value="large" className="text-xs text-white focus:bg-white/5">Large (728×90)</SelectItem>
                      <SelectItem value="leaderboard" className="text-xs text-white focus:bg-white/5">Leaderboard (728×90)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-medium text-white/60">Auto Close</p>
                  <Select value={autoClose} onValueChange={setAutoClose}>
                    <SelectTrigger className="h-8 w-full rounded-[12px] border-[#1A1A1A] bg-[#050505] text-xs text-white/60 [&_svg]:text-white/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-[#1A1A1A] bg-[#0B0B0F]">
                      <SelectItem value="5" className="text-xs text-white focus:bg-white/5">5 sec</SelectItem>
                      <SelectItem value="10" className="text-xs text-white focus:bg-white/5">10 sec</SelectItem>
                      <SelectItem value="15" className="text-xs text-white focus:bg-white/5">15 sec</SelectItem>
                      <SelectItem value="20" className="text-xs text-white focus:bg-white/5">20 sec</SelectItem>
                      <SelectItem value="30" className="text-xs text-white focus:bg-white/5">30 sec</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Display On Checkboxes */}
              <div className="mt-4">
                <p className="mb-2 text-xs font-medium text-white/60">Display On</p>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div
                      onClick={() => setDisplayDesktop(!displayDesktop)}
                      className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-all ${
                        displayDesktop
                          ? 'border-[#FF0000]/40 bg-[#FF0000]/10 text-[#FF0000]'
                          : 'border-[#1A1A1A] bg-white/[0.02] text-white/30 hover:border-white/20'
                      }`}
                    >
                      <Monitor className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-[10px] text-white/50 group-hover:text-white/70">Desktop</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div
                      onClick={() => setDisplayTablet(!displayTablet)}
                      className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-all ${
                        displayTablet
                          ? 'border-[#FF0000]/40 bg-[#FF0000]/10 text-[#FF0000]'
                          : 'border-[#1A1A1A] bg-white/[0.02] text-white/30 hover:border-white/20'
                      }`}
                    >
                      <Tablet className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-[10px] text-white/50 group-hover:text-white/70">Tablet</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div
                      onClick={() => setDisplayMobile(!displayMobile)}
                      className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-all ${
                        displayMobile
                          ? 'border-[#FF0000]/40 bg-[#FF0000]/10 text-[#FF0000]'
                          : 'border-[#1A1A1A] bg-white/[0.02] text-white/30 hover:border-white/20'
                      }`}
                    >
                      <Smartphone className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-[10px] text-white/50 group-hover:text-white/70">Mobile</span>
                  </label>
                </div>
              </div>

              {/* Link URL */}
              <div className="mt-4 mb-4">
                <p className="mb-1.5 text-xs font-medium text-white/60">Redirect Link URL (Optional)</p>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com/promo"
                  className="h-8 w-full rounded-[12px] border border-[#1A1A1A] bg-[#050505] px-3 text-xs text-white placeholder:text-white/25 outline-none focus:border-[#FF0000]/40"
                />
              </div>

              {/* Save / Cancel buttons */}
              <div className="flex gap-2 mt-5">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 rounded-[12px] border border-[#1A1A1A] bg-white/5 py-2 text-xs font-medium text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={saving ? {} : { scale: 1.02, boxShadow: '0 0 25px rgba(255,0,0,0.4)' }}
                  whileTap={saving ? {} : { scale: 0.98 }}
                  disabled={saving}
                  onClick={handleSave}
                  className="flex-1 rounded-[12px] bg-[#FF0000] py-2 text-xs font-semibold text-white shadow-[0_0_15px_rgba(255,0,0,0.3)] transition-all hover:bg-red-600 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingAd ? 'Update Ad' : 'Save Ad'}
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
            <div className="overflow-hidden rounded-[18px] border border-[#1A1A1A] bg-[#0B0B0F]">
              <div className="p-3 lg:p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-bold text-white">Ad Preview</h2>
                  <span className="text-xs text-white/30">Nike Air Max Overlay</span>
                </div>

                {/* Player with overlay */}
                <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
                  {/* Video background scene */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1a2a4a] via-[#0d1b2a] to-[#0a1628]" />
                  {/* Subtle video content */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center opacity-20">
                      <Film className="h-10 w-10 text-white mx-auto mb-2" />
                      <p className="text-xs text-white">Video Content Playing</p>
                    </div>
                  </div>

                  {/* ── Overlay Ad ── */}
                  <motion.div
                    layout
                    className={`absolute ${positionClasses[selectedPosition]} z-10`}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`overflow-hidden rounded-lg border border-white/10 bg-[#0B0B0F]/90 shadow-[0_0_20px_rgba(0,0,0,0.6)] ${
                        selectedPosition.includes('bottom') || selectedPosition.includes('middle') ? 'w-40' : 'w-36'
                      }`}
                    >
                      {/* Overlay gradient top */}
                      <div className="h-[2px] w-full bg-gradient-to-r from-[#FF0000] to-orange-500" />
                      <div className="p-3 text-center">
                        <p className="text-[8px] font-bold tracking-wider text-white/40 mb-1">NEW ARRIVAL</p>
                        <p className="text-[11px] font-bold text-white leading-tight">NIKE AIR MAX</p>
                        <p className="text-[10px] font-bold text-[#FF0000] mt-0.5">50% OFF</p>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="mt-2 rounded bg-[#FF0000] px-3 py-1 text-[8px] font-bold text-white shadow-[0_0_8px_rgba(255,0,0,0.3)]"
                        >
                          SHOP NOW
                        </motion.button>
                      </div>
                    </motion.div>
                  </motion.div>

                  {/* Countdown */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded-md bg-[#FF0000]/20 px-2 py-1 border border-[#FF0000]/30 z-20">
                    <span className="text-[9px] font-bold text-white">Ad</span>
                    <span className="text-[9px] text-white/60">10s</span>
                  </div>

                  {/* Bottom controls */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-2 pt-6 z-20">
                    <div className="group/progress relative mb-1.5 h-1 cursor-pointer rounded-full bg-white/20">
                      <div className="absolute left-0 top-0 h-full w-[55%] rounded-full bg-[#FF0000]" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setIsPlaying(!isPlaying)} className="text-white/70 hover:text-white">
                          {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                        </button>
                        <button className="text-white/70 hover:text-white"><Volume2 className="h-3.5 w-3.5" /></button>
                        <span className="text-[10px] text-white/50">03:42 / 06:18</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="text-white/70 hover:text-white"><Settings className="h-3.5 w-3.5" /></button>
                        <button className="text-white/70 hover:text-white"><Maximize className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ad Details */}
                <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
                  {[
                    { label: 'Placement', value: 'Overlay (During Video)' },
                    { label: 'File', value: 'Overlay_Banner_Ad.png' },
                    { label: 'Resolution', value: '300×250' },
                    { label: 'File Size', value: '2.25 MB' },
                    { label: 'Format', value: 'PNG' },
                    { label: 'Auto Close', value: `${autoClose} sec` },
                    { label: 'Position', value: positionLabels[selectedPosition] },
                    { label: 'Display On', value: `${displayDesktop ? 'Desktop' : ''}${displayDesktop && displayTablet ? ', ' : ''}${displayTablet ? 'Tablet' : ''}${displayTablet && displayMobile ? ', ' : ''}${displayMobile ? 'Mobile' : ''}` },
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
                    { icon: ImageIcon, label: 'Create Image Overlay Ad', desc: 'Upload image ad up to 5GB', color: '#FF0000', bgColor: 'from-red-500/10 to-red-600/5' },
                    { icon: Code, label: 'Create HTML5 Overlay Ad', desc: 'Upload HTML5 ad', color: '#8B5CF6', bgColor: 'from-purple-500/10 to-purple-600/5' },
                    { icon: Megaphone, label: 'Manage Overlay Ads', desc: 'View, edit and manage ads', color: '#00FF85', bgColor: 'from-emerald-500/10 to-emerald-600/5' },
                    { icon: BarChart3, label: 'Ad Performance', desc: 'View analytics and reports', color: '#F59E0B', bgColor: 'from-orange-500/10 to-orange-600/5' },
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
                        4.92M
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
            OVERLAY ADS LIST TABLE
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
              <h2 className="text-base font-bold text-white">Overlay Ads List</h2>
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
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-[#1A1A1A]">
                    {['Preview', 'Ad Name', 'Type', 'Placement', 'Impressions', 'CTR', 'Revenue', 'Status', 'Actions'].map((h) => (
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
                        <div className={`relative h-10 w-14 overflow-hidden rounded-md bg-gradient-to-br ${ad.gradient}`}>
                          <div className="absolute inset-0 flex items-center justify-center">
                            {ad.type === 'Image' ? (
                              <ImageIcon className="h-3.5 w-3.5 text-white/20" />
                            ) : (
                              <Code className="h-3.5 w-3.5 text-white/20" />
                            )}
                          </div>
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
                          <button onClick={() => handleEdit(ad)} className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-white/5 hover:text-white" title="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => toggleAd(ad.id)} className={`rounded-md p-1.5 transition-colors ${ad.status === 'Active' ? 'text-amber-400/50 hover:bg-amber-500/10 hover:text-amber-400' : 'text-emerald-400/50 hover:bg-emerald-500/10 hover:text-emerald-400'}`} title={ad.status === 'Active' ? 'Pause' : 'Activate'}>
                            <Zap className="h-3.5 w-3.5" />
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
