'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { useRealtimeSubscription } from '@/lib/supabase/realtime'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AdItem {
  id: string
  type: string
  position: string
  title: string
  imageUrl: string
  linkUrl?: string | null
  impressions: number
  clicks: number
  revenue: number
  isActive: boolean
  startDate?: string | null
  endDate?: string | null
  frequency?: number
  mediaUrl?: string | null
  mediaFormat?: string
  adDuration?: number
  skipAfter?: number
  quality?: string
  createdAt: string
  updatedAt: string
  videoAds?: Array<{
    id: string
    videoId: string
    position: string
    timing: number
  }>
}

export interface AdsManagerResult {
  ads: AdItem[]
  loading: boolean
  error: string | null
  refetch: () => void
  createAd: (data: Record<string, unknown>) => Promise<boolean>
  updateAd: (id: string, data: Record<string, unknown>) => Promise<boolean>
  deleteAd: (id: string) => Promise<boolean>
  toggleAd: (id: string) => Promise<boolean>
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAdsManager(options?: {
  type?: string
  position?: string
  admin?: boolean
}): AdsManagerResult {
  const { type, position, admin = true } = options ?? {}

  // Realtime subscription for Ad table changes
  const { data: realtimeRows, isLoading: realtimeLoading } = useRealtimeSubscription<Record<string, unknown>>('Ad')

  // Full ad data from API (with videoAds included)
  const [ads, setAds] = useState<AdItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchIdRef = useRef(0)

  const fetchAds = useCallback(async () => {
    const fetchId = ++fetchIdRef.current
    setError(null)
    try {
      const params = new URLSearchParams()
      if (admin) params.set('admin', 'true')
      if (type) params.set('type', type)
      if (position) params.set('position', position)
      params.set('limit', '200')

      const res = await fetch(`/api/ads?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch ads')
      const data = await res.json()
      if (fetchId === fetchIdRef.current) {
        setAds(data.ads || [])
        setLoading(false)
      }
    } catch (err) {
      if (fetchId === fetchIdRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch ads')
        setLoading(false)
      }
    }
  }, [type, position, admin])

  // Initial fetch - use queueMicrotask to avoid synchronous setState in effect
  useEffect(() => {
    setLoading(true)
    queueMicrotask(() => { fetchAds() })
  }, [fetchAds])

  // Refetch when realtime data changes
  const prevRealtimeCount = useRef(0)
  useEffect(() => {
    if (realtimeRows.length !== prevRealtimeCount.current && prevRealtimeCount.current > 0) {
      queueMicrotask(() => { fetchAds() })
    }
    prevRealtimeCount.current = realtimeRows.length
  }, [realtimeRows, fetchAds])

  const createAd = useCallback(async (data: Record<string, unknown>): Promise<boolean> => {
    try {
      const res = await fetch('/api/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create ad')
      fetchAds()
      toast.success('Ad created successfully')
      return true
    } catch (err) {
      console.error('Error creating ad:', err)
      toast.error('Failed to create ad')
      return false
    }
  }, [fetchAds])

  const updateAd = useCallback(async (id: string, data: Record<string, unknown>): Promise<boolean> => {
    try {
      const res = await fetch('/api/ads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      })
      if (!res.ok) throw new Error('Failed to update ad')
      fetchAds()
      toast.success('Ad updated successfully')
      return true
    } catch (err) {
      console.error('Error updating ad:', err)
      toast.error('Failed to update ad')
      return false
    }
  }, [fetchAds])

  const deleteAd = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/ads?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete ad')
      fetchAds()
      toast.success('Ad deleted successfully')
      return true
    } catch (err) {
      console.error('Error deleting ad:', err)
      toast.error('Failed to delete ad')
      return false
    }
  }, [fetchAds])

  const toggleAd = useCallback(async (id: string): Promise<boolean> => {
    const ad = ads.find((a) => a.id === id)
    if (!ad) return false
    try {
      const res = await fetch('/api/ads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !ad.isActive }),
      })
      if (!res.ok) throw new Error('Failed to toggle ad')
      fetchAds()
      toast.success(ad.isActive ? 'Ad paused' : 'Ad activated')
      return true
    } catch (err) {
      console.error('Error toggling ad:', err)
      toast.error('Failed to toggle ad')
      return false
    }
  }, [ads, fetchAds])

  return {
    ads,
    loading: loading || realtimeLoading,
    error,
    refetch: fetchAds,
    createAd,
    updateAd,
    deleteAd,
    toggleAd,
  }
}

// ─── Hero/Footer Ads Hook ────────────────────────────────────────────────────

export interface HeroAdItem {
  id: string
  title: string
  description?: string | null
  category?: string | null
  mediaUrl: string
  thumbnailUrl?: string | null
  adType: string
  mediaFormat: string
  isActive: boolean
  displayOrder: number
  impressions: number
  clicks: number
  ctr: number
  startDate?: string | null
  endDate?: string | null
  createdAt: string
  updatedAt: string
}

export interface FooterAdItem {
  id: string
  title: string
  mediaUrl: string
  thumbnailUrl?: string | null
  adType: string
  mediaFormat: string
  isActive: boolean
  linkUrl?: string | null
  impressions: number
  clicks: number
  ctr: number
  startDate?: string | null
  endDate?: string | null
  createdAt: string
  updatedAt: string
}

export function useHeroAds() {
  const [ads, setAds] = useState<HeroAdItem[]>([])
  const [loading, setLoading] = useState(true)
  const { data: realtimeRows } = useRealtimeSubscription<Record<string, unknown>>('HeroAd')

  const fetchAds = useCallback(async () => {
    try {
      const res = await fetch('/api/hero-ads')
      if (res.ok) {
        const data = await res.json()
        setAds(data.heroAds || [])
      }
      setLoading(false)
    } catch {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => { fetchAds() })
  }, [fetchAds])

  const prevCount = useRef(0)
  useEffect(() => {
    if (realtimeRows.length !== prevCount.current && prevCount.current > 0) {
      queueMicrotask(() => { fetchAds() })
    }
    prevCount.current = realtimeRows.length
  }, [realtimeRows, fetchAds])

  const createAd = useCallback(async (data: Record<string, unknown>) => {
    const res = await fetch('/api/hero-ads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      fetchAds()
      toast.success('Hero ad created successfully')
    } else {
      toast.error('Failed to create hero ad')
    }
    return res.ok
  }, [fetchAds])

  const updateAd = useCallback(async (id: string, data: Record<string, unknown>) => {
    const res = await fetch('/api/hero-ads', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data }),
    })
    if (res.ok) {
      fetchAds()
      toast.success('Hero ad updated successfully')
    } else {
      toast.error('Failed to update hero ad')
    }
    return res.ok
  }, [fetchAds])

  const deleteAd = useCallback(async (id: string) => {
    const res = await fetch('/api/hero-ads', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      fetchAds()
      toast.success('Hero ad deleted successfully')
    } else {
      toast.error('Failed to delete hero ad')
    }
    return res.ok
  }, [fetchAds])

  const toggleAd = useCallback(async (id: string) => {
    const ad = ads.find(a => a.id === id)
    if (!ad) return false
    const res = await fetch('/api/hero-ads', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive: !ad.isActive }),
    })
    if (res.ok) {
      fetchAds()
      toast.success(ad.isActive ? 'Hero ad paused' : 'Hero ad activated')
    } else {
      toast.error('Failed to toggle hero ad')
    }
    return res.ok
  }, [ads, fetchAds])

  return { ads, loading, refetch: fetchAds, createAd, updateAd, deleteAd, toggleAd }
}

export function useFooterAds() {
  const [ads, setAds] = useState<FooterAdItem[]>([])
  const [loading, setLoading] = useState(true)
  const { data: realtimeRows } = useRealtimeSubscription<Record<string, unknown>>('FooterAd')

  const fetchAds = useCallback(async () => {
    try {
      const res = await fetch('/api/footer-ads')
      if (res.ok) {
        const data = await res.json()
        setAds(data.footerAds || [])
      }
      setLoading(false)
    } catch {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => { fetchAds() })
  }, [fetchAds])

  const prevCount = useRef(0)
  useEffect(() => {
    if (realtimeRows.length !== prevCount.current && prevCount.current > 0) {
      queueMicrotask(() => { fetchAds() })
    }
    prevCount.current = realtimeRows.length
  }, [realtimeRows, fetchAds])

  const createAd = useCallback(async (data: Record<string, unknown>) => {
    const res = await fetch('/api/footer-ads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      fetchAds()
      toast.success('Footer ad created successfully')
    } else {
      toast.error('Failed to create footer ad')
    }
    return res.ok
  }, [fetchAds])

  const updateAd = useCallback(async (id: string, data: Record<string, unknown>) => {
    const res = await fetch('/api/footer-ads', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data }),
    })
    if (res.ok) {
      fetchAds()
      toast.success('Footer ad updated successfully')
    } else {
      toast.error('Failed to update footer ad')
    }
    return res.ok
  }, [fetchAds])

  const deleteAd = useCallback(async (id: string) => {
    const res = await fetch('/api/footer-ads', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      fetchAds()
      toast.success('Footer ad deleted successfully')
    } else {
      toast.error('Failed to delete footer ad')
    }
    return res.ok
  }, [fetchAds])

  const toggleAd = useCallback(async (id: string) => {
    const ad = ads.find(a => a.id === id)
    if (!ad) return false
    const res = await fetch('/api/footer-ads', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive: !ad.isActive }),
    })
    if (res.ok) {
      fetchAds()
      toast.success(ad.isActive ? 'Footer ad paused' : 'Footer ad activated')
    } else {
      toast.error('Failed to toggle footer ad')
    }
    return res.ok
  }, [ads, fetchAds])

  return { ads, loading, refetch: fetchAds, createAd, updateAd, deleteAd, toggleAd }
}
