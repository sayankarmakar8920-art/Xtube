'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  Home,
  TrendingUp,
  LayoutGrid,
  Bookmark,
  Clock,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { useAppStore, type ViewMode } from '@/lib/store'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'
import { XtubeLogo } from '@/components/shared/XtubeLogo'

interface NavItem {
  icon: React.ElementType
  label: string
  view: ViewMode
}

const navItems: NavItem[] = [
  { icon: Home, label: 'Home', view: 'home' },
  { icon: TrendingUp, label: 'Trending', view: 'trending' },
  { icon: LayoutGrid, label: 'Categories', view: 'category' },
  { icon: Bookmark, label: 'Bookmarks', view: 'bookmarks' },
  { icon: Clock, label: 'History', view: 'history' },
]

export function Sidebar() {
  const { currentView, sidebarCollapsed, setView, toggleSidebar } = useAppStore()

  // Responsive sidebar width: smaller on tablet (md), full on desktop (lg)
  const expandedWidth = 180 // compact for tablet, works well on desktop too

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 64 : expandedWidth }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-xtube-border bg-[#0a0a0a] md:flex"
    >
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-xtube-border px-3">
        <XtubeLogo
          size="sm"
          showText={!sidebarCollapsed}
          showLive={!sidebarCollapsed}
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {navItems.map((item) => {
          const isActive = currentView === item.view
          const Icon = item.icon

          const navButton = (
            <motion.button
              key={item.view}
              onClick={() => setView(item.view)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`group relative flex w-full items-center gap-2.5 overflow-hidden rounded-lg px-2.5 py-2 transition-colors duration-200 ${
                isActive
                  ? 'bg-xtube-red/10 text-white'
                  : 'text-xtube-text-secondary hover:bg-white/5 hover:text-white'
              }`}
            >
              {/* Active left border accent */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-indicator"
                  className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-xtube-red"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}

              {/* Hover glass effect */}
              <div className="absolute inset-0 rounded-lg opacity-0 transition-opacity duration-200 group-hover:opacity-100 bg-white/[0.03] backdrop-blur-sm" />

              {/* Red glow on active */}
              {isActive && (
                <div className="absolute inset-0 rounded-lg opacity-50 red-glow-subtle" />
              )}

              <Icon
                className={`relative z-10 h-4 w-4 flex-shrink-0 ${
                  isActive ? 'text-xtube-red' : 'text-xtube-text-secondary group-hover:text-white'
                }`}
              />
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className={`relative z-10 whitespace-nowrap text-xs font-medium ${
                      isActive ? 'text-white' : ''
                    }`}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          )

          // When collapsed, wrap with tooltip
          if (sidebarCollapsed) {
            return (
              <Tooltip key={item.view}>
                <TooltipTrigger asChild>{navButton}</TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            )
          }

          return navButton
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-xtube-border p-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              onClick={toggleSidebar}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-2.5 py-2 text-xtube-text-secondary transition-colors hover:bg-white/5 hover:text-white"
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? (
                <ChevronsRight className="h-5 w-5" />
              ) : (
                <>
                  <ChevronsLeft className="h-5 w-5" />
                  <AnimatePresence>
                    {!sidebarCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="text-sm"
                      >
                        Collapse
                      </motion.span>
                    )}
                  </AnimatePresence>
                </>
              )}
            </motion.button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {sidebarCollapsed ? 'Expand' : 'Collapse'}
          </TooltipContent>
        </Tooltip>
      </div>
    </motion.aside>
  )
}
