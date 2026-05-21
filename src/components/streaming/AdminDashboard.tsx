'use client'

import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Film,
  Eye,
  MousePointer,
  DollarSign,
  Megaphone,
  Users,
  TrendingUp,
  TrendingDown,
  Pause,
  Volume2,
  Settings,
  Maximize,
  ChevronDown,
  Eye as ViewIcon,
  Pencil,
  Trash2,
  Clock,
  HardDrive,
  Calendar,
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
import { Skeleton } from '@/components/ui/skeleton'
import { useAdsManager } from '@/hooks/useAdsManager'

// ─── Types ───────────────────────────────────────────────────────────────────

interface DashboardData {
  totalVideos: number
  totalViews: number
  totalClicks: number
  totalRevenue: number
  totalAds: number
  totalUsers: number
  viewsGraph: Array<{ date: string; views: number }>
  revenueGraph: Array<{ date: string; revenue: number }>
  deviceBreakdown: Record<string, number>
  categoryStats: Array<{ category: string; count: number; views: number }>
}

interface AdminDashboardProps {
  data: DashboardData | null
  loading?: boolean
}

// ─── Constants ───────────────────────────────────────────────────────────────

const COLORS = ['#E50914', '#2ed573', '#70a1ff', '#ffa502', '#ff6b6b']
const TRAFFIC_COLORS = ['#E50914', '#2ed573', '#70a1ff', '#ffa502', '#ff6b6b']
const DEVICE_COLORS = ['#E50914', '#2ed573', '#70a1ff', '#ffa502']

const ICON_BG_GRADIENTS = [
  'from-blue-500/20 to-blue-600/10',
  'from-purple-500/20 to-purple-600/10',
  'from-emerald-500/20 to-emerald-600/10',
  'from-orange-500/20 to-orange-600/10',
  'from-pink-500/20 to-pink-600/10',
  'from-cyan-500/20 to-cyan-600/10',
]

const ICON_COLORS = [
  'text-blue-400',
  'text-purple-400',
  'text-emerald-400',
  'text-orange-400',
  'text-pink-400',
  'text-cyan-400',
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toLocaleString()
}

function formatCurrency(num: number): string {
  return '$' + num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number; name: string; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-white/10 bg-[#111111]/95 px-4 py-3 shadow-2xl">
      <p className="mb-2 text-xs font-medium text-white/50">{label}</p>
      {payload.map((entry, idx) => (
        <p key={idx} className="flex items-center gap-2 text-sm font-semibold text-white">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.name}:{' '}
          {entry.name.toLowerCase().includes('revenue')
            ? formatCurrency(entry.value)
            : formatNumber(entry.value)}
        </p>
      ))}
    </div>
  )
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string
  value: string
  icon: React.ElementType
  change: number
  delay: number
  gradientIdx: number
}

