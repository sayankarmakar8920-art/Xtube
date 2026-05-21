import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// Default categories to seed
const defaultCategories = [
  { name: 'Trending', slug: 'trending', icon: 'flame', order: 1 },
  { name: 'Popular', slug: 'popular', icon: 'sparkles', order: 2 },
  { name: 'New Releases', slug: 'new-releases', icon: 'star', order: 3 },
  { name: 'Gaming', slug: 'gaming', icon: 'gamepad', order: 4 },
  { name: 'Music', slug: 'music', icon: 'music', order: 5 },
  { name: 'Education', slug: 'education', icon: 'graduation', order: 6 },
  { name: 'Fitness', slug: 'fitness', icon: 'dumbbell', order: 7 },
  { name: 'Travel', slug: 'travel', icon: 'plane', order: 8 },
  { name: 'Cooking', slug: 'cooking', icon: 'utensils', order: 9 },
  { name: 'Art & Design', slug: 'art-design', icon: 'palette', order: 10 },
]

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

    // Seed 10 default categories
    for (const cat of defaultCategories) {
      await db.category.upsert({
        where: { slug: cat.slug },
        update: {},
        create: {
          name: cat.name,
          slug: cat.slug,
          icon: cat.icon,
          order: cat.order,
        },
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'System initialized with admin user, guest user, and 10 default categories.' 
    })
  } catch (error) {
    console.error('Error initializing system:', error)
    return NextResponse.json({ error: 'Failed to initialize system' }, { status: 500 })
  }
}
