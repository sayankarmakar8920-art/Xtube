'use client'

import { motion } from 'framer-motion'
import { Home, TrendingUp, LayoutGrid, Bookmark, User } from 'lucide-react'
import { useAppStore, type ViewMode } from '@/lib/store'

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
  { icon: User, label: 'Profile', view: 'history' },
]

export function BottomNav() {
  const { currentView, setView } = useAppStore()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* Glassmorphism background */}
      <div className="glass-strong border-t border-xtube-border">
        <div className="flex h-16 items-center justify-around px-2">
          {navItems.map((item) => {
            const isActive = currentView === item.view
            const Icon = item.icon

            return (
              <motion.button
                key={item.view}
                onClick={() => setView(item.view)}
                whileTap={{ scale: 0.9 }}
                className="relative flex min-w-0 flex-1 flex-col items-center gap-1 py-1"
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Active indicator dot */}
                {isActive && (
                  <motion.div
                    layoutId="bottomnav-active-dot"
                    className="absolute -top-1 h-1 w-6 rounded-full bg-xtube-red"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}

                <Icon
                  className={`h-5 w-5 transition-colors duration-200 ${
                    isActive ? 'text-xtube-red' : 'text-xtube-text-secondary'
                  }`}
                />
                <span
                  className={`text-[10px] font-medium leading-tight transition-colors duration-200 ${
                    isActive ? 'text-xtube-red' : 'text-xtube-text-secondary'
                  }`}
                >
                  {item.label}
                </span>
              </motion.button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
