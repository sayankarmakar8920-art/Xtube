'use client'

import { useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Upload,
  Trash2,
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
  Bell,
  Plus,
  LayoutGrid,
  Layers,
  Play,
  Loader2,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts'
import { useAdsManager, type AdItem } from '@/hooks/useAdsManager'

// ─── Types ───────────────────────────────────────────────────────────────────

type AdType = 'Banner' | 'Popup' | 'Hero/Footer' | 'Pre-Roll' | 'Mid-Roll' | 'Post-Roll' | 'Overlay' | 'Image Banner'

// ─── Constants ───────────────────────────────────────────────────────────────

const STAT_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#ec4899', '#f97316']

const AD_TYPE_COLORS: Record<AdType, string> = {
  'Banner': '#3b82f6',
  'Popup': '#ec4899',
  'Hero/Footer': '#8b5cf6',
  'Pre-Roll': '#f97316',
  'Mid-Roll': '#06b6d4',
  'Post-Roll': '#8b5cf6',
  'Overlay': '#eab308',
  'Image Banner': '#10b981',
}

const AD_TYPE_STYLES: Record<AdType, string> = {
  'Banner': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Popup': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  'Hero/Footer': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Pre-Roll': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'Mid-Roll': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'Post-Roll': 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  'Overlay': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  'Image Banner': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
}

// ─── Helper functions ──────────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toLocaleString()
}

function formatCurrency(n: number): string {
  return '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const REALTIME_POSITION_MAP: Record<string, string> = {
  'hero': 'Hero Section',
  'sidebar': 'Sidebar',
  'footer': 'Footer',
  'entry': 'Entry Popup',
  'exit': 'Exit Popup',
  'timed': 'Timed Popup',
  'pre-roll': 'Pre-Roll (Before Video)',
  'mid-roll': 'Mid-Roll (During Video)',
  'post-roll': 'Post-Roll (After Video)',
}

