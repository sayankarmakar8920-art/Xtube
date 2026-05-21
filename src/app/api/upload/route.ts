import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'xtube-media'
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || ''

const s3Client = R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY
  ? new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    })
  : null

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const category = (formData.get('category') as string) || 'video'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 10)
    const ext = file.name.split('.').pop() || 'bin'
    const key = `${category}/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${randomId}-${timestamp}.${ext}`

    if (s3Client) {
      // Upload to R2
      await s3Client.send(new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: file.type || 'application/octet-stream',
      }))

      const publicUrl = R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${key}` : key
      return NextResponse.json({ key, url: publicUrl, provider: 'r2', size: buffer.length })
    } else {
      // Local fallback
      const { mkdirSync, writeFileSync, existsSync } = await import('fs')
      const { join } = await import('path')
      const PUBLIC_DIR = join(process.cwd(), 'public')
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
