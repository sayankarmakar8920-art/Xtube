'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X } from 'lucide-react'
import { useAppStore } from '@/lib/store'

export function SearchBar() {
  const { searchQuery, setSearchQuery, setView } = useAppStore()
  const [localValue, setLocalValue] = useState(searchQuery)
  const [isExpanded, setIsExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync external searchQuery changes to local value
  useEffect(() => {
    setLocalValue(searchQuery)
  }, [searchQuery])

  // Debounced search handler
  const handleInputChange = useCallback(
    (value: string) => {
      setLocalValue(value)

      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      debounceRef.current = setTimeout(() => {
        setSearchQuery(value)
        if (value.trim()) {
          setView('search')
        }
      }, 300)
    },
    [setSearchQuery, setView]
  )

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  const handleClear = () => {
    setLocalValue('')
    setSearchQuery('')
    inputRef.current?.focus()
  }

  const handleExpand = () => {
    setIsExpanded(true)
    // Focus input after animation
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }

  const handleCollapse = () => {
    if (!localValue) {
      setIsExpanded(false)
    }
  }

  return (
    <div className="relative flex items-center">
      {/* Mobile: collapsed search icon button */}
      <div className="md:hidden">
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            <motion.button
              key="search-icon"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleExpand}
              className="flex h-8 w-8 items-center justify-center rounded-full text-xtube-text-secondary transition-colors hover:bg-white/5 hover:text-white"
              aria-label="Open search"
            >
              <Search className="h-5 w-5" />
            </motion.button>
          ) : (
            <motion.div
              key="search-input-mobile"
              initial={{ width: 36, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 36, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="flex items-center gap-2 rounded-full glass px-3 py-1"
            >
              <Search className="h-4 w-4 flex-shrink-0 text-xtube-text-secondary" />
              <input
                ref={inputRef}
                type="text"
                value={localValue}
                onChange={(e) => handleInputChange(e.target.value)}
                onBlur={handleCollapse}
                placeholder="Search..."
                className="w-full bg-transparent text-sm text-white placeholder:text-xtube-text-secondary focus:outline-none"
                aria-label="Search videos"
              />
              {localValue && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  onClick={handleClear}
                  className="flex-shrink-0 text-xtube-text-secondary hover:text-white"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop: always-visible search bar */}
      <div className="hidden md:block">
        <div className="flex items-center gap-2 rounded-full glass px-3 py-1.5 transition-shadow duration-200 focus-within:ring-1 focus-within:ring-xtube-red">
          <Search className="h-4 w-4 flex-shrink-0 text-xtube-text-secondary" />
          <input
            type="text"
            value={localValue}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Search videos..."
            className="w-32 bg-transparent text-xs text-white placeholder:text-xtube-text-secondary focus:outline-none md:w-40 lg:w-56"
            aria-label="Search videos"
          />
          <AnimatePresence>
            {localValue && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={handleClear}
                className="flex-shrink-0 text-xtube-text-secondary hover:text-white"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
