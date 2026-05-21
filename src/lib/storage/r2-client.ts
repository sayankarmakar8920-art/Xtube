/**
 * Cloudflare R2 Storage Client
 *
 * A utility module that wraps the R2/S3-compatible API for file storage.
 * Automatically detects if R2 is configured (via environment variables) and
 * falls back to local file storage when R2 is not available.
 *
 * Environment Variables for R2:
 *   R2_ACCOUNT_ID        - Cloudflare account ID
 *   R2_ACCESS_KEY_ID     - R2 API token access key ID
 *   R2_SECRET_ACCESS_KEY - R2 API token secret access key
 *   R2_BUCKET_NAME       - R2 bucket name (default: xtube-media)
 *   R2_PUBLIC_URL        - Public CDN URL for the bucket
 */

import {
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  unlinkSync,
  readdirSync,
  rmSync,
  createWriteStream,
} from 'fs'
import { join, dirname } from 'path'
import { createHmac, randomUUID, createHash } from 'crypto'

// ─── Types ───────────────────────────────────────────────────────────────────

export type StorageProvider = 'r2' | 'local'
export type FileCategory = 'video' | 'thumbnail' | 'ad' | 'banner'

export interface InitUploadResult {
  uploadId: string
  key: string
  parts: Array<{ partNumber: number; uploadUrl: string }>
  provider: StorageProvider
}

export interface UploadPartResult {
  partNumber: number
  etag: string
  received: boolean
}

export interface CompleteUploadResult {
  key: string
  url: string
  size: number
  provider: StorageProvider
}

export interface SignedUrlResult {
  url: string
  expiresAt: string
}

export interface DeleteResult {
  deleted: boolean
  key: string
}

export interface ObjectUrlResult {
  url: string
  isSigned: boolean
}

interface MultipartSession {
  uploadId: string
  key: string
  category: FileCategory
  fileName: string
  mimeType: string
  parts: Map<number, { etag: string; size: number }>
  createdAt: Date
}

// ─── R2 Configuration ────────────────────────────────────────────────────────

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || ''
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || ''
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || ''
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'xtube-media'
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || ''

const R2_BASE_URL = R2_ACCOUNT_ID
  ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
  : ''

/** Check if R2 is properly configured with all required credentials */
export function isR2Configured(): boolean {
  return !!(
    R2_ACCOUNT_ID &&
    R2_ACCESS_KEY_ID &&
    R2_SECRET_ACCESS_KEY &&
    R2_BUCKET_NAME
  )
}

/** Get the current storage provider */
export function getProvider(): StorageProvider {
  return isR2Configured() ? 'r2' : 'local'
}

// ─── Local Storage Paths ─────────────────────────────────────────────────────

const PUBLIC_DIR = join(process.cwd(), 'public')

const CATEGORY_PATHS: Record<FileCategory, string> = {
  video: 'videos',
  thumbnail: 'thumbnails',
  ad: 'ads',
  banner: 'banners',
}

// ─── In-Memory Upload Session Tracking ───────────────────────────────────────

const activeSessions = new Map<string, MultipartSession>()

// ─── S3-Compatible Signature (AWS Signature V4) ─────────────────────────────

/**
 * Generate AWS Signature Version 4 for authenticating R2/S3 API requests.
 * This is used for both request signing and presigned URL generation.
 */
