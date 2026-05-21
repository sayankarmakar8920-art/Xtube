'use client'

export interface VideoMetadata {
  duration: number
  width: number
  height: number
  isHd: boolean
  resolution: string
  thumbnailBlob: Blob
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

/**
 * Extracts metadata (duration, resolution) and captures a thumbnail frame
 * at 3 seconds (or halfway if the video is shorter) from a Video File.
 */
export function extractVideoMetadataAndThumbnail(file: File): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    // Check if the file is a video
    if (!file.type.startsWith('video/')) {
      return reject(new Error('Selected file is not a valid video.'))
    }

    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true

    const objectUrl = URL.createObjectURL(file)
    video.src = objectUrl

    const cleanUp = () => {
      video.pause()
      video.src = ''
      video.load()
      URL.revokeObjectURL(objectUrl)
    }

    video.onloadedmetadata = () => {
      const duration = video.duration || 0
      const width = video.videoWidth || 0
      const height = video.videoHeight || 0
      const isHd = width >= 1280 || height >= 720
      const resolution = getResolutionLabel(width, height)

      // Seek to 3 seconds or half duration
      const seekTime = Math.min(3, duration / 2)
      video.currentTime = seekTime

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = width || 640
          canvas.height = height || 360

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            cleanUp()
            return reject(new Error('Could not get 2D context for canvas.'))
          }

          // Draw the video frame
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

          // Export canvas to JPEG blob
          canvas.toBlob(
            (blob) => {
              cleanUp()
              if (!blob) {
                return reject(new Error('Failed to generate thumbnail blob.'))
              }
              resolve({
                duration,
                width,
                height,
                isHd,
                resolution,
                thumbnailBlob: blob,
              })
            },
            'image/jpeg',
            0.85
          )
        } catch (err) {
          cleanUp()
          reject(err)
        }
      }

      video.onerror = (e) => {
        cleanUp()
        reject(new Error('Error seeking/decoding video frame.'))
      }
    }

    video.onerror = (e) => {
      cleanUp()
      reject(new Error('Failed to load video metadata.'))
    }
  })
}
