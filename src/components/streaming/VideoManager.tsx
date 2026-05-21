'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Upload,
  Trash2,
  Edit,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Film,
  Clock,
  Eye,
  X,
  CloudUpload,
  CheckCircle2,
  LayoutGrid,
  List,
  Play,
  Calendar,
  HardDrive,
  Tag,
} from 'lucide-react'
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
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { useAppStore } from '@/lib/store'

// ─── Types ───────────────────────────────────────────────────────────────────

interface VideoManagerProps {
  videos: Array<{
    id: string
    title: string
    thumbnail: string
    category: string
    views: number
    duration: string
    isPublished: boolean
    createdAt: string
  }>
  onUpload: (data: Record<string, unknown>) => void
  onDelete: (id: string) => void
  onTogglePublish: (id: string) => void
  loading?: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatViews(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toLocaleString()
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getRandomFileSize(): string {
  const sizes = ['125 MB', '520 MB', '300 MB', '750 MB', '180 MB', '420 MB', '650 MB', '280 MB', '890 MB', '340 MB', '510 MB', '195 MB']
  return sizes[Math.floor(Math.random() * sizes.length)]
}

// ─── Default categories for video upload form ──────────────────────────────────
const categories = [
  'All Categories',
  'Sci-Fi',
  'Action',
  'Adventure',
  'Romance',
  'Documentary',
  'Fantasy',
  'Sports',
  'Nature',
  'Music',
  'History',
  'Animation',
]

const categoryColors: Record<string, string> = {
  'Sci-Fi': 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  'Action': 'bg-red-500/15 text-red-400 border-red-500/20',
  'Adventure': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  'Romance': 'bg-pink-500/15 text-pink-400 border-pink-500/20',
  'Documentary': 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  'Fantasy': 'bg-violet-500/15 text-violet-400 border-violet-500/20',
  'Sports': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  'Nature': 'bg-green-500/15 text-green-400 border-green-500/20',
  'Music': 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  'History': 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  'Animation': 'bg-blue-500/15 text-blue-400 border-blue-500/20',
}

const thumbnailGradients = [
  'from-red-900/40 via-orange-900/30 to-amber-800/20',
  'from-blue-900/40 via-indigo-900/30 to-violet-800/20',
  'from-emerald-900/40 via-teal-900/30 to-cyan-800/20',
  'from-purple-900/40 via-pink-900/30 to-rose-800/20',
  'from-amber-900/40 via-yellow-900/30 to-orange-800/20',
  'from-cyan-900/40 via-blue-900/30 to-indigo-800/20',
  'from-rose-900/40 via-red-900/30 to-pink-800/20',
  'from-teal-900/40 via-emerald-900/30 to-green-800/20',
  'from-violet-900/40 via-purple-900/30 to-indigo-800/20',
  'from-orange-900/40 via-amber-900/30 to-yellow-800/20',
  'from-indigo-900/40 via-blue-900/30 to-cyan-800/20',
  'from-pink-900/40 via-rose-900/30 to-red-800/20',
]

// ─── Sort Types ──────────────────────────────────────────────────────────────

type SortOption = 'newest' | 'oldest' | 'most-viewed' | 'least-viewed' | 'title-az' | 'title-za'

/* ────────────────────────────────────────────
   Upload View
   ──────────────────────────────────────────── */

function UploadView({ onUpload }: { onUpload: (data: Record<string, unknown>) => void }) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'success'>('idle')
  const [uploadedFileName, setUploadedFileName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    duration: '',
    isHD: false,
  })

