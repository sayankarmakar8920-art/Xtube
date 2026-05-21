// ─── HLS Streaming Engine ─────────────────────────────────────────────────────
// Handles HLS manifest generation, quality management, and adaptive streaming

// Quality ladder configuration
export const QUALITY_LADDER = [
  { name: '4K',    width: 3840, height: 2160, bitrate: 15000, codec: 'h264' },
  { name: '2K',    width: 2560, height: 1440, bitrate: 8000,  codec: 'h264' },
  { name: '1440p', width: 2560, height: 1440, bitrate: 6000,  codec: 'h264' },
  { name: '1080p', width: 1920, height: 1080, bitrate: 4500,  codec: 'h264' },
  { name: '720p',  width: 1280, height: 720,  bitrate: 2500,  codec: 'h264' },
  { name: '480p',  width: 854,  height: 480,  bitrate: 1000,  codec: 'h264' },
] as const

export type QualityName = '4K' | '2K' | '1440p' | '1080p' | '720p' | '480p'

export interface StreamInfo {
  videoId: string
  hlsUrl: string
  qualities: QualityName[]
  duration: number
  codec: string
  audioCodec: string
}

export interface BufferHealthInfo {
  level: 'good' | 'fair' | 'poor'
  bufferLength: number     // seconds of buffered content
  currentBitrate: number   // kbps
  downloadSpeed: number    // kbps
  droppedFrames: number
}

// ─── Quality lookup helpers ──────────────────────────────────────────────────

const QUALITY_MAP = new Map<QualityName, (typeof QUALITY_LADDER)[number]>()
for (const q of QUALITY_LADDER) {
  QUALITY_MAP.set(q.name as QualityName, q)
}

export function getQualityConfig(name: QualityName) {
  return QUALITY_MAP.get(name)
}

// ─── Generate HLS Master Manifest ────────────────────────────────────────────
// Produces a standard HLS master playlist that lists all available renditions.
// Each rendition points to a media playlist URL served by our API.

export function generateMasterManifest(qualities: QualityName[]): string {
  const lines: string[] = [
    '#EXTM3U',
    '#EXT-X-VERSION:6',
    '#EXT-X-INDEPENDENT-SEGMENTS',
  ]

  for (const qualityName of qualities) {
    const cfg = QUALITY_MAP.get(qualityName)
    if (!cfg) continue

    // HLS Bandwidth is in bits per second; our bitrate is in kbps
    const bandwidth = cfg.bitrate * 1000
    const resolution = `${cfg.width}x${cfg.height}`

    lines.push(
      `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${resolution},CODECS="avc1.640028,mp4a.40.2",FRAME-RATE=30.000`,
      `playlist?quality=${cfg.name}`
    )
  }

  return lines.join('\n') + '\n'
}

// ─── Generate HLS Media Playlist ─────────────────────────────────────────────
// Produces a media playlist for a single quality level.
// Since we are pseudo-streaming (no real transcoding), we reference the raw
// MP4 as a single long segment. HLS.js will still handle adaptive switching
// when the master manifest lists multiple renditions.

export function generateMediaPlaylist(
  quality: QualityName,
  segmentCount: number,
  segmentDuration: number
): string {
  const cfg = QUALITY_MAP.get(quality)
  const bandwidth = cfg ? cfg.bitrate * 1000 : 2500000

  const lines: string[] = [
    '#EXTM3U',
    '#EXT-X-VERSION:6',
    `#EXT-X-TARGETDURATION:${Math.ceil(segmentDuration)}`,
    '#EXT-X-MEDIA-SEQUENCE:0',
    '#EXT-X-PLAYLIST-TYPE:VOD',
    `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth}`,
  ]

  const totalDuration = segmentCount * segmentDuration

  for (let i = 0; i < segmentCount; i++) {
    const isLast = i === segmentCount - 1
    const dur = isLast
      ? segmentDuration + (totalDuration - segmentCount * segmentDuration)
      : segmentDuration

    lines.push(`#EXTINF:${dur.toFixed(3)},`)
    lines.push(`segment?quality=${quality}&index=${i}`)
  }

  lines.push('#EXT-X-ENDLIST')

  return lines.join('\n') + '\n'
}

// ─── Generate Pseudo-HLS Manifest for Raw MP4 ────────────────────────────────
// When a video has not been transcoded to HLS, we generate a "pseudo" manifest
// that references the raw MP4 as a single byte-range segment. HLS.js can play
// this without any real segmenting — it simply downloads the MP4 progressively.

export function generatePseudoHlsManifest(
  videoId: string,
  videoUrl: string,
  durationSeconds: number,
  quality: QualityName = '1080p'
): string {
  const cfg = QUALITY_MAP.get(quality)
  const bandwidth = cfg ? cfg.bitrate * 1000 : 4500000
  const resolution = cfg ? `${cfg.width}x${cfg.height}` : '1920x1080'

  const masterLines: string[] = [
    '#EXTM3U',
    '#EXT-X-VERSION:6',
    '#EXT-X-INDEPENDENT-SEGMENTS',
    `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${resolution},CODECS="avc1.640028,mp4a.40.2",FRAME-RATE=30.000`,
    `playlist?quality=${quality}`,
  ]

  const playlistLines: string[] = [
    '#EXTM3U',
    '#EXT-X-VERSION:6',
    `#EXT-X-TARGETDURATION:${Math.max(Math.ceil(durationSeconds), 1)}`,
    '#EXT-X-MEDIA-SEQUENCE:0',
    '#EXT-X-PLAYLIST-TYPE:VOD',
    `#EXTINF:${durationSeconds.toFixed(3)},`,
    videoUrl,
    '#EXT-X-ENDLIST',
  ]

  return JSON.stringify({
    master: masterLines.join('\n') + '\n',
    playlist: playlistLines.join('\n') + '\n',
    quality,
    videoUrl,
  })
}

