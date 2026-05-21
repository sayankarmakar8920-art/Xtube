import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import {
  QUALITY_LADDER,
  resolveAvailableQualities,
  calculateOptimalQuality,
  assessBufferHealth,
  type QualityName,
} from '@/lib/streaming/hls-engine'

// ─── GET /api/streaming/quality ──────────────────────────────────────────────
// Returns available quality levels for a video
// Query: ?videoId=xxx

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get('videoId')

    if (!videoId) {
      return NextResponse.json(
        { error: 'videoId is required', code: 'MISSING_VIDEO_ID' },
        { status: 400 }
      )
    }

    const video = await db.video.findUnique({
      where: { id: videoId },
      select: {
        id: true,
        title: true,
        resolution: true,
        qualityLevels: true,
        codec: true,
        audioCodec: true,
        bitrate: true,
        durationSeconds: true,
        hlsUrl: true,
      },
    })

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found', code: 'VIDEO_NOT_FOUND' },
        { status: 404 }
      )
    }

    const availableQualities = resolveAvailableQualities(
      video.resolution,
      video.qualityLevels
    )

    // Build detailed quality info with URLs
    const qualityDetails = availableQualities.map((qName) => {
      const cfg = QUALITY_LADDER.find((q) => q.name === qName)
      return {
        name: qName,
        width: cfg?.width ?? 0,
        height: cfg?.height ?? 0,
        bitrate: cfg?.bitrate ?? 0,
        codec: video.codec,
        audioCodec: video.audioCodec,
        hlsPlaylistUrl: `/api/streaming/hls/${videoId}?type=playlist&quality=${qName}`,
      }
    })

    return NextResponse.json({
      videoId: video.id,
      title: video.title,
      maxResolution: video.resolution,
      codec: video.codec,
      audioCodec: video.audioCodec,
      averageBitrate: video.bitrate,
      durationSeconds: video.durationSeconds,
      hasHls: !!video.hlsUrl,
      qualities: qualityDetails,
    })
  } catch (error) {
    console.error('[Quality API Error]', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

// ─── POST /api/streaming/quality ─────────────────────────────────────────────
// Reports a quality change event for analytics
// Body: { videoId, from, to, reason, bufferLength, downloadSpeed, droppedFrames, screenResolution }

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      videoId,
      from,
      to,
      reason,
      bufferLength,
      downloadSpeed,
      droppedFrames,
      screenResolution,
    } = body

    if (!videoId || !to) {
      return NextResponse.json(
        { error: 'videoId and to (target quality) are required', code: 'MISSING_FIELDS' },
        { status: 400 }
      )
    }

    // Verify video exists
    const video = await db.video.findUnique({
      where: { id: videoId },
      select: { id: true, resolution: true, qualityLevels: true },
    })

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found', code: 'VIDEO_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Calculate optimal quality recommendation based on reported network conditions
    let recommendedQuality: QualityName | null = null
    let bufferHealth = null

    if (downloadSpeed !== undefined && bufferLength !== undefined && screenResolution) {
      recommendedQuality = calculateOptimalQuality(
        downloadSpeed,
        bufferLength,
        screenResolution,
        droppedFrames ?? 0
      )

      const currentBitrate =
        QUALITY_LADDER.find((q) => q.name === to)?.bitrate ?? 4500

      bufferHealth = assessBufferHealth(
        bufferLength,
        currentBitrate,
        downloadSpeed,
        droppedFrames ?? 0
      )
    }

    // Log the quality change event (could be stored in an analytics table)
    // For now, we just acknowledge it and return the analysis
    const event = {
      videoId,
      fromQuality: from || null,
      toQuality: to,
      reason: reason || 'manual',
      bufferLength: bufferLength ?? null,
      downloadSpeed: downloadSpeed ?? null,
      droppedFrames: droppedFrames ?? 0,
      screenResolution: screenResolution ?? null,
      timestamp: new Date().toISOString(),
    }

    console.log('[Quality Change Event]', JSON.stringify(event))

    return NextResponse.json({
      acknowledged: true,
      event,
      recommendedQuality,
      bufferHealth,
    })
  } catch (error) {
    console.error('[Quality Report API Error]', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
