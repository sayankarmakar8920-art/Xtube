import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get('videoId')
    const userId = searchParams.get('userId') || 'default'

    if (!videoId) {
      return NextResponse.json({ error: 'videoId is required' }, { status: 400 })
    }

    const progress = await db.watchProgress.findUnique({
      where: { userId_videoId: { userId, videoId } },
    })

    if (!progress) {
      return NextResponse.json({ position: 0, duration: 0, percentage: 0 })
    }

    return NextResponse.json({
      position: progress.position,
      duration: progress.duration,
      percentage: progress.percentage,
      lastWatchedAt: progress.lastWatchedAt.toISOString(),
    })
  } catch (error) {
    console.error('Error fetching watch progress:', error)
    return NextResponse.json({ error: 'Failed to fetch watch progress' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { videoId, userId = 'default', position, duration } = body

    if (!videoId || position === undefined || duration === undefined) {
      return NextResponse.json({ error: 'videoId, position, and duration are required' }, { status: 400 })
    }

    const percentage = duration > 0 ? (position / duration) * 100 : 0

    const progress = await db.watchProgress.upsert({
      where: { userId_videoId: { userId, videoId } },
      update: {
        position,
        duration,
        percentage,
        lastWatchedAt: new Date(),
      },
      create: {
        userId,
        videoId,
        position,
        duration,
        percentage,
        lastWatchedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      position: progress.position,
      duration: progress.duration,
      percentage: progress.percentage,
    })
  } catch (error) {
    console.error('Error saving watch progress:', error)
    return NextResponse.json({ error: 'Failed to save watch progress' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get('videoId')
    const userId = searchParams.get('userId') || 'default'

    if (!videoId) {
      return NextResponse.json({ error: 'videoId is required' }, { status: 400 })
    }

    await db.watchProgress.deleteMany({
      where: { userId, videoId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting watch progress:', error)
    return NextResponse.json({ error: 'Failed to delete watch progress' }, { status: 500 })
  }
}