function signRequest(
  method: string,
  path: string,
  headers: Record<string, string>,
  bodyHash: string,
  timestamp: Date,
  region = 'auto',
  service = 's3'
): Record<string, string> {
  const dateStamp = timestamp.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const dateOnly = dateStamp.substring(0, 8)

  // Canonical request
  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map((k) => `${k.toLowerCase()}:${headers[k].trim()}`)
    .join('\n')
  const signedHeaders = Object.keys(headers)
    .sort()
    .map((k) => k.toLowerCase())
    .join(';')

  const canonicalRequest = [
    method,
    path,
    '', // query string (handled separately for presigned)
    canonicalHeaders,
    '',
    signedHeaders,
    bodyHash,
  ].join('\n')

  // String to sign
  const scope = `${dateOnly}/${region}/${service}/aws4_request`
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    dateStamp,
    scope,
    sha256Hex(canonicalRequest),
  ].join('\n')

  // Signing key
  const kDate = hmacSha256(`AWS4${R2_SECRET_ACCESS_KEY}`, dateOnly)
  const kRegion = hmacSha256(kDate, region)
  const kService = hmacSha256(kRegion, service)
  const kSigning = hmacSha256(kService, 'aws4_request')

  // Signature
  const signature = hmacSha256Hex(kSigning, stringToSign)

  const authHeader = `AWS4-HMAC-SHA256 Credential=${R2_ACCESS_KEY_ID}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  return {
    ...headers,
    Authorization: authHeader,
    'X-Amz-Date': dateStamp,
    'X-Amz-Content-Sha256': bodyHash,
  }
}

/**
 * Generate a presigned URL for R2/S3 (AWS Signature V4 presigned URL).
 */
function generatePresignedUrl(
  key: string,
  method: string,
  expiresInSeconds: number,
  additionalQueryParams?: Record<string, string>,
  region = 'auto',
  service = 's3'
): string {
  const timestamp = new Date()
  const dateStamp = timestamp.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const dateOnly = dateStamp.substring(0, 8)
  const expires = expiresInSeconds.toString()

  const host = `${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
  const path = `/${key}`

  const scope = `${dateOnly}/${region}/${service}/aws4_request`
  const credential = `${R2_ACCESS_KEY_ID}/${scope}`

  // Canonical query string
  const queryParams: Record<string, string> = {
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': credential,
    'X-Amz-Date': dateStamp,
    'X-Amz-Expires': expires,
    'X-Amz-SignedHeaders': 'host',
    ...additionalQueryParams,
  }

  const sortedQuery = Object.keys(queryParams)
    .sort()
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(queryParams[k])}`)
    .join('&')

  // Canonical request
  const canonicalRequest = [
    method,
    path,
    sortedQuery,
    `host:${host}`,
    '',
    'host',
    'UNSIGNED-PAYLOAD',
  ].join('\n')

  // String to sign
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    dateStamp,
    scope,
    sha256Hex(canonicalRequest),
  ].join('\n')

  // Signing key
  const kDate = hmacSha256(`AWS4${R2_SECRET_ACCESS_KEY}`, dateOnly)
  const kRegion = hmacSha256(kDate, region)
  const kService = hmacSha256(kRegion, service)
  const kSigning = hmacSha256(kService, 'aws4_request')

  const signature = hmacSha256Hex(kSigning, stringToSign)

  return `https://${host}${path}?${sortedQuery}&X-Amz-Signature=${signature}`
}

// ─── Crypto Helpers ──────────────────────────────────────────────────────────

function sha256Hex(data: string): string {
  return createHash('sha256').update(data).digest('hex')
}

function hmacSha256(key: string | Buffer, data: string): Buffer {
  return createHmac('sha256', key).update(data).digest()
}

function hmacSha256Hex(key: Buffer, data: string): string {
  return createHmac('sha256', key).update(data).digest('hex')
}

// ─── Key Generation ──────────────────────────────────────────────────────────

/**
 * Generate a unique storage key for a file based on its category and name.
 * Format: {category}/{year}/{month}/{uuid}.{ext}
 * Example: videos/2024/01/a1b2c3d4.mp4
 */
export function generateStorageKey(
  fileName: string,
  category: FileCategory
): string {
  const now = new Date()
  const year = now.getFullYear().toString()
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const ext = fileName.split('.').pop() || 'bin'
  const uuid = randomUUID().replace(/-/g, '').substring(0, 12)
  const prefix = CATEGORY_PATHS[category]

  return `${prefix}/${year}/${month}/${uuid}.${ext}`
}

// ─── Local Storage Helpers ───────────────────────────────────────────────────

function ensureLocalDir(key: string): string {
  const fullPath = join(PUBLIC_DIR, key)
  const dir = dirname(fullPath)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  return fullPath
}

function getLocalUrl(key: string): string {
  return `/${key}`
}

// ─── R2 API Call Helper ──────────────────────────────────────────────────────

