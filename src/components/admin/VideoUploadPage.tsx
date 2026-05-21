'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Film,
  Upload,
  CloudUpload,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Settings,
  Maximize,
  Trash2,
  CheckCircle2,
  Link,
  Image as ImageIcon,
  Shield,
  Clock,
  ChevronDown,
  RefreshCw,
  Eye,
  TrendingUp,
  Radio,
  AlertCircle,
  Pencil,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { extractVideoMetadataAndThumbnail } from '@/lib/storage/thumbnail-helper'
import { uploadFile } from '@/lib/storage/upload-helper'
import { toast } from 'sonner'

// ─── Types ───────────────────────────────────────────────────────────────────

type UploadStage = 'idle' | 'uploading' | 'processing' | 'success'

interface FileInfo {
  name: string
  resolution: string
  size: string
  duration: string
}

// ─── Thumbnail Gradients ─────────────────────────────────────────────────────

const thumbnailGradients = [
  'from-emerald-900/60 via-teal-800/40 to-cyan-900/30',
  'from-blue-900/60 via-indigo-800/40 to-violet-900/30',
  'from-amber-900/60 via-orange-800/40 to-yellow-900/30',
  'from-rose-900/60 via-pink-800/40 to-red-900/30',
]

const thumbnailTimecodes = ['Auto-gen', '00:08', '00:14', '00:22']

// ─── Quality Options ─────────────────────────────────────────────────────────

const qualityOptions = [
  { value: 'auto', label: 'Auto', desc: 'Recommended' },
  { value: '1080p', label: '1080p', desc: '' },
  { value: '2k', label: '2K', desc: '' },
  { value: '4k', label: '4K', desc: '' },
]

