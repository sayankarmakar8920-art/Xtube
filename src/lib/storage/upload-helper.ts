'use client'

import { FileCategory } from './r2-client'

export interface UploadResult {
  key: string
  url: string
  provider: 'r2' | 'local'
  size: number
}

const CHUNK_SIZE = 5 * 1024 * 1024 // 5MB chunks

/**
 * Uploads a file (File or Blob) using a multipart chunked upload flow.
 * Works seamlessly with both Cloudflare R2 and Local Fallback storage.
 */
export async function uploadFile(
  file: File | Blob,
  category: FileCategory,
  fileName: string,
  onProgress?: (progress: number, speed?: string, remaining?: string) => void
): Promise<UploadResult> {
  const fileSize = file.size
  const mimeType = file.type || 'application/octet-stream'

  // 1. Initialize the multipart upload
  const initRes = await fetch('/api/r2?action=init-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName,
      fileSize,
      mimeType,
      category,
    }),
  })

  if (!initRes.ok) {
    throw new Error(`Failed to initialize upload: ${await initRes.text()}`)
  }

  const { uploadId, key, parts, provider } = await initRes.json() as {
    uploadId: string
    key: string
    parts: Array<{ partNumber: number; uploadUrl: string }>
    provider: 'r2' | 'local'
  }

  const completedParts: Array<{ partNumber: number; etag: string }> = []
  let uploadedBytes = 0
  const startTime = Date.now()

  // 2. Upload each chunk sequentially
  for (const part of parts) {
    const start = (part.partNumber - 1) * CHUNK_SIZE
    const end = Math.min(fileSize, start + CHUNK_SIZE)
    const chunk = file.slice(start, end)
    const chunkLength = end - start

    let attempts = 0
    const maxAttempts = 3
    let uploadedPartSuccessful = false
    let etag = ''

    while (attempts < maxAttempts && !uploadedPartSuccessful) {
      try {
        attempts++
        // Prepare fetch options. We PUT the raw binary data.
        const headers: Record<string, string> = {
          'Content-Length': chunkLength.toString(),
        }

        // If local mode, we upload to our own API and might want content type,
        // but raw binary is accepted by request.arrayBuffer() directly.
        if (provider === 'local') {
          headers['Content-Type'] = 'application/octet-stream'
        }

        const res = await fetch(part.uploadUrl, {
          method: 'PUT',
          headers,
          body: chunk,
        })

        if (!res.ok) {
          throw new Error(`Part upload HTTP error ${res.status}: ${await res.text()}`)
        }

        // Extract ETag:
        // - Directly from header if present (standard for R2/S3)
        // - From JSON body if our API returns it (local fallback)
        let matchedEtag = res.headers.get('ETag')
        if (!matchedEtag) {
          try {
            const body = await res.json()
            matchedEtag = body.etag
          } catch {
            // Not a JSON response
          }
        }

        if (!matchedEtag) {
          throw new Error('ETag header / body property missing from response')
        }

        // Clean up quotes around ETag if any
        etag = matchedEtag.replace(/^"|"$/g, '')
        uploadedPartSuccessful = true
      } catch (err) {
        console.warn(`Chunk ${part.partNumber} upload attempt ${attempts} failed:`, err)
        if (attempts >= maxAttempts) {
          throw new Error(`Failed to upload chunk ${part.partNumber} after ${maxAttempts} attempts: ${String(err)}`)
        }
        // Wait 1s before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    completedParts.push({ partNumber: part.partNumber, etag })
    uploadedBytes += chunkLength

    // Calculate metrics to report progress
    const elapsedSeconds = (Date.now() - startTime) / 1000
    const speedBytesPerSec = elapsedSeconds > 0 ? uploadedBytes / elapsedSeconds : 0
    const speedMBps = (speedBytesPerSec / (1024 * 1024)).toFixed(1) + ' MB/s'

    const remainingBytes = fileSize - uploadedBytes
    const remainingSeconds = speedBytesPerSec > 0 ? remainingBytes / speedBytesPerSec : 0
    let remainingStr = ''
    if (remainingSeconds > 60) {
      remainingStr = `${Math.ceil(remainingSeconds / 60)} mins left`
    } else {
      remainingStr = `${Math.ceil(remainingSeconds)} secs left`
    }

    if (onProgress) {
      const progressPercent = (uploadedBytes / fileSize) * 100
      onProgress(progressPercent, speedMBps, remainingStr)
    }
  }

  // 3. Complete the multipart upload
  const completeRes = await fetch('/api/r2?action=complete-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      uploadId,
      key,
      parts: completedParts,
    }),
  })

  if (!completeRes.ok) {
    throw new Error(`Failed to complete upload: ${await completeRes.text()}`)
  }

  const result = await completeRes.json()
  return {
    key: result.key,
    url: result.url,
    provider: result.provider,
    size: result.size,
  }
}
