import { NextRequest, NextResponse } from 'next/server'

// ─── In-memory rate limiting ─────────────────────────────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW = 60_000 // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return true
  }

  entry.count++
  if (entry.count > MAX_REQUESTS_PER_WINDOW) {
    return false // Rate limited
  }
  return true
}

// ─── Admin credentials ───────────────────────────────────────────────────────

const ADMIN_EMAIL = 'admin@xtube.com'
const ADMIN_PASSWORD = 'xtube2024'

function generateToken(): string {
  const array = new Uint8Array(32)
  // Use crypto for better randomness
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array)
    return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('')
  }
  // Fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// ─── POST handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { email, password } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Admin ID and Password are required' },
        { status: 400 }
      )
    }

    // Check credentials
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      // Add artificial delay to slow brute force
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Generate secure token
    const token = generateToken()

    return NextResponse.json({
      success: true,
      token,
      admin: { email },
    })
  } catch (error) {
    console.error('Admin auth error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
