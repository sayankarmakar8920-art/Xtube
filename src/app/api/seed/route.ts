import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// This endpoint ONLY creates essential system users (no demo data)
// Videos, Ads, Categories should be added via Admin Panel only
export async function POST() {
  try {
    // Seed admin user only (essential for admin panel login)
    await db.user.upsert({
      where: { id: 'admin-user' },
      update: {},
      create: {
        id: 'admin-user',
        username: 'Admin',
        email: 'admin@xtube.com',
        role: 'admin',
      },
    })

    // Seed default guest user
    await db.user.upsert({
      where: { id: 'default-user' },
      update: {},
      create: {
        id: 'default-user',
        username: 'Guest',
        email: 'guest@xtube.com',
      },
    })

    return NextResponse.json({ 
      success: true, 
      message: 'System users initialized. Add videos, ads, and categories via Admin Panel.' 
    })
  } catch (error) {
    console.error('Error initializing system:', error)
    return NextResponse.json({ error: 'Failed to initialize system' }, { status: 500 })
  }
}
