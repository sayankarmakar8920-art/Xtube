import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/hero-ads/[id]
export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    const heroAd = await db.heroAd.findUnique({
      where: { id },
    })

    if (!heroAd) {
      return NextResponse.json(
        { error: 'Hero ad not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ heroAd })
  } catch (error) {
    console.error('Error fetching hero ad:', error)
    return NextResponse.json(
      { error: 'Failed to fetch hero ad' },
      { status: 500 }
    )
  }
}

// PUT /api/hero-ads/[id]
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const { incrementImpressions, incrementClicks, startDate, endDate, ...rest } = body

    // Verify the hero ad exists
    const existing = await db.heroAd.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Hero ad not found' },
        { status: 404 }
      )
    }

    // Build update data
    const data: Record<string, unknown> = { ...rest }

    // Handle date fields
    if (startDate !== undefined) {
      data.startDate = startDate ? new Date(startDate) : null
    }
    if (endDate !== undefined) {
      data.endDate = endDate ? new Date(endDate) : null
    }

    // Handle impression increment
    if (incrementImpressions === true) {
      data.impressions = { increment: 1 }
    }

    // Handle click increment + CTR recalculation
    if (incrementClicks === true) {
      const newClicks = existing.clicks + 1
      const newImpressions = incrementImpressions === true
        ? existing.impressions + 1
        : existing.impressions
      const newCtr = newImpressions > 0 ? (newClicks / newImpressions) * 100 : 0

      data.clicks = { increment: 1 }
      data.ctr = Math.round(newCtr * 100) / 100
    }

    const heroAd = await db.heroAd.update({
      where: { id },
      data,
    })

    return NextResponse.json({ heroAd })
  } catch (error) {
    console.error('Error updating hero ad:', error)
    return NextResponse.json(
      { error: 'Failed to update hero ad' },
      { status: 500 }
    )
  }
}

// DELETE /api/hero-ads/[id]
export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    const existing = await db.heroAd.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Hero ad not found' },
        { status: 404 }
      )
    }

    await db.heroAd.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting hero ad:', error)
    return NextResponse.json(
      { error: 'Failed to delete hero ad' },
      { status: 500 }
    )
  }
}
