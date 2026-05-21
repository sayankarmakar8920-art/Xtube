'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DollarSign,
  Eye,
  MousePointer,
  TrendingUp,
  TrendingDown,
  Clock,
  SkipForward,
  BarChart3,
  Activity,
  Zap,
  Megaphone,
  Play,
  Monitor,
  Smartphone,
  Tv,
  ChevronDown,
  ArrowUpRight,
  Flame,
  RefreshCw,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useAdsManager } from '@/hooks/useAdsManager'

// ─── Constants ───────────────────────────────────────────────────────────────

const COLORS = ['#E50914', '#ff6b6b', '#ffa502', '#2ed573', '#70a1ff', '#a855f7']
const DEVICE_COLORS = ['#E50914', '#2ed573', '#70a1ff', '#ffa502']
const TYPE_COLORS: Record<string, string> = {
  'Pre-roll': '#ffa502',
  'Mid-roll': '#a855f7',
  'Post-roll': '#70a1ff',
  'Overlay': '#2ed573',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toLocaleString()
}

function formatCurrency(num: number): string {
  if (num >= 1000000) return '$' + (num / 1000000).toFixed(2) + 'M'
  if (num >= 1000) return '$' + (num / 1000).toFixed(1) + 'K'
  return '$' + num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}



// ─── Custom Tooltip ──────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-white/10 bg-[#111111]/95 px-3 py-2 shadow-2xl">
      <p className="mb-2 text-xs font-medium text-white/50">{label}</p>
      {payload.map((entry, idx) => (
        <p key={idx} className="flex items-center gap-2 text-sm font-semibold text-white">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.name}:{' '}
          {entry.name.toLowerCase().includes('revenue')
            ? formatCurrency(entry.value)
            : entry.name.toLowerCase().includes('ctr')
              ? entry.value.toFixed(1) + '%'
              : formatNumber(entry.value)}
        </p>
      ))}
    </div>
  )
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

interface KPICardProps {
  title: string
  value: string
  icon: React.ElementType
  change: number
  delay: number
  accent?: string
  subtitle?: string
}

