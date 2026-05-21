import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'xtube2'
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://pub-f96bd5bb73054d3190f40306ec333ab5.r2.dev'

const s3Client = R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY
  ? new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
      maxAttempts: 3,
    })
  : null

const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska', 'application/vnd.apple.mpegurl', 'application/x-mpegURL', 'audio/mpegurl']
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
const MAX_VIDEO_SIZE = 5 * 1024 * 1024 * 1024 // 5GB
const MAX_IMAGE_SIZE = 50 * 1024 * 1024 // 50MB

function getCategoryPath(category: string): string {
  const map: Record<string, string> = {
    video: 'videos',
    thumbnail: 'thumbnails',
    ad: 'ads',
    banner: 'banners',
    hero: 'hero',
    footer: 'footer',
    image: 'images',
    poster: 'posters',
    trailer: 'trailers',
  }
  return map[category] || 'uploads'
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const category = (formData.get('category') as string) || 'video'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const maxSize = ALLOWED_VIDEO_TYPES.includes(file.type) ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE
    if (file.size > maxSize) {
      return NextResponse.json({ error: `File too large. Max: ${maxSize / (1024 * 1024)}MB` }, { status: 413 })
    }

    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 10)
    const ext = file.name.split('.').pop() || 'bin'
    const categoryPath = getCategoryPath(category)
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const key = `${categoryPath}/${year}/${month}/${randomId}-${timestamp}.${ext}`

    if (s3Client) {
      const chunks: Uint8Array[] = []
      const reader = file.stream().getReader()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
      }
      const buffer = Buffer.concat(chunks.map(c => Buffer.from(c)))

      await s3Client.send(new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: file.type || 'application/octet-stream',
        CacheControl: 'public, max-age=31536000, immutable',
      }))

      const publicUrl = `${R2_PUBLIC_URL}/${key}`
      console.log(`[Upload] R2 success: ${key} (${(file.size / 1024 / 1024).toFixed(1)}MB)`)
      return NextResponse.json({ key, url: publicUrl, provider: 'r2', size: file.size })
    } else {
      const { mkdirSync, writeFileSync, existsSync } = await import('fs')
      const { join } = await import('path')
      const PUBLIC_DIR = join(process.cwd(), 'public')
      const fullPath = join(PUBLIC_DIR, key)
      const dir = join(PUBLIC_DIR, key.split('/').slice(0, -1).join('/'))
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

      const chunks: Uint8Array[] = []
      const reader = file.stream().getReader()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
      }
      writeFileSync(fullPath, Buffer.concat(chunks.map(c => Buffer.from(c))))
      return NextResponse.json({ key, url: `/${key}`, provider: 'local', size: file.size })
    }
  } catch (error) {
    console.error('[Upload Error]', error)
    return NextResponse.json({ error: 'Upload failed', details: String(error) }, { status: 500 })
  }
}