async function r2Fetch(
  method: string,
  key: string,
  body?: BodyInit | null,
  extraHeaders?: Record<string, string>
): Promise<Response> {
  const url = `${R2_BASE_URL}/${R2_BUCKET_NAME}/${key}`
  const host = `${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`

  const headers: Record<string, string> = {
    Host: host,
    'Content-Type': 'application/octet-stream',
    ...extraHeaders,
  }

  // Compute body hash
  let bodyHash: string
  if (body === null || body === undefined) {
    bodyHash = sha256Hex('')
  } else if (typeof body === 'string') {
    bodyHash = sha256Hex(body)
  } else {
    // For binary data, use UNSIGNED-PAYLOAD
    bodyHash = 'UNSIGNED-PAYLOAD'
  }

  const signedHeaders = signRequest(
    method,
    `/${R2_BUCKET_NAME}/${key}`,
    headers,
    bodyHash,
    new Date()
  )

  return fetch(url, {
    method,
    headers: signedHeaders,
    body,
  })
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Initialize a multipart/resumable upload session.
 *
 * For R2: Creates an S3 multipart upload and returns presigned part upload URLs.
 * For local: Creates an in-memory session and returns local upload URLs.
 */
export async function initMultipartUpload(
  key: string,
  contentType: string,
  fileSize: number,
  category: FileCategory,
  fileName: string
): Promise<InitUploadResult> {
  const provider = getProvider()

  if (provider === 'r2') {
    return initMultipartUploadR2(key, contentType, fileSize, category, fileName)
  }

  return initMultipartUploadLocal(key, contentType, fileSize, category, fileName)
}

async function initMultipartUploadR2(
  key: string,
  contentType: string,
  fileSize: number,
  category: FileCategory,
  fileName: string
): Promise<InitUploadResult> {
  // Initiate multipart upload with R2/S3 API
  const host = `${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
  const path = `/${R2_BUCKET_NAME}/${key}?uploads`

  const headers: Record<string, string> = {
    Host: host,
    'Content-Type': contentType,
  }

  const bodyHash = sha256Hex('')
  const signedHeaders = signRequest('POST', `/${R2_BUCKET_NAME}/${key}`, headers, bodyHash, new Date())

  const url = `${R2_BASE_URL}/${R2_BUCKET_NAME}/${key}?uploads`
  const response = await fetch(url, {
    method: 'POST',
    headers: signedHeaders,
  })

  if (!response.ok) {
    throw new Error(`R2 initMultipartUpload failed: ${response.status} ${await response.text()}`)
  }

  // Parse the UploadId from the XML response
  const xml = await response.text()
  const uploadIdMatch = xml.match(/<UploadId>([^<]+)<\/UploadId>/)
  if (!uploadIdMatch) {
    throw new Error('Failed to parse UploadId from R2 response')
  }
  const uploadId = uploadIdMatch[1]

  // Calculate number of parts (5MB minimum per part for R2, except last)
  const MIN_PART_SIZE = 5 * 1024 * 1024 // 5MB
  const partCount = Math.max(1, Math.ceil(fileSize / MIN_PART_SIZE))

  // Generate presigned URLs for each part
  const parts = Array.from({ length: partCount }, (_, i) => ({
    partNumber: i + 1,
    uploadUrl: generatePresignedUrl(key, 'PUT', 3600, {
      partNumber: (i + 1).toString(),
      uploadId,
    }),
  }))

  // Track session in memory
  activeSessions.set(uploadId, {
    uploadId,
    key,
    category,
    fileName,
    mimeType: contentType,
    parts: new Map(),
    createdAt: new Date(),
  })

  return {
    uploadId,
    key,
    parts,
    provider: 'r2',
  }
}

async function initMultipartUploadLocal(
  key: string,
  contentType: string,
  fileSize: number,
  category: FileCategory,
  fileName: string
): Promise<InitUploadResult> {
  const uploadId = `local_${randomUUID()}`
  const MIN_PART_SIZE = 5 * 1024 * 1024 // 5MB
  const partCount = Math.max(1, Math.ceil(fileSize / MIN_PART_SIZE))

  // Generate local upload URLs (will be handled by our API route)
  const parts = Array.from({ length: partCount }, (_, i) => ({
    partNumber: i + 1,
    uploadUrl: `/api/r2?action=upload-part&uploadId=${uploadId}&partNumber=${i + 1}`,
  }))

  // Track session in memory
  activeSessions.set(uploadId, {
    uploadId,
    key,
    category,
    fileName,
    mimeType: contentType,
    parts: new Map(),
    createdAt: new Date(),
  })

  // Ensure the local directory exists
  ensureLocalDir(key)

  return {
    uploadId,
    key,
    parts,
    provider: 'local',
  }
}

/**
 * Upload a chunk/part of a file.
 *
 * For R2: Uploads directly to the presigned URL.
 * For local: Saves the chunk to the local filesystem.
 */
export async function uploadPart(
  key: string,
  uploadId: string,
  partNumber: number,
  data: Buffer | ArrayBuffer
): Promise<UploadPartResult> {
  const provider = getProvider()

  if (provider === 'r2') {
    return uploadPartR2(key, uploadId, partNumber, data)
  }

  return uploadPartLocal(key, uploadId, partNumber, data)
}

async function uploadPartR2(
  key: string,
  uploadId: string,
  partNumber: number,
  data: Buffer | ArrayBuffer
): Promise<UploadPartResult> {
  // Upload part to R2 via S3 API
  const host = `${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
  const queryStr = `partNumber=${partNumber}&uploadId=${encodeURIComponent(uploadId)}`
  const path = `/${R2_BUCKET_NAME}/${key}?${queryStr}`

  const bodyBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data)

  const headers: Record<string, string> = {
    Host: host,
    'Content-Type': 'application/octet-stream',
    'Content-Length': bodyBuffer.length.toString(),
  }

  const bodyHash = 'UNSIGNED-PAYLOAD'
  const signedHeaders = signRequest('PUT', `/${R2_BUCKET_NAME}/${key}`, headers, bodyHash, new Date())

  const url = `${R2_BASE_URL}/${R2_BUCKET_NAME}/${key}?${queryStr}`
  const response = await fetch(url, {
    method: 'PUT',
    headers: signedHeaders,
    body: bodyBuffer,
  })

  if (!response.ok) {
    throw new Error(`R2 uploadPart failed: ${response.status} ${await response.text()}`)
  }

  const etag = response.headers.get('ETag') || `"${randomUUID()}"`

  // Update session tracking
  const session = activeSessions.get(uploadId)
  if (session) {
    session.parts.set(partNumber, { etag, size: bodyBuffer.length })
  }

  return {
    partNumber,
    etag,
    received: true,
  }
}

async function uploadPartLocal(
  key: string,
  uploadId: string,
  partNumber: number,
  data: Buffer | ArrayBuffer
): Promise<UploadPartResult> {
  const session = activeSessions.get(uploadId)
  if (!session) {
    throw new Error(`Upload session not found: ${uploadId}`)
  }

  const bodyBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data)
  const etag = `"${randomUUID()}"`

  // Save part to temporary location
  const tempDir = join(process.cwd(), 'upload', 'r2-parts', uploadId)
  if (!existsSync(tempDir)) {
    mkdirSync(tempDir, { recursive: true })
  }

  const partPath = join(tempDir, `part_${partNumber}`)
  writeFileSync(partPath, bodyBuffer)

  // Update session tracking
  session.parts.set(partNumber, { etag, size: bodyBuffer.length })

  return {
    partNumber,
    etag,
    received: true,
  }
}

