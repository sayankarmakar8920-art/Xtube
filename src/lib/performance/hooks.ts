'use client';

/**
 * Performance React hooks for the Xtube OTT streaming platform.
 * All hooks are client-side only.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// ─── useDebounce ────────────────────────────────────────────────────────────

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// ─── useThrottle ────────────────────────────────────────────────────────────

export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const now = Date.now();
    const elapsed = now - lastRan.current;

    if (elapsed >= limit) {
      lastRan.current = now;
      setThrottledValue(value);
    } else {
      const timer = setTimeout(() => {
        lastRan.current = Date.now();
        setThrottledValue(value);
      }, limit - elapsed);
      return () => clearTimeout(timer);
    }
  }, [value, limit]);

  return throttledValue;
}

// ─── useIntersectionObserver ────────────────────────────────────────────────

interface IntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useIntersectionObserver(
  options: IntersectionObserverOptions = {},
): {
  ref: (node: Element | null) => void;
  isIntersecting: boolean;
  entry: IntersectionObserverEntry | null;
} {
  const { threshold = 0, root = null, rootMargin = '0px', triggerOnce = false } = options;
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const elementRef = useRef<Element | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const hasTriggered = useRef(false);

  const ref = useCallback(
    (node: Element | null) => {
      // Cleanup previous observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      elementRef.current = node;

      if (!node || (triggerOnce && hasTriggered.current)) return;

      observerRef.current = new IntersectionObserver(
        ([observerEntry]) => {
          setIsIntersecting(observerEntry.isIntersecting);
          setEntry(observerEntry);

          if (observerEntry.isIntersecting && triggerOnce) {
            hasTriggered.current = true;
            observerRef.current?.disconnect();
          }
        },
        { threshold, root, rootMargin },
      );

      observerRef.current.observe(node);
    },
    [threshold, root, rootMargin, triggerOnce],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return { ref, isIntersecting, entry };
}

// ─── useMediaQuery ──────────────────────────────────────────────────────────

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setMatches(e.matches);
    };

    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

// ─── usePageVisibility ──────────────────────────────────────────────────────

export function usePageVisibility(): boolean {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof document === 'undefined') return true;
    return !document.hidden;
  });

  useEffect(() => {
    const handler = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  return isVisible;
}

// ─── useNetworkStatus ───────────────────────────────────────────────────────

interface NetworkStatus {
  isOnline: boolean;
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g' | 'unknown';
  downlink: number; // Mbps
  saveData: boolean;
}

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    effectiveType: 'unknown',
    downlink: 0,
    saveData: false,
  });

  useEffect(() => {
    const updateStatus = () => {
      const connection = (navigator as unknown as { connection?: {
        effectiveType?: '4g' | '3g' | '2g' | 'slow-2g';
        downlink?: number;
        saveData?: boolean;
      } }).connection;

      setStatus({
        isOnline: navigator.onLine,
        effectiveType: connection?.effectiveType ?? 'unknown',
        downlink: connection?.downlink ?? 0,
        saveData: connection?.saveData ?? false,
      });
    };

    updateStatus();

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    // Listen for Network Information API changes
    const connection = (navigator as unknown as { connection?: {
      addEventListener?: (type: string, handler: () => void) => void;
      removeEventListener?: (type: string, handler: () => void) => void;
    } }).connection;

    connection?.addEventListener?.('change', updateStatus);

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
      connection?.removeEventListener?.('change', updateStatus);
    };
  }, []);

  return status;
}

// ─── usePrefetchOnHover ─────────────────────────────────────────────────────

export function usePrefetchOnHover<T>(
  fetchFn: () => Promise<T>,
  delay: number = 200,
): {
  onMouseEnter: () => void;
  onMouseLeave: () => void;
} {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onMouseEnter = useCallback(() => {
    timerRef.current = setTimeout(() => {
      fetchFn().catch(() => {
        // Silently ignore prefetch errors
      });
    }, delay);
  }, [fetchFn, delay]);

  const onMouseLeave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return { onMouseEnter, onMouseLeave };
}

// ─── useVirtualScroll ───────────────────────────────────────────────────────

interface VirtualScrollResult<T> {
  visibleItems: Array<T & { _virtualIndex: number }>;
  containerProps: {
    style: React.CSSProperties;
    onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  };
  scrollProps: {
    style: React.CSSProperties;
  };
  scrollToIndex: (index: number) => void;
}

export function useVirtualScroll<T>(
  items: T[],
  containerHeight: number,
  itemHeight: number,
  overscan: number = 3,
): VirtualScrollResult<T> {
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = useMemo(() => items.length * itemHeight, [items.length, itemHeight]);

  const startIndex = useMemo(() => {
    return Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  }, [scrollTop, itemHeight, overscan]);

  const endIndex = useMemo(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    return Math.min(items.length - 1, startIndex + visibleCount + overscan * 2);
  }, [scrollTop, itemHeight, containerHeight, startIndex, items.length, overscan]);

  const visibleItems = useMemo(() => {
    const result: Array<T & { _virtualIndex: number }> = [];
    for (let i = startIndex; i <= endIndex; i++) {
      if (items[i] !== undefined) {
        result.push({ ...items[i], _virtualIndex: i });
      }
    }
    return result;
  }, [items, startIndex, endIndex]);

  const offsetY = useMemo(() => startIndex * itemHeight, [startIndex, itemHeight]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const scrollToIndex = useCallback(
    (index: number) => {
      // The caller should set the container's scrollTop
      // We update internal state to reflect the new scroll position
      setScrollTop(index * itemHeight);
    },
    [itemHeight],
  );

  return {
    visibleItems,
    containerProps: {
      style: {
        height: containerHeight,
        overflowY: 'auto' as const,
        position: 'relative' as const,
      },
      onScroll: handleScroll,
    },
    scrollProps: {
      style: {
        height: totalHeight,
        paddingTop: offsetY,
      },
    },
    scrollToIndex,
  };
}
