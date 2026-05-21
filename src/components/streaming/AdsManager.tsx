'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Megaphone,
  Eye,
  MousePointer,
  DollarSign,
  Plus,
  Trash2,
  MoreVertical,
  TrendingUp,
  X,
  ImageIcon,
  Clock,
  SkipForward,
  BarChart3,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore, type AdminSection } from '@/lib/store'
import { VideoAdsAnalytics } from '@/components/admin/VideoAdsAnalytics'

interface AdsManagerProps {
  ads: Array<{
    id: string
    type: string
    position: string
    title: string
    imageUrl: string
    impressions: number
    clicks: number
    revenue: number
    isActive: boolean
    createdAt: string
  }>
  onCreate: (data: Record<string, unknown>) => void
  onDelete: (id: string) => void
  onToggle: (id: string) => void
  loading?: boolean
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toLocaleString()
}

function formatCurrency(num: number): string {
  return '$' + num.toLocaleString()
}

function getCTR(clicks: number, impressions: number): string {
  if (impressions === 0) return '0%'
  return ((clicks / impressions) * 100).toFixed(2) + '%'
}

// Section display configuration
const sectionConfig: Record<string, { title: string; description: string }> = {
  'all-ads': { title: 'All Ads', description: 'Manage all ad campaigns across every type and position' },
  'banner-ads': { title: 'Banner Ads', description: 'Display ads in banner format across the platform' },
  'popup-ads': { title: 'Popup Ads', description: 'Full-screen popup ad campaigns' },
  'footer-ads': { title: 'Footer Ads', description: 'Footer position ads displayed across the platform' },
  'pre-roll-ads': { title: 'Pre-Roll Ads', description: 'Video ads played before content starts' },
  'mid-roll-ads': { title: 'Mid-Roll Ads', description: 'Video ads inserted during content playback' },
  'post-roll-ads': { title: 'Post-Roll Ads', description: 'Video ads shown after content ends' },
  'overlay-ads': { title: 'Overlay Ads', description: 'Semi-transparent overlay ads on content' },
}

