'use client'

import { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Film,
  Upload,
  List,
  Megaphone,
  BarChart3,
  Users,
  Settings,
  LogOut,
  X,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Plus,
  Bell,
  Lock,
  Play,
  Image,
  Popcorn,
  Monitor,
  Layers,
  PanelLeftClose,
  PanelLeft,
  DollarSign,
  FileText,
  Crown,
  ArrowUpFromLine,
} from 'lucide-react'
import { useAppStore, type AdminSection } from '@/lib/store'
import { cachedFetch } from '@/lib/performance/api-cache'
import { useIsMobile } from '@/hooks/use-mobile'
import { AdminDashboard } from './AdminDashboard'
import { VideoManager } from './VideoManager'
import { AdsManager } from './AdsManager'
import { AdminLoginScreen } from './AdminLoginScreen'
import { XtubeLogo } from '@/components/shared/XtubeLogo'

// ─── Dynamic Imports for Admin Sub-pages (Code Splitting) ────────────────────
const UsersPage = lazy(() => import('@/components/admin/UsersPage').then(m => ({ default: m.UsersPage })))
const SettingsPage = lazy(() => import('@/components/admin/SettingsPage').then(m => ({ default: m.SettingsPage })))
const CatalogPage = lazy(() => import('@/components/admin/CatalogPage').then(m => ({ default: m.CatalogPage })))
const VideoAdsAnalytics = lazy(() => import('@/components/admin/VideoAdsAnalytics').then(m => ({ default: m.VideoAdsAnalytics })))
const VideoUploadPage = lazy(() => import('@/components/admin/VideoUploadPage').then(m => ({ default: m.VideoUploadPage })))
const PreRollAdsPage = lazy(() => import('@/components/admin/PreRollAdsPage').then(m => ({ default: m.PreRollAdsPage })))
const MidRollAdsPage = lazy(() => import('@/components/admin/MidRollAdsPage').then(m => ({ default: m.MidRollAdsPage })))
const PostRollAdsPage = lazy(() => import('@/components/admin/PostRollAdsPage').then(m => ({ default: m.PostRollAdsPage })))
const OverlayAdsPage = lazy(() => import('@/components/admin/OverlayAdsPage').then(m => ({ default: m.OverlayAdsPage })))
const PopupAdsPage = lazy(() => import('@/components/admin/PopupAdsPage').then(m => ({ default: m.PopupAdsPage })))
const BannerAdsPage = lazy(() => import('@/components/admin/BannerAdsPage').then(m => ({ default: m.BannerAdsPage })))
const FooterAdsPage = lazy(() => import('@/components/admin/FooterAdsPage').then(m => ({ default: m.FooterAdsPage })))
const HeroAdsPage = lazy(() => import('@/components/admin/HeroAdsPage').then(m => ({ default: m.HeroAdsPage })))
const AllAdsPage = lazy(() => import('@/components/admin/AllAdsPage').then(m => ({ default: m.AllAdsPage })))
const TransactionsPage = lazy(() => import('@/components/admin/TransactionsPage').then(m => ({ default: m.TransactionsPage })))
const ReportsPage = lazy(() => import('@/components/admin/ReportsPage').then(m => ({ default: m.ReportsPage })))

// ─── Custom Hook: Tablet Detection ────────────────────────────────────────────

function useIsTablet() {
  const [isTablet, setIsTablet] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px) and (max-width: 1023px)')
    const onChange = () => {
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024)
    }
    mql.addEventListener('change', onChange)
    onChange()
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return !!isTablet
}

function useIsLaptop() {
  const [isLaptop, setIsLaptop] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px) and (max-width: 1440px)')
    const onChange = () => {
      setIsLaptop(window.innerWidth >= 1024 && window.innerWidth <= 1440)
    }
    mql.addEventListener('change', onChange)
    onChange()
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return !!isLaptop
}

// ─── Navigation Types ─────────────────────────────────────────────────────────

interface NavItem {
  id: AdminSection | string
  label: string
  icon: React.ElementType
  section?: AdminSection
  children?: NavItem[]
}

const navigationItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'dashboard' },
  {
    id: 'video-group',
    label: 'Video',
    icon: Film,
    children: [
      { id: 'all-videos', label: 'All Videos', icon: Film, section: 'all-videos' },
      { id: 'video-upload', label: 'Video Upload', icon: Upload, section: 'video-upload' },
    ],
  },
  { id: 'catalog', label: 'Catalog', icon: List, section: 'catalog' },
  {
    id: 'ads-group',
    label: 'Ads Manager',
    icon: Megaphone,
    children: [
      { id: 'all-ads', label: 'All Ads', icon: Megaphone, section: 'all-ads' },
      { id: 'banner-ads', label: 'Banner Ads', icon: Image, section: 'banner-ads' },
      { id: 'popup-ads', label: 'Popup Ads', icon: Popcorn, section: 'popup-ads' },
      { id: 'footer-ads', label: 'Footer Ads', icon: Monitor, section: 'footer-ads' },
      { id: 'hero-ads', label: 'Hero Ads', icon: Crown, section: 'hero-ads' },
      {
        id: 'video-ads-group',
        label: 'Video Ads',
        icon: Play,
        children: [
          { id: 'pre-roll-ads', label: 'Pre-roll', icon: Play, section: 'pre-roll-ads' },
          { id: 'mid-roll-ads', label: 'Mid-roll', icon: Play, section: 'mid-roll-ads' },
          { id: 'post-roll-ads', label: 'Post-roll', icon: Play, section: 'post-roll-ads' },
          { id: 'overlay-ads', label: 'Overlay', icon: Layers, section: 'overlay-ads' },
          { id: 'video-ads-analytics', label: 'Ads Analytics', icon: BarChart3, section: 'video-ads-analytics' },
        ],
      },
    ],
  },
  { id: 'users', label: 'Users', icon: Users, section: 'users' },
  { id: 'transactions', label: 'Transactions', icon: DollarSign, section: 'transactions' },
  { id: 'reports', label: 'Reports', icon: FileText, section: 'reports' },
  { id: 'settings', label: 'Settings', icon: Settings, section: 'settings' },
]

// ─── Section Title Map ────────────────────────────────────────────────────────

const sectionTitles: Record<AdminSection, string> = {
  dashboard: 'Dashboard',
  'all-videos': 'All Videos',
  'video-upload': 'Video Upload',
  catalog: 'Catalog',
  'all-ads': 'All Ads',
  'banner-ads': 'Banner Ads',
  'popup-ads': 'Popup Ads',
  'footer-ads': 'Footer Ads',
  'hero-ads': 'Hero Ads',
  'pre-roll-ads': 'Pre-roll Ads',
  'mid-roll-ads': 'Mid-roll Ads',
  'post-roll-ads': 'Post-roll Ads',
  'overlay-ads': 'Overlay Ads',
  'video-ads-analytics': 'Video Ads Analytics',
  users: 'Users',
  settings: 'Settings',
  transactions: 'Transactions',
  reports: 'Reports',
}

// ─── Placeholder Components ───────────────────────────────────────────────────

function PlaceholderSection({ title, icon: Icon }: { title: string; icon: React.ElementType }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center gap-4 rounded-2xl border border-xtube-border bg-xtube-card px-12 py-16"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-xtube-red/10">
          <Icon className="h-8 w-8 text-xtube-red" />
        </div>
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <p className="text-sm text-xtube-text-secondary">This section is coming soon.</p>
      </motion.div>
    </div>
  )
}

// ─── Mobile Block Screen ──────────────────────────────────────────────────────

