'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Terminal,
  AlertTriangle,
  AlertCircle,
  Info,
  Shield,
  RefreshCw,
  Trash2,
  Activity,
  Loader2,
  Search,
  Eye,
  Clock,
  Server,
  Bug,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SystemLog {
  id: string
  level: string
  category: string
  message: string
  details: string | null
  userId: string | null
  ip: string | null
  userAgent: string | null
  createdAt: string
}

type LevelFilter = 'all' | 'info' | 'warning' | 'error' | 'critical'
type CategoryFilter = 'all' | 'system' | 'auth' | 'upload' | 'api' | 'security'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) return `${diffSeconds}s ago`
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

function getLevelBadge(level: string) {
  switch (level) {
    case 'info':
      return (
        <Badge className="bg-blue-400/10 text-blue-400 border-0 text-xs hover:bg-blue-400/20">
          <Info className="h-3 w-3 mr-1" />
          Info
        </Badge>
      )
    case 'warning':
      return (
        <Badge className="bg-yellow-400/10 text-yellow-400 border-0 text-xs hover:bg-yellow-400/20">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Warning
        </Badge>
      )
    case 'error':
      return (
        <Badge className="bg-red-400/10 text-red-400 border-0 text-xs hover:bg-red-400/20">
          <AlertCircle className="h-3 w-3 mr-1" />
          Error
        </Badge>
      )
    case 'critical':
      return (
        <Badge className="bg-red-500/15 text-red-500 border-0 text-xs hover:bg-red-500/25 shadow-[0_0_8px_rgba(239,68,68,0.3)]">
          <Bug className="h-3 w-3 mr-1" />
          Critical
        </Badge>
      )
    default:
      return (
        <Badge className="bg-white/5 text-xtube-text-secondary border-0 text-xs">
          {level}
        </Badge>
      )
  }
}

