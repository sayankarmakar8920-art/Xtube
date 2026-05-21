import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get('videoId')

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID required' }, { status: 400 })
    }

    const comments = await db.comment.findMany({
      where: { videoId, parentId: null },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
        replies: {
          include: {
            user: { select: { id: true, username: true, avatar: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, videoId, parentId } = body

    if (!content || !videoId) {
      return NextResponse.json({ error: 'Content and video ID required' }, { status: 400 })
    }

    // Ensure default user exists
    let user = await db.user.findUnique({ where: { id: 'default-user' } })
    if (!user) {
      user = await db.user.create({
        data: {
          id: 'default-user',
          username: 'Guest',
          email: 'guest@xtube.com',
        },
      })
    }

    const comment = await db.comment.create({
      data: {
        content,
        videoId,
        userId: 'default-user',
        parentId: parentId || null,
      },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
      },
    })

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }
}
