import { create } from 'zustand'

export type ViewMode = 'home' | 'trending' | 'category' | 'bookmarks' | 'history' | 'video' | 'admin' | 'search'

export type AdminSection =
  | 'dashboard'
  | 'all-videos'
  | 'video-upload'
  | 'catalog'
  | 'all-ads'
  | 'banner-ads'
  | 'popup-ads'
  | 'footer-ads'
  | 'hero-ads'
  | 'pre-roll-ads'
  | 'mid-roll-ads'
  | 'post-roll-ads'
  | 'overlay-ads'
  | 'video-ads-analytics'
  | 'users'
  | 'settings'
  | 'transactions'
  | 'reports'

interface AppState {
  // Navigation
  currentView: ViewMode
  selectedCategory: string | null
  selectedVideoId: string | null
  searchQuery: string

  // Sidebar
  sidebarCollapsed: boolean
  mobileMenuOpen: boolean

  // Admin
  adminUnlocked: boolean
  adminLoggedIn: boolean
  adminClickCount: number
  adminSection: AdminSection
  adminSidebarCollapsed: boolean
  adminUnlocking: boolean // cinematic animation state
  showAdminModal: boolean // login modal overlay
  _adminClickTimer: ReturnType<typeof setTimeout> | null // internal timer ref

  // Video Player
  theaterMode: boolean

  // Actions
  setView: (view: ViewMode) => void
  setSelectedCategory: (category: string | null) => void
  setSelectedVideoId: (id: string | null) => void
  setSearchQuery: (query: string) => void
  toggleSidebar: () => void
  setMobileMenuOpen: (open: boolean) => void
  incrementAdminClick: (isDesktopOrTablet: boolean) => void
  setAdminUnlocked: (unlocked: boolean) => void
  setAdminLoggedIn: (loggedIn: boolean) => void
  setAdminSection: (section: AdminSection) => void
  setAdminSidebarCollapsed: (collapsed: boolean) => void
  setShowAdminModal: (show: boolean) => void
  setTheaterMode: (mode: boolean) => void
  navigateToVideo: (videoId: string) => void
  goBack: () => void
}

const viewHistory: ViewMode[] = ['home']

export const useAppStore = create<AppState>((set, get) => ({
  // Navigation
  currentView: 'home',
  selectedCategory: null,
  selectedVideoId: null,
  searchQuery: '',

  // Sidebar
  sidebarCollapsed: false,
  mobileMenuOpen: false,

  // Admin
  adminUnlocked: false,
  adminLoggedIn: false,
  adminClickCount: 0,
  adminSection: 'dashboard',
  adminSidebarCollapsed: false,
  adminUnlocking: false,
  showAdminModal: false,

  // Video Player
  theaterMode: false,

  // Actions
  setView: (view) => {
    viewHistory.push(get().currentView)
    set({ currentView: view })
  },

  setSelectedCategory: (category) => set({ selectedCategory: category }),

  setSelectedVideoId: (id) => set({ selectedVideoId: id }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),

  // Track click reset timer to avoid stacking timeouts
  _adminClickTimer: null as ReturnType<typeof setTimeout> | null,

  incrementAdminClick: (isDesktopOrTablet: boolean) => {
    // Mobile users can NEVER unlock admin - just navigate home
    if (!isDesktopOrTablet) {
      set({ adminClickCount: 0, currentView: 'home', selectedVideoId: null })
      return
    }

    const state = get()
    // If already unlocked, just go home
    if (state.adminUnlocked) {
      set({ currentView: 'home', selectedVideoId: null })
      return
    }
    // If modal is already open, don't process more clicks
    if (state.showAdminModal || state.adminUnlocking) return

    const newCount = state.adminClickCount + 1

    if (newCount >= 7) {
      // 7th click: open admin login modal
      set({ adminClickCount: 0, adminUnlocking: true })

      // Short cinematic animation then show modal
      setTimeout(() => {
        set({ adminUnlocking: false, showAdminModal: true })
      }, 600)
    } else {
      set({ adminClickCount: newCount })

      // Clear existing timer
      if (state._adminClickTimer) {
        clearTimeout(state._adminClickTimer)
      }

      // Reset after 5 seconds if not completed
      const timer = setTimeout(() => {
        if (get().adminClickCount < 7 && !get().adminUnlocked && !get().showAdminModal) {
          set({ adminClickCount: 0, _adminClickTimer: null })
        }
      }, 5000)
      set({ _adminClickTimer: timer })
    }
  },

  setAdminUnlocked: (unlocked) => set({ adminUnlocked: unlocked }),

  setAdminLoggedIn: (loggedIn) => set({ adminLoggedIn: loggedIn }),

  setAdminSection: (section) => set({ adminSection: section }),

  setAdminSidebarCollapsed: (collapsed) => set({ adminSidebarCollapsed: collapsed }),

  setShowAdminModal: (show) => set({ showAdminModal: show }),

  setTheaterMode: (mode) => set({ theaterMode: mode }),

  navigateToVideo: (videoId) => {
    viewHistory.push(get().currentView)
    set({ selectedVideoId: videoId, currentView: 'video' })
  },

  goBack: () => {
    const lastView = viewHistory.pop() || 'home'
    set({ currentView: lastView, selectedVideoId: lastView !== 'video' ? null : get().selectedVideoId })
  },
}))
