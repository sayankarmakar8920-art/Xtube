import { NextRequest, NextResponse } from 'next/server'
import { generateStorageKey, getProvider, isR2Configured } from '@/lib/storage/r2-client'
import { mkdirSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const PUBLIC_DIR = join(process.cwd(), 'public')

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const category = (formData.get('category') as string) || 'video'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const key = generateStorageKey(file.name, category as any)
    const buffer = Buffer.from(await file.arrayBuffer())

    if (isR2Configured()) {
      // Upload to R2
      const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
      const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
      const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
      const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'xtube-media'
      const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || ''

      const R2_BASE_URL = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
      const host = `${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`

      // Simple PUT to R2
      const url = `${R2_BASE_URL}/${R2_BUCKET_NAME}/${key}`
      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
        body: buffer,
      })

      if (!res.ok) {
        throw new Error(`R2 upload failed: ${res.status}`)
      }

      const publicUrl = R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${key}` : key
      return NextResponse.json({ key, url: publicUrl, provider: 'r2', size: buffer.length })
    } else {
      // Local fallback
      const fullPath = join(PUBLIC_DIR, key)
      const dir = join(PUBLIC_DIR, key.split('/').slice(0, -1).join('/'))
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
      writeFileSync(fullPath, buffer)
      return NextResponse.json({ key, url: `/${key}`, provider: 'local', size: buffer.length })
    }
  } catch (error) {
    console.error('[Upload Error]', error)
    return NextResponse.json({ error: 'Upload failed', details: String(error) }, { status: 500 })
  }
}
