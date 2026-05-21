'use client'

import { FileCategory } from './r2-client'

export interface UploadResult {
  key: string
  url: string
  provider: 'r2' | 'local'
  size: number
}

export async function uploadFile(
  file: File | Blob,
  category: FileCategory,
  fileName: string,
  onProgress?: (progress: number, speed?: string, remaining?: string) => void
): Promise<UploadResult> {
  const formData = new FormData()
  formData.append('file', file, fileName)
  formData.append('category', category)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const progress = (e.loaded / e.total) * 100
        const speedMBps = (e.loaded / 1024 / 1024 / ((Date.now() - startTime) / 1000 || 1)).toFixed(1) + ' MB/s'
        const remainingSec = (e.total - e.loaded) / (e.loaded / ((Date.now() - startTime) / 1000 || 1))
        const remainingStr = remainingSec > 60 ? `${Math.ceil(remainingSec / 60)} mins` : `${Math.ceil(remainingSec)} secs`
        onProgress(progress, speedMBps, remainingStr)
      }
    })

    const startTime = Date.now()

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText)
          resolve(result)
        } catch {
          reject(new Error('Invalid response'))
        }
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`))
      }
    })

    xhr.addEventListener('error', () => reject(new Error('Network error')))
    xhr.open('POST', '/api/upload')
    xhr.send(formData)
  })
}