/**
 * Complete a multipart upload.
 *
 * For R2: Sends the CompleteMultipartUpload XML to R2.
 * For local: Concatenates all parts into the final file.
 */
export async function completeMultipartUpload(
  key: string,
  uploadId: string,
  parts: Array<{ partNumber: number; etag: string }>
): Promise<CompleteUploadResult> {
  const provider = getProvider()

  if (provider === 'r2') {
    return completeMultipartUploadR2(key, uploadId, parts)
  }

  return completeMultipartUploadLocal(key, uploadId, parts)
}

async function completeMultipartUploadR2(
  key: string,
  uploadId: string,
  parts: Array<{ partNumber: number; etag: string }>
): Promise<CompleteUploadResult> {
  // Build CompleteMultipartUpload XML
  const partsXml = parts
    .sort((a, b) => a.partNumber - b.partNumber)
    .map(
      (p) =>
        `<Part><PartNumber>${p.partNumber}</PartNumber><ETag>${p.etag}</ETag></Part>`
    )
    .join('')

  const body = `<CompleteMultipartUpload>${partsXml}</CompleteMultipartUpload>`

  const host = `${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
  const queryStr = `uploadId=${encodeURIComponent(uploadId)}`
  const path = `/${R2_BUCKET_NAME}/${key}?${queryStr}`

  const headers: Record<string, string> = {
    Host: host,
    'Content-Type': 'application/xml',
  }

  const bodyHash = sha256Hex(body)
  const signedHeaders = signRequest('POST', `/${R2_BUCKET_NAME}/${key}`, headers, bodyHash, new Date())

  const url = `${R2_BASE_URL}/${R2_BUCKET_NAME}/${key}?${queryStr}`
  const response = await fetch(url, {
    method: 'POST',
    headers: signedHeaders,
    body,
  })

  if (!response.ok) {
    throw new Error(`R2 completeMultipartUpload failed: ${response.status} ${await response.text()}`)
  }

  // Calculate total size from session
  const session = activeSessions.get(uploadId)
  let totalSize = 0
  if (session) {
    for (const part of session.parts.values()) {
      totalSize += part.size
    }
    activeSessions.delete(uploadId)
  }

  const url_result = R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${key}` : `/${key}`

  return {
    key,
    url: url_result,
    size: totalSize,
    provider: 'r2',
  }
}

