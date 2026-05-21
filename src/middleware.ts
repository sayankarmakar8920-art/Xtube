import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ─── CORS Configuration ──────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:81',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:81',
]

const DYNAMIC_ORIGIN_SUFFIXES = [
  '.space-z.ai',   // Z.ai preview panel
  '.z.ai',         // Z.ai domain
]

function isOriginAllowed(origin: string): boolean {
  // Check exact matches
  if (ALLOWED_ORIGINS.includes(origin)) return true
  // Check dynamic suffixes (e.g., preview-chat-xxx.space-z.ai)
  return DYNAMIC_ORIGIN_SUFFIXES.some(suffix => origin.endsWith(suffix))
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const origin = request.headers.get('origin') || ''

  // Only handle API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // ── Handle OPTIONS preflight ────────────────────────────────────────
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 })

    if (origin && isOriginAllowed(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    } else {
      response.headers.set('Access-Control-Allow-Origin', '*')
    }

    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Cache-Control')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Max-Age', '86400') // 24 hours
    response.headers.set('Vary', 'Origin')

    return response
  }

  // ── Handle actual requests ──────────────────────────────────────────
  const response = NextResponse.next()

  if (origin && isOriginAllowed(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  } else {
    response.headers.set('Access-Control-Allow-Origin', '*')
  }

  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Cache-Control')
  response.headers.set('Vary', 'Origin')

  return response
}

export const config = {
  matcher: '/api/:path*',
}