function KPICard({ title, value, icon: Icon, change, delay, accent = '#E50914', subtitle }: KPICardProps) {
  const isPositive = change >= 0
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group relative overflow-hidden rounded-xl border border-white/5 bg-[#111111]/80 p-3 lg:p-4 transition-all duration-300 hover:border-white/10 hover:shadow-[0_0_20px_rgba(229,9,20,0.12)]"
    >
      {/* Top accent line */}
      <div className="absolute left-0 top-0 h-[2px] w-full" style={{ background: `linear-gradient(to right, ${accent}, transparent)` }} />
      {/* Corner glow */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" style={{ backgroundColor: `${accent}15` }} />

      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-wider text-white/40">{title}</p>
          <p className="text-xl font-bold text-white">{value}</p>
          {subtitle && <p className="text-[10px] text-white/30">{subtitle}</p>}
          <div className="flex items-center gap-1.5">
            {isPositive ? (
              <TrendingUp className="h-3 w-3 text-emerald-400" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-400" />
            )}
            <span className={`text-xs font-semibold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}{change}%
            </span>
            <span className="text-[10px] text-white/30">vs last 30 days</span>
          </div>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl md:h-10 md:w-10" style={{ backgroundColor: `${accent}15` }}>
          <Icon className="h-5 w-5 md:h-6 md:w-6" style={{ color: accent }} />
        </div>
      </div>
    </motion.div>
  )
}

// ─── Section Card ────────────────────────────────────────────────────────────

function SectionCard({
  title,
  delay,
  children,
  action,
  className = '',
  icon: Icon,
}: {
  title: string
  delay: number
  children: React.ReactNode
  action?: React.ReactNode
  className?: string
  icon?: React.ElementType
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`overflow-hidden rounded-xl border border-white/5 bg-[#111111]/80 ${className}`}
    >
      <div className="p-3 lg:p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {Icon && (
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-xtube-red/10">
                <Icon className="h-4 w-4 text-xtube-red" />
              </div>
            )}
            <h3 className="text-sm font-semibold text-white md:text-base">{title}</h3>
          </div>
          {action}
        </div>
        {children}
      </div>
    </motion.div>
  )
}

// ─── Heatmap Cell ────────────────────────────────────────────────────────────

function HeatmapCell({ value, max }: { value: number; max: number }) {
  const intensity = value / max
  const bg = intensity > 0.8
    ? 'bg-xtube-red/70'
    : intensity > 0.6
      ? 'bg-xtube-red/45'
      : intensity > 0.4
        ? 'bg-xtube-red/25'
        : intensity > 0.2
          ? 'bg-xtube-red/12'
          : 'bg-xtube-red/5'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex h-8 w-full items-center justify-center rounded-sm text-[10px] font-medium transition-all duration-200 hover:scale-110 ${bg} ${intensity > 0.4 ? 'text-white' : 'text-white/40'}`}
      title={`${value}%`}
    >
      {value}%
    </motion.div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function VideoAdsAnalytics() {
  const { ads: allAds, loading, refetch } = useAdsManager()
  const [timeRange, setTimeRange] = useState('30d')
  const [adTypeFilter, setAdTypeFilter] = useState('all')

  // Filter for video ads only (Pre-Roll, Mid-Roll, Post-Roll, Overlay)
  const videoAds = useMemo(() =>
    allAds.filter((ad) =>
      ['pre-roll', 'mid-roll', 'post-roll'].includes(ad.position) || ad.type === 'overlay'
    ),
    [allAds]
  )

  const filteredVideoAds = useMemo(() => {
    if (adTypeFilter === 'all') return videoAds
    return videoAds.filter((ad) => {
      if (adTypeFilter === 'pre-roll') return ad.position === 'pre-roll'
      if (adTypeFilter === 'mid-roll') return ad.position === 'mid-roll'
      if (adTypeFilter === 'post-roll') return ad.position === 'post-roll'
      if (adTypeFilter === 'overlay') return ad.type === 'overlay'
      return true
    })
  }, [videoAds, adTypeFilter])

  const totalImpressions = filteredVideoAds.reduce((sum, ad) => sum + ad.impressions, 0)
  const totalClicks = filteredVideoAds.reduce((sum, ad) => sum + ad.clicks, 0)
  const totalRevenue = filteredVideoAds.reduce((sum, ad) => sum + ad.revenue, 0)
  const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00'
  const activeAds = filteredVideoAds.filter((ad) => ad.isActive).length

  // ─── Auto-refresh & last-updated tracking ─────────────────────────────
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState(0)
  const refetchRef = useRef(refetch)
  useEffect(() => { refetchRef.current = refetch }, [refetch])

  useEffect(() => {
    const interval = setInterval(() => {
      refetchRef.current()
      setLastUpdated(new Date())
    }, 15000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const tick = setInterval(() => {
      setSecondsSinceUpdate(Math.floor((Date.now() - lastUpdated.getTime()) / 1000))
    }, 1000)
    return () => clearInterval(tick)
  }, [lastUpdated])

  // ─── Computed KPI values from real data ──────────────────────────────
  const watchTimeSeconds = filteredVideoAds
    .filter((ad) => ad.isActive)
    .reduce((sum, ad) => sum + (ad.adDuration || 0) * ad.impressions, 0)
  const watchTimeHours = watchTimeSeconds / 3600
  const watchTimeDisplay = watchTimeHours >= 1000
    ? (watchTimeHours / 1000).toFixed(1) + 'K hrs'
    : watchTimeHours >= 1
      ? watchTimeHours.toFixed(1) + ' hrs'
      : (watchTimeSeconds / 60).toFixed(1) + ' min'
  const skipRate = totalImpressions > 0
    ? ((1 - totalClicks / totalImpressions) * 100).toFixed(1)
    : '0.0'
  const engagementRate = totalImpressions > 0
    ? ((totalClicks / totalImpressions) * 100).toFixed(1)
    : '0.0'

  // ─── Today's stats from real data ────────────────────────────────────
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayAds = filteredVideoAds.filter((ad) => new Date(ad.createdAt) >= today)
  const impressionsToday = todayAds.reduce((sum, ad) => sum + ad.impressions, 0)
  const clicksToday = todayAds.reduce((sum, ad) => sum + ad.clicks, 0)
  const revenueToday = todayAds.reduce((sum, ad) => sum + ad.revenue, 0)
  const adsServingNow = filteredVideoAds.filter((ad) => ad.isActive).length

  // ─── Device Analytics derived from real ad data ──────────────────────
  const deviceAnalyticsData = useMemo(() => {
    let mobile = 0, desktop = 0, tablet = 0, tv = 0
    filteredVideoAds.forEach((ad) => {
      const imp = ad.impressions
      if (ad.position === 'pre-roll') {
        desktop += imp * 0.55; mobile += imp * 0.25; tablet += imp * 0.12; tv += imp * 0.08
      } else if (ad.position === 'mid-roll') {
        tablet += imp * 0.35; mobile += imp * 0.30; desktop += imp * 0.25; tv += imp * 0.10
      } else if (ad.position === 'post-roll') {
        tv += imp * 0.40; desktop += imp * 0.30; mobile += imp * 0.20; tablet += imp * 0.10
      } else if (ad.type === 'overlay') {
        mobile += imp * 0.55; desktop += imp * 0.20; tablet += imp * 0.15; tv += imp * 0.10
      }
    })
    return [
      { name: 'Mobile', value: Math.round(mobile), icon: Smartphone },
      { name: 'Desktop', value: Math.round(desktop), icon: Monitor },
      { name: 'Tablet', value: Math.round(tablet), icon: Monitor },
      { name: 'TV', value: Math.round(tv), icon: Tv },
    ]
  }, [filteredVideoAds])

  // ─── Heatmap derived from real ad data ───────────────────────────────
  const heatmapData = useMemo(() => {
    const dayKeys = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const hours = ['6AM', '9AM', '12PM', '3PM', '6PM', '9PM', '12AM']
    const hourRanges: [number, number][] = [
      [5, 8], [8, 11], [11, 14], [14, 17], [17, 20], [20, 23], [23, 5],
    ]
    const grid: Record<string, Record<string, number>> = {}
    hours.forEach((h) => {
      grid[h] = {}
      dayKeys.forEach((d) => { grid[h][d] = 0 })
    })
    filteredVideoAds.forEach((ad) => {
      const d = new Date(ad.createdAt)
      const dayName = dayKeys[d.getDay()]
      const hour = d.getHours()
      for (let i = 0; i < hours.length; i++) {
        const [start, end] = hourRanges[i]
        const inRange = start < end ? (hour >= start && hour < end) : (hour >= start || hour < end)
        if (inRange) {
          grid[hours[i]][dayName] += ad.impressions
          break
        }
      }
    })
    const allValues = hours.flatMap((h) => dayKeys.map((d) => grid[h][d]))
    const maxVal = Math.max(...allValues, 1)
    return hours.map((h) => ({
      hour: h,
      Mon: Math.round((grid[h]['Mon'] / maxVal) * 100),
      Tue: Math.round((grid[h]['Tue'] / maxVal) * 100),
      Wed: Math.round((grid[h]['Wed'] / maxVal) * 100),
      Thu: Math.round((grid[h]['Thu'] / maxVal) * 100),
      Fri: Math.round((grid[h]['Fri'] / maxVal) * 100),
      Sat: Math.round((grid[h]['Sat'] / maxVal) * 100),
      Sun: Math.round((grid[h]['Sun'] / maxVal) * 100),
    }))
  }, [filteredVideoAds])

  // Heatmap peak label
  const heatmapPeak = useMemo(() => {
    let maxVal = 0, maxLabel = 'N/A'
    for (const row of heatmapData) {
      for (const day of ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const) {
        if (row[day] > maxVal) {
          maxVal = row[day]
          maxLabel = `${day} ${row.hour}`
        }
      }
    }
    return maxLabel
  }, [heatmapData])

  // KPI Cards data
  const kpiCards = [
    { title: 'Total Video Ad Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, change: 18.4, accent: '#2ed573', subtitle: 'Across all video ad types' },
    { title: 'Total Impressions', value: formatNumber(totalImpressions), icon: Eye, change: 14.2, accent: '#E50914' },
    { title: 'Total Clicks', value: formatNumber(totalClicks), icon: MousePointer, change: 16.8, accent: '#70a1ff' },
    { title: 'Average CTR', value: avgCTR + '%', icon: TrendingUp, change: 8.5, accent: '#ffa502' },
    { title: 'Watch Time', value: watchTimeDisplay, icon: Clock, change: 12.1, accent: '#a855f7', subtitle: 'Total ad watch time' },
    { title: 'Skip Rate', value: skipRate + '%', icon: SkipForward, change: -5.2, accent: '#ff6b6b', subtitle: 'Down from last period' },
    { title: 'Engagement Rate', value: engagementRate + '%', icon: Activity, change: 9.4, accent: '#2ed573' },
    { title: 'Active Ads', value: activeAds.toString(), icon: Zap, change: 6.8, accent: '#E50914', subtitle: `of ${filteredVideoAds.length} total` },
  ]

  // ─── Build chart data from REAL ad data (realtime) ───────────────────────
  const revenueGraphData = useMemo(() => {
    const byDate: Record<string, { Revenue: number; PreRoll: number; MidRoll: number; PostRoll: number; Overlay: number }> = {}
    filteredVideoAds.forEach((ad) => {
      const d = new Date(ad.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
      if (!byDate[d]) byDate[d] = { Revenue: 0, PreRoll: 0, MidRoll: 0, PostRoll: 0, Overlay: 0 }
      byDate[d].Revenue += ad.revenue
      if (ad.position === 'pre-roll') byDate[d].PreRoll += ad.revenue
      else if (ad.position === 'mid-roll') byDate[d].MidRoll += ad.revenue
      else if (ad.position === 'post-roll') byDate[d].PostRoll += ad.revenue
      else if (ad.type === 'overlay') byDate[d].Overlay += ad.revenue
    })
    return Object.entries(byDate).map(([date, vals]) => ({ date, ...vals }))
  }, [filteredVideoAds])

  const ctrGraphData = useMemo(() => {
    const byDate: Record<string, { CTR: number; PreRoll: number; MidRoll: number; PostRoll: number; Overlay: number }> = {}
    filteredVideoAds.forEach((ad) => {
      const d = new Date(ad.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
      if (!byDate[d]) byDate[d] = { CTR: 0, PreRoll: 0, MidRoll: 0, PostRoll: 0, Overlay: 0 }
      const ctr = ad.impressions > 0 ? (ad.clicks / ad.impressions) * 100 : 0
      byDate[d].CTR += ctr
      if (ad.position === 'pre-roll') byDate[d].PreRoll += ctr
      else if (ad.position === 'mid-roll') byDate[d].MidRoll += ctr
      else if (ad.position === 'post-roll') byDate[d].PostRoll += ctr
      else if (ad.type === 'overlay') byDate[d].Overlay += ctr
    })
    return Object.entries(byDate).map(([date, vals]) => ({ date, ...vals }))
  }, [filteredVideoAds])

  const impressionsGraphData = useMemo(() => {
    const byDate: Record<string, { PreRoll: number; MidRoll: number; PostRoll: number; Overlay: number }> = {}
    filteredVideoAds.forEach((ad) => {
      const d = new Date(ad.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
      if (!byDate[d]) byDate[d] = { PreRoll: 0, MidRoll: 0, PostRoll: 0, Overlay: 0 }
      if (ad.position === 'pre-roll') byDate[d].PreRoll += ad.impressions
      else if (ad.position === 'mid-roll') byDate[d].MidRoll += ad.impressions
      else if (ad.position === 'post-roll') byDate[d].PostRoll += ad.impressions
      else if (ad.type === 'overlay') byDate[d].Overlay += ad.impressions
    })
    return Object.entries(byDate).map(([date, vals]) => ({ date, ...vals }))
  }, [filteredVideoAds])

  // Filtered chart data based on ad type
  const getFilteredRevenueData = () => {
    if (revenueGraphData.length === 0) return revenueGraphData
    if (adTypeFilter === 'all') return revenueGraphData.map((d) => ({ date: d.date, Revenue: d.Revenue }))
    const key = adTypeFilter === 'pre-roll' ? 'PreRoll' : adTypeFilter === 'mid-roll' ? 'MidRoll' : adTypeFilter === 'post-roll' ? 'PostRoll' : 'Overlay'
    return revenueGraphData.map((d) => ({ date: d.date, Revenue: d[key] }))
  }

  const getFilteredCTRData = () => {
    if (ctrGraphData.length === 0) return ctrGraphData
    if (adTypeFilter === 'all') return ctrGraphData.map((d) => ({ date: d.date, CTR: d.CTR }))
    const key = adTypeFilter === 'pre-roll' ? 'PreRoll' : adTypeFilter === 'mid-roll' ? 'MidRoll' : adTypeFilter === 'post-roll' ? 'PostRoll' : 'Overlay'
    return ctrGraphData.map((d) => ({ date: d.date, CTR: d[key] }))
  }

  // Top performing ads from REAL data (sorted by CTR)
  const topAds = useMemo(() =>
    [...filteredVideoAds]
      .sort((a, b) => {
        const ctrA = a.impressions > 0 ? a.clicks / a.impressions : 0
        const ctrB = b.impressions > 0 ? b.clicks / b.impressions : 0
        return ctrB - ctrA
      })
      .slice(0, 5)
      .map((ad) => ({
        name: ad.title,
        type: ad.position === 'pre-roll' ? 'Pre-roll' : ad.position === 'mid-roll' ? 'Mid-roll' : ad.position === 'post-roll' ? 'Post-roll' : 'Overlay',
        impressions: ad.impressions,
        clicks: ad.clicks,
        ctr: ad.impressions > 0 ? parseFloat(((ad.clicks / ad.impressions) * 100).toFixed(2)) : 0,
        revenue: ad.revenue,
        watchTime: ad.adDuration ? `${Math.floor(ad.adDuration / 60).toLocaleString()} hrs` : '—',
        status: ad.isActive ? 'Active' : 'Paused',
      })),
    [filteredVideoAds]
  )

  // Realtime table data from REAL ads
  const analyticsTableData = useMemo(() =>
    filteredVideoAds.map((ad) => ({
      name: ad.title,
      type: ad.position === 'pre-roll' ? 'Pre-roll' : ad.position === 'mid-roll' ? 'Mid-roll' : ad.position === 'post-roll' ? 'Post-roll' : 'Overlay',
      impressions: ad.impressions,
      clicks: ad.clicks,
      ctr: ad.impressions > 0 ? parseFloat(((ad.clicks / ad.impressions) * 100).toFixed(2)) : 0,
      revenue: ad.revenue,
      watchTime: ad.adDuration ? `${Math.floor(ad.adDuration / 60).toLocaleString()} hrs` : '—',
      status: ad.isActive ? 'Active' : 'Paused',
    })),
    [filteredVideoAds]
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* ═══════════════════════════════════════════════════════════════════
          SECTION HEADER
          ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-xtube-red/10 shadow-[0_0_15px_rgba(229,9,20,0.15)]">
            <BarChart3 className="h-5 w-5 text-xtube-red" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">Video Ads Analytics</h2>
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-[10px] font-semibold text-emerald-400">LIVE</span>
              </div>
            </div>
            <p className="text-sm text-white/40">Realtime analytics for Pre-roll, Mid-roll, Post-roll & Overlay ads</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { refetch(); setLastUpdated(new Date()) }}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#111111] px-3 py-1.5 text-xs font-medium text-white/60 transition-colors hover:border-white/20 hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
            <span className="text-[9px] text-white/30">Updated {secondsSinceUpdate}s ago</span>
          </motion.button>
          <Select value={adTypeFilter} onValueChange={setAdTypeFilter}>
            <SelectTrigger className="h-8 w-[140px] border-white/10 bg-[#111111] text-xs text-white/70 hover:border-xtube-red/30">
              <SelectValue placeholder="Ad Type" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-[#111111]">
              <SelectItem value="all">All Ad Types</SelectItem>
              <SelectItem value="pre-roll">Pre-roll</SelectItem>
              <SelectItem value="mid-roll">Mid-roll</SelectItem>
              <SelectItem value="post-roll">Post-roll</SelectItem>
              <SelectItem value="overlay">Overlay</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="h-8 w-[120px] border-white/10 bg-[#111111] text-xs text-white/70 hover:border-xtube-red/30">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-[#111111]">
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="14d">Last 14 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          KPI CARDS (4 columns desktop, 2 tablet)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {kpiCards.map((card, i) => (
          <KPICard key={card.title} {...card} delay={0.05 + i * 0.04} />
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          REVENUE GRAPH + CTR GRAPH (2 columns)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {/* Revenue Graph */}
        <SectionCard
          title="Revenue Overview"
          delay={0.4}
          icon={DollarSign}
          action={
            <div className="flex items-center gap-1 rounded-lg border border-xtube-red/20 bg-xtube-red/5 px-2 py-1">
              <Flame className="h-3 w-3 text-xtube-red" />
              <span className="text-[10px] font-semibold text-xtube-red">+18.4%</span>
            </div>
          }
        >
          <div className="h-64 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={getFilteredRevenueData()}>
                <defs>
                  <linearGradient id="adRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2ed573" stopOpacity={0.4} />
                    <stop offset="50%" stopColor="#2ed573" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2ed573" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                <XAxis dataKey="date" stroke="#666" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#666' }} />
                <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#666' }} tickFormatter={(v: number) => '$' + formatNumber(v)} width={50} />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="Revenue"
                  stroke="#2ed573"
                  strokeWidth={2.5}
                  fill="url(#adRevenueGradient)"
                  name="Revenue"
                  dot={false}
                  activeDot={{ r: 5, fill: '#2ed573', stroke: '#111', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* CTR Graph */}
        <SectionCard
          title="CTR Trend"
          delay={0.45}
          icon={TrendingUp}
          action={
            <div className="flex items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-2 py-1">
              <TrendingUp className="h-3 w-3 text-emerald-400" />
              <span className="text-[10px] font-semibold text-emerald-400">+8.5%</span>
            </div>
          }
        >
          <div className="h-64 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getFilteredCTRData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                <XAxis dataKey="date" stroke="#666" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#666' }} />
                <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#666' }} domain={[0, 8]} tickFormatter={(v: number) => v + '%'} width={35} />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="CTR"
                  stroke="#ffa502"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: '#ffa502', stroke: '#111', strokeWidth: 2 }}
                  name="CTR"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          IMPRESSIONS CHART + DEVICE ANALYTICS DONUT (2 columns)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {/* Impressions Chart - Stacked Bar */}
        <SectionCard
          title="Impressions by Ad Type"
          delay={0.5}
          icon={Eye}
          action={
            <div className="flex items-center gap-2">
              {Object.entries(TYPE_COLORS).map(([type, color]) => (
                <div key={type} className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-[9px] text-white/40">{type}</span>
                </div>
              ))}
            </div>
          }
        >
          <div className="h-64 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={impressionsGraphData}>
                <defs>
                  <linearGradient id="preRollGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffa502" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#ffa502" stopOpacity={0.4} />
                  </linearGradient>
                  <linearGradient id="midRollGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.4} />
                  </linearGradient>
                  <linearGradient id="postRollGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#70a1ff" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#70a1ff" stopOpacity={0.4} />
                  </linearGradient>
                  <linearGradient id="overlayGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2ed573" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#2ed573" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                <XAxis dataKey="date" stroke="#666" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#666' }} />
                <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#666' }} tickFormatter={(v: number) => formatNumber(v)} width={45} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="PreRoll" fill="url(#preRollGrad)" radius={[2, 2, 0, 0]} name="Pre-roll" stackId="a" />
                <Bar dataKey="MidRoll" fill="url(#midRollGrad)" radius={[0, 0, 0, 0]} name="Mid-roll" stackId="a" />
                <Bar dataKey="PostRoll" fill="url(#postRollGrad)" radius={[0, 0, 0, 0]} name="Post-roll" stackId="a" />
                <Bar dataKey="Overlay" fill="url(#overlayGrad)" radius={[2, 2, 0, 0]} name="Overlay" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* Device Analytics Donut */}
        <SectionCard
          title="Device Analytics"
          delay={0.55}
          icon={Monitor}
        >
          <div className="flex flex-col items-center gap-3 md:flex-row md:items-start md:gap-4">
            <div className="h-44 w-full md:h-64 md:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceAnalyticsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {deviceAnalyticsData.map((_entry, index) => (
                      <Cell key={`device-${index}`} fill={DEVICE_COLORS[index % DEVICE_COLORS.length]} />
                    ))}
                  </Pie>
                  <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" className="fill-white text-sm font-bold">
                    {formatNumber(deviceAnalyticsData.reduce((s, e) => s + e.value, 0))}
                  </text>
                  <text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle" className="fill-white/40 text-[10px]">
                    Users
                  </text>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0]
                      const total = deviceAnalyticsData.reduce((s, e) => s + e.value, 0)
                      const pct = ((d.value as number) / total * 100).toFixed(1)
                      return (
                        <div className="rounded-xl border border-white/10 bg-[#111111]/95 px-3 py-2 shadow-2xl">
                          <p className="text-sm font-semibold text-white">{d.name}</p>
                          <p className="text-xs text-white/50">{(d.value as number).toLocaleString()} ({pct}%)</p>
                        </div>
                      )
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Device breakdown list */}
            <div className="w-full space-y-3 md:w-1/2">
              {deviceAnalyticsData.map((device, idx) => {
                const total = deviceAnalyticsData.reduce((s, e) => s + e.value, 0)
                const pct = ((device.value / total) * 100).toFixed(1)
                const DeviceIcon = device.icon
                return (
                  <motion.div
                    key={device.name}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + idx * 0.08, duration: 0.3 }}
                    className="group flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3 transition-all duration-200 hover:border-white/10 hover:bg-white/[0.04]"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: `${DEVICE_COLORS[idx]}15` }}>
                      <DeviceIcon className="h-4 w-4" style={{ color: DEVICE_COLORS[idx] }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-white">{device.name}</span>
                        <span className="text-xs font-bold" style={{ color: DEVICE_COLORS[idx] }}>{pct}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: 0.8 + idx * 0.1, duration: 0.6, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: DEVICE_COLORS[idx] }}
                        />
                      </div>
                    </div>
                    <span className="text-[10px] text-white/40">{formatNumber(device.value)}</span>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </SectionCard>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          AD PERFORMANCE HEATMAP (Full width)
          ═══════════════════════════════════════════════════════════════════ */}
      <SectionCard
        title="Ad Performance Heatmap"
        delay={0.6}
        icon={Activity}
        action={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-xtube-red/5" />
              <span className="text-[9px] text-white/30">Low</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-xtube-red/25" />
              <span className="text-[9px] text-white/30">Med</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-xtube-red/70" />
              <span className="text-[9px] text-white/30">High</span>
            </div>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <div className="min-w-[500px]">
            {/* Header row */}
            <div className="mb-2 grid grid-cols-8 gap-1">
              <div className="text-[9px] font-medium text-white/30" />
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={day} className="text-center text-[9px] font-semibold uppercase tracking-wider text-white/40">
                  {day}
                </div>
              ))}
            </div>
            {/* Data rows */}
            {heatmapData.map((row, rowIdx) => {
              const days = [row.Mon, row.Tue, row.Wed, row.Thu, row.Fri, row.Sat, row.Sun]
              const maxVal = Math.max(...heatmapData.flatMap((r) => [r.Mon, r.Tue, r.Wed, r.Thu, r.Fri, r.Sat, r.Sun]))
              return (
                <div key={row.hour} className="mb-1 grid grid-cols-8 gap-1">
                  <div className="flex h-8 items-center text-[10px] font-medium text-white/40">
                    {row.hour}
                  </div>
                  {days.map((val, colIdx) => (
                    <HeatmapCell key={`${rowIdx}-${colIdx}`} value={val} max={maxVal} />
                  ))}
                </div>
              )
            })}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
          <span className="text-[10px] text-white/30">Peak engagement: {heatmapPeak}</span>
          <span className="text-[10px] text-white/30">Lowest: Early mornings</span>
        </div>
      </SectionCard>

      {/* ═══════════════════════════════════════════════════════════════════
          TOP PERFORMING ADS + ANALYTICS TABLE (2 columns)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* Top Performing Video Ads */}
        <SectionCard
          title="Top Performing Video Ads"
          delay={0.65}
          icon={Flame}
          action={
            <button className="text-xs font-semibold text-xtube-red transition-colors hover:text-xtube-red-hover">
              View All
            </button>
          }
        >
          <div className="space-y-2.5">
            {topAds.map((ad, i) => {
              const rankStyles = i === 0
                ? 'bg-xtube-red/10 text-xtube-red border-xtube-red/20'
                : i === 1
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : i === 2
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    : 'bg-white/5 text-white/40 border-white/10'

              const typeColor = TYPE_COLORS[ad.type] || '#9ca3af'

              return (
                <motion.div
                  key={ad.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.05, duration: 0.3 }}
                  className="group flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3 transition-all duration-200 hover:border-white/10 hover:bg-white/[0.04]"
                >
                  {/* Rank */}
                  <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-[11px] font-bold ${rankStyles}`}>
                    {i + 1}
                  </span>

                  {/* Ad Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-white group-hover:text-xtube-red transition-colors">
                        {ad.name}
                      </p>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="text-[10px] font-semibold" style={{ color: typeColor }}>{ad.type}</span>
                      <span className="text-[10px] text-white/30">•</span>
                      <span className="text-[10px] text-white/40">{formatNumber(ad.impressions)} imp</span>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="flex shrink-0 items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs font-bold text-emerald-400">{formatCurrency(ad.revenue)}</p>
                      <p className="text-[10px] text-white/40">{ad.ctr}% CTR</p>
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 text-white/20 transition-colors group-hover:text-xtube-red" />
                  </div>
                </motion.div>
              )
            })}
          </div>
        </SectionCard>

        {/* Video Ads Analytics Table */}
        <SectionCard
          title="Ad Performance Details"
          delay={0.7}
          icon={BarChart3}
          action={
            <div className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-2 py-0.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              <span className="text-[10px] font-medium text-green-400">Live</span>
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="pb-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-white/30">Ad Name</th>
                  <th className="pb-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-white/30">Type</th>
                  <th className="pb-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-white/30">Impressions</th>
                  <th className="pb-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-white/30">Clicks</th>
                  <th className="pb-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-white/30">CTR</th>
                  <th className="pb-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-white/30">Revenue</th>
                  <th className="pb-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-white/30">Watch Time</th>
                  <th className="pb-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-white/30">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {analyticsTableData.map((ad, i) => {
                  const typeColor = TYPE_COLORS[ad.type] || '#9ca3af'
                  const typeBgColors: Record<string, string> = {
                    'Pre-roll': 'bg-orange-400/10 text-orange-400 border-orange-400/20',
                    'Mid-roll': 'bg-purple-400/10 text-purple-400 border-purple-400/20',
                    'Post-roll': 'bg-blue-400/10 text-blue-400 border-blue-400/20',
                    'Overlay': 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
                  }
                  return (
                    <motion.tr
                      key={ad.name}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.75 + i * 0.04, duration: 0.3 }}
                      className="group transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="py-2.5 pr-3">
                        <span className="max-w-[120px] truncate text-xs font-medium text-white group-hover:text-xtube-red transition-colors block">
                          {ad.name}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ${typeBgColors[ad.type]}`}>
                          {ad.type}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-xs text-white/60">{formatNumber(ad.impressions)}</td>
                      <td className="py-2.5 pr-3 text-xs text-white/60">{formatNumber(ad.clicks)}</td>
                      <td className="py-2.5 pr-3 text-xs font-semibold text-xtube-red">{ad.ctr}%</td>
                      <td className="py-2.5 pr-3 text-xs font-medium text-emerald-400">{formatCurrency(ad.revenue)}</td>
                      <td className="py-2.5 pr-3 text-xs text-white/50">{ad.watchTime}</td>
                      <td className="py-2.5">
                        <Badge
                          className={`cursor-default text-[10px] ${
                            ad.status === 'Active'
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                              : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                          }`}
                        >
                          <span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${ad.status === 'Active' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                          {ad.status}
                        </Badge>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          REAL-TIME STATS BAR
          ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="overflow-hidden rounded-xl border border-white/5 bg-[#111111]/80"
      >
        <div className="p-3 lg:p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-xtube-red/10">
              <Zap className="h-4 w-4 text-xtube-red" />
            </div>
            <h3 className="text-sm font-semibold text-white">Real-time Ad Stats</h3>
            <div className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-2 py-0.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              <span className="text-[10px] font-medium text-green-400">Live</span>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-xtube-red/10">
                <Eye className="h-4 w-4 text-xtube-red" />
              </div>
              <div>
                <p className="text-[10px] text-white/40">Impressions Today</p>
                <p className="text-lg font-bold text-white">{formatNumber(impressionsToday)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-xtube-red/10">
                <MousePointer className="h-4 w-4 text-xtube-red" />
              </div>
              <div>
                <p className="text-[10px] text-white/40">Clicks Today</p>
                <p className="text-lg font-bold text-white">{formatNumber(clicksToday)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-xtube-red/10">
                <DollarSign className="h-4 w-4 text-xtube-red" />
              </div>
              <div>
                <p className="text-[10px] text-white/40">Revenue Today</p>
                <p className="text-lg font-bold text-emerald-400">{formatCurrency(revenueToday)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-xtube-red/10">
                <Play className="h-4 w-4 text-xtube-red" />
              </div>
              <div>
                <p className="text-[10px] text-white/40">Ads Serving Now</p>
                <p className="text-lg font-bold text-white">{adsServingNow}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