async function completeMultipartUploadLocal(
  key: string,
  uploadId: string,
  parts: Array<{ partNumber: number; etag: string }>
): Promise<CompleteUploadResult> {
  const session = activeSessions.get(uploadId)
  if (!session) {
    throw new Error(`Upload session not found: ${uploadId}`)
  }

  const tempDir = join(process.cwd(), 'upload', 'r2-parts', uploadId)
  if (!existsSync(tempDir)) {
    throw new Error(`Upload parts directory not found: ${uploadId}`)
  }

  // Concatenate parts in order
  const sortedParts = parts.sort((a, b) => a.partNumber - b.partNumber)
  const chunks: Buffer[] = []
  let totalSize = 0

  for (const part of sortedParts) {
    const partPath = join(tempDir, `part_${part.partNumber}`)
    if (!existsSync(partPath)) {
      throw new Error(`Part ${part.partNumber} not found on disk`)
    }
    const chunk = readFileSync(partPath)
    chunks.push(chunk)
    totalSize += chunk.length
  }

  const finalBuffer = Buffer.concat(chunks)
  const fullPath = ensureLocalDir(key)
  writeFileSync(fullPath, finalBuffer)

  // Clean up temp parts
  try {
    rmSync(tempDir, { recursive: true, force: true })
  } catch {
    // Ignore cleanup errors
  }

  // Clean up session
  activeSessions.delete(uploadId)

  return {
    key,
    url: getLocalUrl(key),
    size: totalSize,
    provider: 'local',
  }
}

/**
 * Generate a signed URL for secure streaming/access.
 *
 * For R2: Generates an AWS Signature V4 presigned URL.
 * For local: Returns the direct URL (no signing needed).
 */
export async function getSignedUrl(
  key: string,
  expiresInSeconds: number = 3600
): Promise<SignedUrlResult> {
  const provider = getProvider()

  if (provider === 'r2') {
    const url = generatePresignedUrl(key, 'GET', expiresInSeconds)
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString()

    return {
      url,
      expiresAt,
    }
  }

  // Local mode — no signing needed, just return the direct URL
  return {
    url: getLocalUrl(key),
    expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
  }
}

/**
 * Delete a file from storage.
 *
 * For R2: Sends a DELETE request to the R2/S3 API.
 * For local: Deletes the file from the public directory.
 */
export async function deleteObject(key: string): Promise<DeleteResult> {
  const provider = getProvider()

  if (provider === 'r2') {
    return deleteObjectR2(key)
  }

  return deleteObjectLocal(key)
}

async function deleteObjectR2(key: string): Promise<DeleteResult> {
  const response = await r2Fetch('DELETE', key)

  if (!response.ok && response.status !== 204) {
    throw new Error(`R2 deleteObject failed: ${response.status} ${await response.text()}`)
  }

  return {
    deleted: true,
    key,
  }
}

async function deleteObjectLocal(key: string): Promise<DeleteResult> {
  const fullPath = join(PUBLIC_DIR, key)

  if (existsSync(fullPath)) {
    unlinkSync(fullPath)
  }

  // Try to clean up empty parent directories
  try {
    const parentDir = dirname(fullPath)
    const files = readdirSync(parentDir)
    if (files.length === 0) {
      rmSync(parentDir, { recursive: true, force: true })
    }
  } catch {
    // Ignore cleanup errors
  }

  return {
    deleted: true,
    key,
  }
}

/**
 * Get the URL for an object — returns the public URL if available,
 * otherwise generates a signed URL.
 *
 * For R2: Returns public URL if R2_PUBLIC_URL is set, otherwise signed URL.
 * For local: Returns the direct local URL.
 */