function StatCard({ title, value, icon: Icon, change, delay, gradientIdx }: StatCardProps) {
  const isPositive = change >= 0

  return (
    <motion.div
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden rounded-xl border border-white/5 bg-[#111111] p-3 transition-all duration-300 hover:border-xtube-red/20 hover:shadow-[0_0_20px_rgba(229,9,20,0.12)] lg:p-4"
    >
      {/* Red accent top line */}
      <div className="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-xtube-red to-transparent" />

      {/* Corner glow */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-xtube-red/5 blur-2xl transition-opacity duration-300 group-hover:opacity-100 opacity-0" />

      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">{title}</p>
          <p className="text-lg font-bold text-white lg:text-xl">{value}</p>
          <div className="flex items-center gap-1.5">
            {isPositive ? (
              <TrendingUp className="h-3 w-3 text-emerald-400" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-400" />
            )}
            <span className={`text-xs font-semibold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}{change}%
            </span>
            <span className="text-[10px] text-white/30">from last 30 days</span>
          </div>
        </div>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${ICON_BG_GRADIENTS[gradientIdx]} lg:h-10 lg:w-10`}>
          <Icon className={`h-4 w-4 ${ICON_COLORS[gradientIdx]} lg:h-5 lg:w-5`} />
        </div>
      </div>
    </motion.div>
  )
}

// ─── Chart Card Wrapper ──────────────────────────────────────────────────────

function SectionCard({
  title,
  delay,
  children,
  action,
  className = '',
}: {
  title: string
  delay: number
  children: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      className={`overflow-hidden rounded-xl border border-white/5 bg-[#111111] ${className}`}
    >
      <div className="p-3 lg:p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-semibold text-white lg:text-sm">{title}</h3>
          {action}
        </div>
        {children}
      </div>
    </motion.div>
  )
}

// ─── Derived Data Placeholders ────────────────────────────────────────────────

// Data arrays are now computed inside the component from real data

// ─── Loading Skeleton ────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-4 p-3 lg:p-5">
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-white/5 bg-[#111111] p-4">
            <Skeleton className="mb-3 h-3 w-20 bg-white/5" />
            <Skeleton className="mb-2 h-7 w-24 bg-white/5" />
            <Skeleton className="h-3 w-16 bg-white/5" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-white/5 bg-[#111111] p-4">
            <Skeleton className="mb-4 h-5 w-32 bg-white/5" />
            <Skeleton className="h-56 bg-white/5" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-white/5 bg-[#111111] p-4">
            <Skeleton className="mb-4 h-5 w-40 bg-white/5" />
            <Skeleton className="h-48 bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Status Badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: 'Published' | 'Processing' | 'Draft' }) {
  const styles = {
    Published: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Processing: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Draft: 'bg-white/5 text-white/50 border-white/10',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${styles[status]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${
        status === 'Published' ? 'bg-emerald-400' : status === 'Processing' ? 'bg-amber-400 animate-pulse' : 'bg-white/30'
      }`} />
      {status}
    </span>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export const AdminDashboard = memo(function AdminDashboard({ data, loading }: AdminDashboardProps) {
  const { ads: allAds } = useAdsManager()

  const d = data || {
    totalVideos: 0, totalViews: 0, totalClicks: 0, totalRevenue: 0, totalAds: 0, totalUsers: 0,
    viewsGraph: [], revenueGraph: [], deviceBreakdown: {}, categoryStats: [],
  }

  const recentVideos: Array<{ id: string; title: string; duration: string; size: string; uploaded: string; status: 'Published' | 'Processing' | 'Draft'; thumbnail: string }> = []

  const catalogCategories = (() => {
    if (!d.categoryStats?.length) return [] as Array<{ name: string; icon: React.ElementType; items: number; color: string; iconColor: string; glow: string }>
    const categoryIcons: Record<string, { icon: React.ElementType; color: string; iconColor: string; glow: string }> = {
      'Action': { icon: Film, color: 'from-red-500/10 to-red-600/5', iconColor: 'text-red-400', glow: 'hover:shadow-red-500/10' },
      'Drama': { icon: Eye, color: 'from-purple-500/10 to-purple-600/5', iconColor: 'text-purple-400', glow: 'hover:shadow-purple-500/10' },
      'Comedy': { icon: Megaphone, color: 'from-yellow-500/10 to-yellow-600/5', iconColor: 'text-yellow-400', glow: 'hover:shadow-yellow-500/10' },
      'Horror': { icon: Volume2, color: 'from-green-500/10 to-green-600/5', iconColor: 'text-green-400', glow: 'hover:shadow-green-500/10' },
      'Sci-Fi': { icon: Settings, color: 'from-cyan-500/10 to-cyan-600/5', iconColor: 'text-cyan-400', glow: 'hover:shadow-cyan-500/10' },
      'Romance': { icon: DollarSign, color: 'from-pink-500/10 to-pink-600/5', iconColor: 'text-pink-400', glow: 'hover:shadow-pink-500/10' },
    }
    const defaultIcon = { icon: Film, color: 'from-white/5 to-white/[0.02]', iconColor: 'text-white/40', glow: '' }
    return d.categoryStats.map(c => {
      const cfg = categoryIcons[c.category] || defaultIcon
      return { name: c.category, icon: cfg.icon, items: c.count, color: cfg.color, iconColor: cfg.iconColor, glow: cfg.glow }
    })
  })()

  const videoAdsData = useMemo(() => {
    const typeGroups: Record<string, { totalAds: number; impressions: number; clicks: number; revenue: number }> = {}
    for (const ad of allAds) {
      const displayType = ad.position === 'pre-roll' ? 'Pre-roll'
        : ad.position === 'mid-roll' ? 'Mid-roll'
        : ad.position === 'post-roll' ? 'Post-roll'
        : ad.type === 'overlay' ? 'Overlay' : null
      if (!displayType) continue
      if (!typeGroups[displayType]) typeGroups[displayType] = { totalAds: 0, impressions: 0, clicks: 0, revenue: 0 }
      typeGroups[displayType].totalAds++
      typeGroups[displayType].impressions += ad.impressions
      typeGroups[displayType].clicks += ad.clicks
      typeGroups[displayType].revenue += ad.revenue
    }
    return Object.entries(typeGroups).map(([type, d]) => ({
      type,
      totalAds: d.totalAds,
      impressions: d.impressions,
      clicks: d.clicks,
      ctr: d.impressions > 0 ? parseFloat(((d.clicks / d.impressions) * 100).toFixed(2)) : 0,
      revenue: parseFloat(d.revenue.toFixed(2)),
    }))
  }, [allAds])

  const topPerformingAds = useMemo(() => {
    const videoPositions = ['pre-roll', 'mid-roll', 'post-roll']
    const videoAds = allAds.filter(ad => videoPositions.includes(ad.position) || ad.type === 'overlay')
    return videoAds
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 5)
      .map((ad, i) => ({
        rank: i + 1,
        name: ad.title,
        type: ad.position === 'pre-roll' ? 'Pre-roll' : ad.position === 'mid-roll' ? 'Mid-roll' : ad.position === 'post-roll' ? 'Post-roll' : 'Overlay',
        impressions: ad.impressions,
        ctr: ad.impressions > 0 ? parseFloat(((ad.clicks / ad.impressions) * 100).toFixed(2)) : 0,
        revenue: parseFloat(ad.revenue.toFixed(2)),
      }))
  }, [allAds])

  const performanceData = d.viewsGraph?.length ? d.viewsGraph.map(v => ({ date: v.date, Views: v.views, Clicks: Math.round(v.views * 0.15), Revenue: Math.round(v.views * 0.02) })) : [
    { date: 'Week 1', Views: 0, Clicks: 0, Revenue: 0 },
    { date: 'Week 2', Views: 0, Clicks: 0, Revenue: 0 },
    { date: 'Week 3', Views: 0, Clicks: 0, Revenue: 0 },
  ]

  const trafficSourceData = d.categoryStats?.length ? d.categoryStats.map(c => ({ name: c.category, value: c.views })) : [{ name: 'No Data', value: 1 }]

  const userDeviceData = Object.entries(d.deviceBreakdown || {}).length ? Object.entries(d.deviceBreakdown).map(([name, value]) => ({ name, value: value as number })) : [{ name: 'No Data', value: 1 }]

  const statCards: Array<Omit<StatCardProps, 'delay'>> = [
    { title: 'Total Videos', value: formatNumber(d.totalVideos), icon: Film, change: 12.5, gradientIdx: 0 },
    { title: 'Total Views', value: formatNumber(d.totalViews), icon: Eye, change: 18.6, gradientIdx: 1 },
    { title: 'Total Clicks', value: formatNumber(d.totalClicks), icon: MousePointer, change: 11.4, gradientIdx: 2 },
    { title: 'Total Revenue', value: formatCurrency(d.totalRevenue), icon: DollarSign, change: 22.7, gradientIdx: 3 },
    { title: 'Total Ads', value: formatNumber(d.totalAds), icon: Megaphone, change: 14.8, gradientIdx: 4 },
    { title: 'Total Users', value: formatNumber(d.totalUsers), icon: Users, change: 16.2, gradientIdx: 5 },
  ]

  if (loading && !data) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-4 p-3 lg:p-5">

      {/* ═══════════════════════════════════════════════════════════════════
          TOP STATISTICS ROW
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-6">
        {statCards.map((card, i) => (
          <StatCard key={card.title} {...card} delay={i * 0.05} />
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          PERFORMANCE + TRAFFIC + DEVICE ROW (3-column on desktop)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {/* Performance Overview */}
        <SectionCard
          title="Performance Overview"
          delay={0.3}
          className="md:col-span-1 lg:col-span-1"
          action={
            <button className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/50 transition-colors hover:bg-white/10 hover:text-white">
              Last 30 Days
              <ChevronDown className="h-3 w-3" />
            </button>
          }
        >
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#666' }} />
                <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#666' }} tickFormatter={(v: number) => formatNumber(v)} width={45} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} formatter={(value: string) => <span className="text-white/50">{value}</span>} />
                <Line type="monotone" dataKey="Views" stroke="#E50914" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#E50914', stroke: '#111', strokeWidth: 2 }} />
                <Line type="monotone" dataKey="Clicks" stroke="#2ed573" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#2ed573', stroke: '#111', strokeWidth: 2 }} />
                <Line type="monotone" dataKey="Revenue" stroke="#70a1ff" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#70a1ff', stroke: '#111', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* Traffic Source */}
        <SectionCard title="Traffic Source" delay={0.35}>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={trafficSourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {trafficSourceData.map((_entry, index) => (
                    <Cell key={`traffic-${index}`} fill={TRAFFIC_COLORS[index % TRAFFIC_COLORS.length]} />
                  ))}
                </Pie>
                {/* Center label */}
                <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" className="fill-white text-sm font-bold">
                  12.45M
                </text>
                <text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle" className="fill-white/40 text-[10px]">
                  Views
                </text>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0]
                    const total = trafficSourceData.reduce((s, e) => s + e.value, 0)
                    const pct = ((d.value as number) / total * 100).toFixed(1)
                    return (
                      <div className="rounded-xl border border-white/10 bg-[#111111]/95 px-4 py-3 shadow-2xl">
                        <p className="text-sm font-semibold text-white">{d.name}</p>
                        <p className="text-xs text-white/50">{formatNumber(d.value as number)} ({pct}%)</p>
                      </div>
                    )
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 10 }}
                  formatter={(value: string, entry) => {
                    const item = trafficSourceData.find(d => d.name === value)
                    const total = trafficSourceData.reduce((s, e) => s + e.value, 0)
                    const pct = item ? ((item.value / total) * 100).toFixed(1) : ''
                    return <span className="text-white/50 text-[10px]">{value} {pct}%</span>
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* User Device */}
        <SectionCard title="User Device" delay={0.4}>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={userDeviceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {userDeviceData.map((_entry, index) => (
                    <Cell key={`device-${index}`} fill={DEVICE_COLORS[index % DEVICE_COLORS.length]} />
                  ))}
                </Pie>
                <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" className="fill-white text-sm font-bold">
                  85,247
                </text>
                <text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle" className="fill-white/40 text-[10px]">
                  Users
                </text>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0]
                    const total = userDeviceData.reduce((s, e) => s + e.value, 0)
                    const pct = ((d.value as number) / total * 100).toFixed(1)
                    return (
                      <div className="rounded-xl border border-white/10 bg-[#111111]/95 px-4 py-3 shadow-2xl">
                        <p className="text-sm font-semibold text-white">{d.name}</p>
                        <p className="text-xs text-white/50">{(d.value as number).toLocaleString()} ({pct}%)</p>
                      </div>
                    )
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 10 }}
                  formatter={(value: string, entry) => {
                    const item = userDeviceData.find(d => d.name === value)
                    const total = userDeviceData.reduce((s, e) => s + e.value, 0)
                    const pct = item ? ((item.value / total) * 100).toFixed(1) : ''
                    return <span className="text-white/50 text-[10px]">{value} {pct}%</span>
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          RECENTLY UPLOADED VIDEOS TABLE
          ═══════════════════════════════════════════════════════════════════ */}
      <SectionCard
        title="Recently Uploaded Videos"
        delay={0.45}
        action={
          <button className="text-xs font-semibold text-xtube-red transition-colors hover:text-xtube-red-hover">
            View All
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-white/30">Thumbnail</th>
                <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-white/30">Title</th>
                <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-white/30">Duration</th>
                <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-white/30">Size</th>
                <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-white/30">Uploaded</th>
                <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-white/30">Status</th>
                <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-white/30">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentVideos.map((video, i) => (
                <tr
                  key={video.id}
                  className="group transition-colors hover:bg-white/[0.02]"
                >
                  <td className="py-3 pr-4">
                    <div className="h-10 w-[72px] overflow-hidden rounded-md bg-xtube-card">
                      <div className="h-full w-full bg-gradient-to-br from-white/5 to-white/[0.02] flex items-center justify-center">
                        <Film className="h-4 w-4 text-white/20" />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-sm font-medium text-white group-hover:text-xtube-red transition-colors">{video.title}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="flex items-center gap-1 text-xs text-white/50">
                      <Clock className="h-3 w-3" />
                      {video.duration}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="flex items-center gap-1 text-xs text-white/50">
                      <HardDrive className="h-3 w-3" />
                      {video.size}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="flex items-center gap-1 text-xs text-white/50">
                      <Calendar className="h-3 w-3" />
                      {video.uploaded}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={video.status} />
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white" aria-label="View">
                        <ViewIcon className="h-3.5 w-3.5" />
                      </button>
                      <button className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white" aria-label="Edit">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-xtube-red/10 hover:text-xtube-red" aria-label="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
            <span className="text-xs text-white/30">1 to 5 of 20 videos</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4].map((page) => (
                <button
                  key={page}
                  className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium transition-colors ${
                    page === 1
                      ? 'bg-xtube-red text-white'
                      : 'text-white/40 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ═══════════════════════════════════════════════════════════════════
          VIDEO AD PLACEMENT PREVIEW + CATALOG OVERVIEW (2 columns)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* Video Ad Placement Preview */}
        <SectionCard
          title="Video Ad Placement Preview"
          delay={0.5}
          action={
            <button className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/50 transition-colors hover:bg-white/10 hover:text-white">
              Change Video
            </button>
          }
        >
          {/* Video Player Preview */}
          <div className="relative overflow-hidden rounded-lg bg-black">
            {/* Fake video frame */}
            <div className="relative aspect-video bg-gradient-to-br from-[#1a1a2e] to-[#16213e]">
              {/* Mountain scene gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] via-[#1a2a4a] to-[#2d3a5c]" />
              <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-[#0d1b2a] to-transparent" />

              {/* Ad markers on timeline */}
              <div className="absolute bottom-10 left-0 right-0 px-3">
                {/* Progress bar */}
                <div className="relative h-1 rounded-full bg-white/10">
                  <div className="absolute left-0 top-0 h-full w-[25%] rounded-full bg-xtube-red" />
                  {/* Pre-roll marker */}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-2 w-[3%] rounded-sm bg-orange-400" title="Pre-roll Ad" />
                  {/* Mid-roll marker */}
                  <div className="absolute left-[25%] top-1/2 -translate-y-1/2 h-2 w-[5%] rounded-sm bg-purple-400" title="Mid-roll Ad" />
                  {/* Overlay marker */}
                  <div className="absolute left-[6%] top-1/2 -translate-y-1/2 h-2 w-[3%] rounded-sm bg-emerald-400" title="Overlay Ad" />
                  {/* Post-roll marker */}
                  <div className="absolute right-[6%] top-1/2 -translate-y-1/2 h-2 w-[3%] rounded-sm bg-blue-400" title="Post-roll Ad" />
                </div>

                {/* Controls */}
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Pause className="h-3.5 w-3.5 text-white/70" />
                    <Volume2 className="h-3.5 w-3.5 text-white/50" />
                    <span className="text-[10px] text-white/50">02:15 / 08:30</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Settings className="h-3.5 w-3.5 text-white/50" />
                    <Maximize className="h-3.5 w-3.5 text-white/50" />
                  </div>
                </div>
              </div>

              {/* Ad overlay labels */}
              <div className="absolute top-3 left-3 space-y-1.5">
                <div className="flex items-center gap-1.5 rounded-md bg-orange-400/20 px-2 py-0.5 border border-orange-400/30">
                  <span className="text-[9px] font-bold text-orange-300">PRE-ROLL AD</span>
                  <span className="text-[8px] text-orange-300/60">00:00-00:15</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-md bg-purple-400/20 px-2 py-0.5 border border-purple-400/30">
                  <span className="text-[9px] font-bold text-purple-300">MID-ROLL AD</span>
                  <span className="text-[8px] text-purple-300/60">02:15-02:45</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-md bg-blue-400/20 px-2 py-0.5 border border-blue-400/30">
                  <span className="text-[9px] font-bold text-blue-300">POST-ROLL AD</span>
                  <span className="text-[8px] text-blue-300/60">05:20-05:35</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-md bg-emerald-400/20 px-2 py-0.5 border border-emerald-400/30">
                  <span className="text-[9px] font-bold text-emerald-300">OVERLAY AD</span>
                  <span className="text-[8px] text-emerald-300/60">00:30-00:45</span>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Catalog Overview */}
        <SectionCard
          title="Catalog Overview"
          delay={0.55}
          action={
            <button className="text-xs font-semibold text-xtube-red transition-colors hover:text-xtube-red-hover">
              View All
            </button>
          }
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {catalogCategories.map((cat, i) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 1, scale: 1 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`group relative overflow-hidden rounded-xl border border-white/5 bg-gradient-to-br ${cat.color} p-3 transition-all duration-300 hover:border-white/10 hover:shadow-lg ${cat.glow}`}
              >
                <cat.icon className={`h-6 w-6 ${cat.iconColor} mb-2 transition-transform duration-300 group-hover:scale-110`} />
                <p className="text-sm font-semibold text-white">{cat.name}</p>
                <p className="text-xs text-white/40">{cat.items} items</p>
              </motion.div>
            ))}
          </div>
          {/* Catalog Stats */}
          <div className="mt-4 flex items-center gap-4 border-t border-white/5 pt-3">
            <div>
              <span className="text-lg font-bold text-white">460</span>
              <span className="ml-1.5 text-xs text-white/40">Total Items</span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div>
              <span className="text-lg font-bold text-emerald-400">412</span>
              <span className="ml-1.5 text-xs text-white/40">Active</span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div>
              <span className="text-lg font-bold text-white/30">48</span>
              <span className="ml-1.5 text-xs text-white/40">Inactive</span>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          VIDEO ADS OVERVIEW + TOP PERFORMING ADS (2 columns)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* Video Ads Overview */}
        <SectionCard
          title="Video Ads Overview"
          delay={0.6}
          action={
            <button className="text-xs font-semibold text-xtube-red transition-colors hover:text-xtube-red-hover">
              View All
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="pb-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-white/30">Ad Type</th>
                  <th className="pb-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-white/30">Total</th>
                  <th className="pb-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-white/30">Impressions</th>
                  <th className="pb-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-white/30">Clicks</th>
                  <th className="pb-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-white/30">CTR</th>
                  <th className="pb-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-white/30">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {videoAdsData.map((ad, i) => {
                  const typeColors: Record<string, string> = {
                    'Pre-roll': 'bg-orange-400/10 text-orange-400 border-orange-400/20',
                    'Mid-roll': 'bg-purple-400/10 text-purple-400 border-purple-400/20',
                    'Post-roll': 'bg-blue-400/10 text-blue-400 border-blue-400/20',
                    'Overlay': 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
                  }
                  return (
                    <tr
                      key={ad.type}
                      className="group transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="py-2.5 pr-3">
                        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ${typeColors[ad.type]}`}>
                          {ad.type}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-xs font-medium text-white">{ad.totalAds}</td>
                      <td className="py-2.5 pr-3 text-xs text-white/60">{formatNumber(ad.impressions)}</td>
                      <td className="py-2.5 pr-3 text-xs text-white/60">{formatNumber(ad.clicks)}</td>
                      <td className="py-2.5 pr-3 text-xs font-semibold text-xtube-red">{ad.ctr}%</td>
                      <td className="py-2.5 text-xs font-medium text-emerald-400">${ad.revenue.toLocaleString()}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Top Performing Video Ads */}
        <SectionCard
          title="Top Performing Video Ads"
          delay={0.65}
          action={
            <button className="text-xs font-semibold text-xtube-red transition-colors hover:text-xtube-red-hover">
              View All
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="pb-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-white/30">#</th>
                  <th className="pb-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-white/30">Ad Name</th>
                  <th className="pb-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-white/30">Type</th>
                  <th className="pb-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-white/30">Impressions</th>
                  <th className="pb-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-white/30">CTR</th>
                  <th className="pb-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-white/30">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {topPerformingAds.map((ad, i) => {
                  const rankStyles = ad.rank === 1
                    ? 'bg-xtube-red/10 text-xtube-red'
                    : ad.rank === 2
                      ? 'bg-amber-500/10 text-amber-400'
                      : ad.rank === 3
                        ? 'bg-blue-500/10 text-blue-400'
                        : 'bg-white/5 text-white/40'

                  const typeColors: Record<string, string> = {
                    'Pre-roll': 'text-orange-400',
                    'Mid-roll': 'text-purple-400',
                    'Post-roll': 'text-blue-400',
                    'Overlay': 'text-emerald-400',
                  }

                  return (
                    <tr
                      key={ad.rank}
                      className="group transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="py-2.5 pr-3">
                        <span className={`inline-flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold ${rankStyles}`}>
                          {ad.rank}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-xs font-medium text-white group-hover:text-xtube-red transition-colors">{ad.name}</td>
                      <td className="py-2.5 pr-3 text-[10px] font-semibold">
                        <span className={typeColors[ad.type]}>{ad.type}</span>
                      </td>
                      <td className="py-2.5 pr-3 text-xs text-white/60">{formatNumber(ad.impressions)}</td>
                      <td className="py-2.5 pr-3 text-xs font-semibold text-xtube-red">{ad.ctr}%</td>
                      <td className="py-2.5 text-xs font-medium text-emerald-400">${ad.revenue.toLocaleString()}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          REVENUE OVERVIEW (Full width)
          ═══════════════════════════════════════════════════════════════════ */}
      <SectionCard
        title="Revenue Overview"
        delay={0.75}
        action={
          <button className="text-xs font-semibold text-xtube-red transition-colors hover:text-xtube-red-hover">
            View All
          </button>
        }
      >
        <div className="mb-4 flex items-baseline gap-3">
          <span className="text-2xl font-bold text-white">{formatCurrency(d.totalRevenue)}</span>
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
            <TrendingUp className="h-3 w-3" />
            +22.7%
          </span>
          <span className="text-[10px] text-white/30">from last 30 days</span>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={d.revenueGraph}>
              <defs>
                <linearGradient id="revenueOverviewGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E50914" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#E50914" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#9ca3af"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#666' }}
              />
              <YAxis
                stroke="#9ca3af"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#666' }}
                tickFormatter={(v: number) => '$' + formatNumber(v)}
                width={55}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#E50914"
                strokeWidth={2.5}
                fill="url(#revenueOverviewGradient)"
                dot={false}
                activeDot={{ r: 5, fill: '#E50914', stroke: '#111', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>
    </div>
  )
})