  const simulateUpload = useCallback((fileName: string) => {
    setUploadedFileName(fileName)
    setUploadState('uploading')
    setUploadProgress(0)
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
    let progress = 0
    progressIntervalRef.current = setInterval(() => {
      progress += Math.random() * 15 + 3
      if (progress >= 100) {
        progress = 100
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
        setUploadProgress(100)
        setTimeout(() => setUploadState('success'), 300)
      } else {
        setUploadProgress(Math.min(progress, 100))
      }
    }, 150)
  }, [])

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true) }, [])
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(false) }, [])
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) simulateUpload(files[0].name)
  }, [simulateUpload])
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) simulateUpload(files[0].name)
  }, [simulateUpload])
  const handleBrowseClick = useCallback(() => { fileInputRef.current?.click() }, [])
  const handleResetUpload = useCallback(() => {
    setUploadState('idle'); setUploadProgress(0); setUploadedFileName('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    onUpload({ title: form.title, description: form.description, category: form.category, duration: form.duration, isHD: form.isHD, fileName: uploadedFileName })
    setForm({ title: '', description: '', category: '', duration: '', isHD: false })
    handleResetUpload()
  }, [form, onUpload, uploadedFileName, handleResetUpload])

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-4 p-3 lg:p-5"
    >
      <div>
        <h2 className="text-xl font-bold text-white">Upload Video</h2>
        <p className="text-sm text-xtube-text-secondary">Drag and drop your video files or browse to upload</p>
      </div>

      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        animate={{ borderColor: isDragOver ? '#E50914' : '#1f1f1f', backgroundColor: isDragOver ? 'rgba(229,9,20,0.05)' : 'rgba(15,15,15,0.8)' }}
        transition={{ duration: 0.2 }}
        className="relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed bg-[#0f0f0f]/80 backdrop-blur-xl transition-shadow hover:shadow-[0_0_15px_rgba(229,9,20,0.1)]"
        onClick={handleBrowseClick}
      >
        <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileSelect} />
        <AnimatePresence mode="wait">
          {uploadState === 'idle' && (
            <motion.div key="idle" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-xtube-red/10"><CloudUpload className="h-8 w-8 text-xtube-red" /></div>
              <div className="text-center">
                <p className="text-lg font-medium text-white">Drag & drop video files here</p>
                <p className="mt-1 text-sm text-xtube-text-secondary">or <span className="cursor-pointer text-xtube-red underline underline-offset-2 hover:text-xtube-red-hover">browse files</span></p>
              </div>
              <p className="text-xs text-xtube-text-secondary">MP4, MOV, AVI up to 2GB</p>
            </motion.div>
          )}
          {uploadState === 'uploading' && (
            <motion.div key="uploading" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex w-full max-w-sm flex-col items-center gap-3 px-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-xtube-red/10"><Upload className="h-8 w-8 animate-bounce text-xtube-red" /></div>
              <div className="w-full space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate text-white" title={uploadedFileName}>{uploadedFileName}</span>
                  <span className="ml-2 flex-shrink-0 font-mono text-xtube-red">{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2 bg-xtube-border [&>div]:bg-xtube-red" />
              </div>
            </motion.div>
          )}
          {uploadState === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10"><CheckCircle2 className="h-8 w-8 text-green-400" /></div>
              <div className="text-center">
                <p className="text-lg font-medium text-white">Upload Complete!</p>
                <p className="mt-1 text-sm text-xtube-text-secondary">{uploadedFileName}</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); handleResetUpload() }} className="mt-2 text-sm text-xtube-red underline underline-offset-2 hover:text-xtube-red-hover">Upload another file</button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.35 }}
        className="rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-6 backdrop-blur-xl transition-shadow hover:border-xtube-red/20 hover:shadow-[0_0_15px_rgba(229,9,20,0.1)]"
      >
        <h3 className="mb-5 text-lg font-semibold text-white">Video Details</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2"><Label className="text-white">Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Enter video title" className="border-xtube-border bg-xtube-bg text-white placeholder:text-xtube-text-secondary focus:border-xtube-red/40 focus:ring-xtube-red/20" required /></div>
          <div className="space-y-2"><Label className="text-white">Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe your video..." className="min-h-[100px] border-xtube-border bg-xtube-bg text-white placeholder:text-xtube-text-secondary focus:border-xtube-red/40 focus:ring-xtube-red/20" rows={4} /></div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-2"><Label className="text-white">Category</Label><Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}><SelectTrigger className="w-full border-xtube-border bg-xtube-bg text-white focus:ring-xtube-red/20"><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent className="border-xtube-border bg-xtube-card">{categories.filter(c => c !== 'All Categories').map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent></Select></div>
            <div className="space-y-2"><Label className="text-white">Duration</Label><Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="e.g. 12:30" className="border-xtube-border bg-xtube-bg text-white placeholder:text-xtube-text-secondary focus:border-xtube-red/40 focus:ring-xtube-red/20" /></div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-xtube-border bg-xtube-bg/50 p-4">
            <div><p className="text-sm font-medium text-white">HD Quality</p><p className="text-xs text-xtube-text-secondary">Enable high-definition streaming</p></div>
            <div className="flex items-center gap-3"><Switch checked={form.isHD} onCheckedChange={(checked) => setForm({ ...form, isHD: checked })} /><span className={`text-sm font-medium ${form.isHD ? 'text-xtube-red' : 'text-xtube-text-secondary'}`}>{form.isHD ? 'HD' : 'SD'}</span></div>
          </div>
          <Button type="submit" className="w-full bg-xtube-red py-6 text-base font-semibold text-white transition-all hover:bg-xtube-red-hover hover:shadow-[0_0_20px_rgba(229,9,20,0.3)]"><Upload className="mr-2 h-5 w-5" />Publish Now</Button>
        </form>
      </motion.div>
    </motion.div>
  )
}

