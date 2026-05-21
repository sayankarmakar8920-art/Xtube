'use client'

import { motion } from 'framer-motion'
import {
  Eye,
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  Play,
  DollarSign,
  Globe,
  Wifi,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'

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

interface AnalyticsPageProps {
  data: DashboardData | null
  loading: boolean
}

const COLORS = ['#E50914', '#ff6b6b', '#ffa502', '#2ed573', '#70a1ff', '#a855f7']

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toLocaleString()
}

function formatCurrency(num: number): string {
  return '$' + num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

// Custom tooltip
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-xtube-border bg-[#0f0f0f] px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs text-xtube-text-secondary">{label}</p>
      {payload.map((entry, idx) => (
        <p key={idx} className="text-sm font-medium" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  )
}

// Simulated data generators
function generateTrafficData(viewsGraph: Array<{ date: string; views: number }>) {
  return viewsGraph.map((item) => ({
    ...item,
    uniqueVisitors: Math.round(item.views * (0.55 + Math.random() * 0.15)),
    sessions: Math.round(item.views * (0.7 + Math.random() * 0.1)),
  }))
}

function generateUserGrowthData() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  let base = 1200
  return months.map((month) => {
    base += Math.round(100 + Math.random() * 300)
    return { month, signups: base + Math.round(Math.random() * 200) }
  })
}

function generateAdPerformanceData() {
  return [
    { type: 'Pre-roll', impressions: 45200, clicks: 2260, revenue: 3400 },
    { type: 'Mid-roll', impressions: 38700, clicks: 1935, revenue: 2900 },
    { type: 'Post-roll', impressions: 22100, clicks: 884, revenue: 1320 },
    { type: 'Overlay', impressions: 31500, clicks: 1575, revenue: 2360 },
    { type: 'Banner', impressions: 52800, clicks: 2640, revenue: 1580 },
  ]
}

function generateGeoData() {
  return [
    { country: 'United States', visitors: 42300, pct: 32 },
    { country: 'United Kingdom', visitors: 18700, pct: 14 },
    { country: 'Germany', visitors: 14200, pct: 11 },
    { country: 'Japan', visitors: 11500, pct: 9 },
    { country: 'Brazil', visitors: 8900, pct: 7 },
  ]
}

interface TopMetricCardProps {
  title: string
  value: string
  icon: React.ElementType
  change: number
  delay: number
}

function TopMetricCard({ title, value, icon: Icon, change, delay }: TopMetricCardProps) {
  const isPositive = change >= 0
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="group rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-3 lg:p-5 transition-colors hover:border-xtube-red/20 hover:shadow-[0_0_15px_rgba(229,9,20,0.1)]"
    >
      <div className="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-xtube-red to-transparent" />
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-xtube-text-secondary">{title}</p>
          <p className="text-xl md:text-2xl font-bold text-white">{value}</p>
          <div className="flex items-center gap-1">
            {isPositive ? (
              <TrendingUp className="h-3.5 w-3.5 text-green-400" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-red-400" />
            )}
            <span className={`text-xs font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}{change}%
            </span>
            <span className="text-xs text-xtube-text-secondary">vs last month</span>
          </div>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-xtube-red/10 md:h-10 md:w-10">
          <Icon className="h-5 w-5 text-xtube-red md:h-6 md:w-6" />
        </div>
      </div>
    </motion.div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 p-3 lg:p-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl bg-xtube-card" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-72 rounded-xl bg-xtube-card" />
        ))}
      </div>
    </div>
  )
}

export function AnalyticsPage({ data, loading }: AnalyticsPageProps) {
  if (loading || !data) {
    return <LoadingSkeleton />
  }

  const trafficData = generateTrafficData(data.viewsGraph)
  const userGrowthData = generateUserGrowthData()
  const adPerfData = generateAdPerformanceData()
  const geoData = generateGeoData()

  const deviceData = Object.entries(data.deviceBreakdown).map(([name, value]) => ({
    name,
    value,
  }))

  const topMetrics = [
    { title: 'Page Views', value: formatNumber(data.totalViews * 2.4), icon: Eye, change: 12.3 },
    { title: 'Unique Visitors', value: formatNumber(Math.round(data.totalViews * 0.62)), icon: Users, change: 8.7 },
    { title: 'Bounce Rate', value: '34.2%', icon: Activity, change: -2.1 },
    { title: 'Avg. Session', value: '8m 24s', icon: Clock, change: 5.4 },
  ]

  return (
    <div className="space-y-4 p-3 lg:p-5">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {topMetrics.map((metric, i) => (
          <TopMetricCard key={metric.title} {...metric} delay={i * 0.05} />
        ))}
      </div>

      {/* Traffic Overview + Revenue Analytics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Traffic Overview - Large Area Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-3 lg:p-5 hover:border-xtube-red/20 hover:shadow-[0_0_15px_rgba(229,9,20,0.1)] transition-colors"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Traffic Overview</h3>
          <div className="h-64 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficData}>
                <defs>
                  <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E50914" stopOpacity={0.4} />
                    <stop offset="50%" stopColor="#E50914" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#E50914" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="visitorsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff6b6b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ff6b6b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => formatNumber(v)} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
                <Area type="monotone" dataKey="views" stroke="#E50914" strokeWidth={2.5} fill="url(#trafficGradient)" name="Views" />
                <Area type="monotone" dataKey="uniqueVisitors" stroke="#ff6b6b" strokeWidth={2} fill="url(#visitorsGradient)" name="Unique Visitors" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Revenue Analytics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-3 lg:p-5 hover:border-xtube-red/20 hover:shadow-[0_0_15px_rgba(229,9,20,0.1)] transition-colors"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Revenue Analytics</h3>
          <div className="h-64 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenueGraph}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2ed573" stopOpacity={0.4} />
                    <stop offset="50%" stopColor="#2ed573" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2ed573" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => '$' + formatNumber(v)} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#2ed573" strokeWidth={2.5} fill="url(#revenueGradient)" name="Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* User Growth + Traffic Sources */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* User Growth Line Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-3 lg:p-5 hover:border-xtube-red/20 hover:shadow-[0_0_15px_rgba(229,9,20,0.1)] transition-colors"
        >
          <h3 className="text-lg font-semibold text-white mb-4">User Growth</h3>
          <div className="h-64 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => formatNumber(v)} />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="signups"
                  stroke="#70a1ff"
                  strokeWidth={2.5}
                  dot={{ fill: '#70a1ff', r: 4 }}
                  activeDot={{ r: 6, fill: '#70a1ff' }}
                  name="Signups"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Traffic Sources - Donut/Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-3 lg:p-5 hover:border-xtube-red/20 hover:shadow-[0_0_15px_rgba(229,9,20,0.1)] transition-colors"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Traffic Sources</h3>
          <div className="h-64 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deviceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#9ca3af' }}
                >
                  {deviceData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Ad Performance + Geographic Distribution */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Ad Performance Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-3 lg:p-5 hover:border-xtube-red/20 hover:shadow-[0_0_15px_rgba(229,9,20,0.1)] transition-colors"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Ad Performance</h3>
          <div className="h-64 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={adPerfData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                <XAxis dataKey="type" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => formatNumber(v)} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
                <Bar dataKey="impressions" fill="#E50914" radius={[3, 3, 0, 0]} name="Impressions" />
                <Bar dataKey="clicks" fill="#ff6b6b" radius={[3, 3, 0, 0]} name="Clicks" />
                <Bar dataKey="revenue" fill="#2ed573" radius={[3, 3, 0, 0]} name="Revenue ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Geographic Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-3 lg:p-5 hover:border-xtube-red/20 hover:shadow-[0_0_15px_rgba(229,9,20,0.1)] transition-colors"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Geographic Distribution</h3>
          <div className="space-y-3">
            {geoData.map((item, idx) => (
              <div key={item.country} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-xtube-text-secondary" />
                    <span className="text-sm text-white">{item.country}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{formatNumber(item.visitors)}</span>
                    <span className="text-xs text-xtube-text-secondary">({item.pct}%)</span>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-xtube-border overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.pct}%` }}
                    transition={{ delay: 0.5 + idx * 0.1, duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Real-time Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-3 lg:p-5 hover:border-xtube-red/20 hover:shadow-[0_0_15px_rgba(229,9,20,0.1)] transition-colors"
      >
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-semibold text-white">Real-time Stats</h3>
          <div className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-0.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            <span className="text-xs font-medium text-green-400">Live</span>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-lg border border-xtube-border bg-xtube-bg/50 p-3 lg:p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-xtube-red/10">
              <Wifi className="h-5 w-5 text-xtube-red" />
            </div>
            <div>
              <p className="text-sm text-xtube-text-secondary">Active Users Now</p>
              <p className="text-xl font-bold text-white">{Math.round(data.totalViews * 0.003).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-xtube-border bg-xtube-bg/50 p-3 lg:p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-xtube-red/10">
              <Play className="h-5 w-5 text-xtube-red" />
            </div>
            <div>
              <p className="text-sm text-xtube-text-secondary">Videos Being Watched</p>
              <p className="text-xl font-bold text-white">{Math.round(data.totalViews * 0.0012).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-xtube-border bg-xtube-bg/50 p-3 lg:p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-xtube-red/10">
              <DollarSign className="h-5 w-5 text-xtube-red" />
            </div>
            <div>
              <p className="text-sm text-xtube-text-secondary">Revenue Today</p>
              <p className="text-xl font-bold text-white">{formatCurrency(Math.round(data.totalRevenue * 0.035))}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
