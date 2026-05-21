import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const position = searchParams.get('position')
    const type = searchParams.get('type')
    const admin = searchParams.get('admin')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    // Admin mode: return all ads with pagination & filters (no isActive filter, no impression increment)
    if (admin === 'true') {
      const where: Record<string, unknown> = {}
      if (position) where.position = position
      if (type) where.type = type
      if (status === 'active') where.isActive = true
      else if (status === 'paused') where.isActive = false
      if (search) {
        where.title = { contains: search }
      }

      const [ads, total] = await Promise.all([
        db.ad.findMany({
          where,
          include: { videoAds: true },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.ad.count({ where }),
      ])

      return NextResponse.json({
        ads,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }, {
        headers: { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30' },
      })
    }

    // Public mode: only active ads within date range, increment impressions
    const where: Record<string, unknown> = { isActive: true }
    if (position) where.position = position
    if (type) where.type = type

    const now = new Date()
    const ads = await db.ad.findMany({
      where: {
        ...where,
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: now }, endDate: { gte: now } },
          { startDate: null, endDate: { gte: now } },
          { startDate: { lte: now }, endDate: null },
        ],
      },
    })

    // Impression tracking moved to dedicated endpoint (see /api/video-ads/impression)
    // No longer incrementing on every GET to improve performance

    return NextResponse.json({ ads }, {
      headers: { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30' },
    })
  } catch (error) {
    console.error('Error fetching ads:', error)
    return NextResponse.json({ error: 'Failed to fetch ads' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      type,
      position,
      title,
      imageUrl,
      linkUrl,
      isActive,
      startDate,
      endDate,
      frequency,
      mediaUrl,
      mediaFormat,
      adDuration,
      skipAfter,
      quality,
    } = body

    const ad = await db.ad.create({
      data: {
        type,
        position,
        title,
        imageUrl: imageUrl || '',
        linkUrl: linkUrl || null,
        isActive: isActive !== undefined ? isActive : true,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        frequency: frequency || 1,
        mediaUrl: mediaUrl || null,
        mediaFormat: mediaFormat || 'jpg',
        adDuration: adDuration || 0,
        skipAfter: skipAfter || 5,
        quality: quality || '720p',
      },
    })

    return NextResponse.json({ ad }, { status: 201 })
  } catch (error) {
    console.error('Error creating ad:', error)
    return NextResponse.json({ error: 'Failed to create ad' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Handle date fields
    const updateData: Record<string, unknown> = {}

    // Handle increment operations
    if (data.incrementImpressions) {
      updateData.impressions = { increment: 1 }
    }
    if (data.incrementClicks) {
      updateData.clicks = { increment: 1 }
    }

    // Handle regular field updates (skip increment flags)
    const skipKeys = ['incrementImpressions', 'incrementClicks']
    for (const [key, val] of Object.entries(data)) {
      if (skipKeys.includes(key)) continue
      if (key === 'startDate') {
        updateData.startDate = val ? new Date(val as string) : null
      } else if (key === 'endDate') {
        updateData.endDate = val ? new Date(val as string) : null
      } else {
        updateData[key] = val
      }
    }

    const ad = await db.ad.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ ad })
  } catch (error) {
    console.error('Error updating ad:', error)
    return NextResponse.json({ error: 'Failed to update ad' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    await db.ad.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting ad:', error)
    return NextResponse.json({ error: 'Failed to delete ad' }, { status: 500 })
  }
}