/* ────────────────────────────────────────────
   Video Card (Grid View)
   ──────────────────────────────────────────── */

function VideoCard({
  video,
  index,
  onDelete,
  onTogglePublish,
  onWatch,
}: {
  video: VideoManagerProps['videos'][0] & { fileSize?: string }
  index: number
  onDelete: (id: string) => void
  onTogglePublish: (id: string) => void
  onWatch: (id: string) => void
}) {
  const gradientIdx = parseInt(video.id) % thumbnailGradients.length
  const catColor = categoryColors[video.category] || 'bg-xtube-red/15 text-xtube-red border-xtube-red/20'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.04, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group relative overflow-hidden rounded-xl border border-white/5 bg-[#111111]/90 backdrop-blur-xl transition-all duration-300 hover:border-white/10 hover:shadow-[0_0_25px_rgba(229,9,20,0.12)]"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        {/* Cinematic gradient thumbnail */}
        <div className={`absolute inset-0 bg-gradient-to-br ${thumbnailGradients[gradientIdx]}`} />

        {/* Decorative film elements */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {/* Film reel circles */}
            <div className="h-16 w-24 rounded-lg border border-white/10 bg-black/30 backdrop-blur-sm flex items-center justify-center">
              <Film className="h-8 w-8 text-white/20" />
            </div>
          </div>
        </div>

        {/* Dark overlay on hover */}
        <div className="absolute inset-0 bg-black/0 transition-all duration-300 group-hover:bg-black/40" />

        {/* Play button overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100">
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-xtube-red/90 shadow-[0_0_20px_rgba(229,9,20,0.5)] cursor-pointer"
            onClick={() => onWatch(video.id)}
          >
            <Play className="h-5 w-5 text-white ml-0.5" fill="white" />
          </motion.div>
        </div>

        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 rounded-md bg-black/80 px-1.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm border border-white/10">
          {video.duration}
        </div>

        {/* Three-dot menu */}
        <div className="absolute top-2 right-2 opacity-0 transition-all duration-200 group-hover:opacity-100">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm text-white/70 transition-colors hover:bg-black/80 hover:text-white">
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="border-white/10 bg-[#111111]/95 backdrop-blur-xl" align="end">
              <DropdownMenuItem className="text-white focus:bg-white/5" onClick={() => onWatch(video.id)}>
                <Play className="mr-2 h-3.5 w-3.5" />Watch
              </DropdownMenuItem>
              <DropdownMenuItem className="text-white focus:bg-white/5">
                <Edit className="mr-2 h-3.5 w-3.5" />Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="text-white focus:bg-white/5" onClick={() => onTogglePublish(video.id)}>
                {video.isPublished ? 'Unpublish' : 'Publish'}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuItem className="text-red-400 focus:bg-red-500/10" onClick={() => onDelete(video.id)}>
                <Trash2 className="mr-2 h-3.5 w-3.5" />Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Status badge */}
        <div className="absolute top-2 left-2">
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm ${
            video.isPublished
              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
              : 'border-amber-500/20 bg-amber-500/10 text-amber-400'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${video.isPublished ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            {video.isPublished ? 'Published' : 'Draft'}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-3.5">
        {/* Title */}
        <h3 className="mb-1.5 truncate text-sm font-semibold text-white transition-colors group-hover:text-xtube-red">
          {video.title}
        </h3>

        {/* Category */}
        <div className="mb-2.5">
          <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${catColor}`}>
            <Tag className="h-2.5 w-2.5" />
            {video.category}
          </span>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-3 text-[11px] text-white/40 mb-3">
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {formatViews(video.views)}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(video.createdAt)}
          </span>
          <span className="flex items-center gap-1">
            <HardDrive className="h-3 w-3" />
            {video.fileSize || getRandomFileSize()}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onWatch(video.id)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-white/10 border border-white/5"
          >
            <Play className="h-3 w-3" />Watch
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-white/10 border border-white/5"
          >
            <Edit className="h-3 w-3" />Edit
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onDelete(video.id)}
            className="flex items-center justify-center rounded-lg bg-red-500/5 px-2.5 py-1.5 text-[11px] font-semibold text-red-400 transition-colors hover:bg-red-500/15 border border-red-500/10"
          >
            <Trash2 className="h-3 w-3" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

/* ────────────────────────────────────────────
   List Row View
   ──────────────────────────────────────────── */

function VideoListRow({
  video,
  index,
  onDelete,
  onTogglePublish,
  onWatch,
}: {
  video: VideoManagerProps['videos'][0] & { fileSize?: string }
  index: number
  onDelete: (id: string) => void
  onTogglePublish: (id: string) => void
  onWatch: (id: string) => void
}) {
  const gradientIdx = parseInt(video.id) % thumbnailGradients.length
  const catColor = categoryColors[video.category] || 'bg-xtube-red/15 text-xtube-red border-xtube-red/20'

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className="group flex items-center gap-3 rounded-xl border border-white/5 bg-[#111111]/80 p-3 backdrop-blur-xl transition-all duration-200 hover:border-white/10 hover:bg-[#111111]/95 hover:shadow-[0_0_15px_rgba(229,9,20,0.08)]"
    >
      {/* Thumbnail */}
      <div className="relative h-14 w-24 flex-shrink-0 overflow-hidden rounded-lg">
        <div className={`absolute inset-0 bg-gradient-to-br ${thumbnailGradients[gradientIdx]}`} />
        <div className="absolute inset-0 flex items-center justify-center">
          <Film className="h-5 w-5 text-white/15" />
        </div>
        <div className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[9px] font-semibold text-white">
          {video.duration}
        </div>
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="truncate text-sm font-semibold text-white transition-colors group-hover:text-xtube-red">{video.title}</h3>
          <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-semibold ${catColor}`}>
            {video.category}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-white/40">
          <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{formatViews(video.views)}</span>
          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(video.createdAt)}</span>
          <span className="flex items-center gap-1"><HardDrive className="h-3 w-3" />{video.fileSize || getRandomFileSize()}</span>
        </div>
      </div>

      {/* Status */}
      <span className={`hidden sm:inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
        video.isPublished
          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
          : 'border-amber-500/20 bg-amber-500/10 text-amber-400'
      }`}>
        <span className={`h-1.5 w-1.5 rounded-full ${video.isPublished ? 'bg-emerald-400' : 'bg-amber-400'}`} />
        {video.isPublished ? 'Published' : 'Draft'}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onWatch(video.id)} className="flex items-center justify-center rounded-lg bg-white/5 p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white">
          <Play className="h-3.5 w-3.5" />
        </motion.button>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex items-center justify-center rounded-lg bg-white/5 p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white">
          <Edit className="h-3.5 w-3.5" />
        </motion.button>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onDelete(video.id)} className="flex items-center justify-center rounded-lg bg-red-500/5 p-2 text-red-400/60 transition-colors hover:bg-red-500/15 hover:text-red-400">
          <Trash2 className="h-3.5 w-3.5" />
        </motion.button>
      </div>
    </motion.div>
  )
}

