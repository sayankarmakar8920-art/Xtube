import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// ─── POST /api/thumbnails/generate ───────────────────────────────────────────
// Generates placeholder thumbnails for a video.
// Since we can't run ffmpeg in the sandbox, this creates placeholder entries
// in the database and updates the video's thumbnailUrls field.

interface ThumbnailGenerateRequest {
  videoId: string
  count?: number      // number of thumbnails to generate (default: 6)
  interval?: number   // interval in seconds between thumbnails (default: auto)
}

export async function POST(request: NextRequest) {
  try {
    const body: ThumbnailGenerateRequest = await request.json()
    const { videoId, count = 6, interval } = body

    if (!videoId) {
      return NextResponse.json(
        { error: 'videoId is required', code: 'MISSING_VIDEO_ID' },
        { status: 400 }
      )
    }

    // Fetch the video
    const video = await db.video.findUnique({
      where: { id: videoId },
      select: {
        id: true,
        title: true,
        durationSeconds: true,
        thumbnailUrls: true,
        videoUrl: true,
        thumbnail: true,
      },
    })

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found', code: 'VIDEO_NOT_FOUND' },
        { status: 404 }
      )
    }

    const duration = video.durationSeconds || 300
    const effectiveCount = Math.min(count, 12) // cap at 12 thumbnails
    const effectiveInterval = interval || Math.floor(duration / (effectiveCount + 1))

    // Generate placeholder thumbnail entries
    // In production, these would be actual frames extracted by ffmpeg
    const thumbnails: {
      index: number
      timeSeconds: number
      url: string
      width: number
      height: number
    }[] = []

    for (let i = 0; i < effectiveCount; i++) {
      const timeSeconds = effectiveInterval * (i + 1)
      if (timeSeconds >= duration) break

      thumbnails.push({
        index: i,
        timeSeconds,
        // Placeholder: use the video's existing thumbnail with a time parameter
        // In production, this would be a real extracted frame URL like:
        // /thumbnails/{videoId}/frame_{i}.webp
        url: `${video.thumbnail}?t=${timeSeconds}&idx=${i}`,
        width: 320,
        height: 180,
      })
    }

    // Also generate a WebVTT preview sprite sheet URL placeholder
    const previewUrl = `/api/streaming/hls/${videoId}?type=preview`

    // Update the video record with generated thumbnail URLs
    const thumbnailUrls = JSON.stringify(thumbnails)
    await db.video.update({
      where: { id: videoId },
      data: {
        thumbnailUrls,
        previewUrl,
      },
    })

    return NextResponse.json({
      success: true,
      videoId,
      generated: thumbnails.length,
      thumbnails,
      previewUrl,
      message: thumbnails.length > 0
        ? 'Placeholder thumbnails generated. In production, ffmpeg would extract real frames.'
        : 'Video too short for thumbnail generation.',
    })
  } catch (error) {
    console.error('[Thumbnail Generate API Error]', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
