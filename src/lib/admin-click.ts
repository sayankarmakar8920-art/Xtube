// ─── Admin Logo Click System ─────────────────────────────────────────────────
// Tracks click count in sessionStorage so it survives page reloads.
// Flow: Clicks 1-6 = page refresh, 7th click = open admin login modal.
// Mobile (phones only): Every click = refresh only, admin NEVER accessible.
// Tablet/Desktop/Laptop: Clicks 1-6 = refresh, 7th = admin panel opens.

const ADMIN_CLICK_KEY = 'xtube_admin_clicks'
const ADMIN_TOKEN_KEY = 'admin_token'
const CLICK_WINDOW_MS = 5000  // 5-second window for continuous clicks
const REQUIRED_CLICKS = 7

interface ClickData {
  count: number
  lastTime: number
}

/**
 * Get the current admin click count from sessionStorage.
 * Returns 0 if no data or data is stale (older than 5 seconds).
 */
export function getAdminClickCount(): number {
  if (typeof window === 'undefined') return 0
  try {
    const raw = sessionStorage.getItem(ADMIN_CLICK_KEY)
    if (!raw) return 0
    const data: ClickData = JSON.parse(raw)
    // Stale data? Reset counter
    if (Date.now() - data.lastTime > CLICK_WINDOW_MS) {
      sessionStorage.removeItem(ADMIN_CLICK_KEY)
      return 0
    }
    return data.count
  } catch {
    return 0
  }
}

/**
 * Determine if the current device is a phone (NOT tablet/laptop/desktop).
 * Uses screen.width which doesn't change on rotation/resize.
 * Phones typically have screen.width < 768.
 * Tablets (iPad etc.) have screen.width >= 768.
 */
export function isPhone(): boolean {
  if (typeof window === 'undefined') return false
  // screen.width is physical screen width in CSS pixels (doesn't change with rotation on most devices)
  // Phones: typically < 768 (iPhone 430, Galaxy S 412, etc.)
  // Tablets: typically >= 768 (iPad 810, Galaxy Tab 800, etc.)
  const screenWidth = window.screen.width
  // Also check maxTouchPoints to distinguish touch laptops from tablets
  const hasSmallScreen = screenWidth < 768
  // Additional check: if device has fine pointer (mouse) it's likely laptop/desktop, not phone
  const hasFinePointer = window.matchMedia('(pointer: fine)').matches
  return hasSmallScreen && !hasFinePointer
}

/**
 * Process a logo click for the secret admin unlock system.
 *
 * Returns:
 * - 'reload'   → clicks 1-6 or phone: page should refresh
 * - 'admin'    → 7th continuous click: admin login modal should open (tablet/desktop/laptop)
 * - 'navigate' → admin already logged in: navigate home
 */
export function processAdminClick(isPhoneDevice: boolean): 'reload' | 'admin' | 'navigate' {
  // If admin session already exists, just navigate home
  if (typeof window !== 'undefined' && sessionStorage.getItem(ADMIN_TOKEN_KEY)) {
    return 'navigate'
  }

  // Phone ONLY: always just reload, never track clicks
  // Tablet/Desktop/Laptop: track clicks for admin unlock
  if (isPhoneDevice) {
    sessionStorage.removeItem(ADMIN_CLICK_KEY)
    return 'reload'
  }

  // ─── Desktop / Tablet / Laptop: Track clicks with sessionStorage ───────

  let existingCount = 0
  try {
    const raw = sessionStorage.getItem(ADMIN_CLICK_KEY)
    if (raw) {
      const data: ClickData = JSON.parse(raw)
      // Only keep counting if within the 5-second window
      if (Date.now() - data.lastTime <= CLICK_WINDOW_MS) {
        existingCount = data.count
      }
      // If stale, count resets to 0 (first click of new sequence)
    }
  } catch {
    // Corrupted data, start fresh
  }

  const newCount = existingCount + 1

  if (newCount >= REQUIRED_CLICKS) {
    // ★ 7th click! Open admin modal — DO NOT refresh
    sessionStorage.removeItem(ADMIN_CLICK_KEY)
    return 'admin'
  }

  // Clicks 1-6: save count with timestamp, then reload
  const newData: ClickData = { count: newCount, lastTime: Date.now() }
  sessionStorage.setItem(ADMIN_CLICK_KEY, JSON.stringify(newData))
  return 'reload'
}

/**
 * Clear admin click counter (e.g., after admin modal is dismissed).
 */
export function clearAdminClicks(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(ADMIN_CLICK_KEY)
}

/**
 * Check if admin session is active (token exists in sessionStorage).
 */
export function isAdminSessionActive(): boolean {
  if (typeof window === 'undefined') return false
  return !!sessionStorage.getItem(ADMIN_TOKEN_KEY)
}
