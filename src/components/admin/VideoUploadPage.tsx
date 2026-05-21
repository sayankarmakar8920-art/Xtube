'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
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
  Shield,
  Clock,
  RefreshCw,
  AlertCircle,
  Pencil,
  Eye,
  TrendingUp,
  Radio,
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

type UploadStage = 'idle' | 'uploading' | 'processing' | 'success'

interface FileInfo {
  name: string
  resolution: string
  size: string
  duration: string
}

const thumbnailGradients = [
  'from-emerald-900/60 via-teal-800/40 to-cyan-900/30',
  'from-blue-900/60 via-indigo-800/40 to-violet-900/30',
  'from-amber-900/60 via-orange-800/40 to-yellow-900/30',
  'from-rose-900/60 via-pink-800/40 to-red-900/30',
]

const qualityOptions = [
  { value: '360p', label: '360p', desc: '' },
  { value: '480p', label: '480p', desc: '' },
  { value: '720p', label: '720p', desc: 'HD' },
  { value: '1080p', label: '1080p', desc: 'FHD' },
  { value: '2k', label: '2K', desc: 'QHD' },
  { value: '4k', label: '4K', desc: 'UHD' },
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

export function VideoUploadPage() {
  const [uploadStage, setUploadStage] = useState<UploadStage>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadSpeed, setUploadSpeed] = useState('0 MB/s')
  const [uploadRemaining, setUploadRemaining] = useState('')
  const [uploadedSize, setUploadedSize] = useState('0 MB')
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedThumbnail, setSelectedThumbnail] = useState(0)
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [quality, setQuality] = useState('720p')
  const [duration, setDuration] = useState('')
  const [isFeatured, setIsFeatured] = useState(false)
  const [isTrending, setIsTrending] = useState(false)
  const [isLive, setIsLive] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [videoDuration, setVideoDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(true)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [localThumbnailUrls, setLocalThumbnailUrls] = useState<string[]>([])
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | File | null>(null)
  const [previewVideoUrl, setPreviewVideoUrl] = useState('')
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishSuccess, setPublishSuccess] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleFileProcess = useCallback(async (file: File) => {
    if (!file) return
    setVideoFile(file)
    setUploadStage('idle')
    setUploadProgress(0)
    setUploadedSize('0 MB')
    setUploadSpeed('0 MB/s')
    setUploadRemaining('')

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
      const urls = meta.thumbnails.map(t => URL.createObjectURL(t))
      setLocalThumbnailUrls(urls)
      setPreviewVideoUrl(URL.createObjectURL(file))
      setUploadStage('uploading')

      const uploadRes = await uploadFile(file, 'video', file.name, (progress, speed, remaining) => {
        setUploadProgress(progress)
        setUploadSpeed(speed || '0 MB/s')
        setUploadRemaining(remaining || '')
        const uploadedMB = (progress / 100) * file.size / (1024 * 1024)
        setUploadedSize(uploadedMB >= 1024 ? `${(uploadedMB / 1024).toFixed(2)} GB` : `${uploadedMB.toFixed(1)} MB`)
      })

      setVideoUrl(uploadRes.url)

      if (meta.thumbnailBlob) {
        try {
          const thumbRes = await uploadFile(meta.thumbnailBlob, 'thumbnail', 'thumbnail.jpg')
          setThumbnailUrl(thumbRes.url)
        } catch (thumbErr) {
          console.warn('Thumbnail upload failed, using auto-generated:', thumbErr)
        }
      }

      setUploadStage('success')
      toast.success('Video uploaded successfully!')
    } catch (err) {
      console.error('Upload failed:', err)
      setUploadStage('idle')
      setFileInfo(null)
      toast.error(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true) }, [])
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false) }, [])
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(false)
    if (e.dataTransfer.files.length > 0) handleFileProcess(e.dataTransfer.files[0])
  }, [handleFileProcess])
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) handleFileProcess(e.target.files[0])
  }, [handleFileProcess])
  const handleBrowseClick = useCallback(() => fileInputRef.current?.click(), [])

  const handleResetUpload = useCallback(() => {
    setUploadStage('idle'); setUploadProgress(0); setFileInfo(null); setTitle('')
    setDescription(''); setCategory(''); setQuality('720p'); setDuration('')
    setIsFeatured(false); setIsTrending(false); setIsLive(false); setSelectedThumbnail(0)
    setVideoFile(null); setVideoUrl(''); setThumbnailUrl('')
    setThumbnailBlob(null); setPreviewVideoUrl(''); setLocalThumbnailUrls([]); setCurrentTime(0); setVideoDuration(0)
    setIsPlaying(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = ''
  }, [])

  const handleClearForm = useCallback(() => {
    setTitle(''); setDescription(''); setCategory('');     setQuality('720p')
    setDuration(''); setIsFeatured(false); setIsTrending(false); setIsLive(false)
  }, [])

  const handleManualThumbnailSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const file = e.target.files[0]
      setThumbnailBlob(file)
      const url = URL.createObjectURL(file)
      setLocalThumbnailUrls([url])
      setSelectedThumbnail(0)
    }
  }, [])

  const handlePlayPause = useCallback(() => {
    if (!videoRef.current) return
    isPlaying ? videoRef.current.pause() : videoRef.current.play()
  }, [isPlaying])

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime)
  }, [])

  const handleVideoLoaded = useCallback(() => {
    if (videoRef.current) setVideoDuration(videoRef.current.duration)
  }, [])

  const handleProgressBarClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || videoDuration <= 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    videoRef.current.currentTime = pct * videoDuration
    setCurrentTime(pct * videoDuration)
  }, [videoDuration])

  const handlePublishVideo = useCallback(async () => {
    if (!title.trim() || !category) { toast.error('Title and Category required'); return }
    if (!videoUrl) { toast.error('Video upload not complete. Please wait.'); return }
    setIsPublishing(true)
    try {
      let finalThumbUrl = thumbnailUrl
      if (thumbnailBlob && !thumbnailUrl) {
        try {
          const thumbRes = await uploadFile(thumbnailBlob, 'thumbnail', 'thumbnail.jpg')
          finalThumbUrl = thumbRes.url
          setThumbnailUrl(thumbRes.url)
        } catch (thumbErr) {
          console.warn('Thumbnail upload failed, using fallback:', thumbErr)
          finalThumbUrl = `https://picsum.photos/seed/${Date.now()}/640/360`
        }
      }
      if (!finalThumbUrl) {
        finalThumbUrl = `https://picsum.photos/seed/${Date.now()}/640/360`
      }
      const res = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || `Watch ${title.trim()} on Xtube.`,
          thumbnail: finalThumbUrl,
          videoUrl,
          category,
          duration: duration || '0:00',
          isHd: ['1080p', '2k', '4k'].includes(quality),
          isPublished: true,
          resolution: quality,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        console.log('[Publish] Video created:', data.video?.id)
        setPublishSuccess(true)
        toast.success('Video published! It will appear in the catalog instantly.')
        setTimeout(() => { handleResetUpload(); setPublishSuccess(false) }, 2000)
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Failed to publish video')
      }
    } catch (err) {
      console.error('[Publish] Error:', err)
      toast.error('Error publishing video')
    } finally {
      setIsPublishing(false)
    }
  }, [title, description, category, quality, duration, videoUrl, thumbnailUrl, thumbnailBlob, handleResetUpload])

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-white/5 bg-[#0a0a0a] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-xtube-red/10">
            <Film className="h-4 w-4 text-xtube-red" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Upload Video</h1>
            <p className="text-xs text-white/40">Upload a video — preview is auto-generated</p>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="p-4 lg:p-5">
          {/* Two Column Grid */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {/* LEFT COLUMN */}
            <div className="space-y-4">
              {/* Section 1 Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-xtube-red">1.</span>
                  <h2 className="text-base font-bold text-white">Upload Video</h2>
                </div>
                {fileInfo && (
                  <div className="flex items-center gap-2">
                    <button onClick={handleBrowseClick} className="text-xs font-medium text-xtube-red hover:text-xtube-red-hover">Change File</button>
                    <button onClick={handleResetUpload} className="rounded-lg p-1.5 text-white/30 hover:bg-white/10 hover:text-red-400">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* File Info Card */}
              <AnimatePresence>
                {fileInfo && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-xl border border-white/5 bg-[#111]">
                    <div className="flex items-center gap-3 p-3">
                      <div className="relative h-14 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-xtube-card">
                        {localThumbnailUrls.length > 0 ? (
                          <img src={localThumbnailUrls[0]} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center"><Film className="h-5 w-5 text-white/25" /></div>
                        )}
                        <div className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[9px] font-semibold text-white">{fileInfo.duration}</div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">{fileInfo.name}</p>
                        <p className="mt-0.5 text-xs text-white/40">{fileInfo.resolution} • {fileInfo.size} • {fileInfo.duration}</p>
                      </div>
                      {uploadStage === 'success' && <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-400" />}
                      {uploadStage === 'processing' && <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />}
                      {uploadStage === 'uploading' && <Upload className="h-5 w-5 flex-shrink-0 animate-pulse text-xtube-red" />}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Video Player Preview */}
              <AnimatePresence>
                {uploadStage === 'success' && previewVideoUrl && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-xl border border-white/5 bg-black">
                    <div className="relative aspect-video">
                      <video ref={videoRef} src={previewVideoUrl} className="h-full w-full object-cover"
                        onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)}
                        onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleVideoLoaded}
                        onClick={handlePlayPause} muted={isMuted} />
                      {!isPlaying && (
                        <button onClick={handlePlayPause} className="absolute inset-0 flex items-center justify-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
                            <Play className="h-5 w-5 text-white ml-0.5" fill="white" />
                          </div>
                        </button>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2.5 pt-6">
                        <div onClick={handleProgressBarClick} className="group relative mb-2 h-1 cursor-pointer rounded-full bg-white/20">
                          <div className="absolute h-full rounded-full bg-xtube-red" style={{ width: `${videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0}%` }} />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button onClick={handlePlayPause} className="text-white/70 hover:text-white">
                              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </button>
                            <button onClick={() => setIsMuted(!isMuted)} className="text-white/70 hover:text-white">
                              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                            </button>
                            <span className="text-xs text-white/50">{formatTime(currentTime)} / {formatTime(videoDuration)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="text-white/70 hover:text-white"><Settings className="h-4 w-4" /></button>
                            <button className="text-white/70 hover:text-white"><Maximize className="h-4 w-4" /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Upload Area */}
              <AnimatePresence>
                {uploadStage === 'idle' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                    onClick={handleBrowseClick}
                    className={`flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-all ${isDragOver ? 'border-xtube-red bg-xtube-red/5' : 'border-white/10 bg-[#111]/60 hover:border-white/20'}`}
                  >
                    <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileSelect} />
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-xtube-red/10">
                      <CloudUpload className="h-5 w-5 text-xtube-red" />
                    </div>
                    <p className="text-sm font-medium text-white">Drag & drop your video here</p>
                    <p className="text-xs text-white/40">or <span className="text-xtube-red underline">browse files</span></p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* OR Divider */}
              {uploadStage === 'idle' && (
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-xs text-white/30">OR</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
              )}

              {/* Paste URL */}
              {uploadStage === 'idle' && (
                <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#111]/60 py-2.5 text-sm text-white/60 hover:border-white/20 hover:text-white">
                  <Link className="h-4 w-4" /> Paste video URL
                </button>
              )}

              {/* Thumbnails */}
              <AnimatePresence>
                {uploadStage === 'success' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-white/70">Thumbnails (10 auto-generated)</span>
                      <button onClick={() => thumbnailInputRef.current?.click()} className="text-xs text-xtube-red hover:text-xtube-red-hover">Upload Manually</button>
                      <input ref={thumbnailInputRef} type="file" accept="image/*" className="hidden" onChange={handleManualThumbnailSelect} />
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {localThumbnailUrls.map((url, i) => (
                        <button key={i} onClick={() => setSelectedThumbnail(i)}
                          className={`relative aspect-video overflow-hidden rounded-lg border-2 transition-all ${selectedThumbnail === i ? 'border-xtube-red shadow-[0_0_10px_rgba(229,9,20,0.3)]' : 'border-transparent hover:border-white/20'}`}
                        >
                          <img src={url} alt={`Frame ${i + 1}`} className="h-full w-full object-cover" />
                          {selectedThumbnail === i && (
                            <div className="absolute inset-0 flex items-center justify-center bg-xtube-red/20">
                              <CheckCircle2 className="h-5 w-5 text-xtube-red" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    <div className="mt-2 flex items-start gap-1.5">
                      <AlertCircle className="mt-0.5 h-3 w-3 text-white/25" />
                      <p className="text-[11px] text-white/30">10 frames auto-generated from video. Select preferred thumbnail.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Upload Progress */}
              <AnimatePresence>
                {(uploadStage === 'uploading' || uploadStage === 'processing') && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-white/5 bg-[#111] p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">{uploadStage === 'processing' ? 'Processing...' : 'Uploading...'}</span>
                      <span className="text-sm font-bold text-xtube-red">{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="relative mb-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${uploadProgress}%` }} className="absolute h-full rounded-full bg-xtube-red" />
                    </div>
                    {uploadStage === 'uploading' && (
                      <div className="grid grid-cols-3 gap-3">
                        <div><p className="text-[10px] text-white/30">Uploaded</p><p className="text-xs font-semibold text-white">{uploadedSize}</p></div>
                        <div><p className="text-[10px] text-white/30">Speed</p><p className="text-xs font-semibold text-white">{uploadSpeed}</p></div>
                        <div><p className="text-[10px] text-white/30">Time Left</p><p className="text-xs font-semibold text-white">{uploadRemaining}</p></div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* RIGHT COLUMN - Video Details */}
            <div className="space-y-4">
              {/* Section 2 Header */}
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-xtube-red">2.</span>
                <h2 className="text-base font-bold text-white">Video Details</h2>
                <Pencil className="h-4 w-4 text-xtube-red" />
              </div>

              {/* Form Card */}
              <div className="overflow-hidden rounded-xl border border-white/5 bg-[#111]">
                <div className="space-y-4 p-4">
                  {/* Title */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-white">Title <span className="text-xtube-red">*</span></label>
                      <span className="text-xs text-white/30">{title.length}/100</span>
                    </div>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                      placeholder="Enter video title"
                      className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-xtube-red/40 focus:ring-1 focus:ring-xtube-red/20" />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-white">Description</label>
                      <span className="text-xs text-white/30">{description.length}/500</span>
                    </div>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                      placeholder="Describe your video..." rows={3}
                      className="w-full resize-none rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-xtube-red/40 focus:ring-1 focus:ring-xtube-red/20" />
                  </div>

                  {/* Category + Quality */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">Category</label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="w-full rounded-lg border-white/10 bg-[#0a0a0a] text-sm text-white/70">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-[#111]">
                          {categoryOptions.map((c) => <SelectItem key={c} value={c} className="text-white">{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">Quality</label>
                      <Select value={quality} onValueChange={setQuality}>
                        <SelectTrigger className="w-full rounded-lg border-white/10 bg-[#0a0a0a] text-sm text-white/70">
                          <SelectValue placeholder="Select quality" />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-[#111]">
                          {qualityOptions.map((q) => <SelectItem key={q.value} value={q.value} className="text-white">{q.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Duration</label>
                    <div className="relative">
                      <input type="text" value={duration} onChange={(e) => setDuration(e.target.value)}
                        placeholder="Auto-generated" readOnly={!!fileInfo}
                        className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2.5 pr-10 text-sm text-white placeholder:text-white/25 outline-none disabled:opacity-70 focus:border-xtube-red/40 focus:ring-1 focus:ring-xtube-red/20" />
                      <Clock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
                    </div>
                  </div>

                  {/* Checkboxes */}
                  <div className="flex items-center gap-6 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={isFeatured} onCheckedChange={(v) => setIsFeatured(v as boolean)} className="border-white/20 data-[state=checked]:bg-xtube-red" />
                      <span className="text-sm text-white/70">Featured</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={isTrending} onCheckedChange={(v) => setIsTrending(v as boolean)} className="border-white/20 data-[state=checked]:bg-xtube-red" />
                      <span className="text-sm text-white/70">Trending</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={isLive} onCheckedChange={(v) => setIsLive(v as boolean)} className="border-white/20 data-[state=checked]:bg-xtube-red" />
                      <span className="text-sm text-white/70">Live</span>
                    </label>
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center gap-3 pt-2">
                    <button onClick={handleClearForm}
                      className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/60 hover:border-white/20 hover:text-white">
                      <RefreshCw className="h-4 w-4" /> Clear
                    </button>
                    <button onClick={handlePublishVideo} disabled={isPublishing || !title.trim() || !category}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-xtube-red px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_15px_rgba(229,9,20,0.3)] hover:bg-xtube-red-hover disabled:opacity-50">
                      {isPublishing ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : publishSuccess ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      {isPublishing ? 'Publishing...' : publishSuccess ? 'Published!' : 'Upload Video'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Legal Notice */}
              <div className="overflow-hidden rounded-xl border border-white/5 bg-[#111]/50">
                <div className="flex items-start gap-3 p-3">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-xtube-red/10">
                    <Shield className="h-3.5 w-3.5 text-xtube-red" />
                  </div>
                  <p className="text-[11px] leading-relaxed text-white/35">
                    By uploading, you confirm you own the rights to this content and agree to our{' '}
                    <span className="text-xtube-red">Terms of Service</span> and{' '}
                    <span className="text-xtube-red">Community Guidelines</span>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
