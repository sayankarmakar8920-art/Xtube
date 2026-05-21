'use client'

import { FileCategory } from './r2-client'

export interface UploadResult {
  key: string
  url: string
  provider: 'r2' | 'local'
  size: number
}

const CHUNK_SIZE = 5 * 1024 * 1024

export async function uploadFile(
  file: File | Blob,
  category: FileCategory,
  fileName: string,
  onProgress?: (progress: number, speed?: string, remaining?: string) => void
): Promise<UploadResult> {
  const fileSize = file.size
  const mimeType = file.type || 'application/octet-stream'

  try {
    // 1. Initialize multipart upload
    const initRes = await fetch('/api/r2?action=init-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName, fileSize, mimeType, category }),
    })

    if (!initRes.ok) {
      const errText = await initRes.text()
      throw new Error(`Init failed (${initRes.status}): ${errText}`)
    }

    const { uploadId, key, parts, provider } = await initRes.json()

    const completedParts: Array<{ partNumber: number; etag: string }> = []
    let uploadedBytes = 0
    const startTime = Date.now()

    // 2. Upload each chunk
    for (const part of parts) {
      const start = (part.partNumber - 1) * CHUNK_SIZE
      const end = Math.min(fileSize, start + CHUNK_SIZE)
      const chunk = file.slice(start, end)
      const chunkLength = end - start

      let attempts = 0
      const maxAttempts = 3
      let etag = ''

      while (attempts < maxAttempts) {
        attempts++
        try {
          const headers: Record<string, string> = {}
          if (provider === 'local') {
            headers['Content-Type'] = 'application/octet-stream'
          }

          const res = await fetch(part.uploadUrl, {
            method: 'PUT',
            headers,
            body: chunk,
          })

          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${await res.text()}`)
          }

          let matchedEtag = res.headers.get('ETag')
          if (!matchedEtag) {
            try {
              const body = await res.json()
              matchedEtag = body.etag
            } catch { /* not JSON */ }
          }

          if (!matchedEtag) throw new Error('No ETag in response')

          etag = matchedEtag.replace(/^"|"$/g, '')
          break
        } catch (err) {
          console.warn(`Chunk ${part.partNumber} attempt ${attempts} failed:`, err)
          if (attempts >= maxAttempts) throw err
          await new Promise(r => setTimeout(r, 1000))
        }
      }

      completedParts.push({ partNumber: part.partNumber, etag })
      uploadedBytes += chunkLength

      const elapsed = (Date.now() - startTime) / 1000
      const speed = elapsed > 0 ? uploadedBytes / elapsed : 0
      const speedStr = (speed / (1024 * 1024)).toFixed(1) + ' MB/s'
      const remainingBytes = fileSize - uploadedBytes
      const remainingSec = speed > 0 ? remainingBytes / speed : 0
      const remainingStr = remainingSec > 60
        ? `${Math.ceil(remainingSec / 60)} mins left`
        : `${Math.ceil(remainingSec)} secs left`

      if (onProgress) {
        onProgress((uploadedBytes / fileSize) * 100, speedStr, remainingStr)
      }
    }

    // 3. Complete upload
    const completeRes = await fetch('/api/r2?action=complete-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uploadId, key, parts: completedParts }),
    })

    if (!completeRes.ok) {
      throw new Error(`Complete failed: ${await completeRes.text()}`)
    }

    const result = await completeRes.json()
    return { key: result.key, url: result.url, provider: result.provider, size: result.size }
  } catch (err) {
    console.error('Multipart upload failed, trying direct upload:', err)

    // Fallback: direct upload via FormData
    return directUpload(file, category, fileName, onProgress)
  }
}

async function directUpload(
  file: File | Blob,
  category: FileCategory,
  fileName: string,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  const formData = new FormData()
  formData.append('file', file, fileName)
  formData.append('category', category)

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    throw new Error(`Direct upload failed: ${await res.text()}`)
  }

  const result = await res.json()
  if (onProgress) onProgress(100)
  return { key: result.key, url: result.url, provider: result.provider || 'local', size: file.size }
}