const categoryOptions = [
  'Travel & Nature',
  'Action',
  'Sci-Fi',
  'Gaming',
  'Sports',
  'Documentary',
  'Adventure',
  'Romance',
  'Fantasy',
  'Music',
  'Comedy',
  'Horror',
]

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function VideoUploadPage() {
  // Upload state
  const [uploadStage, setUploadStage] = useState<UploadStage>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadSpeed, setUploadSpeed] = useState('0 MB/s')
  const [uploadRemaining, setUploadRemaining] = useState('')
  const [uploadedSize, setUploadedSize] = useState('0 MB')
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedQuality, setSelectedQuality] = useState('auto')
  const [selectedThumbnail, setSelectedThumbnail] = useState(0)

  // File info
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [quality, setQuality] = useState('1080p')
  const [duration, setDuration] = useState('')
  const [isFeatured, setIsFeatured] = useState(false)
  const [isTrending, setIsTrending] = useState(false)
  const [isLive, setIsLive] = useState(false)

  // Video player state
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [videoDuration, setVideoDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(true)

  // Upload/processing references
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [localThumbnailUrl, setLocalThumbnailUrl] = useState('')
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | File | null>(null)
  const [previewVideoUrl, setPreviewVideoUrl] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  // ── Real File Upload Process ──────────────────────────────────────────────

  const handleFileProcess = useCallback(async (file: File) => {
    if (!file) return
    setVideoFile(file)
    setUploadStage('idle')
    setUploadProgress(0)
    setUploadedSize('0 MB')
    setUploadSpeed('0 MB/s')

    const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name
    setTitle(nameWithoutExt)

    const sizeInMB = file.size / (1024 * 1024)
    const sizeStr = sizeInMB >= 1024 ? `${(sizeInMB / 1024).toFixed(2)} GB` : `${sizeInMB.toFixed(1)} MB`

    setFileInfo({
      name: file.name,
      resolution: 'Detecting...',
      size: sizeStr,
      duration: 'Detecting...',
    })

    setUploadStage('processing')

    try {
      const meta = await extractVideoMetadataAndThumbnail(file)

      const durationStr = formatDuration(meta.duration)
      setDuration(durationStr)
      setVideoDuration(meta.duration)
      setQuality(meta.resolution)

      setFileInfo({
        name: file.name,
        resolution: `${meta.width} × ${meta.height} (${meta.resolution})`,
        size: sizeStr,
        duration: durationStr,
      })

      setThumbnailBlob(meta.thumbnailBlob)
      const localUrl = URL.createObjectURL(meta.thumbnailBlob)
      setLocalThumbnailUrl(localUrl)

      const localVideoUrl = URL.createObjectURL(file)
      setPreviewVideoUrl(localVideoUrl)

      setUploadStage('uploading')

      const uploadRes = await uploadFile(file, 'video', file.name, (progress, speed, remaining) => {
        setUploadProgress(progress)
        setUploadSpeed(speed)
        setUploadRemaining(remaining)
        const uploaded = (progress / 100) * file.size
        const uploadedMB = uploaded / (1024 * 1024)
        if (uploadedMB >= 1024) {
          setUploadedSize(`${(uploadedMB / 1024).toFixed(2)} GB`)
        } else {
          setUploadedSize(`${uploadedMB.toFixed(1)} MB`)
        }
      })

      setVideoUrl(uploadRes.url)

      let finalThumbnailUrl = ''
      if (meta.thumbnailBlob) {
        try {
          const thumbRes = await uploadFile(meta.thumbnailBlob, 'thumbnail', 'thumbnail.jpg')
          finalThumbnailUrl = thumbRes.url
          setThumbnailUrl(thumbRes.url)
        } catch (thumbErr) {
          console.error('Failed to upload thumbnail:', thumbErr)
        }
      }

      setUploadStage('success')
      toast.success('Video uploaded and processed successfully!')
    } catch (err) {
      console.error('Upload process failed:', err)
      setUploadStage('idle')
      setFileInfo(null)
      toast.error(`Upload failed: ${err instanceof Error ? err.message : String(err)}`)
    }
  }, [])

  // ─── Drag & Drop ───────────────────────────────────────────────────────

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)
      const files = e.dataTransfer.files
      if (files.length > 0) handleFileProcess(files[0])
    },
    [handleFileProcess]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) handleFileProcess(files[0])
    },
    [handleFileProcess]
  )

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleResetUpload = useCallback(() => {
    setUploadStage('idle')
    setUploadProgress(0)
    setFileInfo(null)
    setTitle('')
    setDescription('')
    setCategory('')
    setQuality('1080p')
    setDuration('')
    setIsFeatured(false)
    setIsTrending(false)
    setIsLive(false)
    setSelectedThumbnail(0)
    setVideoFile(null)
    setVideoUrl('')
    setThumbnailUrl('')
    setLocalThumbnailUrl('')
    setThumbnailBlob(null)
    setPreviewVideoUrl('')
    setCurrentTime(0)
    setVideoDuration(0)
    setIsPlaying(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = ''
  }, [])

  const handleClearForm = useCallback(() => {
    setTitle('')
    setDescription('')
    setCategory('')
    setQuality('1080p')
    setDuration('')
    setIsFeatured(false)
    setIsTrending(false)
    setIsLive(false)
  }, [])

  const handleManualThumbnailSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      setThumbnailBlob(file)
      const localUrl = URL.createObjectURL(file)
      setLocalThumbnailUrl(localUrl)
      setSelectedThumbnail(0)
    }
  }, [])

  // Video Player custom controls
  const handlePlayPause = useCallback(() => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
  }, [isPlaying])

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return
    setCurrentTime(videoRef.current.currentTime)
  }, [])

  const handleVideoLoaded = useCallback(() => {
    if (!videoRef.current) return
    setVideoDuration(videoRef.current.duration)
  }, [])

  const handleProgressBarClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || videoDuration <= 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = clickX / rect.width
    videoRef.current.currentTime = percentage * videoDuration
    setCurrentTime(percentage * videoDuration)
  }, [videoDuration])

  // ── Create video in database via API ──────────────────────────────────────
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishSuccess, setPublishSuccess] = useState(false)

  const handlePublishVideo = useCallback(async () => {
    if (!title.trim() || !category) {
      toast.error('Title and Category are required')
      return
    }
    setIsPublishing(true)
    try {
      let finalThumbUrl = thumbnailUrl

      if (thumbnailBlob && !thumbnailUrl) {
        toast.info('Uploading thumbnail...')
        const thumbRes = await uploadFile(thumbnailBlob, 'thumbnail', 'thumbnail.jpg')
        finalThumbUrl = thumbRes.url
        setThumbnailUrl(thumbRes.url)
      }

      const res = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || `Watch ${title.trim()} on Xtube.`,
          thumbnail: finalThumbUrl || `https://picsum.photos/seed/${Date.now()}/640/360`,
          videoUrl: videoUrl || 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
          category,
          duration: duration || '0:00',
          isFeatured,
          isTrending,
          isLive,
          isHd: quality === '1080p' || quality === '2k' || quality === '4k',
          isPublished: true,
          resolution: quality,
        }),
      })
      if (res.ok) {
        setPublishSuccess(true)
        toast.success('Video published successfully!')
        setTimeout(() => {
          handleResetUpload()
          setPublishSuccess(false)
        }, 2000)
      } else {
        const errorData = await res.json().catch(() => ({}))
        toast.error(errorData.error || 'Failed to publish video')
      }
    } catch (err) {
      console.error('Error creating video:', err)
      toast.error('Error publishing video')
    } finally {
      setIsPublishing(false)
    }
  }, [title, description, category, quality, duration, videoUrl, thumbnailUrl, thumbnailBlob, isFeatured, isTrending, isLive, handleResetUpload])

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <div className="min-h-full p-4 lg:p-6">
        {/* ── Header Section ── */}
        <div className="mb-5">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Upload Video</h1>
              <p className="mt-1 text-sm text-white/40">Upload a video — preview is auto-generated</p>
            </div>
          </div>

          {/* Tab */}
          <div className="mt-5 flex items-center gap-0 border-b border-white/5">
            <button className="relative flex items-center gap-2 px-5 pb-3 text-sm font-semibold text-xtube-red">
              <Film className="h-4 w-4" />
              Video
              <motion.div
                layoutId="upload-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-xtube-red"
              />
            </button>
          </div>
        </div>

        {/* ── Two Column Layout ── */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_440px]">
          {/* ═══════════════════════════════════════════════════════════════════
              LEFT COLUMN — Upload Video
              ═══════════════════════════════════════════════════════════════════ */}
          <div className="space-y-4">
            {/* Section Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-xtube-red">1.</span>
                <h2 className="text-base font-bold text-white">Upload Video</h2>
              </div>
              {fileInfo && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleBrowseClick}
                    className="text-sm font-medium text-xtube-red transition-colors hover:text-xtube-red-hover"
                  >
                    Change File
                  </button>
                  <button
                    onClick={handleResetUpload}
                    className="rounded-lg p-1.5 text-white/30 transition-colors hover:bg-white/10 hover:text-red-400"
                    aria-label="Delete file"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* ── File Info Card ── */}
            <AnimatePresence mode="wait">
              {fileInfo && (
                <motion.div
                  key="file-info"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="overflow-hidden rounded-xl border border-white/5 bg-[#111111]/80"
                >
                  <div className="flex items-center gap-3 p-3">
                    <div className="relative h-14 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-xtube-card">
                      {localThumbnailUrl ? (
                        <img src={localThumbnailUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Film className="h-5 w-5 text-white/25" />
                        </div>
                      )}
                      <div className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[9px] font-semibold text-white">
                        {fileInfo.duration}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{fileInfo.name}</p>
                      <p className="mt-0.5 text-xs text-white/40">
                        {fileInfo.resolution} &bull; {fileInfo.size} &bull; {fileInfo.duration}
                      </p>
                    </div>

                    {uploadStage === 'success' && (
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      </div>
                    )}
                    {uploadStage === 'processing' && (
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/10">
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
                      </div>
                    )}
                    {(uploadStage === 'uploading' || uploadStage === 'idle') && fileInfo && (
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-xtube-red/10">
                        <Upload className="h-3.5 w-3.5 text-xtube-red animate-pulse" />
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Video Player Preview ── */}
            <AnimatePresence>
              {uploadStage === 'success' && previewVideoUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="overflow-hidden rounded-xl border border-white/5 bg-[#111111]/80"
                >
                  <div className="relative aspect-video bg-black">
                    <video
                      ref={videoRef}
                      src={previewVideoUrl}
                      className="absolute inset-0 h-full w-full object-cover"
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleVideoLoaded}
                      onClick={handlePlayPause}
                      muted={isMuted}
                    />

                    {!isPlaying && (
                      <button
                        onClick={handlePlayPause}
                        className="absolute inset-0 flex items-center justify-center transition-opacity"
                      >
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-colors hover:bg-white/20"
                        >
                          <Play className="h-5 w-5 text-white ml-0.5" fill="white" />
                        </motion.div>
                      </button>
                    )}

                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-2.5 pt-6">
                      <div
                        onClick={handleProgressBarClick}
                        className="group/progress relative mb-2 h-1 cursor-pointer rounded-full bg-white/20"
                      >
                        <div
                          className="absolute left-0 top-0 h-full bg-xtube-red rounded-full"
                          style={{ width: `${videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0}%` }}
                        />
                        <div
                          className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border-2 border-xtube-red bg-white opacity-0 transition-opacity group-hover/progress:opacity-100"
                          style={{
                            left: `${videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0}%`,
                            transform: 'translate(-50%, -50%)',
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <button onClick={handlePlayPause} className="text-white/70 transition-colors hover:text-white">
                            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => setIsMuted(!isMuted)}
                            className="text-white/70 transition-colors hover:text-white"
                          >
                            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                          </button>
                          <span className="text-xs text-white/50">
                            {formatTime(currentTime)} / {formatTime(videoDuration)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <button className="text-white/70 transition-colors hover:text-white">
                            <Settings className="h-4 w-4" />
                          </button>
                          <button className="text-white/70 transition-colors hover:text-white">
                            <Maximize className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Upload Area ── */}
            <AnimatePresence>
              {uploadStage === 'idle' && (
                <motion.div
                  key="upload-area"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={handleBrowseClick}
                  className={`relative flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-all duration-200 ${
                    isDragOver
                      ? 'border-xtube-red bg-xtube-red/5'
                      : 'border-white/10 bg-[#111111]/60 hover:border-white/20 hover:bg-[#111111]/80'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/mov,video/webm,video/x-mpegURL,application/x-mpegURL"
                    className="hidden"
                    onChange={handleFileSelect}
                  />

                  <motion.div
                    animate={isDragOver ? { scale: 1.1 } : { scale: 1 }}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-xtube-red/10"
                  >
                    <CloudUpload className="h-5 w-5 text-xtube-red" />
                  </motion.div>

                  <div className="text-center">
                    <p className="text-sm font-medium text-white">Drag &amp; drop your video here</p>
                    <p className="mt-0.5 text-xs text-white/40">
                      or{' '}
                      <span className="cursor-pointer text-xtube-red underline underline-offset-2 hover:text-xtube-red-hover">
                        browse files
                      </span>
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── OR Divider ── */}
            <AnimatePresence>
              {uploadStage === 'idle' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3"
                >
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-xs text-white/30">OR</span>
                  <div className="h-px flex-1 bg-white/10" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* ─ Paste URL Button ── */}
            <AnimatePresence>
              {uploadStage === 'idle' && (
                <motion.button
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#111111]/60 px-3 py-2.5 text-sm font-medium text-white/60 transition-all hover:border-white/20 hover:bg-[#111111]/80 hover:text-white"
                >
                  <Link className="h-4 w-4" />
                  Paste video URL
                </motion.button>
              )}
            </AnimatePresence>

            {/* ─ Thumbnail Section ── */}
            <AnimatePresence>
              {uploadStage === 'success' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-white/70">Thumbnail</span>
                    <button
                      onClick={() => thumbnailInputRef.current?.click()}
                      className="text-xs font-medium text-xtube-red transition-colors hover:text-xtube-red-hover"
                    >
                      Upload Manually
                    </button>
                    <input
                      ref={thumbnailInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleManualThumbnailSelect}
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {thumbnailGradients.map((gradient, i) => (
                      <motion.button
                        key={i}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setSelectedThumbnail(i)}
                        className={`group relative aspect-video overflow-hidden rounded-lg border-2 transition-all ${
                          selectedThumbnail === i
                            ? 'border-xtube-red'
                            : 'border-transparent hover:border-white/20'
                        }`}
                      >
                        {i === 0 && localThumbnailUrl ? (
                          <img
                            src={localThumbnailUrl}
                            alt="Generated thumbnail"
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        ) : (
                          <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
                        )}
                        {selectedThumbnail === i && (
                          <div className="absolute inset-0 flex items-center justify-center bg-xtube-red/20">
                            <CheckCircle2 className="h-5 w-5 text-xtube-red" />
                          </div>
                        )}
                      </motion.button>
                    ))}
                  </div>

                  <div className="mt-2 flex items-start gap-1.5">
                    <AlertCircle className="mt-0.5 h-3 w-3 flex-shrink-0 text-white/25" />
                    <p className="text-[11px] text-white/30">
                      Video thumbnail and duration are auto-generated after upload.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Upload Progress ── */}
            <AnimatePresence>
              {(uploadStage === 'uploading' || uploadStage === 'processing') && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="overflow-hidden rounded-xl border border-white/5 bg-[#111111]/80 p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">
                      {uploadStage === 'processing' ? 'Processing...' : 'Uploading...'}
                    </span>
                    <span className="text-sm font-bold text-xtube-red">{Math.round(uploadProgress)}%</span>
                  </div>

                  <div className="relative mb-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.3 }}
                      className="absolute left-0 top-0 h-full rounded-full bg-xtube-red"
                    />
                  </div>

                  {uploadStage === 'uploading' && (
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <p className="text-[10px] text-white/30">Uploaded</p>
                        <p className="text-xs font-semibold text-white">{uploadedSize}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-white/30">Speed</p>
                        <p className="text-xs font-semibold text-white">{uploadSpeed}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-white/30">Time Left</p>
                        <p className="text-xs font-semibold text-white">{uploadRemaining}</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              RIGHT COLUMN — Video Details
              ═══════════════════════════════════════════════════════════════════ */}
          <div className="space-y-4">
            {/* Section Header */}
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-xtube-red">2.</span>
              <h2 className="text-base font-bold text-white">Video Details</h2>
              <Pencil className="h-4 w-4 text-xtube-red" />
            </div>

            {/* ── Form Card ── */}
            <div className="overflow-hidden rounded-xl border border-white/5 bg-[#111111]/80">
              <div className="space-y-4 p-4">
                {/* Title */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-white">
                      Title <span className="text-xtube-red">*</span>
                    </label>
                    <span className="text-xs text-white/30">{title.length}/100</span>
                  </div>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                    placeholder="Enter video title"
                    className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-all focus:border-xtube-red/40 focus:ring-1 focus:ring-xtube-red/20"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-white">Description</label>
                    <span className="text-xs text-white/30">{description.length}/500</span>
                  </div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                    placeholder="Describe your video..."
                    rows={3}
                    className="w-full resize-none rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-all focus:border-xtube-red/40 focus:ring-1 focus:ring-xtube-red/20"
                  />
                </div>

                {/* Category + Quality */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Category</label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="w-full rounded-lg border-white/10 bg-[#0a0a0a] text-sm text-white/70 focus:ring-xtube-red/20 [&_svg]:text-white/30">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="border-white/10 bg-[#111111]">
                        {categoryOptions.map((cat) => (
                          <SelectItem key={cat} value={cat} className="text-white focus:bg-white/5 focus:text-white">
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Quality</label>
                    <Select value={quality} onValueChange={setQuality}>
                      <SelectTrigger className="w-full rounded-lg border-white/10 bg-[#0a0a0a] text-sm text-white/70 focus:ring-xtube-red/20 [&_svg]:text-white/30">
                        <SelectValue placeholder="Select quality" />
                      </SelectTrigger>
                      <SelectContent className="border-white/10 bg-[#111111]">
                        <SelectItem value="auto" className="text-white focus:bg-white/5 focus:text-white">Auto</SelectItem>
                        <SelectItem value="1080p" className="text-white focus:bg-white/5 focus:text-white">1080p</SelectItem>
                        <SelectItem value="2k" className="text-white focus:bg-white/5 focus:text-white">2K</SelectItem>
                        <SelectItem value="4k" className="text-white focus:bg-white/5 focus:text-white">4K</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Duration</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="Auto-generated"
                      readOnly={!!fileInfo}
                      className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2.5 pr-10 text-sm text-white placeholder:text-white/25 outline-none transition-all focus:border-xtube-red/40 focus:ring-1 focus:ring-xtube-red/20 disabled:cursor-not-allowed disabled:opacity-70"
                    />
                    <Clock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="flex items-center gap-6 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={isFeatured}
                      onCheckedChange={(checked) => setIsFeatured(checked as boolean)}
                      className="border-white/20 data-[state=checked]:bg-xtube-red data-[state=checked]:border-xtube-red"
                    />
                    <span className="text-sm text-white/70">Featured</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={isTrending}
                      onCheckedChange={(checked) => setIsTrending(checked as boolean)}
                      className="border-white/20 data-[state=checked]:bg-xtube-red data-[state=checked]:border-xtube-red"
                    />
                    <span className="text-sm text-white/70">Trending</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={isLive}
                      onCheckedChange={(checked) => setIsLive(checked as boolean)}
                      className="border-white/20 data-[state=checked]:bg-xtube-red data-[state=checked]:border-xtube-red"
                    />
                    <span className="text-sm text-white/70">Live</span>
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleClearForm}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/60 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Clear
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: '0 0 25px rgba(229,9,20,0.4)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePublishVideo}
                    disabled={isPublishing || !title.trim() || !category}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-xtube-red px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_15px_rgba(229,9,20,0.3)] transition-all hover:bg-xtube-red-hover disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPublishing ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : publishSuccess ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {isPublishing ? 'Publishing...' : publishSuccess ? 'Published!' : 'Upload Video'}
                  </motion.button>
                </div>
              </div>
            </div>

            {/* ── Legal Notice ── */}
            <div className="overflow-hidden rounded-xl border border-white/5 bg-[#111111]/50">
              <div className="flex items-start gap-3 p-3">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-xtube-red/10">
                  <Shield className="h-3.5 w-3.5 text-xtube-red" />
                </div>
                <p className="text-[11px] leading-relaxed text-white/35">
                  By uploading, you confirm that you own the rights to this content and agree to our{' '}
                  <span className="cursor-pointer text-xtube-red hover:text-xtube-red-hover">
                    Terms of Service
                  </span>{' '}
                  and{' '}
                  <span className="cursor-pointer text-xtube-red hover:text-xtube-red-hover">
                    Community Guidelines
                  </span>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
