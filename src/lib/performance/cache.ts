/**
 * Type-safe in-memory cache with TTL and LRU eviction.
 * Designed for the Xtube OTT streaming platform.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  accessedAt: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
}

interface CacheOptions {
  maxSize: number;
  defaultTTL: number; // milliseconds
  cleanupInterval: number; // milliseconds
}

const DEFAULT_OPTIONS: CacheOptions = {
  maxSize: 500,
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  cleanupInterval: 60 * 1000, // 1 minute
};

export class LRUCache<T = unknown> {
  private cache = new Map<string, CacheEntry<T>>();
  private stats: CacheStats = { hits: 0, misses: 0, evictions: 0 };
  private readonly options: CacheOptions;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(options: Partial<CacheOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.startCleanup();
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.misses++;
      return undefined;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return undefined;
    }

    // LRU: move to end (most recently used)
    entry.accessedAt = Date.now();
    this.cache.delete(key);
    this.cache.set(key, entry);
    this.stats.hits++;
    return entry.value;
  }

  set(key: string, value: T, ttl?: number): void {
    // If key exists, delete first to update position
    this.cache.delete(key);

    // Evict LRU entries if at capacity
    if (this.cache.size >= this.options.maxSize) {
      this.evictOldest();
    }

    const now = Date.now();
    this.cache.set(key, {
      value,
      expiresAt: now + (ttl ?? this.options.defaultTTL),
      accessedAt: now,
    });
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, evictions: 0 };
  }

  get size(): number {
    return this.cache.size;
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  /** Get remaining TTL for a key in ms, or -1 if not found/expired */
  getRemainingTTL(key: string): number {
    const entry = this.cache.get(key);
    if (!entry) return -1;
    const remaining = entry.expiresAt - Date.now();
    return remaining > 0 ? remaining : -1;
  }

  /** Get all non-expired keys */
  keys(): string[] {
    this.removeExpired();
    return Array.from(this.cache.keys());
  }

  private evictOldest(): void {
    const firstKey = this.cache.keys().next().value;
    if (firstKey !== undefined) {
      this.cache.delete(firstKey);
      this.stats.evictions++;
    }
  }

  private removeExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  private startCleanup(): void {
    if (typeof window === 'undefined' && typeof globalThis !== 'undefined') {
      // Server-side: use setInterval
      this.cleanupTimer = setInterval(() => this.removeExpired(), this.options.cleanupInterval);
      // Don't prevent Node.js process from exiting
      if (this.cleanupTimer && 'unref' in this.cleanupTimer) {
        (this.cleanupTimer as ReturnType<typeof setInterval> & { unref: () => void }).unref();
      }
    }
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.cache.clear();
  }
}

/** Global singleton app cache */
export const appCache = new LRUCache({
  maxSize: 1000,
  defaultTTL: 5 * 60 * 1000,
  cleanupInterval: 60 * 1000,
});