function getDisplayType(ad: AdItem): AdType {
  if (ad.type === 'video') {
    if (ad.position === 'mid-roll') return 'Mid-Roll'
    if (ad.position === 'post-roll') return 'Post-Roll'
    return 'Pre-Roll'
  }
  if (ad.type === 'banner') return 'Banner'
  if (ad.type === 'popup') return 'Popup'
  if (ad.type === 'overlay') return 'Overlay'
  return 'Banner'
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

function StatCard({ title, value, change, icon: Icon, color, delay, index }: {
  title: string; value: string; change: string; icon: React.ElementType; color: string; delay: number; index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
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

export function AllAdsPage() {
  const { ads: realAds, loading: adsLoading, deleteAd, toggleAd, createAd, updateAd } = useAdsManager()
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTypeFilter, setActiveTypeFilter] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newAd, setNewAd] = useState({ title: '', type: 'banner', position: 'hero', imageUrl: '', linkUrl: '', startDate: '', endDate: '', frequency: '0' })

  // ─── Computed stats from real data ──────────────────────────────────
  const totalAds = realAds.length
  const activeAds = realAds.filter(a => a.isActive).length
  const totalImpressions = realAds.reduce((s, a) => s + a.impressions, 0)
  const totalClicks = realAds.reduce((s, a) => s + a.clicks, 0)
  const totalRevenue = realAds.reduce((s, a) => s + a.revenue, 0)
  const overallCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) + '%' : '0%'

  // ─── Donut data from real ad type distribution ──────────────────────
  const donutData = useMemo(() => {
    const counts: Record<string, number> = {}
    realAds.forEach(ad => {
      const displayType = getDisplayType(ad)
      counts[displayType] = (counts[displayType] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({
      name: name + ' Ads',
      value,
      color: AD_TYPE_COLORS[name as AdType] || '#6b7280',
    }))
  }, [realAds])

  // ─── Impressions & Revenue chart data from real ads ────────────────
  const impressionsData = useMemo(() => {
    const byDate: Record<string, number> = {}
    realAds.forEach(ad => {
      const d = new Date(ad.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
      byDate[d] = (byDate[d] || 0) + ad.impressions
    })
    return Object.entries(byDate).map(([date, value]) => ({ date, value }))
  }, [realAds])

  const revenueData = useMemo(() => {
    const byDate: Record<string, number> = {}
    realAds.forEach(ad => {
      const d = new Date(ad.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
      byDate[d] = (byDate[d] || 0) + ad.revenue
    })
    return Object.entries(byDate).map(([date, value]) => ({ date, value }))
  }, [realAds])

  // ─── Filtered Ads ──────────────────────────────────────────────────────

  const filteredAds = useMemo(() => {
    return realAds.filter((ad) => {
      const displayStatus = ad.isActive ? 'active' : 'paused'
      if (statusFilter !== 'all' && displayStatus !== statusFilter) return false
      if (activeTypeFilter !== 'all') {
        const displayType = getDisplayType(ad)
        const typeMap: Record<string, string> = {
          'banner': 'Banner', 'popup': 'Popup', 'hero-footer': 'Hero/Footer',
          'pre-roll': 'Pre-Roll', 'mid-roll': 'Mid-Roll', 'post-roll': 'Post-Roll',
          'overlay': 'Overlay', 'image-banner': 'Image Banner',
        }
        if (displayType !== typeMap[activeTypeFilter]) return false
      }
      if (searchQuery && !ad.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [realAds, statusFilter, activeTypeFilter, searchQuery])

  // ─── Pagination ────────────────────────────────────────────────────
  const pageSize = 10
  const totalPages = Math.max(1, Math.ceil(filteredAds.length / pageSize))
  const paginatedAds = filteredAds.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handleCreateAd = useCallback(async () => {
    setCreating(true)
    const ok = await createAd({
      title: newAd.title,
      type: newAd.type,
      position: newAd.position,
      imageUrl: newAd.imageUrl || 'https://placehold.co/800x400/111/fff?text=Ad',
      linkUrl: newAd.linkUrl || null,
      startDate: newAd.startDate || null,
      endDate: newAd.endDate || null,
      frequency: Number(newAd.frequency) || 0,
      isActive: true,
    })
    setCreating(false)
    if (ok) {
      setShowCreateDialog(false)
      setNewAd({ title: '', type: 'banner', position: 'hero', imageUrl: '', linkUrl: '', startDate: '', endDate: '', frequency: '0' })
    }
  }, [createAd, newAd])

  const statusStyles: Record<string, string> = {
    Active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Paused: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  }

  const typeFilterButtons = [
    { key: 'all', label: 'All Ads' },
    { key: 'banner', label: 'Banner Ads' },
    { key: 'popup', label: 'Popup Ads' },
    { key: 'hero-footer', label: 'Hero/Footer' },
    { key: 'pre-roll', label: 'Pre-Roll' },
    { key: 'mid-roll', label: 'Mid-Roll' },
    { key: 'post-roll', label: 'Post-Roll' },
    { key: 'overlay', label: 'Overlay' },
    { key: 'image-banner', label: 'Image Banner' },
  ]

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
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ff0000]/10">
              <Megaphone className="h-5 w-5 text-[#ff0000]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white md:text-2xl">All Ads</h1>
              <p className="mt-0.5 text-sm text-white/40">Manage all ads across your platform</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0B0B0F]/60 px-3 py-2 text-xs font-medium text-white/60 transition-colors hover:border-white/20 hover:text-white">
              <Clock className="h-3.5 w-3.5" />
              May 10 – Jun 10, 2025
            </button>
            <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0B0B0F]/60 px-3 py-2 text-xs font-medium text-white/60 transition-colors hover:border-white/20 hover:text-white">
              <Upload className="h-3.5 w-3.5" />
              Export Report
            </button>
            <button className="relative flex items-center gap-2 rounded-xl border border-white/10 bg-[#0B0B0F]/60 px-2.5 py-2 text-white/60 transition-colors hover:border-white/20 hover:text-white">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#ff0000] text-[8px] font-bold text-white">12</span>
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#ff0000] to-red-700 shadow-[0_0_12px_rgba(255,0,0,0.3)]">
              <span className="text-xs font-bold text-white">A</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: '0 0 25px rgba(255,0,0,0.4)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff0000] to-[#cc0000] px-4 py-2 text-sm font-semibold text-white shadow-[0_0_15px_rgba(255,0,0,0.3)] transition-all hover:from-[#ff1111] hover:to-[#dd0000]"
            >
              <Plus className="h-4 w-4" />
              Create New Ad
            </motion.button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            TOP ANALYTICS CARDS (5 cards)
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard title="Total Ads" value={String(totalAds)} change={`${activeAds} active`} icon={Megaphone} color={STAT_COLORS[0]} delay={0} index={0} />
          <StatCard title="Active Ads" value={String(activeAds)} change={`${totalAds - activeAds} paused`} icon={Radio} color={STAT_COLORS[1]} delay={0.05} index={1} />
          <StatCard title="Impressions" value={formatNumber(totalImpressions)} change="total" icon={Eye} color={STAT_COLORS[2]} delay={0.1} index={2} />
          <StatCard title="CTR" value={overallCtr} change="avg" icon={MousePointer} color={STAT_COLORS[3]} delay={0.15} index={3} />
          <StatCard title="Revenue" value={formatCurrency(totalRevenue)} change="total" icon={DollarSign} color={STAT_COLORS[4]} delay={0.2} index={4} />
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            CHARTS ROW: Donut + Impressions + Revenue
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr_1fr] xl:grid-cols-[340px_1fr_1fr]">
          {/* Ads Distribution Donut */}
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-xl border border-white/5 bg-[#0B0B0F]/80"
          >
            <div className="p-3 lg:p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold text-white">Ads Distribution</h2>
                <span className="text-[10px] text-white/30">{totalAds} Total Ads</span>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donutData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2} dataKey="value" stroke="none">
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" className="fill-white text-lg font-bold">{totalAds}</text>
                    <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" className="fill-white/30 text-[8px]">Total Ads</text>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const d = payload[0]
                        const total = donutData.reduce((s, e) => s + e.value, 0)
                        const pct = ((d.value as number) / total * 100).toFixed(0)
                        return (
                          <div className="rounded-lg border border-white/10 bg-[#111]/95 px-3 py-2 shadow-xl">
                            <p className="text-xs font-semibold text-white">{d.name}</p>
                            <p className="text-[10px] text-white/40">{d.value} ads ({pct}%)</p>
                          </div>
                        )
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div className="mt-3 space-y-1">
                {donutData.map((item) => {
                  const total = donutData.reduce((s, e) => s + e.value, 0)
                  const pct = ((item.value / total) * 100).toFixed(0)
                  return (
                    <div key={item.name} className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
                        <span className="text-white/50 truncate">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white/40">{item.value}</span>
                        <span className="font-medium text-white/60">{pct}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>

          {/* Impressions Overview */}
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-xl border border-white/5 bg-[#0B0B0F]/80"
          >
            <div className="p-3 lg:p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold text-white">Impressions Overview</h2>
                <Select value="30d" onValueChange={() => {}}>
                  <SelectTrigger className="h-6 w-24 rounded border-white/10 bg-[#0a0a0a] text-[10px] text-white/50 [&_svg]:text-white/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#111]">
                    <SelectItem value="7d" className="text-[10px] text-white focus:bg-white/5">Last 7 Days</SelectItem>
                    <SelectItem value="30d" className="text-[10px] text-white focus:bg-white/5">Last 30 Days</SelectItem>
                    <SelectItem value="90d" className="text-[10px] text-white focus:bg-white/5">Last 90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={impressionsData} barSize={14}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.25)' }} axisLine={false} tickLine={false} interval={3} />
                    <YAxis tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.25)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        return (
                          <div className="rounded-lg border border-white/10 bg-[#111]/95 px-3 py-2 shadow-xl">
                            <p className="text-[10px] text-white/40">{payload[0].payload.date}</p>
                            <p className="text-xs font-semibold text-white">{(payload[0].value as number).toLocaleString()} impressions</p>
                          </div>
                        )
                      }}
                    />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>

          {/* Revenue Overview */}
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-xl border border-white/5 bg-[#0B0B0F]/80"
          >
            <div className="p-3 lg:p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold text-white">Revenue Overview</h2>
                <Select value="30d" onValueChange={() => {}}>
                  <SelectTrigger className="h-6 w-24 rounded border-white/10 bg-[#0a0a0a] text-[10px] text-white/50 [&_svg]:text-white/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#111]">
                    <SelectItem value="7d" className="text-[10px] text-white focus:bg-white/5">Last 7 Days</SelectItem>
                    <SelectItem value="30d" className="text-[10px] text-white focus:bg-white/5">Last 30 Days</SelectItem>
                    <SelectItem value="90d" className="text-[10px] text-white focus:bg-white/5">Last 90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.25)' }} axisLine={false} tickLine={false} interval={3} />
                    <YAxis tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.25)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        return (
                          <div className="rounded-lg border border-white/10 bg-[#111]/95 px-3 py-2 shadow-xl">
                            <p className="text-[10px] text-white/40">{payload[0].payload.date}</p>
                            <p className="text-xs font-semibold text-white">${(payload[0].value as number).toLocaleString()}</p>
                          </div>
                        )
                      }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#f97316" strokeWidth={2} fill="url(#revenueGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            AD TYPE QUICK FILTERS
            ═══════════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1"
        >
          {typeFilterButtons.map((btn) => (
            <motion.button
              key={btn.key}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setActiveTypeFilter(btn.key); setCurrentPage(1) }}
              className={`relative flex-shrink-0 rounded-xl px-4 py-2 text-xs font-medium transition-all duration-200 ${
                activeTypeFilter === btn.key
                  ? 'bg-[#ff0000] text-white shadow-[0_0_15px_rgba(255,0,0,0.3)]'
                  : 'border border-white/10 bg-[#0B0B0F]/60 text-white/50 hover:border-white/20 hover:text-white/70'
              }`}
            >
              {btn.label}
              {activeTypeFilter === btn.key && (
                <motion.div
                  layoutId="ad-type-filter-glow"
                  className="absolute inset-0 rounded-xl bg-[#ff0000]/20 blur-md"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════════
            ALL ADS TABLE
            ═══════════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-xl border border-white/5 bg-[#0B0B0F]/80"
        >
          <div className="p-3 lg:p-4">
            {/* Table header */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-base font-bold text-white">All Ads List</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setCurrentPage(1) }}>
                  <SelectTrigger className="h-8 w-28 rounded-lg border-white/10 bg-[#0a0a0a] text-xs text-white/60 [&_svg]:text-white/30">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#111]">
                    <SelectItem value="all" className="text-xs text-white focus:bg-white/5">All Types</SelectItem>
                    <SelectItem value="banner" className="text-xs text-white focus:bg-white/5">Banner</SelectItem>
                    <SelectItem value="popup" className="text-xs text-white focus:bg-white/5">Popup</SelectItem>
                    <SelectItem value="hero-footer" className="text-xs text-white focus:bg-white/5">Hero/Footer</SelectItem>
                    <SelectItem value="pre-roll" className="text-xs text-white focus:bg-white/5">Pre-Roll</SelectItem>
                    <SelectItem value="mid-roll" className="text-xs text-white focus:bg-white/5">Mid-Roll</SelectItem>
                    <SelectItem value="post-roll" className="text-xs text-white focus:bg-white/5">Post-Roll</SelectItem>
                    <SelectItem value="overlay" className="text-xs text-white focus:bg-white/5">Overlay</SelectItem>
                    <SelectItem value="image-banner" className="text-xs text-white focus:bg-white/5">Image Banner</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1) }}>
                  <SelectTrigger className="h-8 w-28 rounded-lg border-white/10 bg-[#0a0a0a] text-xs text-white/60 [&_svg]:text-white/30">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#111]">
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
                    className="h-8 w-40 rounded-lg border border-white/10 bg-[#0a0a0a] pl-8 pr-3 text-xs text-white placeholder:text-white/25 outline-none focus:border-[#ff0000]/40"
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            {adsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-9 w-16 rounded-lg bg-white/5" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-32 rounded bg-white/5" />
                      <Skeleton className="h-2 w-20 rounded bg-white/5" />
                    </div>
                    <Skeleton className="h-5 w-14 rounded-md bg-white/5" />
                    <Skeleton className="h-3 w-16 rounded bg-white/5" />
                    <Skeleton className="h-3 w-12 rounded bg-white/5" />
                    <Skeleton className="h-3 w-14 rounded bg-white/5" />
                    <Skeleton className="h-3 w-10 rounded bg-white/5" />
                    <Skeleton className="h-3 w-16 rounded bg-white/5" />
                    <Skeleton className="h-5 w-14 rounded-md bg-white/5" />
                  </div>
                ))}
              </div>
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Preview', 'Ad Name', 'Type', 'Placement', 'Size / Duration', 'Impressions', 'CTR', 'Revenue', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="pb-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-white/25">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {paginatedAds.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-sm text-white/30">No ads found</td>
                    </tr>
                  )}
                  {paginatedAds.map((ad, i) => {
                    const displayType = getDisplayType(ad)
                    const displayStatus = ad.isActive ? 'Active' : 'Paused'
                    const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) + '%' : '0%'
                    const displayPosition = REALTIME_POSITION_MAP[ad.position] || ad.position
                    const sizeDuration = ad.type === 'video' && ad.adDuration ? `${String(Math.floor(ad.adDuration / 60)).padStart(2, '0')}:${String(ad.adDuration % 60).padStart(2, '0')} sec` : '—'
                    const dateStr = ad.createdAt ? new Date(ad.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
                    const previewBg = AD_TYPE_COLORS[displayType] || '#6b7280'
                    return (
                      <motion.tr
                        key={ad.id}
                        initial={{ opacity: 1, x: 0 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="group transition-colors hover:bg-white/[0.02]"
                      >
                        {/* Preview */}
                        <td className="py-2 pr-3">
                          <div className="relative h-9 w-16 overflow-hidden rounded-lg">
                            <div className="absolute inset-0" style={{ background: `${previewBg}20` }} />
                            <div className="absolute inset-0 flex items-center justify-center">
                              {displayType === 'Banner' || displayType === 'Image Banner' ? <ImageIcon className="h-3 w-3 text-white/20" /> :
                               displayType === 'Pre-Roll' || displayType === 'Mid-Roll' || displayType === 'Post-Roll' ? <Play className="h-3 w-3 text-white/20" /> :
                               displayType === 'Overlay' ? <Layers className="h-3 w-3 text-white/20" /> :
                               displayType === 'Popup' ? <LayoutGrid className="h-3 w-3 text-white/20" /> :
                               <Megaphone className="h-3 w-3 text-white/20" />}
                            </div>
                          </div>
                        </td>
                        {/* Ad Name */}
                        <td className="py-2 pr-3">
                          <p className="text-xs font-medium text-white">{ad.title}</p>
                          <p className="text-[10px] text-white/25">{dateStr}</p>
                        </td>
                        {/* Type */}
                        <td className="py-2 pr-3">
                          <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${AD_TYPE_STYLES[displayType]}`}>
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: AD_TYPE_COLORS[displayType] }} />
                            {displayType}
                          </span>
                        </td>
                        {/* Placement */}
                        <td className="py-2 pr-3">
                          <span className="text-xs text-white/50">{displayPosition}</span>
                        </td>
                        {/* Size / Duration */}
                        <td className="py-2 pr-3">
                          <span className="text-xs text-white/50">{sizeDuration}</span>
                        </td>
                        {/* Impressions */}
                        <td className="py-2 pr-3">
                          <span className="text-xs font-medium text-white/70">{formatNumber(ad.impressions)}</span>
                        </td>
                        {/* CTR */}
                        <td className="py-2 pr-3">
                          <span className="text-xs font-medium text-white/70">{ctr}</span>
                        </td>
                        {/* Revenue */}
                        <td className="py-2 pr-3">
                          <span className="text-xs font-semibold text-emerald-400">{formatCurrency(ad.revenue)}</span>
                        </td>
                        {/* Status */}
                        <td className="py-2 pr-3">
                          <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium ${statusStyles[displayStatus]}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${ad.isActive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                            {displayStatus}
                          </span>
                        </td>
                        {/* Actions */}
                        <td className="py-2">
                          <div className="flex items-center gap-0.5">
                            <button className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-white/10 hover:text-white" title="View">
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-white/10 hover:text-white" title="Analytics">
                              <BarChart3 className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => toggleAd(ad.id)} className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-white/10 hover:text-white" title={ad.isActive ? 'Pause' : 'Activate'}>
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => { if (confirm('Delete this ad?')) deleteAd(ad.id) }} className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-red-500/10 hover:text-red-400" title="Delete">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            )}

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/30">Rows per page:</span>
                <span className="text-[10px] text-white/50">{pageSize}</span>
                <span className="text-[10px] text-white/30">{`${Math.min((currentPage - 1) * pageSize + 1, filteredAds.length)}–${Math.min(currentPage * pageSize, filteredAds.length)} of ${filteredAds.length}`}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 text-white/40 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-30"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                  const startPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4))
                  const page = startPage + idx
                  if (page > totalPages) return null
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-[#ff0000] text-white'
                          : 'border border-white/10 text-white/40 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {page}
                    </button>
                  )
                })}
                {totalPages > 5 && <span className="text-[10px] text-white/30">...{totalPages}</span>}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage >= totalPages}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 text-white/40 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-30"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          CREATE NEW AD DIALOG
          ═══════════════════════════════════════════════════════════════════ */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="border-white/10 bg-[#111] text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Ad</DialogTitle>
            <DialogDescription className="text-white/40">Fill in the details to create a new advertisement.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-white/60">Title</Label>
              <Input
                value={newAd.title}
                onChange={(e) => setNewAd(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ad title"
                className="border-white/10 bg-[#0a0a0a] text-white placeholder:text-white/25"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-white/60">Type</Label>
                <Select value={newAd.type} onValueChange={(v) => setNewAd(prev => ({ ...prev, type: v }))}>
                  <SelectTrigger className="border-white/10 bg-[#0a0a0a] text-white/60 [&_svg]:text-white/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#111]">
                    <SelectItem value="banner" className="text-white focus:bg-white/5">Banner</SelectItem>
                    <SelectItem value="popup" className="text-white focus:bg-white/5">Popup</SelectItem>
                    <SelectItem value="overlay" className="text-white focus:bg-white/5">Overlay</SelectItem>
                    <SelectItem value="video" className="text-white focus:bg-white/5">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="text-white/60">Position</Label>
                <Select value={newAd.position} onValueChange={(v) => setNewAd(prev => ({ ...prev, position: v }))}>
                  <SelectTrigger className="border-white/10 bg-[#0a0a0a] text-white/60 [&_svg]:text-white/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#111]">
                    <SelectItem value="hero" className="text-white focus:bg-white/5">Hero</SelectItem>
                    <SelectItem value="sidebar" className="text-white focus:bg-white/5">Sidebar</SelectItem>
                    <SelectItem value="footer" className="text-white focus:bg-white/5">Footer</SelectItem>
                    <SelectItem value="entry" className="text-white focus:bg-white/5">Entry</SelectItem>
                    <SelectItem value="exit" className="text-white focus:bg-white/5">Exit</SelectItem>
                    <SelectItem value="timed" className="text-white focus:bg-white/5">Timed</SelectItem>
                    <SelectItem value="pre-roll" className="text-white focus:bg-white/5">Pre-Roll</SelectItem>
                    <SelectItem value="mid-roll" className="text-white focus:bg-white/5">Mid-Roll</SelectItem>
                    <SelectItem value="post-roll" className="text-white focus:bg-white/5">Post-Roll</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-white/60">Image URL</Label>
              <Input
                value={newAd.imageUrl}
                onChange={(e) => setNewAd(prev => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="https://example.com/image.jpg"
                className="border-white/10 bg-[#0a0a0a] text-white placeholder:text-white/25"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-white/60">Link URL</Label>
              <Input
                value={newAd.linkUrl}
                onChange={(e) => setNewAd(prev => ({ ...prev, linkUrl: e.target.value }))}
                placeholder="https://example.com"
                className="border-white/10 bg-[#0a0a0a] text-white placeholder:text-white/25"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-white/60">Start Date</Label>
                <Input
                  type="date"
                  value={newAd.startDate}
                  onChange={(e) => setNewAd(prev => ({ ...prev, startDate: e.target.value }))}
                  className="border-white/10 bg-[#0a0a0a] text-white/60"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-white/60">End Date</Label>
                <Input
                  type="date"
                  value={newAd.endDate}
                  onChange={(e) => setNewAd(prev => ({ ...prev, endDate: e.target.value }))}
                  className="border-white/10 bg-[#0a0a0a] text-white/60"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-white/60">Frequency</Label>
              <Input
                type="number"
                value={newAd.frequency}
                onChange={(e) => setNewAd(prev => ({ ...prev, frequency: e.target.value }))}
                placeholder="0"
                className="border-white/10 bg-[#0a0a0a] text-white placeholder:text-white/25"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setShowCreateDialog(false)}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/60 transition-colors hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateAd}
              disabled={creating || !newAd.title.trim()}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#ff0000] to-[#cc0000] px-4 py-2 text-sm font-semibold text-white transition-all hover:from-[#ff1111] hover:to-[#dd0000] disabled:opacity-50"
            >
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              {creating ? 'Creating...' : 'Create Ad'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
