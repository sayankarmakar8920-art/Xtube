import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/hero-ads?active=true
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') === 'true'

    const now = new Date()

    if (activeOnly) {
      // Frontend display: only active ads within valid date range
      const heroAds = await db.heroAd.findMany({
        where: {
          isActive: true,
          OR: [
            { startDate: null, endDate: null },
            { startDate: { lte: now }, endDate: null },
            { startDate: null, endDate: { gte: now } },
            { startDate: { lte: now }, endDate: { gte: now } },
          ],
        },
        orderBy: [
          { displayOrder: 'asc' },
          { createdAt: 'desc' },
        ],
      })

      return NextResponse.json({ heroAds }, {
        headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=240' },
      })
    }

    // Admin panel: fetch all hero ads
    const heroAds = await db.heroAd.findMany({
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json({ heroAds }, {
      headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=240' },
    })
  } catch (error) {
    console.error('Error fetching hero ads:', error)
    return NextResponse.json(
      { error: 'Failed to fetch hero ads' },
      { status: 500 }
    )
  }
}

// POST /api/hero-ads — Create a hero ad
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      category,
      mediaUrl,
      thumbnailUrl,
      adType,
      mediaFormat,
      isActive,
      displayOrder,
      startDate,
      endDate,
    } = body

    if (!title || !mediaUrl) {
      return NextResponse.json(
        { error: 'title and mediaUrl are required' },
        { status: 400 }
      )
    }

    const heroAd = await db.heroAd.create({
      data: {
        title,
        description: description ?? null,
        category: category ?? null,
        mediaUrl,
        thumbnailUrl: thumbnailUrl ?? null,
        adType: adType ?? 'image',
        mediaFormat: mediaFormat ?? 'jpg',
        isActive: isActive ?? true,
        displayOrder: displayOrder ?? 0,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    })

    return NextResponse.json({ heroAd }, { status: 201 })
  } catch (error) {
    console.error('Error creating hero ad:', error)
    return NextResponse.json(
      { error: 'Failed to create hero ad' },
      { status: 500 }
    )
  }
}

// PUT /api/hero-ads — Update a hero ad
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, incrementImpressions, incrementClicks, startDate, endDate, ...rest } = body

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
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
      // First, fetch current values to compute new CTR
      const current = await db.heroAd.findUnique({
        where: { id },
        select: { impressions: true, clicks: true },
      })

      if (!current) {
        return NextResponse.json(
          { error: 'Hero ad not found' },
          { status: 404 }
        )
      }

      const newClicks = current.clicks + 1
      const newImpressions = incrementImpressions === true
        ? current.impressions + 1
        : current.impressions
      const newCtr = newImpressions > 0 ? (newClicks / newImpressions) * 100 : 0

      data.clicks = { increment: 1 }
      data.ctr = Math.round(newCtr * 100) / 100 // round to 2 decimal places
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

// DELETE /api/hero-ads — Delete a hero ad
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
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

// PATCH /api/hero-ads — Reorder hero ads
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { orders }: { orders: { id: string; displayOrder: number }[] } = body

    if (!orders || !Array.isArray(orders)) {
      return NextResponse.json(
        { error: 'orders array is required' },
        { status: 400 }
      )
    }

    // Update display order for each ad in a transaction
    await db.$transaction(
      orders.map(({ id, displayOrder }) =>
        db.heroAd.update({
          where: { id },
          data: { displayOrder },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering hero ads:', error)
    return NextResponse.json(
      { error: 'Failed to reorder hero ads' },
      { status: 500 }
    )
  }
}