// Custom chart tooltip
function AdChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-white/5 bg-[#0f0f0f]/90 px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs text-xtube-text-secondary">{label}</p>
      {payload.map((entry, idx) => (
        <p key={idx} className="text-sm font-medium" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  )
}

// Stagger animation container variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export function AdsManager({ ads, onCreate, onDelete, onToggle, loading }: AdsManagerProps) {
  const adminSection = useAppStore((s) => s.adminSection)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [positionFilter, setPositionFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [createOpen, setCreateOpen] = useState(false)

  // Create form state
  const [createForm, setCreateForm] = useState({
    title: '',
    type: '',
    position: '',
    imageUrl: '',
    linkUrl: '',
    startDate: '',
    endDate: '',
    frequency: '',
  })

  // Filter ads based on adminSection from store
  const sectionFilteredAds = useMemo(() => {
    switch (adminSection) {
      case 'banner-ads':
        return ads.filter((ad) => ad.type === 'banner')
      case 'popup-ads':
        return ads.filter((ad) => ad.type === 'popup')
      case 'footer-ads':
        return ads.filter((ad) => ad.position === 'footer')
      case 'pre-roll-ads':
        return ads.filter((ad) => ad.position === 'pre-roll')
      case 'mid-roll-ads':
        return ads.filter((ad) => ad.position === 'mid-roll')
      case 'post-roll-ads':
        return ads.filter((ad) => ad.position === 'post-roll')
      case 'overlay-ads':
        return ads.filter((ad) => ad.type === 'overlay')
      case 'all-ads':
      default:
        return ads
    }
  }, [ads, adminSection])

  // Apply user filters on top of section filter
  const filteredAds = useMemo(() => {
    let result = [...sectionFilteredAds]

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter((ad) => ad.title.toLowerCase().includes(q))
    }

    if (typeFilter !== 'all') {
      result = result.filter((ad) => ad.type === typeFilter)
    }

    if (positionFilter !== 'all') {
      result = result.filter((ad) => ad.position === positionFilter)
    }

    return result
  }, [sectionFilteredAds, searchQuery, typeFilter, positionFilter])

  // Overview stats based on filtered set
  const totalImpressions = filteredAds.reduce((sum, ad) => sum + ad.impressions, 0)
  const totalClicks = filteredAds.reduce((sum, ad) => sum + ad.clicks, 0)
  const overallCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0'
  const totalRevenue = filteredAds.reduce((sum, ad) => sum + ad.revenue, 0)

  // Chart data - ad performance
  const chartData = filteredAds.map((ad) => ({
    name: ad.title.length > 15 ? ad.title.substring(0, 15) + '...' : ad.title,
    Impressions: ad.impressions,
    Clicks: ad.clicks,
  }))

  // Simulated analytics metrics for the filtered ad type
  const avgCTR = filteredAds.length > 0
    ? (filteredAds.reduce((sum, ad) => sum + (ad.impressions > 0 ? (ad.clicks / ad.impressions) * 100 : 0), 0) / filteredAds.length).toFixed(2)
    : '0'

  const isVideoAd = ['pre-roll-ads', 'mid-roll-ads', 'post-roll-ads'].includes(adminSection)
  const totalWatchTime = isVideoAd
    ? formatNumber(filteredAds.reduce((sum, ad) => sum + ad.impressions * 15, 0))
    : formatNumber(filteredAds.reduce((sum, ad) => sum + ad.impressions * 3, 0))
  const watchTimeUnit = isVideoAd ? 'hrs' : 'hrs'

  const skipRate = isVideoAd
    ? (Math.min(85, Math.max(20, 100 - parseFloat(avgCTR) * 10))).toFixed(1) + '%'
    : '--'

  const revenuePerImpression = totalImpressions > 0
    ? '$' + (totalRevenue / totalImpressions).toFixed(4)
    : '$0.0000'

  // Get section display info
  const sectionInfo = sectionConfig[adminSection] || sectionConfig['all-ads']

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreate(createForm)
    setCreateForm({
      title: '',
      type: '',
      position: '',
      imageUrl: '',
      linkUrl: '',
      startDate: '',
      endDate: '',
      frequency: '',
    })
    setCreateOpen(false)
  }

  const resetFilters = () => {
    setSearchQuery('')
    setTypeFilter('all')
    setPositionFilter('all')
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl bg-xtube-card" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl bg-xtube-card" />
        <Skeleton className="h-96 w-full rounded-xl bg-xtube-card" />
      </div>
    )
  }

  return (
    <div className="space-y-4 p-3 lg:p-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h2 className="text-xl font-bold text-white">{sectionInfo.title}</h2>
          <p className="text-sm text-xtube-text-secondary">{sectionInfo.description}</p>
          <p className="mt-1 text-xs text-xtube-text-secondary">
            {filteredAds.length} ad{filteredAds.length !== 1 ? 's' : ''} shown
            {sectionFilteredAds.length !== ads.length && ` of ${ads.length} total`}
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-xtube-red hover:bg-xtube-red-hover">
              <Plus className="mr-2 h-4 w-4" />
              Create Ad
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto border-white/5 bg-[#0f0f0f]/90 sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Ad</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white">Title</Label>
                <Input
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="Ad title"
                  className="border-xtube-border bg-xtube-bg text-white placeholder:text-xtube-text-secondary"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-white">Type</Label>
                  <Select
                    value={createForm.type}
                    onValueChange={(v) => setCreateForm({ ...createForm, type: v })}
                  >
                    <SelectTrigger className="w-full border-xtube-border bg-xtube-bg text-white">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="border-xtube-border bg-xtube-card">
                      <SelectItem value="banner">Banner</SelectItem>
                      <SelectItem value="popup">Popup</SelectItem>
                      <SelectItem value="overlay">Overlay</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Position</Label>
                  <Select
                    value={createForm.position}
                    onValueChange={(v) => setCreateForm({ ...createForm, position: v })}
                  >
                    <SelectTrigger className="w-full border-xtube-border bg-xtube-bg text-white">
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent className="border-xtube-border bg-xtube-card">
                      <SelectItem value="hero">Hero</SelectItem>
                      <SelectItem value="sidebar">Sidebar</SelectItem>
                      <SelectItem value="footer">Footer</SelectItem>
                      <SelectItem value="entry">Entry</SelectItem>
                      <SelectItem value="exit">Exit</SelectItem>
                      <SelectItem value="timed">Timed</SelectItem>
                      <SelectItem value="pre-roll">Pre-Roll</SelectItem>
                      <SelectItem value="mid-roll">Mid-Roll</SelectItem>
                      <SelectItem value="post-roll">Post-Roll</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-white">Image URL</Label>
                <Input
                  value={createForm.imageUrl}
                  onChange={(e) => setCreateForm({ ...createForm, imageUrl: e.target.value })}
                  placeholder="https://example.com/ad-image.jpg"
                  className="border-xtube-border bg-xtube-bg text-white placeholder:text-xtube-text-secondary"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Link URL</Label>
                <Input
                  value={createForm.linkUrl}
                  onChange={(e) => setCreateForm({ ...createForm, linkUrl: e.target.value })}
                  placeholder="https://example.com/landing"
                  className="border-xtube-border bg-xtube-bg text-white placeholder:text-xtube-text-secondary"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-white">Start Date</Label>
                  <Input
                    type="date"
                    value={createForm.startDate}
                    onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                    className="border-xtube-border bg-xtube-bg text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">End Date</Label>
                  <Input
                    type="date"
                    value={createForm.endDate}
                    onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })}
                    className="border-xtube-border bg-xtube-bg text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-white">Frequency (per session)</Label>
                <Input
                  type="number"
                  value={createForm.frequency}
                  onChange={(e) => setCreateForm({ ...createForm, frequency: e.target.value })}
                  placeholder="1"
                  min="1"
                  max="10"
                  className="border-xtube-border bg-xtube-bg text-white placeholder:text-xtube-text-secondary"
                />
              </div>
              <Button type="submit" className="w-full bg-xtube-red hover:bg-xtube-red-hover">
                Create Ad
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Overview Stats Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        <motion.div
          variants={itemVariants}
          className="group relative overflow-hidden rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-4 transition-colors hover:border-xtube-red/20 hover:shadow-[0_0_15px_rgba(229,9,20,0.1)] md:p-6"
        >
          <div className="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-xtube-red to-transparent" />
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-xtube-red/10 lg:h-10 lg:w-10">
              <Eye className="h-5 w-5 text-xtube-red md:h-6 md:w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-xtube-text-secondary">Impressions</p>
              <p className="text-lg font-bold text-white lg:text-xl">{formatNumber(totalImpressions)}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="group relative overflow-hidden rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-4 transition-colors hover:border-xtube-red/20 hover:shadow-[0_0_15px_rgba(229,9,20,0.1)] md:p-6"
        >
          <div className="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-xtube-red to-transparent" />
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-xtube-red/10 lg:h-10 lg:w-10">
              <MousePointer className="h-5 w-5 text-xtube-red md:h-6 md:w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-xtube-text-secondary">Clicks</p>
              <p className="text-lg font-bold text-white lg:text-xl">{formatNumber(totalClicks)}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="group relative overflow-hidden rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-4 transition-colors hover:border-xtube-red/20 hover:shadow-[0_0_15px_rgba(229,9,20,0.1)] md:p-6"
        >
          <div className="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-xtube-red to-transparent" />
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-xtube-red/10 lg:h-10 lg:w-10">
              <TrendingUp className="h-5 w-5 text-xtube-red md:h-6 md:w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-xtube-text-secondary">CTR</p>
              <p className="text-lg font-bold text-white lg:text-xl">{overallCTR}%</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="group relative overflow-hidden rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-4 transition-colors hover:border-xtube-red/20 hover:shadow-[0_0_15px_rgba(229,9,20,0.1)] md:p-6"
        >
          <div className="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-xtube-red to-transparent" />
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-xtube-red/10 lg:h-10 lg:w-10">
              <DollarSign className="h-5 w-5 text-xtube-red md:h-6 md:w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-xtube-text-secondary">Revenue</p>
              <p className="text-lg font-bold text-white lg:text-xl">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Ad Performance Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-4 md:p-6"
      >
        <h3 className="mb-4 text-lg font-semibold text-white">Ad Performance</h3>
        {chartData.length > 0 ? (
          <div className="h-64 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => formatNumber(v)} />
                <Tooltip content={<AdChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
                <Bar dataKey="Impressions" fill="#E50914" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Clicks" fill="#ff6b6b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-48 flex-col items-center justify-center gap-2">
            <BarChart3 className="h-8 w-8 text-xtube-text-secondary" />
            <p className="text-sm text-xtube-text-secondary">No chart data available</p>
          </div>
        )}
      </motion.div>

      {/* Ad Analytics Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
      >
        <h3 className="mb-3 text-lg font-semibold text-white">Analytics</h3>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-3 md:grid-cols-4"
        >
          {/* Average CTR */}
          <motion.div
            variants={itemVariants}
            className="group rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-4 transition-colors hover:border-xtube-red/20 hover:shadow-[0_0_15px_rgba(229,9,20,0.1)]"
          >
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-xtube-red/10">
                <TrendingUp className="h-4 w-4 text-xtube-red" />
              </div>
              <span className="text-xs text-xtube-text-secondary">Average CTR</span>
            </div>
            <p className="text-xl font-bold text-xtube-red">{avgCTR}%</p>
          </motion.div>

          {/* Total Watch Time */}
          <motion.div
            variants={itemVariants}
            className="group rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-4 transition-colors hover:border-xtube-red/20 hover:shadow-[0_0_15px_rgba(229,9,20,0.1)]"
          >
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-xtube-red/10">
                <Clock className="h-4 w-4 text-xtube-red" />
              </div>
              <span className="text-xs text-xtube-text-secondary">Est. Watch Time</span>
            </div>
            <p className="text-xl font-bold text-white">{totalWatchTime} <span className="text-sm font-normal text-xtube-text-secondary">{watchTimeUnit}</span></p>
          </motion.div>

          {/* Skip Rate */}
          <motion.div
            variants={itemVariants}
            className="group rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-4 transition-colors hover:border-xtube-red/20 hover:shadow-[0_0_15px_rgba(229,9,20,0.1)]"
          >
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-xtube-red/10">
                <SkipForward className="h-4 w-4 text-xtube-red" />
              </div>
              <span className="text-xs text-xtube-text-secondary">Skip Rate</span>
            </div>
            <p className="text-xl font-bold text-white">{skipRate}</p>
          </motion.div>

          {/* Revenue Per Impression */}
          <motion.div
            variants={itemVariants}
            className="group rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-4 transition-colors hover:border-xtube-red/20 hover:shadow-[0_0_15px_rgba(229,9,20,0.1)]"
          >
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-xtube-red/10">
                <DollarSign className="h-4 w-4 text-xtube-red" />
              </div>
              <span className="text-xs text-xtube-text-secondary">Rev / Impression</span>
            </div>
            <p className="text-xl font-bold text-white">{revenuePerImpression}</p>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="flex flex-col gap-3 rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-4 md:flex-row md:items-center"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-xtube-text-secondary" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ads..."
            className="border-xtube-border bg-xtube-bg pl-10 text-white placeholder:text-xtube-text-secondary"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full border-xtube-border bg-xtube-bg text-white md:w-36">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent className="border-xtube-border bg-xtube-card">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="banner">Banner</SelectItem>
            <SelectItem value="popup">Popup</SelectItem>
            <SelectItem value="overlay">Overlay</SelectItem>
            <SelectItem value="video">Video</SelectItem>
          </SelectContent>
        </Select>
        <Select value={positionFilter} onValueChange={setPositionFilter}>
          <SelectTrigger className="w-full border-xtube-border bg-xtube-bg text-white md:w-36">
            <SelectValue placeholder="Position" />
          </SelectTrigger>
          <SelectContent className="border-xtube-border bg-xtube-card">
            <SelectItem value="all">All Positions</SelectItem>
            <SelectItem value="hero">Hero</SelectItem>
            <SelectItem value="sidebar">Sidebar</SelectItem>
            <SelectItem value="footer">Footer</SelectItem>
            <SelectItem value="entry">Entry</SelectItem>
            <SelectItem value="exit">Exit</SelectItem>
            <SelectItem value="timed">Timed</SelectItem>
            <SelectItem value="pre-roll">Pre-Roll</SelectItem>
            <SelectItem value="mid-roll">Mid-Roll</SelectItem>
            <SelectItem value="post-roll">Post-Roll</SelectItem>
          </SelectContent>
        </Select>
        <AnimatePresence>
          {(searchQuery || typeFilter !== 'all' || positionFilter !== 'all') && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={resetFilters}
              className="flex items-center gap-1 text-sm text-xtube-red hover:text-xtube-red-hover"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Video Ads Analytics Section - shown on all video ad sections */}
      {['pre-roll-ads', 'mid-roll-ads', 'post-roll-ads', 'overlay-ads'].includes(adminSection) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4 }}
        >
          <VideoAdsAnalytics ads={ads} />
        </motion.div>
      )}

      {/* Ads Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.4 }}
        className="overflow-hidden rounded-xl border border-white/5 bg-[#0f0f0f]/80"
      >
        <div className="max-h-[600px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-xtube-border/50 hover:bg-transparent">
                <TableHead className="text-xtube-text-secondary">Preview</TableHead>
                <TableHead className="text-xtube-text-secondary">Title</TableHead>
                <TableHead className="text-xtube-text-secondary">Type</TableHead>
                <TableHead className="text-xtube-text-secondary">Position</TableHead>
                <TableHead className="text-xtube-text-secondary">Impressions</TableHead>
                <TableHead className="text-xtube-text-secondary">Clicks</TableHead>
                <TableHead className="text-xtube-text-secondary">CTR</TableHead>
                <TableHead className="text-xtube-text-secondary">Revenue</TableHead>
                <TableHead className="text-xtube-text-secondary">Status</TableHead>
                <TableHead className="text-xtube-text-secondary">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {filteredAds.length === 0 ? (
                  <TableRow className="border-xtube-border/50 hover:bg-transparent">
                    <TableCell colSpan={10} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-xtube-red/5">
                          <Megaphone className="h-8 w-8 text-xtube-red/40" />
                        </div>
                        <p className="text-lg font-medium text-white">No ads found</p>
                        <p className="text-sm text-xtube-text-secondary">
                          {sectionFilteredAds.length === 0
                            ? `No ads in the "${sectionInfo.title}" category`
                            : 'Try adjusting your search or filters'}
                        </p>
                        {sectionFilteredAds.length === 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 border-xtube-border text-xtube-text-secondary hover:border-xtube-red/30 hover:text-white"
                            onClick={() => setCreateOpen(true)}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Create your first ad
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAds.map((ad, index) => (
                    <motion.tr
                      key={ad.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03, duration: 0.3 }}
                      className="border-xtube-border/50 hover:bg-white/[0.02]"
                    >
                      <TableCell className="py-3">
                        <div className="flex h-10 w-16 items-center justify-center overflow-hidden rounded-md bg-xtube-bg">
                          {ad.imageUrl ? (
                            <img
                              src={ad.imageUrl}
                              alt={ad.title}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                ;(e.target as HTMLImageElement).style.display = 'none'
                                ;(e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden')
                              }}
                            />
                          ) : null}
                          <ImageIcon className={`h-5 w-5 text-xtube-text-secondary ${ad.imageUrl ? 'hidden' : ''}`} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="max-w-[160px] truncate font-medium text-white">{ad.title}</p>
                        <p className="text-xs text-xtube-text-secondary">{ad.createdAt}</p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="border-xtube-red/20 bg-xtube-red/5 capitalize text-xtube-red"
                        >
                          {ad.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="border-white/10 bg-white/5 capitalize text-xtube-text-secondary"
                        >
                          {ad.position}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-white">{formatNumber(ad.impressions)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-white">{formatNumber(ad.clicks)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-xtube-red">
                          {getCTR(ad.clicks, ad.impressions)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-white">{formatCurrency(ad.revenue)}</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`cursor-pointer transition-colors ${
                            ad.isActive
                              ? 'border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20'
                              : 'border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                          }`}
                          onClick={() => onToggle(ad.id)}
                        >
                          <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${ad.isActive ? 'bg-green-400' : 'bg-red-400'}`} />
                          {ad.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-xtube-text-secondary hover:text-white">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="border-xtube-border bg-xtube-card" align="end">
                            <DropdownMenuItem
                              className="text-white focus:bg-white/5"
                              onClick={() => onToggle(ad.id)}
                            >
                              {ad.isActive ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-400 focus:bg-red-500/10"
                              onClick={() => onDelete(ad.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      </motion.div>
    </div>
  )
}