function getCategoryIcon(category: string) {
  switch (category) {
    case 'system':
      return <Server className="h-3.5 w-3.5 text-xtube-text-secondary" />
    case 'auth':
      return <Shield className="h-3.5 w-3.5 text-blue-400" />
    case 'upload':
      return <Activity className="h-3.5 w-3.5 text-purple-400" />
    case 'api':
      return <Terminal className="h-3.5 w-3.5 text-green-400" />
    case 'security':
      return <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
    default:
      return <Activity className="h-3.5 w-3.5 text-xtube-text-secondary" />
  }
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KPICardProps {
  title: string
  value: number
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
          <p className="text-xl md:text-2xl font-bold text-white">{value.toLocaleString()}</p>
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
      <Skeleton className="h-12 rounded-xl bg-xtube-card" />
      <Skeleton className="h-96 rounded-xl bg-xtube-card" />
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-xtube-red/10 mb-4">
        <Terminal className="h-8 w-8 text-xtube-red" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">No Logs Found</h3>
      <p className="text-sm text-xtube-text-secondary max-w-sm">
        No system logs match your current filters. Try adjusting the level or category filters.
      </p>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SystemLogsPage() {
  const [logs, setLogs] = useState<SystemLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [clearing, setClearing] = useState(false)

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (levelFilter !== 'all') params.set('level', levelFilter)
      if (categoryFilter !== 'all') params.set('category', categoryFilter)
      const query = params.toString()
      const url = `/api/system-logs${query ? `?${query}` : ''}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch system logs')
      const data = await res.json()
      setLogs(data.items || [])
    } catch (err) {
      console.error('Error fetching system logs:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [levelFilter, categoryFilter])

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => {
      fetchLogs()
    }, 30000)
    return () => clearInterval(interval)
  }, [autoRefresh, fetchLogs])

  const handleClearLogs = async () => {
    try {
      setClearing(true)
      const res = await fetch('/api/system-logs', { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to clear logs')
      setLogs([])
    } catch (err) {
      console.error('Error clearing logs:', err)
    } finally {
      setClearing(false)
    }
  }

  const handleViewDetail = (log: SystemLog) => {
    setSelectedLog(log)
    setDetailOpen(true)
  }

  // Computed KPI values
  const totalLogs = logs.length
  const errorCount = logs.filter((l) => l.level === 'error' || l.level === 'critical').length
  const warningCount = logs.filter((l) => l.level === 'warning').length
  const infoCount = logs.filter((l) => l.level === 'info').length

  const kpiCards = [
    { title: 'Total Logs', value: totalLogs, icon: Terminal, color: 'text-xtube-red', bgColor: 'bg-xtube-red/10' },
    { title: 'Errors', value: errorCount, icon: AlertCircle, color: 'text-red-400', bgColor: 'bg-red-400/10' },
    { title: 'Warnings', value: warningCount, icon: AlertTriangle, color: 'text-yellow-400', bgColor: 'bg-yellow-400/10' },
    { title: 'Info', value: infoCount, icon: Info, color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
  ]

  if (loading && logs.length === 0) return <LoadingSkeleton />

  if (error && logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center p-3 lg:p-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 mb-4">
          <AlertCircle className="h-8 w-8 text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Failed to Load Logs</h3>
        <p className="text-sm text-xtube-text-secondary mb-4">{error}</p>
        <Button
          onClick={fetchLogs}
          variant="outline"
          className="border-xtube-border bg-xtube-card text-white hover:bg-white/10"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
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
            <Terminal className="h-5 w-5 text-xtube-red" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">System Logs</h2>
            <p className="text-sm text-xtube-text-secondary">Monitor system activity and errors</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Auto-refresh toggle */}
          <div className="flex items-center gap-2">
            <Switch
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
              className="data-[state=checked]:bg-xtube-red"
            />
            <span className="text-xs text-xtube-text-secondary whitespace-nowrap">Auto-refresh (30s)</span>
          </div>
          <Button
            onClick={fetchLogs}
            variant="outline"
            size="sm"
            className="border-xtube-border bg-xtube-card text-white hover:bg-white/10 h-9"
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
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

      {/* Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
          {/* Level Filter */}
          <Select value={levelFilter} onValueChange={(v) => setLevelFilter(v as LevelFilter)}>
            <SelectTrigger className="border-xtube-border bg-xtube-card text-white h-9 w-full sm:w-[140px]">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent className="border-xtube-border bg-xtube-card text-white">
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>

          {/* Category Filter */}
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as CategoryFilter)}>
            <SelectTrigger className="border-xtube-border bg-xtube-card text-white h-9 w-full sm:w-[140px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="border-xtube-border bg-xtube-card text-white">
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="auth">Auth</SelectItem>
              <SelectItem value="upload">Upload</SelectItem>
              <SelectItem value="api">API</SelectItem>
              <SelectItem value="security">Security</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Clear Logs Button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={logs.length === 0 || clearing}
              className="border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 hover:text-red-300 h-9"
            >
              {clearing ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-1.5" />
              )}
              Clear Logs
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="border-xtube-border bg-[#0f0f0f] text-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Clear All System Logs?</AlertDialogTitle>
              <AlertDialogDescription className="text-xtube-text-secondary">
                This action will permanently delete all system logs. This operation cannot be undone.
                All log entries including errors, warnings, and info messages will be removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-xtube-border bg-xtube-card text-white hover:bg-white/10">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleClearLogs}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                Delete All Logs
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>

      {/* Logs Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-4 lg:p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-xtube-text-secondary" />
            <span className="text-sm text-xtube-text-secondary">
              Showing {logs.length} log{logs.length !== 1 ? 's' : ''}
            </span>
          </div>
          {autoRefresh && (
            <div className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-0.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              <span className="text-xs font-medium text-green-400">Live</span>
            </div>
          )}
        </div>

        {logs.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-xtube-border hover:bg-transparent">
                  <TableHead className="text-xtube-text-secondary w-[100px]">Level</TableHead>
                  <TableHead className="text-xtube-text-secondary w-[100px] hidden sm:table-cell">Category</TableHead>
                  <TableHead className="text-xtube-text-secondary">Message</TableHead>
                  <TableHead className="text-xtube-text-secondary w-[140px] hidden md:table-cell">Timestamp</TableHead>
                  <TableHead className="text-xtube-text-secondary text-right w-[80px]">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log, idx) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.02, duration: 0.25 }}
                    className="border-xtube-border hover:bg-white/[0.02] transition-colors"
                  >
                    <TableCell>{getLevelBadge(log.level)}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-1.5">
                        {getCategoryIcon(log.category)}
                        <span className="text-sm text-xtube-text-secondary capitalize">{log.category}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-white line-clamp-2 max-w-xs lg:max-w-md">{log.message}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-xtube-text-secondary">{formatRelativeTime(log.createdAt)}</span>
                        <span className="text-[10px] text-xtube-text-secondary/60">{formatDate(log.createdAt)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetail(log)}
                        className="h-7 px-2 text-xtube-text-secondary hover:text-white hover:bg-white/10 text-xs"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </motion.div>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="border-xtube-border bg-[#0f0f0f] text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Terminal className="h-5 w-5 text-xtube-red" />
              Log Detail
            </DialogTitle>
            <DialogDescription className="text-xtube-text-secondary">
              Full log entry details
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-3">
              {/* Level & Category Row */}
              <div className="flex items-center gap-3">
                {getLevelBadge(selectedLog.level)}
                <div className="flex items-center gap-1.5">
                  {getCategoryIcon(selectedLog.category)}
                  <span className="text-sm text-xtube-text-secondary capitalize">{selectedLog.category}</span>
                </div>
              </div>

              {/* Message */}
              <div className="rounded-lg border border-xtube-border bg-xtube-bg/50 p-3">
                <p className="text-xs text-xtube-text-secondary mb-1">Message</p>
                <p className="text-sm text-white">{selectedLog.message}</p>
              </div>

              {/* Timestamp */}
              <div className="flex items-center gap-2 text-sm text-xtube-text-secondary">
                <Clock className="h-4 w-4" />
                <span>{formatDate(selectedLog.createdAt)}</span>
              </div>

              {/* Details */}
              {selectedLog.details && (
                <div className="rounded-lg border border-xtube-border bg-xtube-bg/50 p-3">
                  <p className="text-xs text-xtube-text-secondary mb-1">Details</p>
                  <pre className="text-xs text-white/80 whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
                    {(() => {
                      try {
                        return JSON.stringify(JSON.parse(selectedLog.details), null, 2)
                      } catch {
                        return selectedLog.details
                      }
                    })()}
                  </pre>
                </div>
              )}

              {/* Metadata Grid */}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {selectedLog.userId && (
                  <div className="rounded-lg border border-xtube-border bg-xtube-bg/50 p-2.5">
                    <p className="text-[10px] text-xtube-text-secondary mb-0.5">User ID</p>
                    <p className="text-xs text-white font-mono truncate">{selectedLog.userId}</p>
                  </div>
                )}
                {selectedLog.ip && (
                  <div className="rounded-lg border border-xtube-border bg-xtube-bg/50 p-2.5">
                    <p className="text-[10px] text-xtube-text-secondary mb-0.5">IP Address</p>
                    <p className="text-xs text-white font-mono">{selectedLog.ip}</p>
                  </div>
                )}
                {selectedLog.userAgent && (
                  <div className="rounded-lg border border-xtube-border bg-xtube-bg/50 p-2.5">
                    <p className="text-[10px] text-xtube-text-secondary mb-0.5">User Agent</p>
                    <p className="text-xs text-white font-mono truncate">{selectedLog.userAgent}</p>
                  </div>
                )}
              </div>

              {/* Log ID */}
              <div className="rounded-lg border border-xtube-border bg-xtube-bg/50 p-2.5">
                <p className="text-[10px] text-xtube-text-secondary mb-0.5">Log ID</p>
                <p className="text-xs text-white font-mono">{selectedLog.id}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
