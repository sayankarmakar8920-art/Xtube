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

function captureFrame(video: HTMLVideoElement, time: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    video.currentTime = time
    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth || 640
        canvas.height = video.videoHeight || 360
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('No canvas context'))
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob)
            else reject(new Error('Blob generation failed'))
          },
          'image/jpeg',
          0.85
        )
      } catch (err) {
        reject(err)
      }
    }
    video.onerror = () => reject(new Error('Frame capture error'))
  })
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
    video.onloadedmetadata = () => resolve()
    video.onerror = () => reject(new Error('Failed to load video'))
  })

  const duration = video.duration || 0
  const width = video.videoWidth || 0
  const height = video.videoHeight || 0
  const isHd = width >= 1280 || height >= 720
  const resolution = getResolutionLabel(width, height)

  // Generate 10 thumbnails at different timestamps
  const thumbnailCount = 10
  const thumbnails: Blob[] = []
  const interval = duration > 0 ? duration / (thumbnailCount + 1) : 0

  for (let i = 0; i < thumbnailCount; i++) {
    const time = interval > 0 ? interval * (i + 1) : 0
    try {
      const blob = await captureFrame(video, Math.min(time, duration - 0.1))
      thumbnails.push(blob)
    } catch {
      // If frame capture fails, reuse previous or create empty
      if (thumbnails.length > 0) {
        thumbnails.push(thumbnails[thumbnails.length - 1])
      }
    }
  }

  // Cleanup
  video.pause()
  video.src = ''
  URL.revokeObjectURL(objectUrl)

  if (thumbnails.length === 0) {
    throw new Error('Failed to generate any thumbnails')
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