export async function getObjectUrl(key: string): Promise<ObjectUrlResult> {
  const provider = getProvider()

  if (provider === 'r2') {
    if (R2_PUBLIC_URL) {
      return {
        url: `${R2_PUBLIC_URL}/${key}`,
        isSigned: false,
      }
    }
    // No public URL configured, generate a signed URL
    const signed = await getSignedUrl(key)
    return {
      url: signed.url,
      isSigned: true,
    }
  }

  return {
    url: getLocalUrl(key),
    isSigned: false,
  }
}

/**
 * Get an active upload session (for internal use by the API route).
 */
export function getUploadSession(uploadId: string): MultipartSession | undefined {
  return activeSessions.get(uploadId)
}

/**
 * Clean up stale upload sessions (older than 24 hours).
 * Should be called periodically.
 */
export function cleanupStaleSessions(): number {
  const STALE_THRESHOLD = 24 * 60 * 60 * 1000 // 24 hours
  const now = Date.now()
  let cleaned = 0

  for (const [uploadId, session] of activeSessions.entries()) {
    if (now - session.createdAt.getTime() > STALE_THRESHOLD) {
      activeSessions.delete(uploadId)
      cleaned++
    }
  }

  return cleaned
}

/**
 * List all objects with a given prefix in storage.
 * For local mode, reads the filesystem. For R2, uses the ListObjectsV2 API.
 */
export async function listObjects(
  prefix: string,
  maxKeys: number = 100
): Promise<Array<{ key: string; size: number; lastModified: string }>> {
  const provider = getProvider()

  if (provider === 'r2') {
    return listObjectsR2(prefix, maxKeys)
  }

  return listObjectsLocal(prefix, maxKeys)
}

async function listObjectsR2(
  prefix: string,
  maxKeys: number
): Promise<Array<{ key: string; size: number; lastModified: string }>> {
  const host = `${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
  const path = `/${R2_BUCKET_NAME}?list-type=2&prefix=${encodeURIComponent(prefix)}&max-keys=${maxKeys}`

  const headers: Record<string, string> = {
    Host: host,
  }

  const bodyHash = sha256Hex('')
  const signedHeaders = signRequest('GET', `/${R2_BUCKET_NAME}`, headers, bodyHash, new Date())

  const url = `${R2_BASE_URL}${path}`
  const response = await fetch(url, {
    method: 'GET',
    headers: signedHeaders,
  })

  if (!response.ok) {
    throw new Error(`R2 listObjects failed: ${response.status}`)
  }

  const xml = await response.text()
  const objects: Array<{ key: string; size: number; lastModified: string }> = []

  // Simple XML parsing for ListObjectsV2 response
  const contentRegex = /<Contents>([\s\S]*?)<\/Contents>/g
  let match
  while ((match = contentRegex.exec(xml)) !== null) {
    const content = match[1]
    const keyMatch = content.match(/<Key>([^<]+)<\/Key>/)
    const sizeMatch = content.match(/<Size>([^<]+)<\/Size>/)
    const dateMatch = content.match(/<LastModified>([^<]+)<\/LastModified>/)

    if (keyMatch && sizeMatch) {
      objects.push({
        key: keyMatch[1],
        size: parseInt(sizeMatch[1], 10),
        lastModified: dateMatch ? dateMatch[1] : new Date().toISOString(),
      })
    }
  }

  return objects
}

async function listObjectsLocal(
  prefix: string,
  maxKeys: number
): Promise<Array<{ key: string; size: number; lastModified: string }>> {
  const dir = join(PUBLIC_DIR, prefix)
  if (!existsSync(dir)) {
    return []
  }

  const objects: Array<{ key: string; size: number; lastModified: string }> = []
  const { statSync } = await import('fs')

  function walkDir(currentDir: string, currentPrefix: string) {
    if (objects.length >= maxKeys) return

    const entries = readdirSync(currentDir, { withFileTypes: true })
    for (const entry of entries) {
      if (objects.length >= maxKeys) break

      const fullPath = join(currentDir, entry.name)
      const entryPrefix = currentPrefix ? `${currentPrefix}/${entry.name}` : entry.name

      if (entry.isDirectory()) {
        walkDir(fullPath, entryPrefix)
      } else {
        try {
          const stat = statSync(fullPath)
          objects.push({
            key: entryPrefix,
            size: stat.size,
            lastModified: stat.mtime.toISOString(),
          })
        } catch {
          // Skip files that can't be stat'd
        }
      }
    }
  }

  walkDir(dir, prefix)
  return objects
}
