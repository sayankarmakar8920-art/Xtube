import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get('videoId')

    if (!videoId) {
      return NextResponse.json({ error: 'videoId is required' }, { status: 400 })
    }

    // Fetch the video to get midrollTimings
    const video = await db.video.findUnique({
      where: { id: videoId },
      select: { midrollTimings: true },
    })

    let midrollTimings: number[] = []
    if (video?.midrollTimings) {
      try {
        midrollTimings = JSON.parse(video.midrollTimings)
      } catch {
        midrollTimings = []
      }
    }

    // Fetch all VideoAd records for this video, including the Ad details
    const videoAds = await db.videoAd.findMany({
      where: { videoId },
      include: { ad: true },
    })

    // Filter only active ads
    const activeVideoAds = videoAds.filter((va) => va.ad.isActive)

    // Categorize ads by position
    const preRoll: Array<{
      id: string
      type: string
      mediaUrl: string | null
      mediaFormat: string
      adDuration: number
      skipAfter: number
      title: string
    }> = []

    const midRoll: Array<{
      id: string
      timing: number
      type: string
      mediaUrl: string | null
      mediaFormat: string
      adDuration: number
      skipAfter: number
      title: string
    }> = []

    const postRoll: Array<{
      id: string
      type: string
      mediaUrl: string | null
      mediaFormat: string
      adDuration: number
      skipAfter: number
      title: string
    }> = []

    const overlay: Array<{
      id: string
      timing: number
      type: string
      mediaUrl: string | null
      mediaFormat: string
      duration: number
      title: string
    }> = []

    for (const va of activeVideoAds) {
      const ad = va.ad
      switch (va.position) {
        case 'pre-roll':
          preRoll.push({
            id: ad.id,
            type: ad.type,
            mediaUrl: ad.mediaUrl,
            mediaFormat: ad.mediaFormat,
            adDuration: ad.adDuration,
            skipAfter: ad.skipAfter,
            title: ad.title,
          })
          break
        case 'mid-roll':
          midRoll.push({
            id: ad.id,
            timing: va.timing,
            type: ad.type,
            mediaUrl: ad.mediaUrl,
            mediaFormat: ad.mediaFormat,
            adDuration: ad.adDuration,
            skipAfter: ad.skipAfter,
            title: ad.title,
          })
          break
        case 'post-roll':
          postRoll.push({
            id: ad.id,
            type: ad.type,
            mediaUrl: ad.mediaUrl,
            mediaFormat: ad.mediaFormat,
            adDuration: ad.adDuration,
            skipAfter: ad.skipAfter,
            title: ad.title,
          })
          break
        case 'overlay':
          overlay.push({
            id: ad.id,
            timing: va.timing,
            type: ad.type,
            mediaUrl: ad.mediaUrl,
            mediaFormat: ad.mediaFormat,
            duration: ad.adDuration,
            title: ad.title,
          })
          break
      }
    }

    return NextResponse.json({
      videoId,
      ads: {
        preRoll,
        midRoll,
        postRoll,
        overlay,
      },
      midrollTimings,
    })
  } catch (error) {
    console.error('Error fetching video ads:', error)
    return NextResponse.json({ error: 'Failed to fetch video ads' }, { status: 500 })
  }
}