// ─── Calculate Optimal Quality ───────────────────────────────────────────────
// Adaptive bitrate algorithm that considers:
//   1. Available download throughput (kbps)
//   2. Buffer length (seconds of content already buffered)
//   3. Screen resolution (don't waste bandwidth on invisible pixels)
//   4. Dropped frames (indicates decode / render issues)

export function calculateOptimalQuality(
  downloadSpeed: number,    // kbps
  bufferLength: number,     // seconds
  screenResolution: { width: number; height: number },
  droppedFrames: number
): QualityName {
  // If we have plenty of buffer, allow a quality step above what throughput alone would suggest
  const bufferBonus = Math.min(bufferLength / 10, 1) // 0-1 bonus factor
  const effectiveBandwidth = downloadSpeed * (1 + bufferBonus * 0.3)

  // If significant dropped frames, step down one level
  const droppedFramePenalty = droppedFrames > 30 ? 0.7 : droppedFrames > 10 ? 0.85 : 1.0
  const adjustedBandwidth = effectiveBandwidth * droppedFramePenalty

  // Filter qualities that the screen can actually display
  const screenPixels = screenResolution.width * screenResolution.height
  const suitableQualities = QUALITY_LADDER.filter(
    (q) => q.width * q.height <= screenPixels
  )

  // If no quality fits the screen (unlikely), use lowest
  if (suitableQualities.length === 0) {
    return '480p'
  }

  // Find the highest quality whose bitrate we can sustain
  for (const q of suitableQualities) {
    if (adjustedBandwidth >= q.bitrate) {
      return q.name as QualityName
    }
  }

  // Even the lowest quality is too high; return lowest anyway
  return suitableQualities[suitableQualities.length - 1].name as QualityName
}

// ─── Assess Buffer Health ────────────────────────────────────────────────────
// Classifies the current streaming health based on buffer, throughput,
// and frame-drop metrics.

export function assessBufferHealth(
  bufferLength: number,
  currentBitrate: number,
  downloadSpeed: number,
  droppedFrames: number
): BufferHealthInfo {
  // Throughput ratio: how much headroom do we have?
  const throughputRatio = downloadSpeed / Math.max(currentBitrate, 1)

  // Determine health level
  let level: BufferHealthInfo['level']

  if (
    bufferLength >= 10 &&
    throughputRatio >= 2.0 &&
    droppedFrames < 5
  ) {
    level = 'good'
  } else if (
    bufferLength >= 3 &&
    throughputRatio >= 1.2 &&
    droppedFrames < 20
  ) {
    level = 'fair'
  } else {
    level = 'poor'
  }

  return {
    level,
    bufferLength: Math.round(bufferLength * 100) / 100,
    currentBitrate,
    downloadSpeed,
    droppedFrames,
  }
}

// ─── Generate Mid-roll Ad Insertion Points ───────────────────────────────────
// For long videos, generates evenly-spaced ad break points.
// The first ad break starts after `intervalSeconds`, and subsequent breaks
// occur at regular intervals. No ad is placed in the last 30 seconds.

export function generateMidrollPoints(
  durationSeconds: number,
  intervalSeconds: number = 1800 // 30 minutes default
): number[] {
  // Don't insert ads in very short videos
  if (durationSeconds < 120) return []

  const points: number[] = []
  const minContentBeforeFirstAd = 300 // at least 5 min of content before first ad
  const minContentBeforeLastAd = 30   // at least 30s of content after last ad

  let position = minContentBeforeFirstAd

  while (position < durationSeconds - minContentBeforeLastAd) {
    points.push(position)
    position += intervalSeconds
  }

  return points
}

// ─── Utility: Parse Quality Levels from JSON string ──────────────────────────

export function parseQualityLevels(jsonStr: string): QualityName[] {
  try {
    const parsed = JSON.parse(jsonStr)
    if (!Array.isArray(parsed)) return ['1080p']

    const valid = new Set(QUALITY_LADDER.map((q) => q.name))
    const filtered = parsed.filter((q: string) => valid.has(q as QualityName)) as QualityName[]

    return filtered.length > 0 ? filtered : ['1080p']
  } catch {
    return ['1080p']
  }
}

// ─── Utility: Resolve available qualities for a video ────────────────────────
// Determines what quality levels a video actually supports, based on its
// stored resolution and qualityLevels JSON.

export function resolveAvailableQualities(
  resolution: string,
  qualityLevelsJson: string
): QualityName[] {
  // If explicit quality levels are stored, use them
  const stored = parseQualityLevels(qualityLevelsJson)
  if (stored.length > 0 && qualityLevelsJson !== '[]') {
    return stored
  }

  // Otherwise derive from the video's max resolution
  const maxPixels: Record<string, QualityName> = {
    '4K': '4K',
    '2K': '2K',
    '1440p': '1440p',
    '1080p': '1080p',
    '720p': '720p',
    '480p': '480p',
    '360p': '480p',
    '240p': '480p',
  }

  const maxQuality = maxPixels[resolution] || '1080p'
  const maxIndex = QUALITY_LADDER.findIndex((q) => q.name === maxQuality)

  if (maxIndex === -1) return ['1080p']

  // Return all qualities at or below the max resolution
  return QUALITY_LADDER.slice(maxIndex).map((q) => q.name as QualityName)
}