function MobileBlockScreen({ onReturn }: { onReturn: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#050505]"
    >
      {/* Subtle red glow background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-xtube-red/5 blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 px-8 text-center">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <XtubeLogo size="lg" showText={true} showLive={true} />
          <span className="text-lg font-medium text-xtube-text-secondary">.Admin</span>
        </div>

        {/* Lock Icon */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="flex h-20 w-20 items-center justify-center rounded-full border border-xtube-border bg-xtube-card"
        >
          <Lock className="h-10 w-10 text-xtube-red" />
        </motion.div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-white">Admin Panel Not Available on Mobile</h1>
          <p className="max-w-xs text-sm text-xtube-text-secondary">
            Please use a tablet or desktop device to access the admin dashboard.
          </p>
        </div>

        {/* Return Button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onReturn}
          className="mt-2 rounded-xl bg-xtube-red px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-xtube-red-hover"
        >
          Return to Homepage
        </motion.button>
      </div>
    </motion.div>
  )
}

// ─── Sidebar Nav Item ─────────────────────────────────────────────────────────

interface SidebarNavItemProps {
  item: NavItem
  depth: number
  activeSection: AdminSection
  collapsed: boolean
  expandedGroups: Set<string>
  onToggleGroup: (groupId: string) => void
  onSelectSection: (section: AdminSection) => void
  delay: number
}

const SidebarNavItem = memo(function SidebarNavItem({
  item,
  depth,
  activeSection,
  collapsed,
  expandedGroups,
  onToggleGroup,
  onSelectSection,
  delay,
}: SidebarNavItemProps) {
  const hasChildren = item.children && item.children.length > 0
  const isActive = item.section === activeSection
  const isGroupExpanded = expandedGroups.has(item.id)
  const Icon = item.icon

  // Check if any child is active (for parent highlighting)
  const isChildActive = useMemo(() => {
    if (!hasChildren) return false
    const checkActive = (children: NavItem[]): boolean => {
      return children.some(
        (child) =>
          child.section === activeSection ||
          (child.children ? checkActive(child.children) : false)
      )
    }
    return checkActive(item.children!)
  }, [hasChildren, item.children, activeSection])

  const handleClick = () => {
    if (hasChildren) {
      onToggleGroup(item.id)
    } else if (item.section) {
      onSelectSection(item.section)
    }
  }

  // Collapsed mode: just show icon with tooltip
  if (collapsed) {
    return (
      <div className="relative group">
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay }}
          onClick={handleClick}
          className={`relative flex w-full items-center justify-center rounded-lg px-0 py-2.5 transition-colors ${
            isActive
              ? 'bg-xtube-red/10 text-white'
              : isChildActive
                ? 'text-white'
                : 'text-xtube-text-secondary hover:bg-white/5 hover:text-white'
          }`}
        >
          {isActive && (
            <motion.div
              layoutId="admin-active-indicator"
              className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-xtube-red"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
          <Icon
            className={`h-5 w-5 flex-shrink-0 ${
              isActive ? 'text-xtube-red' : isChildActive ? 'text-xtube-red/70' : ''
            }`}
          />
        </motion.button>
        {/* Tooltip */}
        <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-xtube-card px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg border border-xtube-border transition-opacity group-hover:opacity-100">
          {item.label}
        </div>
      </div>
    )
  }

  return (
    <div>
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay, duration: 0.2 }}
        onClick={handleClick}
        className={`group relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors ${
          depth > 0 ? 'pl-6' : ''
        } ${
          isActive
            ? 'bg-xtube-red/10 text-white shadow-[0_0_10px_rgba(229,9,20,0.15)]'
            : isChildActive
              ? 'text-white'
              : 'text-xtube-text-secondary hover:bg-white/5 hover:text-white'
        }`}
      >
        {/* Active left border */}
        {isActive && (
          <motion.div
            layoutId="admin-active-tab"
            className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-xtube-red"
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}

        <Icon
          className={`h-4 w-4 flex-shrink-0 ${
            isActive
              ? 'text-xtube-red'
              : isChildActive
                ? 'text-xtube-red/70'
                : 'text-xtube-text-secondary group-hover:text-white'
          }`}
        />

        <span className="flex-1 text-left">{item.label}</span>

        {/* Expand/collapse chevron */}
        {hasChildren && (
          <motion.div
            animate={{ rotate: isGroupExpanded ? 0 : -90 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0"
          >
            <ChevronDown className="h-4 w-4 text-xtube-text-secondary" />
          </motion.div>
        )}
      </motion.button>

      {/* Children */}
      <AnimatePresence initial={false}>
        {hasChildren && isGroupExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-0.5">
              {item.children!.map((child, idx) => (
                <SidebarNavItem
                  key={child.id}
                  item={child}
                  depth={depth + 1}
                  activeSection={activeSection}
                  collapsed={collapsed}
                  expandedGroups={expandedGroups}
                  onToggleGroup={onToggleGroup}
                  onSelectSection={onSelectSection}
                  delay={delay + (idx + 1) * 0.03}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

// ─── Main AdminPanel Component ────────────────────────────────────────────────

export function AdminPanel() {
  const {
    adminUnlocked,
    adminLoggedIn,
    adminUnlocking,
    adminSection,
    adminSidebarCollapsed,
    setAdminSection,
    setAdminUnlocked,
    setAdminSidebarCollapsed,
    setAdminLoggedIn,
  } = useAppStore()

  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const isLaptop = useIsLaptop()

  // Compute sidebar width based on screen size
  const sidebarExpandedWidth = isLaptop ? 220 : 260

  // Auto-collapse sidebar on tablet
  useEffect(() => {
    if (isTablet) setAdminSidebarCollapsed(true)
  }, [isTablet])

  // Expandable groups state
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['video-group', 'ads-group']))

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }, [])

  // ─── Data Fetching ──────────────────────────────────────────────────────

  const [dashboardData, setDashboardData] = useState<any>(null)
  const [adminVideos, setAdminVideos] = useState<any[]>([])
  const [adminAds, setAdminAds] = useState<any[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  const fetchAdminData = useCallback(async () => {
    if (!dashboardData) setDataLoading(true)
    try {

      const [analyticsData, videosData, adsData] = await Promise.all([
        cachedFetch('admin:analytics', () => fetch('/api/analytics').then(r => r.ok ? r.json() : null), 10_000),
        cachedFetch('admin:videos', () => fetch('/api/videos?limit=100').then(r => r.ok ? r.json() : null), 15_000),
        cachedFetch('admin:ads', () => fetch('/api/ads').then(r => r.ok ? r.json() : null), 10_000),
      ])

      if (analyticsData) setDashboardData(analyticsData)
      if (videosData) setAdminVideos(videosData.videos || [])
      if (adsData) setAdminAds(adsData.ads || [])
    } catch (err) {
      console.error('Error fetching admin data:', err)
    } finally {
      setDataLoading(false)
    }
  }, [])

  useEffect(() => {
    if (adminUnlocked) {
      fetchAdminData()
    }
  }, [adminUnlocked, fetchAdminData])

  // Refresh data when switching sections (but throttled)
  const lastRefetchRef = useRef(0)
  useEffect(() => {
    if (!adminUnlocked) return
    const now = Date.now()
    if (now - lastRefetchRef.current > 5000) { // max once per 5s
      lastRefetchRef.current = now
      fetchAdminData()
    }
  }, [adminSection, adminUnlocked, fetchAdminData])

  // ─── Video Handlers ─────────────────────────────────────────────────────

  const handleVideoUpload = useCallback(
    async (data: any) => {
      try {
        const res = await fetch('/api/videos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (res.ok) fetchAdminData()
      } catch (err) {
        console.error('Error uploading video:', err)
      }
    },
    [fetchAdminData]
  )

  const handleVideoDelete = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/videos/${id}`, { method: 'DELETE' })
        if (res.ok) fetchAdminData()
      } catch (err) {
        console.error('Error deleting video:', err)
      }
    },
    [fetchAdminData]
  )

  const handleVideoTogglePublish = useCallback(
    async (id: string) => {
      const video = adminVideos.find((v) => v.id === id)
      if (!video) return
      try {
        const res = await fetch(`/api/videos/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPublished: !video.isPublished }),
        })
        if (res.ok) fetchAdminData()
      } catch (err) {
        console.error('Error toggling video publish:', err)
      }
    },
    [adminVideos, fetchAdminData]
  )

  // ─── Ad Handlers ────────────────────────────────────────────────────────

  const handleAdCreate = useCallback(
    async (data: any) => {
      try {
        const res = await fetch('/api/ads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (res.ok) fetchAdminData()
      } catch (err) {
        console.error('Error creating ad:', err)
      }
    },
    [fetchAdminData]
  )

  const handleAdDelete = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/ads?id=${id}`, { method: 'DELETE' })
        if (res.ok) fetchAdminData()
      } catch (err) {
        console.error('Error deleting ad:', err)
      }
    },
    [fetchAdminData]
  )

  const handleAdToggle = useCallback(
    async (id: string) => {
      const ad = adminAds.find((a) => a.id === id)
      if (!ad) return
      try {
        const res = await fetch('/api/ads', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, isActive: !ad.isActive }),
        })
        if (res.ok) fetchAdminData()
      } catch (err) {
        console.error('Error toggling ad:', err)
      }
    },
    [adminAds, fetchAdminData]
  )

  // ─── Close Handler ──────────────────────────────────────────────────────

  const handleClose = useCallback(() => {
    setAdminUnlocked(false)
    setAdminLoggedIn(false)
    localStorage.removeItem('admin_token')
    sessionStorage.removeItem('admin_token')
  }, [setAdminUnlocked, setAdminLoggedIn])

  // ─── Content Rendering ─────────────────────────────────────────────────

  const adsSections: AdminSection[] = [
    'all-ads',
    'banner-ads',
    'popup-ads',
    'footer-ads',
    'hero-ads',
    'pre-roll-ads',
    'mid-roll-ads',
    'post-roll-ads',
    'overlay-ads',
    'video-ads-analytics',
  ]

  const renderContent = () => {
    const content = (() => {
      switch (adminSection) {
        case 'dashboard':
          return <AdminDashboard data={dashboardData} loading={dataLoading} />
        case 'all-videos':
        return (
          <VideoManager
            videos={adminVideos.map((v) => ({
              id: v.id,
              title: v.title,
              thumbnail: v.thumbnail,
              category: v.category,
              views: v.views,
              duration: v.duration,
              isPublished: v.isPublished,
              createdAt: v.createdAt,
            }))}
            onUpload={handleVideoUpload}
            onDelete={handleVideoDelete}
            onTogglePublish={handleVideoTogglePublish}
            loading={dataLoading}
          />
        )
      case 'video-upload':
        return <VideoUploadPage />
      case 'all-ads':
        return <AllAdsPage />
      case 'pre-roll-ads':
        return <PreRollAdsPage />
      case 'mid-roll-ads':
        return <MidRollAdsPage />
      case 'post-roll-ads':
        return <PostRollAdsPage />
      case 'overlay-ads':
        return <OverlayAdsPage />
      case 'popup-ads':
        return <PopupAdsPage />
      case 'banner-ads':
        return <BannerAdsPage />
      case 'footer-ads':
        return <FooterAdsPage />
      case 'hero-ads':
        return <HeroAdsPage />
      case 'catalog':
        return <CatalogPage />
      case 'users':
        return <UsersPage />
      case 'settings':
        return <SettingsPage />
      case 'transactions':
        return <TransactionsPage />
      case 'reports':
        return <ReportsPage />
      case 'video-ads-analytics':
        return <VideoAdsAnalytics />
      default:
        if (adsSections.includes(adminSection)) {
          return (
            <AdsManager
              ads={adminAds.map((a) => ({
                id: a.id,
                type: a.type,
                position: a.position,
                title: a.title,
                imageUrl: a.imageUrl,
                impressions: a.impressions,
                clicks: a.clicks,
                revenue: a.revenue,
                isActive: a.isActive,
                createdAt: a.createdAt,
              }))}
              onCreate={handleAdCreate}
              onDelete={handleAdDelete}
              onToggle={handleAdToggle}
              loading={dataLoading}
            />
          )
        }
        return <AdminDashboard data={dashboardData} loading={dataLoading} />
    }
    })()

    return (
      <Suspense fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-xtube-red border-t-transparent" />
        </div>
      }>
        {content}
      </Suspense>
    )
  }

  // ─── Main Render ────────────────────────────────────────────────────────

  return (
    <>
      {/* ─── Cinematic Unlock Animation Overlay ─── */}
      <AnimatePresence>
        {adminUnlocking && (
          <motion.div
            key="admin-unlock-animation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black"
          >
            {/* Red glow pulse */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [0, 1.5, 2],
                opacity: [0, 0.6, 0],
              }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              className="absolute h-[400px] w-[400px] rounded-full bg-xtube-red blur-[120px]"
            />
            {/* Secondary glow ring */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [0, 1.2, 1.8],
                opacity: [0, 0.3, 0],
              }}
              transition={{ duration: 1.0, ease: 'easeOut', delay: 0.1 }}
              className="absolute h-[600px] w-[600px] rounded-full border border-xtube-red/30"
            />
            {/* Logo reveal */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="relative z-10 flex flex-col items-center gap-4"
            >
              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(255,0,0,0.3)',
                    '0 0 60px rgba(255,0,0,0.6)',
                    '0 0 100px rgba(255,0,0,0.3)',
                  ],
                }}
                transition={{ duration: 0.8, ease: 'easeInOut' }}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FF0000]"
              >
                <span className="text-2xl font-black text-white">x</span>
              </motion.div>
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
                className="text-lg font-extrabold text-white"
              >
                <span className="text-white">Xtube</span>{' '}
                <span className="text-[#FF0000]">Live</span>{' '}
                <span className="text-xtube-text-secondary font-medium">Admin Access</span>
              </motion.span>
            </motion.div>
            {/* Dark fade overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.3 }}
              className="absolute inset-0 bg-black"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Admin Panel ─── */}
      <AnimatePresence>
        {adminUnlocked && !adminLoggedIn && (
        <motion.div
          key="admin-login"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50"
        >
          <AdminLoginScreen />
        </motion.div>
      )}
      </AnimatePresence>

      <AnimatePresence>
        {adminUnlocked && adminLoggedIn && (
        <motion.div
          key="admin-panel"
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-50 flex bg-[#050505]"
        >
          {/* Mobile Block Screen */}
          {isMobile && <MobileBlockScreen onReturn={handleClose} />}

          {/* Desktop/Tablet Layout */}
          {!isMobile && (
            <>
              {/* ── Left Sidebar ── */}
              <motion.aside
                animate={{ width: adminSidebarCollapsed ? 64 : sidebarExpandedWidth }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                style={{ willChange: 'width' }}
                className="relative flex flex-shrink-0 flex-col border-r border-xtube-border bg-[#0a0a0a] overflow-hidden"
              >
                {/* Sidebar Header */}
                <div className="flex h-14 flex-shrink-0 items-center justify-between border-b border-xtube-border px-3">
                  <AnimatePresence mode="wait">
                    {!adminSidebarCollapsed ? (
                      <motion.div
                        key="full-logo"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="flex items-center gap-2.5"
                      >
                        <XtubeLogo size="sm" showText={true} showLive={false} />
                        <span className="text-xs font-medium text-white/30">.Admin</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="collapsed-logo"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="flex items-center justify-center w-full"
                      >
                        <XtubeLogo size="sm" showText={false} />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!adminSidebarCollapsed && (
                    <button
                      onClick={handleClose}
                      className="rounded-lg p-1.5 text-xtube-text-secondary transition-colors hover:bg-white/10 hover:text-white"
                      aria-label="Close admin panel"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-2 space-y-0.5 no-scrollbar compact-scrollbar">
                  {navigationItems.map((item, idx) => (
                    <SidebarNavItem
                      key={item.id}
                      item={item}
                      depth={0}
                      activeSection={adminSection}
                      collapsed={adminSidebarCollapsed}
                      expandedGroups={expandedGroups}
                      onToggleGroup={toggleGroup}
                      onSelectSection={setAdminSection}
                      delay={idx * 0.04}
                    />
                  ))}
                </nav>

                {/* Sidebar Footer - Logout */}
                <div className="flex-shrink-0 border-t border-xtube-border p-2">
                  {adminSidebarCollapsed ? (
                    <div className="relative group">
                      <button
                        onClick={handleClose}
                        className="flex w-full items-center justify-center rounded-lg px-0 py-2.5 text-xtube-text-secondary transition-colors hover:bg-xtube-red/10 hover:text-xtube-red"
                      >
                        <LogOut className="h-5 w-5" />
                      </button>
                      <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-xtube-card px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg border border-xtube-border transition-opacity group-hover:opacity-100">
                        Logout
                      </div>
                    </div>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={handleClose}
                      className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-xtube-text-secondary transition-colors hover:bg-xtube-red/10 hover:text-xtube-red"
                    >
                      <LogOut className="h-4 w-4 flex-shrink-0" />
                      <span>Logout</span>
                    </motion.button>
                  )}
                </div>

                {/* Collapse/Expand Toggle */}
                <button
                  onClick={() => setAdminSidebarCollapsed(!adminSidebarCollapsed)}
                  className="absolute -right-3 top-16 z-10 flex h-5 w-5 items-center justify-center rounded-full border border-xtube-border bg-xtube-card text-xtube-text-secondary shadow-md transition-colors hover:bg-white/10 hover:text-white"
                  aria-label={adminSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  {adminSidebarCollapsed ? (
                    <ChevronRight className="h-3 w-3" />
                  ) : (
                    <ChevronLeft className="h-3 w-3" />
                  )}
                </button>
              </motion.aside>

              {/* ── Main Content Area ── */}
              <div className="flex flex-1 flex-col overflow-hidden">
                {/* Top Header */}
                <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-white/5 bg-[#0a0a0a] px-3 md:px-5">
                  {/* Left: Hamburger + Title */}
                  <div className="flex items-center gap-3">
                    <motion.button
                      onClick={() => setAdminSidebarCollapsed(!adminSidebarCollapsed)}
                      className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                      aria-label="Toggle sidebar"
                    >
                      {adminSidebarCollapsed ? (
                        <PanelLeft className="h-5 w-5" />
                      ) : (
                        <PanelLeftClose className="h-5 w-5" />
                      )}
                    </motion.button>
                    <div>
                      <h1 className="text-base font-bold text-white">
                        {sectionTitles[adminSection] || 'Admin Dashboard'}
                      </h1>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 md:gap-3">
                    {/* Create New Ad Button */}
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setAdminSection('all-ads')}
                      className="hidden items-center gap-1.5 rounded-lg bg-xtube-red px-3 py-1.5 text-xs font-semibold text-white shadow-[0_0_12px_rgba(229,9,20,0.3)] transition-colors hover:bg-xtube-red-hover sm:flex"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      New Ad
                    </motion.button>

                    {/* Notification Bell with badge count */}
                    <motion.button
                      className="relative rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                      aria-label="Notifications"
                    >
                      <Bell className="h-5 w-5" />
                      {/* Notification count badge */}
                      <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-xtube-red text-[9px] font-bold text-white shadow-[0_0_8px_rgba(229,9,20,0.6)]">
                        12
                      </span>
                    </motion.button>

                    {/* Admin Avatar + Dropdown */}
                    <motion.button
                      className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/5"
                      aria-label="Admin profile"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-xtube-red to-red-700 shadow-[0_0_10px_rgba(229,9,20,0.3)]">
                        <span className="text-xs font-bold text-white">A</span>
                      </div>
                      <div className="hidden sm:block text-left">
                        <p className="text-xs font-semibold text-white">Admin</p>
                        <p className="text-[10px] text-white/30">Super Admin</p>
                      </div>
                      <ChevronDown className="hidden h-3 w-3 text-white/40 sm:block" />
                    </motion.button>
                  </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto bg-xtube-bg compact-scrollbar">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={adminSection}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.1 }}
                    >
                      {renderContent()}
                    </motion.div>
                  </AnimatePresence>
                </main>
              </div>
            </>
          )}
        </motion.div>
      )}
      </AnimatePresence>
    </>
  )
}
