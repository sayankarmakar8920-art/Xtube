'use client'

export interface VideoMetadata {
  duration: number
  width: number
  height: number
  isHd: boolean
  resolution: string
  thumbnailBlob: Blob
  thumbnails: Blob[]
}

function getResolutionLabel(width: number, height: number): string {
  const minDim = Math.min(width, height)
  if (minDim >= 2160) return '4K'
  if (minDim >= 1440) return '1440p'
  if (minDim >= 1080) return '1080p'
  if (minDim >= 720) return '720p'
  if (minDim >= 480) return '480p'
  return '360p'
}

function captureFrame(video: HTMLVideoElement, time: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(null), 5000)
    video.currentTime = time
    video.onseeked = () => {
      clearTimeout(timeout)
      try {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth || 640
        canvas.height = video.videoHeight || 360
        const ctx = canvas.getContext('2d')
        if (!ctx) { resolve(null); return }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob)
            else resolve(null)
          },
          'image/jpeg',
          0.85
        )
      } catch {
        resolve(null)
      }
    }
    video.onerror = () => {
      clearTimeout(timeout)
      resolve(null)
    }
  })
}

function createFallbackThumbnail(): Blob {
  const canvas = document.createElement('canvas')
  canvas.width = 640
  canvas.height = 360
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createLinearGradient(0, 0, 640, 360)
  gradient.addColorStop(0, '#1a1a2e')
  gradient.addColorStop(0.5, '#16213e')
  gradient.addColorStop(1, '#0f3460')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 640, 360)
  ctx.fillStyle = '#e94560'
  ctx.font = 'bold 48px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('▶', 320, 180)
  return new Blob([canvas.toDataURL('image/jpeg', 0.85)], { type: 'image/jpeg' })
}

export async function extractVideoMetadataAndThumbnail(file: File): Promise<VideoMetadata> {
  if (!file.type.startsWith('video/')) {
    throw new Error('Selected file is not a valid video.')
  }

  const video = document.createElement('video')
  video.preload = 'auto'
  video.muted = true
  video.playsInline = true

  const objectUrl = URL.createObjectURL(file)
  video.src = objectUrl

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Video load timeout')), 30000)
    video.onloadedmetadata = () => { clearTimeout(timeout); resolve() }
    video.onerror = () => { clearTimeout(timeout); reject(new Error('Failed to load video')) }
  })

  const duration = video.duration || 0
  const width = video.videoWidth || 0
  const height = video.videoHeight || 0
  const isHd = width >= 1280 || height >= 720
  const resolution = getResolutionLabel(width, height)

  const thumbnailCount = 10
  const thumbnails: Blob[] = []
  const interval = duration > 1 ? duration / (thumbnailCount + 1) : 0

  for (let i = 0; i < thumbnailCount; i++) {
    const time = interval > 0 ? interval * (i + 1) : 0.5
    try {
      const blob = await captureFrame(video, Math.min(time, Math.max(duration - 0.1, 0.1)))
      if (blob) {
        thumbnails.push(blob)
      }
    } catch {
      // skip
    }
  }

  video.pause()
  video.src = ''
  URL.revokeObjectURL(objectUrl)

  if (thumbnails.length === 0) {
    const fallback = createFallbackThumbnail()
    for (let i = 0; i < thumbnailCount; i++) {
      thumbnails.push(fallback)
    }
  }

  return {
    duration,
    width,
    height,
    isHd,
    resolution,
    thumbnailBlob: thumbnails[0],
    thumbnails,
  }
}
