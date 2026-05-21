'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  DollarSign,
  Users,
  Film,
  Download,
  RefreshCw,
  BarChart3,
  TrendingUp,
  Eye,
  Activity,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AnalyticsData {
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

interface GeneratedReport {
  id: string
  type: string
  title: string
  dateRange: string
  generatedAt: string
  status: 'ready' | 'generating'
  summary: string
  data: Record<string, unknown>
}

type DateRange = '7d' | '30d' | '90d' | 'all'

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  all: 'All time',
}

const REPORT_TYPES = [
  {
    id: 'revenue',
    title: 'Revenue Summary',
    description: 'Total revenue, breakdown by source, and trend analysis',
    icon: DollarSign,
    color: 'text-green-400',
    bgColor: 'bg-green-400/10',
    borderColor: 'border-green-400/20',
  },
  {
    id: 'user-activity',
    title: 'User Activity',
    description: 'User engagement, signups, retention, and session metrics',
    icon: Users,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    borderColor: 'border-blue-400/20',
  },
  {
    id: 'content-performance',
    title: 'Content Performance',
    description: 'Video views, top content, category breakdown, and watch time',
    icon: Film,
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
    borderColor: 'border-purple-400/20',
  },
  {
    id: 'ad-performance',
    title: 'Ad Performance',
    description: 'Ad impressions, clicks, CTR, revenue, and placement analysis',
    icon: Activity,
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/10',
    borderColor: 'border-amber-400/20',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toLocaleString()
}

function formatCurrency(num: number): string {
  return '$' + num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function generateReportData(type: string, analytics: AnalyticsData, dateRange: DateRange): GeneratedReport {
  const now = new Date().toISOString()
  const rangeLabel = DATE_RANGE_LABELS[dateRange]

  switch (type) {
    case 'revenue':
      return {
        id: `rpt-${Date.now()}-rev`,
        type: 'revenue',
        title: 'Revenue Summary',
        dateRange: rangeLabel,
        generatedAt: now,
        status: 'ready',
        summary: `Total revenue: ${formatCurrency(analytics.totalRevenue)} across ${analytics.totalAds} active ads. Average revenue per ad: ${formatCurrency(analytics.totalAds > 0 ? analytics.totalRevenue / analytics.totalAds : 0)}.`,
        data: {
          totalRevenue: analytics.totalRevenue,
          totalAds: analytics.totalAds,
          avgRevenuePerAd: analytics.totalAds > 0 ? analytics.totalRevenue / analytics.totalAds : 0,
          revenueByDate: analytics.revenueGraph,
          ctr: analytics.totalViews > 0 ? ((analytics.totalClicks / analytics.totalViews) * 100).toFixed(2) + '%' : '0%',
        },
      }
    case 'user-activity':
      return {
        id: `rpt-${Date.now()}-user`,
        type: 'user-activity',
        title: 'User Activity',
        dateRange: rangeLabel,
        generatedAt: now,
        status: 'ready',
        summary: `Total users: ${analytics.totalUsers.toLocaleString()}. Total views: ${formatNumber(analytics.totalViews)}. Avg views per user: ${analytics.totalUsers > 0 ? formatNumber(analytics.totalViews / analytics.totalUsers) : '0'}.`,
        data: {
          totalUsers: analytics.totalUsers,
          totalViews: analytics.totalViews,
          avgViewsPerUser: analytics.totalUsers > 0 ? Math.round(analytics.totalViews / analytics.totalUsers) : 0,
          viewsByDate: analytics.viewsGraph,
          deviceBreakdown: analytics.deviceBreakdown,
        },
      }
    case 'content-performance':
      return {
        id: `rpt-${Date.now()}-content`,
        type: 'content-performance',
        title: 'Content Performance',
        dateRange: rangeLabel,
        generatedAt: now,
        status: 'ready',
        summary: `Total videos: ${analytics.totalVideos.toLocaleString()}. Total views: ${formatNumber(analytics.totalViews)}. Top categories: ${analytics.categoryStats.slice(0, 3).map(c => c.category).join(', ') || 'N/A'}.`,
        data: {
          totalVideos: analytics.totalVideos,
          totalViews: analytics.totalViews,
          categoryStats: analytics.categoryStats,
          topCategory: analytics.categoryStats[0]?.category || 'N/A',
          viewsByDate: analytics.viewsGraph,
        },
      }
    case 'ad-performance':
      return {
        id: `rpt-${Date.now()}-ad`,
        type: 'ad-performance',
        title: 'Ad Performance',
        dateRange: rangeLabel,
        generatedAt: now,
        status: 'ready',
        summary: `Total impressions: ${formatNumber(analytics.totalViews)}. Total clicks: ${formatNumber(analytics.totalClicks)}. CTR: ${analytics.totalViews > 0 ? ((analytics.totalClicks / analytics.totalViews) * 100).toFixed(2) : '0'}%. Revenue: ${formatCurrency(analytics.totalRevenue)}.`,
        data: {
          totalImpressions: analytics.totalViews,
          totalClicks: analytics.totalClicks,
          ctr: analytics.totalViews > 0 ? ((analytics.totalClicks / analytics.totalViews) * 100).toFixed(2) + '%' : '0%',
          totalRevenue: analytics.totalRevenue,
          totalAds: analytics.totalAds,
          revenueByDate: analytics.revenueGraph,
        },
      }
    default:
      return {
        id: `rpt-${Date.now()}-unknown`,
        type: 'unknown',
        title: 'Unknown Report',
        dateRange: rangeLabel,
        generatedAt: now,
        status: 'ready',
        summary: 'Unknown report type.',
        data: {},
      }
  }
}

function downloadCSV(report: GeneratedReport) {
  const rows: string[] = []
  rows.push('Field,Value')
  Object.entries(report.data).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      rows.push(`${key},"[Array with ${value.length} items]"`)
    } else if (typeof value === 'object' && value !== null) {
      rows.push(`${key},"${JSON.stringify(value)}"`)
    } else {
      rows.push(`${key},${value}`)
    }
  })
  rows.push('')
  rows.push(`Report Type,${report.title}`)
  rows.push(`Date Range,${report.dateRange}`)
  rows.push(`Generated At,${report.generatedAt}`)
  rows.push(`Summary,${report.summary}`)

  const csv = rows.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${report.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KPICardProps {
  title: string
  value: string
  icon: React.ElementType
  color: string
  bgColor: string
  delay: number
}

function KPICard({ title, value, icon: Icon, color, bgColor, delay }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="group relative overflow-hidden rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-4 lg:p-5 transition-colors hover:border-xtube-red/20 hover:shadow-[0_0_15px_rgba(229,9,20,0.1)]"
    >
      <div className="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-xtube-red to-transparent" />
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-xtube-text-secondary">{title}</p>
          <p className="text-xl md:text-2xl font-bold text-white">{value}</p>
        </div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${bgColor}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
      </div>
    </motion.div>
  )
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-4 p-3 lg:p-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl bg-xtube-card" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl bg-xtube-card" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl bg-xtube-card" />
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-xtube-red/10 mb-4">
        <FileText className="h-8 w-8 text-xtube-red" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">No Reports Generated</h3>
      <p className="text-sm text-xtube-text-secondary max-w-sm">
        Generate your first report by clicking the &quot;Generate&quot; button on any report type above.
      </p>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ReportsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>('30d')
  const [reports, setReports] = useState<GeneratedReport[]>([])
  const [generating, setGenerating] = useState<string | null>(null)

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/analytics')
      if (!res.ok) throw new Error('Failed to fetch analytics')
      const data = await res.json()
      setAnalytics(data)
    } catch (err) {
      console.error('Error fetching analytics:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const handleGenerate = async (reportType: string) => {
    if (!analytics) {
      await fetchAnalytics()
      return
    }
    setGenerating(reportType)
    // Simulate brief generation time
    await new Promise((resolve) => setTimeout(resolve, 1200))
    const report = generateReportData(reportType, analytics, dateRange)
    setReports((prev) => [report, ...prev])
    setGenerating(null)
  }

  const handleExport = (report: GeneratedReport) => {
    downloadCSV(report)
  }

  if (loading) return <LoadingSkeleton />

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center p-3 lg:p-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 mb-4">
          <AlertCircle className="h-8 w-8 text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Failed to Load Data</h3>
        <p className="text-sm text-xtube-text-secondary mb-4">{error}</p>
        <Button
          onClick={fetchAnalytics}
          variant="outline"
          className="border-xtube-border bg-xtube-card text-white hover:bg-white/10"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  const totalReports = reports.length
  const revenueReports = reports.filter((r) => r.type === 'revenue').length
  const userReports = reports.filter((r) => r.type === 'user-activity').length
  const contentReports = reports.filter((r) => r.type === 'content-performance').length

  const kpiCards = [
    { title: 'Total Reports', value: totalReports.toString(), icon: FileText, color: 'text-xtube-red', bgColor: 'bg-xtube-red/10' },
    { title: 'Revenue Reports', value: revenueReports.toString(), icon: DollarSign, color: 'text-green-400', bgColor: 'bg-green-400/10' },
    { title: 'User Reports', value: userReports.toString(), icon: Users, color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
    { title: 'Content Reports', value: contentReports.toString(), icon: Film, color: 'text-purple-400', bgColor: 'bg-purple-400/10' },
  ]

  const getReportTypeBadge = (type: string) => {
    switch (type) {
      case 'revenue':
        return <Badge className="bg-green-400/10 text-green-400 border-0 text-xs hover:bg-green-400/20">Revenue</Badge>
      case 'user-activity':
        return <Badge className="bg-blue-400/10 text-blue-400 border-0 text-xs hover:bg-blue-400/20">User Activity</Badge>
      case 'content-performance':
        return <Badge className="bg-purple-400/10 text-purple-400 border-0 text-xs hover:bg-purple-400/20">Content</Badge>
      case 'ad-performance':
        return <Badge className="bg-amber-400/10 text-amber-400 border-0 text-xs hover:bg-amber-400/20">Ads</Badge>
      default:
        return <Badge className="bg-white/5 text-xtube-text-secondary border-0 text-xs">{type}</Badge>
    }
  }

  return (
    <div className="space-y-4 p-3 lg:p-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-xtube-red/10">
            <FileText className="h-5 w-5 text-xtube-red" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Reports</h2>
            <p className="text-sm text-xtube-text-secondary">Generate and view platform reports</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <SelectTrigger className="border-xtube-border bg-xtube-card text-white h-9 w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-xtube-border bg-xtube-card text-white">
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={fetchAnalytics}
            variant="outline"
            size="sm"
            className="border-xtube-border bg-xtube-card text-white hover:bg-white/10 h-9"
          >
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {kpiCards.map((card, i) => (
          <KPICard key={card.title} {...card} delay={i * 0.05} />
        ))}
      </div>

      {/* Report Generator Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-xtube-red" />
          <h3 className="text-lg font-semibold text-white">Report Generator</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {REPORT_TYPES.map((report, i) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.05 }}
              className={`group rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-4 transition-colors hover:${report.borderColor} hover:shadow-[0_0_12px_rgba(229,9,20,0.08)]`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${report.bgColor} flex-shrink-0`}>
                    <report.icon className={`h-5 w-5 ${report.color}`} />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h4 className="text-sm font-semibold text-white">{report.title}</h4>
                    <p className="text-xs text-xtube-text-secondary leading-relaxed">{report.description}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleGenerate(report.id)}
                  disabled={generating !== null}
                  className="bg-xtube-red text-white hover:bg-xtube-red/90 h-8 px-3 text-xs ml-3 flex-shrink-0"
                >
                  {generating === report.id ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Generating
                    </>
                  ) : (
                    <>
                      <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent Reports Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-4 lg:p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-xtube-red" />
            <h3 className="text-lg font-semibold text-white">Recent Reports</h3>
          </div>
          {reports.length > 0 && (
            <Badge className="bg-xtube-red/10 text-xtube-red border-0 text-xs">
              {reports.length} report{reports.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {reports.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-xtube-border hover:bg-transparent">
                  <TableHead className="text-xtube-text-secondary">Type</TableHead>
                  <TableHead className="text-xtube-text-secondary">Title</TableHead>
                  <TableHead className="text-xtube-text-secondary hidden sm:table-cell">Date Range</TableHead>
                  <TableHead className="text-xtube-text-secondary hidden md:table-cell">Generated</TableHead>
                  <TableHead className="text-xtube-text-secondary">Status</TableHead>
                  <TableHead className="text-xtube-text-secondary text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report, idx) => (
                  <motion.tr
                    key={report.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03, duration: 0.3 }}
                    className="border-xtube-border hover:bg-white/[0.02] transition-colors"
                  >
                    <TableCell>{getReportTypeBadge(report.type)}</TableCell>
                    <TableCell>
                      <span className="font-medium text-white text-sm">{report.title}</span>
                    </TableCell>
                    <TableCell className="text-xtube-text-secondary text-sm hidden sm:table-cell">
                      {report.dateRange}
                    </TableCell>
                    <TableCell className="text-xtube-text-secondary text-sm hidden md:table-cell">
                      {formatDate(report.generatedAt)}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-400/10 text-green-400 border-0 text-xs hover:bg-green-400/20">
                        Ready
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleExport(report)}
                        className="h-7 px-2 text-xtube-text-secondary hover:text-white hover:bg-white/10 text-xs"
                      >
                        <Download className="h-3.5 w-3.5 mr-1" />
                        CSV
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </motion.div>
    </div>
  )
}