/* ────────────────────────────────────────────
   All Videos View (Grid + List)
   ──────────────────────────────────────────── */

function AllVideosView({
  videos,
  onDelete,
  onTogglePublish,
  loading,
}: {
  videos: VideoManagerProps['videos']
  onDelete: VideoManagerProps['onDelete']
  onTogglePublish: VideoManagerProps['onTogglePublish']
  loading?: boolean
}) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('All Categories')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)

  // Show ONLY real videos from database (no mock data)
  const allVideos = useMemo(() => videos, [videos])

  // Filter and sort videos
  const filteredVideos = useMemo(() => {
    let result = [...allVideos]

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(v => v.title.toLowerCase().includes(q) || v.category.toLowerCase().includes(q))
    }

    if (categoryFilter !== 'All Categories') {
      result = result.filter(v => v.category === categoryFilter)
    }

    switch (sortBy) {
      case 'newest': result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break
      case 'oldest': result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); break
      case 'most-viewed': result.sort((a, b) => b.views - a.views); break
      case 'least-viewed': result.sort((a, b) => a.views - b.views); break
      case 'title-az': result.sort((a, b) => a.title.localeCompare(b.title)); break
      case 'title-za': result.sort((a, b) => b.title.localeCompare(a.title)); break
    }

    return result
  }, [allVideos, searchQuery, categoryFilter, sortBy])

  // Pagination
  const totalPages = Math.ceil(filteredVideos.length / itemsPerPage)
  const paginatedVideos = filteredVideos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleWatch = useCallback((id: string) => {
    // Navigate to video watch page
    useAppStore.getState().setSelectedVideoId(id)
    useAppStore.getState().setView('video')
  }, [])

  const resetFilters = useCallback(() => {
    setSearchQuery('')
    setCategoryFilter('All Categories')
    setSortBy('newest')
    setCurrentPage(1)
  }, [])

  if (loading) {
    return (
      <div className="space-y-4 p-3 lg:p-5">
        <div className="flex items-center justify-between">
          <div><Skeleton className="h-8 w-48 bg-xtube-card" /><Skeleton className="mt-2 h-4 w-60 bg-xtube-card" /></div>
          <Skeleton className="h-10 w-36 rounded-xl bg-xtube-card" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 flex-1 bg-xtube-card" />
          <Skeleton className="h-10 w-36 bg-xtube-card" />
          <Skeleton className="h-10 w-36 bg-xtube-card" />
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-white/5 bg-[#111111]/80">
              <Skeleton className="aspect-video bg-xtube-card" />
              <div className="p-3 space-y-2"><Skeleton className="h-4 w-3/4 bg-xtube-card" /><Skeleton className="h-3 w-1/2 bg-xtube-card" /></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-4 p-3 lg:p-5"
    >
      {/* ═══════════════════════════════════════════════════════════════════
          TOP HEADER
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-xtube-red/10">
            <Film className="h-5 w-5 text-xtube-red" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">All Videos</h2>
            <p className="text-sm text-white/40">Manage your entire video library</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Upload Video Button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => useAppStore.getState().setAdminSection('video-upload')}
            className="flex items-center gap-2 rounded-xl bg-xtube-red px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(229,9,20,0.35)] transition-all hover:bg-xtube-red-hover hover:shadow-[0_0_25px_rgba(229,9,20,0.5)]"
          >
            <Upload className="h-4 w-4" />
            Upload Video
          </motion.button>

          {/* View Toggle */}
          <div className="flex items-center overflow-hidden rounded-lg border border-white/10 bg-[#0f0f0f]/80">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center justify-center p-2 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-xtube-red text-white'
                  : 'text-white/40 hover:bg-white/5 hover:text-white/70'
              }`}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center justify-center p-2 transition-colors ${
                viewMode === 'list'
                  ? 'bg-xtube-red text-white'
                  : 'text-white/40 hover:bg-white/5 hover:text-white/70'
              }`}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SEARCH + FILTER SECTION
          ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="flex flex-col gap-3 rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-4 backdrop-blur-xl transition-shadow hover:border-white/10 md:flex-row md:items-center"
      >
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <Input
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
            placeholder="Search videos..."
            className="border-white/10 bg-[#0a0a0a] pl-10 text-white placeholder:text-white/30 focus:border-xtube-red/40 focus:ring-xtube-red/20 rounded-lg"
          />
        </div>

        {/* Category Filter */}
        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setCurrentPage(1) }}>
          <SelectTrigger className="w-full rounded-lg border-white/10 bg-[#0a0a0a] text-white/70 focus:ring-xtube-red/20 md:w-44">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-[#111111]">
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort By */}
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-full rounded-lg border-white/10 bg-[#0a0a0a] text-white/70 focus:ring-xtube-red/20 md:w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-[#111111]">
            <SelectItem value="newest">Sort by: Newest</SelectItem>
            <SelectItem value="oldest">Sort by: Oldest</SelectItem>
            <SelectItem value="most-viewed">Most Viewed</SelectItem>
            <SelectItem value="least-viewed">Least Viewed</SelectItem>
            <SelectItem value="title-az">Title: A → Z</SelectItem>
            <SelectItem value="title-za">Title: Z → A</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        <AnimatePresence>
          {(searchQuery || categoryFilter !== 'All Categories' || sortBy !== 'newest') && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={resetFilters}
              className="flex items-center gap-1 text-sm text-xtube-red hover:text-xtube-red-hover whitespace-nowrap"
            >
              <X className="h-3.5 w-3.5" />Clear
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          VIDEOS COUNT
          ═══════════════════════════════════════════════════════════════════ */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="text-sm text-white/40"
      >
        Showing <span className="font-semibold text-white/70">{filteredVideos.length}</span> video{filteredVideos.length !== 1 ? 's' : ''}
      </motion.p>

      {/* ═══════════════════════════════════════════════════════════════════
          VIDEO GRID / LIST
          ═══════════════════════════════════════════════════════════════════ */}
      {paginatedVideos.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center gap-3 rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-16 backdrop-blur-xl"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-xtube-red/5">
            <Film className="h-8 w-8 text-white/20" />
          </div>
          <p className="text-lg font-medium text-white">No videos found</p>
          <p className="text-sm text-white/40">Try adjusting your search or filters</p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={resetFilters}
            className="mt-2 rounded-lg bg-xtube-red/10 px-4 py-2 text-sm font-medium text-xtube-red transition-colors hover:bg-xtube-red/20"
          >
            Clear All Filters
          </motion.button>
        </motion.div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {paginatedVideos.map((video, index) => (
            <VideoCard
              key={video.id}
              video={video}
              index={index}
              onDelete={onDelete}
              onTogglePublish={onTogglePublish}
              onWatch={handleWatch}
            />
          ))}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="space-y-2">
          {paginatedVideos.map((video, index) => (
            <VideoListRow
              key={video.id}
              video={video}
              index={index}
              onDelete={onDelete}
              onTogglePublish={onTogglePublish}
              onWatch={handleWatch}
            />
          ))}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          PAGINATION
          ═══════════════════════════════════════════════════════════════════ */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between"
        >
          <p className="text-sm text-white/40">
            {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredVideos.length)} of {filteredVideos.length}
          </p>

          <div className="flex items-center gap-1">
            <button
              className="flex h-9 items-center justify-center rounded-lg border border-white/10 bg-[#0f0f0f]/80 px-3 text-xs font-medium text-white/50 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <motion.button
                key={page}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                  page === currentPage
                    ? 'bg-xtube-red text-white shadow-[0_0_10px_rgba(229,9,20,0.3)]'
                    : 'border border-white/10 bg-[#0f0f0f]/80 text-white/40 hover:bg-white/5 hover:text-white'
                }`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </motion.button>
            ))}

            <button
              className="flex h-9 items-center justify-center rounded-lg border border-white/10 bg-[#0f0f0f]/80 px-3 text-xs font-medium text-white/50 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next<ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>

          {/* Items per page selector */}
          <Select value={itemsPerPage.toString()} onValueChange={(v) => { setItemsPerPage(parseInt(v)); setCurrentPage(1) }}>
            <SelectTrigger className="h-9 w-20 rounded-lg border-white/10 bg-[#0f0f0f]/80 text-xs text-white/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-[#111111]">
              <SelectItem value="8">8 / page</SelectItem>
              <SelectItem value="12">12 / page</SelectItem>
              <SelectItem value="16">16 / page</SelectItem>
              <SelectItem value="24">24 / page</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>
      )}
    </motion.div>
  )
}

/* ────────────────────────────────────────────
   Main VideoManager Component
   ──────────────────────────────────────────── */

export function VideoManager({ videos, onUpload, onDelete, onTogglePublish, loading }: VideoManagerProps) {
  const { adminSection } = useAppStore()

  if (adminSection === 'video-upload') {
    return <UploadView onUpload={onUpload} />
  }

  return (
    <AllVideosView
      videos={videos}
      onDelete={onDelete}
      onTogglePublish={onTogglePublish}
      loading={loading}
    />
  )
}
