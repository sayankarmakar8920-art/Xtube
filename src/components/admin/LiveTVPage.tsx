'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Radio,
  Plus,
  Pencil,
  Trash2,
  Power,
  PowerOff,
  Tv,
  Eye,
  Users,
  Loader2,
  Link as LinkIcon,
  Tag,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
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

interface LiveTVChannel {
  id: string
  title: string
  description: string | null
  streamUrl: string
  thumbnailUrl: string | null
  category: string
  isLive: boolean
  isActive: boolean
  viewers: number
  createdAt: string
  updatedAt: string
}

interface FormData {
  title: string
  description: string
  streamUrl: string
  thumbnailUrl: string
  category: string
  isLive: boolean
}

const CATEGORIES = ['General', 'Sports', 'Entertainment', 'Music', 'News', 'Gaming']

const emptyForm: FormData = {
  title: '',
  description: '',
  streamUrl: '',
  thumbnailUrl: '',
  category: 'General',
  isLive: false,
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
              <div className="h-6 w-12 animate-pulse rounded bg-white/10" />
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
        <div className="h-5 w-32 animate-pulse rounded bg-white/10" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
              <div className="h-4 w-48 animate-pulse rounded bg-white/10" />
              <div className="h-4 w-20 animate-pulse rounded bg-white/10" />
              <div className="h-4 w-16 animate-pulse rounded bg-white/10" />
              <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function LiveTVPage() {
  const [channels, setChannels] = useState<LiveTVChannel[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // ─── Fetch Channels ────────────────────────────────────────────────────

  const fetchChannels = useCallback(async () => {
    try {
      const res = await fetch('/api/live-tv')
      if (res.ok) {
        const data = await res.json()
        setChannels(data.items || [])
      }
    } catch (err) {
      console.error('Error fetching live TV channels:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchChannels()
  }, [fetchChannels])

  // ─── KPI Calculations ──────────────────────────────────────────────────

  const totalChannels = channels.length
  const activeStreams = channels.filter((c) => c.isLive && c.isActive).length
  const totalViewers = channels.reduce((sum, c) => sum + c.viewers, 0)
  const avgViewers = totalChannels > 0 ? Math.round(totalViewers / totalChannels) : 0

  const stats = [
    {
      title: 'Total Channels',
      value: totalChannels.toString(),
      icon: Tv,
      color: 'text-xtube-red',
      bgColor: 'bg-xtube-red/10',
    },
    {
      title: 'Active Streams',
      value: activeStreams.toString(),
      icon: Radio,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Total Viewers',
      value: totalViewers.toLocaleString(),
      icon: Eye,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Avg Viewers',
      value: avgViewers.toLocaleString(),
      icon: Users,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
    },
  ]

  // ─── CRUD Handlers ────────────────────────────────────────────────────

  const handleOpenCreate = () => {
    setEditingId(null)
    setFormData(emptyForm)
    setDialogOpen(true)
  }

  const handleOpenEdit = (channel: LiveTVChannel) => {
    setEditingId(channel.id)
    setFormData({
      title: channel.title,
      description: channel.description || '',
      streamUrl: channel.streamUrl,
      thumbnailUrl: channel.thumbnailUrl || '',
      category: channel.category.charAt(0).toUpperCase() + channel.category.slice(1),
      isLive: channel.isLive,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.streamUrl.trim()) return

    setSubmitting(true)
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        streamUrl: formData.streamUrl.trim(),
        thumbnailUrl: formData.thumbnailUrl.trim() || null,
        category: formData.category.toLowerCase(),
        isLive: formData.isLive,
      }

      if (editingId) {
        const res = await fetch('/api/live-tv', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...payload }),
        })
        if (res.ok) {
          setDialogOpen(false)
          fetchChannels()
        }
      } else {
        const res = await fetch('/api/live-tv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          setDialogOpen(false)
          fetchChannels()
        }
      }
    } catch (err) {
      console.error('Error saving channel:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/live-tv?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setDeleteConfirm(null)
        fetchChannels()
      }
    } catch (err) {
      console.error('Error deleting channel:', err)
    }
  }

  const handleToggleActive = async (channel: LiveTVChannel) => {
    try {
      const res = await fetch('/api/live-tv', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: channel.id, isActive: !channel.isActive }),
      })
      if (res.ok) fetchChannels()
    } catch (err) {
      console.error('Error toggling channel:', err)
    }
  }

  const handleToggleLive = async (channel: LiveTVChannel) => {
    try {
      const res = await fetch('/api/live-tv', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: channel.id, isLive: !channel.isLive }),
      })
      if (res.ok) fetchChannels()
    } catch (err) {
      console.error('Error toggling live status:', err)
    }
  }

  // ─── Format Helpers ────────────────────────────────────────────────────

  function formatViewers(n: number): string {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
    return n.toString()
  }

  function truncateUrl(url: string, maxLen = 35): string {
    if (url.length <= maxLen) return url
    return url.slice(0, maxLen) + '...'
  }

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 p-3 lg:p-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-xtube-red/10">
            <Radio className="h-5 w-5 text-xtube-red" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Live TV</h2>
            <p className="text-sm text-xtube-text-secondary">Manage live streaming channels</p>
          </div>
        </div>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button
            onClick={handleOpenCreate}
            className="bg-xtube-red hover:bg-xtube-red/90 text-white shadow-[0_0_12px_rgba(229,9,20,0.3)]"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add Channel
          </Button>
        </motion.div>
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

      {/* Channels Table */}
      {loading ? (
        <TableSkeleton />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-3 lg:p-5 transition-colors hover:border-xtube-red/20 hover:shadow-[0_0_15px_rgba(229,9,20,0.1)]"
        >
          <h3 className="mb-4 text-lg font-semibold text-white">Channels</h3>

          {channels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-xtube-red/10">
                <Radio className="h-8 w-8 text-xtube-red/50" />
              </div>
              <p className="text-base font-medium text-white/70">No live TV channels</p>
              <p className="mt-1 text-sm text-xtube-text-secondary">
                Add your first channel to get started
              </p>
              <Button
                onClick={handleOpenCreate}
                variant="outline"
                className="mt-4 border-xtube-border text-xtube-text-secondary hover:bg-xtube-red/10 hover:text-white hover:border-xtube-red/30"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Add Channel
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-xtube-border hover:bg-transparent">
                    <TableHead className="text-xtube-text-secondary">Title</TableHead>
                    <TableHead className="text-xtube-text-secondary hidden md:table-cell">Stream URL</TableHead>
                    <TableHead className="text-xtube-text-secondary hidden sm:table-cell">Category</TableHead>
                    <TableHead className="text-xtube-text-secondary">Viewers</TableHead>
                    <TableHead className="text-xtube-text-secondary">Status</TableHead>
                    <TableHead className="text-xtube-text-secondary text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {channels.map((channel, idx) => (
                      <motion.tr
                        key={channel.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ delay: idx * 0.03, duration: 0.3 }}
                        className="border-xtube-border hover:bg-white/[0.02] transition-colors"
                      >
                        {/* Title */}
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${channel.isLive ? 'bg-red-500/10' : 'bg-white/5'}`}>
                              <Radio className={`h-4 w-4 ${channel.isLive ? 'text-red-400' : 'text-xtube-text-secondary'}`} />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-white max-w-[180px]">{channel.title}</p>
                              {channel.description && (
                                <p className="truncate text-xs text-xtube-text-secondary max-w-[180px]">{channel.description}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Stream URL */}
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-1.5 text-xtube-text-secondary">
                            <LinkIcon className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="text-sm truncate max-w-[200px]" title={channel.streamUrl}>
                              {truncateUrl(channel.streamUrl)}
                            </span>
                          </div>
                        </TableCell>

                        {/* Category */}
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex items-center gap-1.5">
                            <Tag className="h-3.5 w-3.5 text-xtube-text-secondary" />
                            <span className="text-sm text-xtube-text-secondary capitalize">{channel.category}</span>
                          </div>
                        </TableCell>

                        {/* Viewers */}
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Eye className="h-3.5 w-3.5 text-xtube-text-secondary" />
                            <span className="text-sm text-white">{formatViewers(channel.viewers)}</span>
                          </div>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={
                                channel.isLive
                                  ? 'border-green-500/30 bg-green-500/10 text-green-400 text-xs'
                                  : 'border-red-500/30 bg-red-500/10 text-red-400 text-xs'
                              }
                            >
                              {channel.isLive ? 'Live' : 'Offline'}
                            </Badge>
                            {!channel.isActive && (
                              <Badge
                                variant="outline"
                                className="border-yellow-500/30 bg-yellow-500/10 text-yellow-400 text-xs"
                              >
                                Disabled
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleLive(channel)}
                              className={`h-7 px-2 text-xs ${channel.isLive ? 'text-green-400 hover:bg-green-500/10 hover:text-green-300' : 'text-xtube-text-secondary hover:bg-green-500/10 hover:text-green-300'}`}
                              title={channel.isLive ? 'Set Offline' : 'Set Live'}
                            >
                              {channel.isLive ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEdit(channel)}
                              className="h-7 px-2 text-xtube-text-secondary hover:text-white hover:bg-white/10 text-xs"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirm(channel.id)}
                              className="h-7 px-2 text-xtube-text-secondary hover:text-red-400 hover:bg-red-500/10 text-xs"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          )}
        </motion.div>
      )}

      {/* ─── Add/Edit Channel Dialog ──────────────────────────────────────── */}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-xtube-border bg-[#0B0B0F] text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingId ? 'Edit Channel' : 'Add New Channel'}
            </DialogTitle>
            <DialogDescription className="text-xtube-text-secondary">
              {editingId ? 'Update channel details' : 'Configure a new live TV channel'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="channel-title" className="text-sm text-xtube-text-secondary">
                Title *
              </Label>
              <Input
                id="channel-title"
                placeholder="Channel name"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="border-xtube-border bg-[#0f0f0f] text-white placeholder:text-xtube-text-secondary/50"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="channel-desc" className="text-sm text-xtube-text-secondary">
                Description
              </Label>
              <Input
                id="channel-desc"
                placeholder="Brief channel description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="border-xtube-border bg-[#0f0f0f] text-white placeholder:text-xtube-text-secondary/50"
              />
            </div>

            {/* Stream URL */}
            <div className="space-y-2">
              <Label htmlFor="stream-url" className="text-sm text-xtube-text-secondary">
                Stream URL *
              </Label>
              <Input
                id="stream-url"
                placeholder="https://stream.example.com/live/channel.m3u8"
                value={formData.streamUrl}
                onChange={(e) => setFormData({ ...formData, streamUrl: e.target.value })}
                className="border-xtube-border bg-[#0f0f0f] text-white placeholder:text-xtube-text-secondary/50"
              />
            </div>

            {/* Thumbnail URL */}
            <div className="space-y-2">
              <Label htmlFor="thumbnail-url" className="text-sm text-xtube-text-secondary">
                Thumbnail URL
              </Label>
              <Input
                id="thumbnail-url"
                placeholder="https://example.com/thumb.jpg"
                value={formData.thumbnailUrl}
                onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                className="border-xtube-border bg-[#0f0f0f] text-white placeholder:text-xtube-text-secondary/50"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label className="text-sm text-xtube-text-secondary">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(val) => setFormData({ ...formData, category: val })}
              >
                <SelectTrigger className="border-xtube-border bg-[#0f0f0f] text-white w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="border-xtube-border bg-xtube-card text-white">
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Is Live Toggle */}
            <div className="flex items-center justify-between rounded-lg border border-xtube-border bg-[#0f0f0f] p-3">
              <div className="space-y-0.5">
                <Label className="text-sm text-white">Live Status</Label>
                <p className="text-xs text-xtube-text-secondary">
                  Mark this channel as currently streaming
                </p>
              </div>
              <Switch
                checked={formData.isLive}
                onCheckedChange={(checked) => setFormData({ ...formData, isLive: checked })}
                className="data-[state=checked]:bg-xtube-red"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="border-xtube-border text-xtube-text-secondary hover:bg-white/5 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !formData.title.trim() || !formData.streamUrl.trim()}
              className="bg-xtube-red hover:bg-xtube-red/90 text-white shadow-[0_0_12px_rgba(229,9,20,0.3)]"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  {editingId ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                editingId ? 'Update Channel' : 'Create Channel'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ──────────────────────────────────── */}

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="border-xtube-border bg-[#0B0B0F] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Channel</DialogTitle>
            <DialogDescription className="text-xtube-text-secondary">
              Are you sure you want to delete this channel? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
              className="border-xtube-border text-xtube-text-secondary hover:bg-white/5 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
