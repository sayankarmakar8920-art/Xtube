import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { adId, videoId, event } = body

    if (!adId || !videoId || !event) {
      return NextResponse.json({ error: 'adId, videoId, and event are required' }, { status: 400 })
    }

    if (!['impression', 'click', 'skip', 'complete'].includes(event)) {
      return NextResponse.json({ error: 'Invalid event type. Must be: impression, click, skip, or complete' }, { status: 400 })
    }

    // Update the Ad counters based on the event type
    if (event === 'impression') {
      await db.ad.update({
        where: { id: adId },
        data: { impressions: { increment: 1 } },
      })
    } else if (event === 'click') {
      await db.ad.update({
        where: { id: adId },
        data: { clicks: { increment: 1 } },
      })
    }
    // 'skip' and 'complete' events are tracked for analytics but don't increment counters

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error recording ad impression:', error)
    return NextResponse.json({ error: 'Failed to record ad impression' }, { status: 500 })
  }
}
