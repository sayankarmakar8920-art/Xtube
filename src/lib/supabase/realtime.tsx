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

const RealtimeContext = createContext<SupabaseClient | null>(null)

function useSupabase(): SupabaseClient | null {
  const ctx = useContext(RealtimeContext)
  return ctx
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => getBrowserClient(), [])
  if (!client) return <>{children}</>
  return <RealtimeContext.Provider value={client}>{children}</RealtimeContext.Provider>
}

interface RealtimeOptions<T = any> {
  filter?: string
  schema?: string
  pollInterval?: number
  initialData?: T[]
}

interface UseRealtimeResult<T> {
  data: T[]
  isLoading: boolean
  error: string | null
}

export function useRealtimeSubscription<T extends Record<string, unknown> = Record<string, unknown>>(
  table: string,
  options: RealtimeOptions<T> = {}
): UseRealtimeResult<T> {
  const { filter, schema = 'public', initialData } = options
  const client = useSupabase()

  const [data, setData] = useState<T[]>(initialData || [])
  const [isLoading, setIsLoading] = useState(!initialData?.length)
  const [error, setError] = useState<string | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (initialData) {
      setData(initialData)
      setIsLoading(false)
    }
  }, [initialData])

  useEffect(() => {
    if (!client) {
      setIsLoading(false)
      return
    }

    let mounted = true
    const channelName = `rt:${table}:${filter ?? 'all'}`

    const channel = client
      .channel(channelName)
      .on<T>(
        'postgres_changes',
        { event: '*', schema, table, filter },
        (payload: RealtimePostgresChangesPayload<T>) => {
          if (!mounted) return

          setData((prev) => {
            const existing = [...prev]
            if (payload.eventType === 'INSERT') {
              const newId = (payload.new as Record<string, unknown>)?.id
              if (newId && !existing.some((r) => (r as Record<string, unknown>).id === newId)) {
                existing.unshift(payload.new)
              }
            } else if (payload.eventType === 'UPDATE') {
              const newId = (payload.new as Record<string, unknown>)?.id
              const idx = newId ? existing.findIndex((r) => (r as Record<string, unknown>).id === newId) : -1
              if (idx !== -1) {
                existing[idx] = payload.new
              } else {
                existing.unshift(payload.new)
              }
            } else if (payload.eventType === 'DELETE') {
              const oldId = (payload.old as Record<string, unknown>)?.id
              if (oldId) {
                const delIdx = existing.findIndex((r) => (r as Record<string, unknown>).id === oldId)
                if (delIdx !== -1) existing.splice(delIdx, 1)
              }
            }
            return existing
          })
        }
      )
      .subscribe((status) => {
        if (!mounted) return
        if (status === 'SUBSCRIBED') {
          setIsLoading(false)
          setError(null)
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setError('Realtime connection lost')
        }
      })

    channelRef.current = channel

    return () => {
      mounted = false
      if (channelRef.current) {
        client.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [table, filter, schema, client])

  return { data, isLoading, error }
}

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
    if (!client) return
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
