import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const settings = await db.setting.findMany({
      orderBy: { key: 'asc' },
    })

    // Return as key-value pairs object as well as items array
    const kv: Record<string, string> = {}
    for (const s of settings) {
      kv[s.key] = s.value
    }

    return NextResponse.json({ items: settings, kv })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    // Accept either a single { key, value } or an array of { key, value }
    const entries: { key: string; value: string }[] = Array.isArray(body) ? body : [body]

    if (entries.length === 0) {
      return NextResponse.json({ error: 'No settings provided' }, { status: 400 })
    }

    // Validate each entry
    for (const entry of entries) {
      if (!entry.key || entry.value === undefined || entry.value === null) {
        return NextResponse.json(
          { error: 'Each setting must have a key and value' },
          { status: 400 }
        )
      }
    }

    // Upsert each setting
    const results = await Promise.all(
      entries.map((entry) =>
        db.setting.upsert({
          where: { key: entry.key },
          update: { value: String(entry.value) },
          create: { key: entry.key, value: String(entry.value) },
        })
      )
    )

    return NextResponse.json({
      items: results,
      updated: results.length,
    })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
