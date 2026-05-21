import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const active = searchParams.get('active')

    const where: Record<string, unknown> = {}
    if (active === 'true') where.isActive = true
    if (active === 'false') where.isActive = false

    const items = await db.liveTV.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Error fetching live TV entries:', error)
    return NextResponse.json({ error: 'Failed to fetch live TV entries' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, streamUrl, thumbnailUrl, category, isLive, viewers } = body

    if (!title || !streamUrl) {
      return NextResponse.json(
        { error: 'Title and streamUrl are required' },
        { status: 400 }
      )
    }

    const item = await db.liveTV.create({
      data: {
        title,
        description: description || null,
        streamUrl,
        thumbnailUrl: thumbnailUrl || null,
        category: category || 'general',
        isLive: isLive ?? false,
        viewers: viewers ?? 0,
      },
    })

    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error('Error creating live TV entry:', error)
    return NextResponse.json({ error: 'Failed to create live TV entry' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const existing = await db.liveTV.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Live TV entry not found' }, { status: 404 })
    }

    const item = await db.liveTV.update({
      where: { id },
      data,
    })

    return NextResponse.json({ item })
  } catch (error) {
    console.error('Error updating live TV entry:', error)
    return NextResponse.json({ error: 'Failed to update live TV entry' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const existing = await db.liveTV.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Live TV entry not found' }, { status: 404 })
    }

    await db.liveTV.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting live TV entry:', error)
    return NextResponse.json({ error: 'Failed to delete live TV entry' }, { status: 500 })
  }
}
