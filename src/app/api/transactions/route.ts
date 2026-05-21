import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (type) where.type = type

    const items = await db.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type, amount, currency, status, description, metadata } = body

    if (!type || amount === undefined || amount === null) {
      return NextResponse.json(
        { error: 'Type and amount are required' },
        { status: 400 }
      )
    }

    const item = await db.transaction.create({
      data: {
        userId: userId || null,
        type,
        amount: Number(amount),
        currency: currency || 'USD',
        status: status || 'pending',
        description: description || null,
        metadata: metadata
          ? typeof metadata === 'string'
            ? metadata
            : JSON.stringify(metadata)
          : null,
      },
    })

    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    const existing = await db.transaction.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    const item = await db.transaction.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json({ item })
  } catch (error) {
    console.error('Error updating transaction:', error)
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
  }
}
