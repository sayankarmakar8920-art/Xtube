'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import {
  createClient,
  SupabaseClient,
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js'

// ── Client singleton (browser only) ──────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY)

const globalForSupabase = globalThis as unknown as {
  realtimeClient: SupabaseClient | undefined
}

function getBrowserClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null
  if (!globalForSupabase.realtimeClient) {
    globalForSupabase.realtimeClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      realtime: {
        params: { eventsPerSecond: 10 },
      },
    })
  }
  return globalForSupabase.realtimeClient
}

// ── Context ──────────────────────────────────────────────────────

const RealtimeContext = createContext<SupabaseClient | null>(null)

function useSupabase(): SupabaseClient | null {
  const ctx = useContext(RealtimeContext)
  return ctx
}

// ── Provider ─────────────────────────────────────────────────────

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => getBrowserClient(), [])
  // If Supabase is not configured, render children without provider (no realtime)
  if (!client) return <>{children}</>
  return <RealtimeContext.Provider value={client}>{children}</RealtimeContext.Provider>
}

// ── Types ────────────────────────────────────────────────────────

interface RealtimeOptions<T = any> {
  filter?: string
  schema?: string
  /** Polling interval (ms) when realtime fails. Default: 5000 */
  pollInterval?: number
  initialData?: T[]
}

interface UseRealtimeResult<T> {
  data: T[]
  isLoading: boolean
  error: string | null
}

// ── useRealtimeSubscription ──────────────────────────────────────

export function useRealtimeSubscription<T extends Record<string, unknown> = Record<string, unknown>>(
  table: string,
  options: RealtimeOptions<T> = {}
): UseRealtimeResult<T> {
  const { filter, schema = 'public', initialData } = options
  const client = useSupabase()

  const [data, setData] = useState<T[]>(initialData || [])
  const [isLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Keep state in sync when initialData changes (e.g. after API load completes)
  useEffect(() => {
    if (initialData) {
      setData(initialData)
    }
  }, [initialData])

  // Throttle state updates to max once per 200ms
  const lastEmit = useRef(0)
  const pendingRef = useRef<T[]>([])
  const rafRef = useRef<number | null>(null)

  const throttledSet = useCallback((next: T[]) => {
    const now = Date.now()
    if (now - lastEmit.current >= 200) {
      lastEmit.current = now
      setData(next)
    } else {
      pendingRef.current = next
      if (!rafRef.current) {
        const delay = 200 - (now - lastEmit.current)
        setTimeout(() => {
          lastEmit.current = Date.now()
          setData(pendingRef.current)
          rafRef.current = null
        }, delay)
      }
    }
  }, [])

  // Realtime subscription only — data loading is handled by consuming hooks via API routes
  useEffect(() => {
    if (!client) return // Supabase not configured, skip realtime
    let channel: RealtimeChannel | null = null
    let mounted = true

    const subscribe = () => {
      const channelName = `rt:${table}:${filter ?? 'all'}`
      
      // Remove any existing channel with the same name first
      client.removeChannel(client.channel(channelName))
      
      channel = client
        .channel(channelName)
        .on<T>(
          'postgres_changes',
          { event: '*', schema, table, filter },
          (payload: RealtimePostgresChangesPayload<T>) => {
            if (!mounted) return
            setData((prev) => {
              const next = [...prev]
              if (payload.eventType === 'INSERT') {
                const exists = next.some((r) => (r as Record<string, unknown>).id === (payload.new as Record<string, unknown>).id)
                if (!exists) {
                  next.unshift(payload.new) // Put newest first
                }
              } else if (payload.eventType === 'UPDATE') {
                const oldId = (payload.old as Record<string, unknown>)?.id || (payload.new as Record<string, unknown>)?.id
                const idx = next.findIndex((r) => (r as Record<string, unknown>).id === oldId)
                if (idx !== -1) {
                  next[idx] = payload.new
                } else {
                  next.unshift(payload.new)
                }
              } else if (payload.eventType === 'DELETE') {
                const oldId = (payload.old as Record<string, unknown>)?.id
                if (oldId) {
                  const delIdx = next.findIndex((r) => (r as Record<string, unknown>).id === oldId)
                  if (delIdx !== -1) next.splice(delIdx, 1)
                }
              }
              throttledSet(next)
              return next
            })
          }
        )
        .subscribe((status) => {
          if (!mounted) return
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setError('Realtime connection lost')
          } else if (status === 'SUBSCRIBED') {
            setError(null)
          }
        })
    }

    subscribe()

    return () => {
      mounted = false
      if (channel && client) {
        client.removeChannel(channel)
      }
      if (rafRef.current) {
        clearTimeout(rafRef.current)
        rafRef.current = null
      }
    }
  }, [table, filter, schema, client, throttledSet])

  return { data, isLoading, error }
}

// ── useRealtimePresence ──────────────────────────────────────────

interface PresenceState {
  [key: string]: { user_id?: string; name?: string; online_at: string }[]
}

interface UsePresenceResult {
  onlineUsers: number
  track: (state: Record<string, unknown>) => void
  untrack: () => void
}

export function useRealtimePresence(channelName: string): UsePresenceResult {
  const client = useSupabase()
  const [onlineUsers, setOnlineUsers] = useState(0)
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!client) return // Supabase not configured, skip presence
    let mounted = true
    const channel = client.channel(channelName, {
      config: { presence: { key: '' } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        if (!mounted) return
        const state = channel.presenceState<PresenceState>() as unknown as PresenceState
        setOnlineUsers(Object.keys(state).length)
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      mounted = false
      client.removeChannel(channel)
      channelRef.current = null
    }
  }, [client, channelName])

  const track = useCallback((state: Record<string, unknown>) => {
    channelRef.current?.track({ ...state, online_at: new Date().toISOString() })
  }, [])

  const untrack = useCallback(() => {
    channelRef.current?.untrack()
  }, [])

  return { onlineUsers, track, untrack }
}
