'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DollarSign,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
  Eye,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Receipt,
  Wallet,
  Info,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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

// ─── Types ───────────────────────────────────────────────────────────────────

interface Transaction {
  id: string
  userId: string | null
  type: string
  amount: number
  currency: string
  status: string
  description: string | null
  metadata: string | null
  createdAt: string
  updatedAt: string
}

// ─── Status Config ───────────────────────────────────────────────────────────

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  completed: { label: 'Completed', color: 'border-green-500/30 bg-green-500/10 text-green-400', icon: CheckCircle2 },
  pending: { label: 'Pending', color: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400', icon: Clock },
  failed: { label: 'Failed', color: 'border-red-500/30 bg-red-500/10 text-red-400', icon: XCircle },
  refunded: { label: 'Refunded', color: 'border-blue-500/30 bg-blue-500/10 text-blue-400', icon: RotateCcw },
}

const typeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  subscription: { label: 'Subscription', icon: CreditCard, color: 'text-purple-400' },
  payment: { label: 'Payment', icon: ArrowUpRight, color: 'text-green-400' },
  refund: { label: 'Refund', icon: RotateCcw, color: 'text-blue-400' },
  withdrawal: { label: 'Withdrawal', icon: Wallet, color: 'text-amber-400' },
}

// ─── Skeleton Loader ─────────────────────────────────────────────────────────

function KPISkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-4 lg:p-5"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="h-3 w-20 animate-pulse rounded bg-white/10" />
              <div className="h-6 w-16 animate-pulse rounded bg-white/10" />
            </div>
            <div className="h-8 w-8 animate-pulse rounded-lg bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-4 lg:p-5">
      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="h-9 w-32 animate-pulse rounded bg-white/10" />
          <div className="h-9 w-32 animate-pulse rounded bg-white/10" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-4 w-20 animate-pulse rounded bg-white/10" />
              <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
              <div className="h-4 w-16 animate-pulse rounded bg-white/10" />
              <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)

  // ─── Fetch Transactions ────────────────────────────────────────────────

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (typeFilter !== 'all') params.set('type', typeFilter)

      const query = params.toString()
      const url = query ? `/api/transactions?${query}` : '/api/transactions'

      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setTransactions(data.items || [])
      }
    } catch (err) {
      console.error('Error fetching transactions:', err)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, typeFilter])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  // ─── KPI Calculations ──────────────────────────────────────────────────

  const totalRevenue = transactions
    .filter((t) => t.status === 'completed' && (t.type === 'payment' || t.type === 'subscription'))
    .reduce((sum, t) => sum + t.amount, 0)

  const completedCount = transactions.filter((t) => t.status === 'completed').length
  const pendingCount = transactions.filter((t) => t.status === 'pending').length
  const refundedAmount = transactions
    .filter((t) => t.status === 'refunded')
    .reduce((sum, t) => sum + t.amount, 0)

  const stats = [
    {
      title: 'Total Revenue',
      value: `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Completed',
      value: completedCount.toString(),
      icon: CheckCircle2,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Pending',
      value: pendingCount.toString(),
      icon: Clock,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
    },
    {
      title: 'Refunded',
      value: `$${refundedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: RotateCcw,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
  ]

  // ─── Format Helpers ────────────────────────────────────────────────────

  function truncateId(id: string): string {
    if (id.length <= 12) return id
    return `${id.slice(0, 8)}...${id.slice(-4)}`
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

  function formatAmount(amount: number, currency: string): string {
    const sign = amount >= 0 ? '+' : '-'
    return `${sign}$${Math.abs(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`
  }

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 p-3 lg:p-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-3"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-xtube-red/10">
          <DollarSign className="h-5 w-5 text-xtube-red" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Transactions</h2>
          <p className="text-sm text-xtube-text-secondary">Financial transaction history</p>
        </div>
      </motion.div>

      {/* KPI Cards */}
      {loading ? (
        <KPISkeleton />
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="group rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-3 lg:p-5 transition-colors hover:border-xtube-red/20 hover:shadow-[0_0_15px_rgba(229,9,20,0.1)]"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-xtube-text-secondary">{stat.title}</p>
                  <p className="text-xl md:text-2xl font-bold text-white">{stat.value}</p>
                </div>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Table Card */}
      {loading ? (
        <TableSkeleton />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-3 lg:p-5 transition-colors hover:border-xtube-red/20 hover:shadow-[0_0_15px_rgba(229,9,20,0.1)]"
        >
          {/* Filter Bar */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold text-white">Transactions</h3>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-xtube-border bg-xtube-bg text-white h-9 w-full sm:w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="border-xtube-border bg-xtube-card text-white">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>

              {/* Type Filter */}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="border-xtube-border bg-xtube-bg text-white h-9 w-full sm:w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="border-xtube-border bg-xtube-card text-white">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="subscription">Subscription</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="refund">Refund</SelectItem>
                  <SelectItem value="withdrawal">Withdrawal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table or Empty State */}
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-xtube-red/10">
                <Receipt className="h-8 w-8 text-xtube-red/50" />
              </div>
              <p className="text-base font-medium text-white/70">No transactions found</p>
              <p className="mt-1 text-sm text-xtube-text-secondary">
                {statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Transactions will appear here when processed'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-xtube-border hover:bg-transparent">
                    <TableHead className="text-xtube-text-secondary">ID</TableHead>
                    <TableHead className="text-xtube-text-secondary">Type</TableHead>
                    <TableHead className="text-xtube-text-secondary">Amount</TableHead>
                    <TableHead className="text-xtube-text-secondary hidden md:table-cell">Currency</TableHead>
                    <TableHead className="text-xtube-text-secondary">Status</TableHead>
                    <TableHead className="text-xtube-text-secondary hidden lg:table-cell">Description</TableHead>
                    <TableHead className="text-xtube-text-secondary hidden sm:table-cell">Date</TableHead>
                    <TableHead className="text-xtube-text-secondary text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {transactions.map((tx, idx) => {
                      const sConfig = statusConfig[tx.status] || {
                        label: tx.status,
                        color: 'border-white/30 bg-white/10 text-white',
                        icon: Info,
                      }
                      const tConfig = typeConfig[tx.type] || {
                        label: tx.type,
                        icon: ArrowDownLeft,
                        color: 'text-xtube-text-secondary',
                      }
                      const StatusIcon = sConfig.icon
                      const TypeIcon = tConfig.icon

                      return (
                        <motion.tr
                          key={tx.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ delay: idx * 0.03, duration: 0.3 }}
                          className="border-xtube-border hover:bg-white/[0.02] transition-colors"
                        >
                          {/* ID */}
                          <TableCell>
                            <span className="font-mono text-xs text-xtube-text-secondary" title={tx.id}>
                              {truncateId(tx.id)}
                            </span>
                          </TableCell>

                          {/* Type */}
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <TypeIcon className={`h-3.5 w-3.5 ${tConfig.color}`} />
                              <span className="text-sm text-white">{tConfig.label}</span>
                            </div>
                          </TableCell>

                          {/* Amount */}
                          <TableCell>
                            <span className={`text-sm font-semibold ${tx.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {formatAmount(tx.amount, tx.currency)}
                            </span>
                          </TableCell>

                          {/* Currency */}
                          <TableCell className="hidden md:table-cell">
                            <span className="text-sm text-xtube-text-secondary">{tx.currency}</span>
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`${sConfig.color} text-xs`}
                            >
                              <StatusIcon className="mr-1 h-3 w-3" />
                              {sConfig.label}
                            </Badge>
                          </TableCell>

                          {/* Description */}
                          <TableCell className="hidden lg:table-cell">
                            <span className="max-w-[200px] truncate text-sm text-xtube-text-secondary" title={tx.description || ''}>
                              {tx.description || '—'}
                            </span>
                          </TableCell>

                          {/* Date */}
                          <TableCell className="hidden sm:table-cell">
                            <span className="text-sm text-xtube-text-secondary">
                              {formatDate(tx.createdAt)}
                            </span>
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedTransaction(tx)}
                              className="h-7 px-2 text-xtube-text-secondary hover:text-white hover:bg-white/10 text-xs"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              <span className="hidden md:inline">Details</span>
                            </Button>
                          </TableCell>
                        </motion.tr>
                      )
                    })}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          )}
        </motion.div>
      )}

      {/* ─── Transaction Detail Dialog ───────────────────────────────────── */}

      <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent className="border-xtube-border bg-[#0B0B0F] text-white sm:max-w-lg">
          {selectedTransaction && (() => {
            const sConfig = statusConfig[selectedTransaction.status] || {
              label: selectedTransaction.status,
              color: 'border-white/30 bg-white/10 text-white',
              icon: Info,
            }
            const tConfig = typeConfig[selectedTransaction.type] || {
              label: selectedTransaction.type,
              icon: ArrowDownLeft,
              color: 'text-xtube-text-secondary',
            }
            const StatusIcon = sConfig.icon
            const TypeIcon = tConfig.icon

            let parsedMetadata: Record<string, unknown> | null = null
            if (selectedTransaction.metadata) {
              try {
                parsedMetadata = JSON.parse(selectedTransaction.metadata)
              } catch {
                parsedMetadata = null
              }
            }

            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-white">
                    <Receipt className="h-5 w-5 text-xtube-red" />
                    Transaction Details
                  </DialogTitle>
                  <DialogDescription className="text-xtube-text-secondary">
                    Full information for this transaction
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                  {/* Transaction ID */}
                  <div className="rounded-lg border border-xtube-border bg-[#0f0f0f] p-3">
                    <p className="text-xs text-xtube-text-secondary mb-1">Transaction ID</p>
                    <p className="font-mono text-sm text-white break-all">{selectedTransaction.id}</p>
                  </div>

                  {/* Key Info Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Type */}
                    <div className="rounded-lg border border-xtube-border bg-[#0f0f0f] p-3">
                      <p className="text-xs text-xtube-text-secondary mb-1">Type</p>
                      <div className="flex items-center gap-1.5">
                        <TypeIcon className={`h-4 w-4 ${tConfig.color}`} />
                        <span className="text-sm font-medium text-white">{tConfig.label}</span>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="rounded-lg border border-xtube-border bg-[#0f0f0f] p-3">
                      <p className="text-xs text-xtube-text-secondary mb-1">Status</p>
                      <Badge variant="outline" className={`${sConfig.color} text-xs`}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {sConfig.label}
                      </Badge>
                    </div>

                    {/* Amount */}
                    <div className="rounded-lg border border-xtube-border bg-[#0f0f0f] p-3">
                      <p className="text-xs text-xtube-text-secondary mb-1">Amount</p>
                      <p className={`text-sm font-bold ${selectedTransaction.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatAmount(selectedTransaction.amount, selectedTransaction.currency)}
                      </p>
                    </div>

                    {/* Currency */}
                    <div className="rounded-lg border border-xtube-border bg-[#0f0f0f] p-3">
                      <p className="text-xs text-xtube-text-secondary mb-1">Currency</p>
                      <p className="text-sm font-medium text-white">{selectedTransaction.currency}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="rounded-lg border border-xtube-border bg-[#0f0f0f] p-3">
                    <p className="text-xs text-xtube-text-secondary mb-1">Description</p>
                    <p className="text-sm text-white">{selectedTransaction.description || 'No description'}</p>
                  </div>

                  {/* User ID */}
                  {selectedTransaction.userId && (
                    <div className="rounded-lg border border-xtube-border bg-[#0f0f0f] p-3">
                      <p className="text-xs text-xtube-text-secondary mb-1">User ID</p>
                      <p className="font-mono text-sm text-white break-all">{selectedTransaction.userId}</p>
                    </div>
                  )}

                  {/* Metadata */}
                  {parsedMetadata && (
                    <div className="rounded-lg border border-xtube-border bg-[#0f0f0f] p-3">
                      <p className="text-xs text-xtube-text-secondary mb-1">Metadata</p>
                      <pre className="text-xs text-white/80 overflow-x-auto whitespace-pre-wrap break-all">
                        {JSON.stringify(parsedMetadata, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-xtube-border bg-[#0f0f0f] p-3">
                      <p className="text-xs text-xtube-text-secondary mb-1">Created</p>
                      <p className="text-sm text-white">{formatDate(selectedTransaction.createdAt)}</p>
                    </div>
                    <div className="rounded-lg border border-xtube-border bg-[#0f0f0f] p-3">
                      <p className="text-xs text-xtube-text-secondary mb-1">Updated</p>
                      <p className="text-sm text-white">{formatDate(selectedTransaction.updatedAt)}</p>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedTransaction(null)}
                    className="border-xtube-border text-xtube-text-secondary hover:bg-white/5 hover:text-white"
                  >
                    Close
                  </Button>
                </DialogFooter>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
