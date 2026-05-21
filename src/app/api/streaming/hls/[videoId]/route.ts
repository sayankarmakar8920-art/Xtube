import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import {
  generateMasterManifest,
  generateMediaPlaylist,
  generatePseudoHlsManifest,
  resolveAvailableQualities,
  parseQualityLevels,
  type QualityName,
} from '@/lib/streaming/hls-engine'

// ─── GET /api/streaming/hls/[videoId] ────────────────────────────────────────
// Serves HLS manifest and segment files based on query parameters:
//   ?type=master                       → Master .m3u8 manifest
//   ?type=playlist&quality=1080p       → Quality-specific media playlist
//   ?type=segment&quality=1080p&index=0 → Proxy video segment

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'master'
    const quality = (searchParams.get('quality') || '1080p') as QualityName

    // Fetch the video from database
    const video = await db.video.findUnique({
      where: { id: videoId },
    })

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found', code: 'VIDEO_NOT_FOUND' },
        { status: 404 }
      )
    }

    if (!video.isPublished) {
      return NextResponse.json(
        { error: 'Video is not published', code: 'VIDEO_UNPUBLISHED' },
        { status: 403 }
      )
    }

    // ─── Master manifest ──────────────────────────────────────────────────
    if (type === 'master') {
      // If the video has a real HLS URL, redirect to it
      if (video.hlsUrl) {
        // Generate a master manifest referencing our playlist endpoint
        const qualities = resolveAvailableQualities(video.resolution, video.qualityLevels)
        const manifest = generateMasterManifest(qualities)

        return new NextResponse(manifest, {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.apple.mpegurl',
            'Cache-Control': 'public, max-age=60',
            'Access-Control-Allow-Origin': '*',
          },
        })
      }

      // Pseudo-HLS: generate a master manifest that wraps the raw MP4
      const qualities = resolveAvailableQualities(video.resolution, video.qualityLevels)
      const manifest = generateMasterManifest(qualities)

      return new NextResponse(manifest, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Cache-Control': 'public, max-age=60',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    // ─── Media playlist ───────────────────────────────────────────────────
    if (type === 'playlist') {
      const duration = video.durationSeconds || 300

      if (video.hlsUrl) {
        // For real HLS, we would redirect or proxy to the actual playlist.
        // Since we're generating manifests ourselves, create a playlist
        // that references our segment endpoint.
        const qualities = resolveAvailableQualities(video.resolution, video.qualityLevels)
        const validQuality = qualities.includes(quality) ? quality : qualities[0]

        // For pseudo-HLS with raw MP4, we create a single-segment playlist
        const segmentDuration = duration
        const playlist = generateMediaPlaylist(validQuality, 1, segmentDuration)

        return new NextResponse(playlist, {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.apple.mpegurl',
            'Cache-Control': 'public, max-age=30',
            'Access-Control-Allow-Origin': '*',
          },
        })
      }

      // Pseudo-HLS: single segment covering the entire video
      const qualities = resolveAvailableQualities(video.resolution, video.qualityLevels)
      const validQuality = qualities.includes(quality) ? quality : qualities[0]

      const playlistLines = [
        '#EXTM3U',
        '#EXT-X-VERSION:6',
        `#EXT-X-TARGETDURATION:${Math.max(Math.ceil(duration), 1)}`,
        '#EXT-X-MEDIA-SEQUENCE:0',
        '#EXT-X-PLAYLIST-TYPE:VOD',
        `#EXTINF:${duration.toFixed(3)},`,
        video.videoUrl,
        '#EXT-X-ENDLIST',
      ]

      return new NextResponse(playlistLines.join('\n') + '\n', {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Cache-Control': 'public, max-age=30',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    // ─── Segment proxy ────────────────────────────────────────────────────
    if (type === 'segment') {
      const index = parseInt(searchParams.get('index') || '0', 10)

      // For pseudo-HLS, the "segment" is just the raw MP4 file
      if (!video.hlsUrl && index === 0) {
        // Redirect to the raw video URL
        return NextResponse.redirect(video.videoUrl)
      }

      // For real HLS with segments, we would proxy the actual segment.
      // Since we don't have real segments, return an error for index > 0
      // when there's no HLS URL.
      if (!video.hlsUrl) {
        return NextResponse.json(
          { error: 'Segment not available for pseudo-HLS', code: 'SEGMENT_UNAVAILABLE' },
          { status: 404 }
        )
      }

      // For real HLS, proxy the segment from the CDN/storage
      try {
        const segmentUrl = `${video.hlsUrl}/${quality}/segment_${index}.ts`
        const segmentResponse = await fetch(segmentUrl)

        if (!segmentResponse.ok) {
          return NextResponse.json(
            { error: 'Failed to fetch segment', code: 'SEGMENT_FETCH_FAILED' },
            { status: 502 }
          )
        }

        const segmentData = await segmentResponse.arrayBuffer()
        return new NextResponse(segmentData, {
          status: 200,
          headers: {
            'Content-Type': 'video/mp2t',
            'Cache-Control': 'public, max-age=86400',
            'Access-Control-Allow-Origin': '*',
          },
        })
      } catch {
        return NextResponse.json(
          { error: 'Failed to proxy segment', code: 'SEGMENT_PROXY_ERROR' },
          { status: 502 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Invalid type parameter. Use: master, playlist, or segment', code: 'INVALID_TYPE' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[HLS API Error]', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
