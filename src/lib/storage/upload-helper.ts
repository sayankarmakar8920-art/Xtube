'use client'

import { FileCategory } from './r2-client'

export interface UploadResult {
  key: string
  url: string
  provider: 'r2' | 'local'
  size: number
}

const MAX_RETRIES = 3
const RETRY_DELAY = 2000

async function uploadWithRetry(
  file: File | Blob,
  category: FileCategory,
  fileName: string,
  onProgress?: (progress: number, speed?: string, remaining?: string) => void,
  attempt: number = 0
): Promise<UploadResult> {
  const formData = new FormData()
  formData.append('file', file, fileName)
  formData.append('category', category)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const startTime = Date.now()

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const progress = (e.loaded / e.total) * 100
        const elapsed = (Date.now() - startTime) / 1000 || 1
        const speedMBps = (e.loaded / 1024 / 1024 / elapsed).toFixed(1) + ' MB/s'
        const bytesPerSec = e.loaded / elapsed
        const remainingSec = bytesPerSec > 0 ? (e.total - e.loaded) / bytesPerSec : 0
        const remainingStr = remainingSec > 120
          ? `${Math.ceil(remainingSec / 60)} mins`
          : remainingSec > 60
            ? `${Math.ceil(remainingSec / 60)} min`
            : `${Math.ceil(remainingSec)} secs`
        onProgress(progress, speedMBps, remainingStr)
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText)
          resolve(result)
        } catch {
          reject(new Error('Invalid server response'))
        }
      } else if (xhr.status >= 500 && attempt < MAX_RETRIES) {
        console.warn(`[Upload] Attempt ${attempt + 1} failed (${xhr.status}), retrying...`)
        setTimeout(() => {
          uploadWithRetry(file, category, fileName, onProgress, attempt + 1)
            .then(resolve)
            .catch(reject)
        }, RETRY_DELAY * (attempt + 1))
      } else {
        reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`))
      }
    })

    xhr.addEventListener('error', () => {
      if (attempt < MAX_RETRIES) {
        console.warn(`[Upload] Network error, retrying (${attempt + 1}/${MAX_RETRIES})...`)
        setTimeout(() => {
          uploadWithRetry(file, category, fileName, onProgress, attempt + 1)
            .then(resolve)
            .catch(reject)
        }, RETRY_DELAY * (attempt + 1))
      } else {
        reject(new Error('Network error after retries'))
      }
    })

    xhr.addEventListener('timeout', () => {
      if (attempt < MAX_RETRIES) {
        console.warn(`[Upload] Timeout, retrying (${attempt + 1}/${MAX_RETRIES})...`)
        setTimeout(() => {
          uploadWithRetry(file, category, fileName, onProgress, attempt + 1)
            .then(resolve)
            .catch(reject)
        }, RETRY_DELAY * (attempt + 1))
      } else {
        reject(new Error('Upload timeout after retries'))
      }
    })

    xhr.timeout = 300000 // 5 minutes
    xhr.open('POST', '/api/upload')
    xhr.send(formData)
  })
}

export async function uploadFile(
  file: File | Blob,
  category: FileCategory,
  fileName: string,
  onProgress?: (progress: number, speed?: string, remaining?: string) => void
): Promise<UploadResult> {
  return uploadWithRetry(file, category, fileName, onProgress, 0)
}
