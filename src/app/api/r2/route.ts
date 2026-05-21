import { NextRequest, NextResponse } from 'next/server'
import {
  initMultipartUpload,
  uploadPart,
  completeMultipartUpload,
  getSignedUrl,
  deleteObject,
  generateStorageKey,
  getUploadSession,
  getProvider,
  type FileCategory,
} from '@/lib/storage/r2-client'
import { mkdirSync, existsSync, writeFileSync, readFileSync, rmSync, readdirSync } from 'fs'
import { join } from 'path'

// ─── Local upload parts directory ────────────────────────────────────────────

const PARTS_DIR = join(process.cwd(), 'upload', 'r2-parts')

function ensurePartsDir() {
  if (!existsSync(PARTS_DIR)) {
    mkdirSync(PARTS_DIR, { recursive: true })
  }
}

// ─── POST /api/r2 ────────────────────────────────────────────────────────────
// Handles: init-upload, complete-upload

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    // ─── Initialize Upload ──────────────────────────────────────────────
    if (action === 'init-upload') {
      const body = await request.json()
      const { fileName, fileSize, mimeType, category = 'video' } = body

      if (!fileName || !fileSize) {
        return NextResponse.json(
          { error: 'fileName and fileSize are required' },
          { status: 400 }
        )
      }

      const validCategories: FileCategory[] = ['video', 'thumbnail', 'ad', 'banner']
      const fileCategory = validCategories.includes(category) ? category as FileCategory : 'video'

      // Generate a unique storage key
      const key = generateStorageKey(fileName, fileCategory)

      // Initialize the multipart upload
      const result = await initMultipartUpload(key, mimeType || 'video/mp4', fileSize, fileCategory, fileName)

      return NextResponse.json({
        uploadId: result.uploadId,
        key: result.key,
        parts: result.parts,
        provider: result.provider,
      }, { status: 201 })
    }

    // ─── Complete Upload ────────────────────────────────────────────────
    if (action === 'complete-upload') {
      const body = await request.json()
      const { uploadId, key, parts } = body

      if (!uploadId || !key) {
        return NextResponse.json(
          { error: 'uploadId and key are required' },
          { status: 400 }
        )
      }

      const validParts = Array.isArray(parts) ? parts : []

      const result = await completeMultipartUpload(key, uploadId, validParts)

      return NextResponse.json({
        key: result.key,
        url: result.url,
        size: result.size,
        provider: result.provider,
      })
    }

    return NextResponse.json(
      { error: 'Invalid action. Use: init-upload, complete-upload, upload-part' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[R2 POST Error]', error)
    return NextResponse.json(
      { error: 'Upload operation failed', details: String(error) },
      { status: 500 }
    )
  }
}

// ─── PUT /api/r2 ────────────────────────────────────────────────────────────
// Upload a part/chunk

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    // ─── Upload Part ────────────────────────────────────────────────────
    if (action === 'upload-part') {
      const uploadId = searchParams.get('uploadId') || ''
      const partNumber = parseInt(searchParams.get('partNumber') || '1', 10)
      const key = searchParams.get('key') || ''

      if (!uploadId) {
        return NextResponse.json(
          { error: 'uploadId is required' },
          { status: 400 }
        )
      }

      // Read the chunk data
      const contentType = request.headers.get('content-type') || ''
      let chunkData: Buffer

      if (contentType.includes('multipart/form-data')) {
        const formData = await request.formData()
        const chunkFile = formData.get('chunk') as File | null
        if (!chunkFile) {
          return NextResponse.json(
            { error: 'No chunk file in form data' },
            { status: 400 }
          )
        }
        chunkData = Buffer.from(await chunkFile.arrayBuffer())
      } else {
        chunkData = Buffer.from(await request.arrayBuffer())
      }

      // For local mode, save part directly
      const provider = getProvider()
      if (provider === 'local') {
        ensurePartsDir()
        const sessionDir = join(PARTS_DIR, uploadId)
        if (!existsSync(sessionDir)) {
          mkdirSync(sessionDir, { recursive: true })
        }
        const partPath = join(sessionDir, `part_${partNumber}`)
        writeFileSync(partPath, chunkData)

        const etag = `"part-${partNumber}-${Date.now()}"`

        return NextResponse.json({
          partNumber,
          etag,
          received: true,
          size: chunkData.length,
        })
      }

      // For R2 mode, upload to R2
      const session = getUploadSession(uploadId)
      if (!session) {
        return NextResponse.json(
          { error: 'Upload session not found' },
          { status: 404 }
        )
      }

      const result = await uploadPart(session.key, uploadId, partNumber, chunkData)

      return NextResponse.json({
        partNumber: result.partNumber,
        etag: result.etag,
        received: result.received,
      })
    }

    return NextResponse.json(
      { error: 'Invalid action for PUT. Use: upload-part' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[R2 PUT Error]', error)
    return NextResponse.json(
      { error: 'Part upload failed', details: String(error) },
      { status: 500 }
    )
  }
}

// ─── GET /api/r2 ────────────────────────────────────────────────────────────
// Generate signed URL

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    // ─── Signed URL ────────────────────────────────────────────────────
    if (action === 'signed-url') {
      const key = searchParams.get('key')
      const expiresInSeconds = parseInt(searchParams.get('expires') || '3600', 10)

      if (!key) {
        return NextResponse.json(
          { error: 'key is required' },
          { status: 400 }
        )
      }

      const result = await getSignedUrl(key, expiresInSeconds)

      return NextResponse.json({
        url: result.url,
        expiresAt: result.expiresAt,
      })
    }

    // ─── Provider info ────────────────────────────────────────────────
    if (action === 'info') {
      return NextResponse.json({
        provider: getProvider(),
        configured: getProvider() === 'r2',
      })
    }

    return NextResponse.json(
      { error: 'Invalid action. Use: signed-url, info' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[R2 GET Error]', error)
    return NextResponse.json(
      { error: 'Signed URL generation failed', details: String(error) },
      { status: 500 }
    )
  }
}

// ─── DELETE /api/r2 ─────────────────────────────────────────────────────────
// Delete a file

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (!key) {
      return NextResponse.json(
        { error: 'key is required' },
        { status: 400 }
      )
    }

    const result = await deleteObject(key)

    return NextResponse.json({
      deleted: result.deleted,
      key: result.key,
    })
  } catch (error) {
    console.error('[R2 DELETE Error]', error)
    return NextResponse.json(
      { error: 'Delete operation failed', details: String(error) },
      { status: 500 }
    )
  }
}
