import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const level = searchParams.get('level')
    const category = searchParams.get('category')

    const where: Record<string, unknown> = {}
    if (level) where.level = level
    if (category) where.category = category

    const items = await db.systemLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Error fetching system logs:', error)
    return NextResponse.json({ error: 'Failed to fetch system logs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { level, category, message, details, userId, ip, userAgent } = body

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const item = await db.systemLog.create({
      data: {
        level: level || 'info',
        category: category || 'system',
        message,
        details: details
          ? typeof details === 'string'
            ? details
            : JSON.stringify(details)
          : null,
        userId: userId || null,
        ip: ip || null,
        userAgent: userAgent || null,
      },
    })

    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error('Error creating system log:', error)
    return NextResponse.json({ error: 'Failed to create system log' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    await db.systemLog.deleteMany()
    return NextResponse.json({ success: true, message: 'All system logs cleared' })
  } catch (error) {
    console.error('Error clearing system logs:', error)
    return NextResponse.json({ error: 'Failed to clear system logs' }, { status: 500 })
  }
}
