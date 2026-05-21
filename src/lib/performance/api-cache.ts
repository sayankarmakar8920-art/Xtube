/**
 * API response caching layer with deduplication of in-flight requests.
 * Uses the appCache under the hood for storage.
 */

import { appCache } from './cache';

/** In-flight request deduplication map: key -> Promise<T> */
const inFlightRequests = new Map<string, Promise<unknown>>();

const API_CACHE_PREFIX = 'api:';
const DEFAULT_API_TTL = 2 * 60 * 1000; // 2 minutes

/**
 * Fetch with caching. Deduplicates concurrent identical requests.
 * @param key - Unique cache key for this request
 * @param fetcher - Async function that fetches the data
 * @param ttl - Cache TTL in milliseconds (default: 2 min)
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = DEFAULT_API_TTL,
): Promise<T> {
  const cacheKey = `${API_CACHE_PREFIX}${key}`;

  // 1. Check cache first
  const cached = appCache.get<T>(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  // 2. Deduplicate: if same request is already in-flight, return same promise
  const inFlight = inFlightRequests.get(cacheKey) as Promise<T> | undefined;
  if (inFlight) {
    return inFlight;
  }

  // 3. Make the request
  const fetchPromise = fetcher()
    .then((result) => {
      appCache.set(cacheKey, result, ttl);
      inFlightRequests.delete(cacheKey);
      return result;
    })
    .catch((error) => {
      inFlightRequests.delete(cacheKey);
      throw error;
    });

  inFlightRequests.set(cacheKey, fetchPromise);
  return fetchPromise;
}

/**
 * Invalidate cache for a specific key or all API cache entries.
 * @param key - Specific key to invalidate, or omit to clear all API cache
 */
export function invalidateCache(key?: string): void {
  if (key) {
    appCache.delete(`${API_CACHE_PREFIX}${key}`);
    inFlightRequests.delete(`${API_CACHE_PREFIX}${key}`);
  } else {
    // Clear all API-prefixed entries
    for (const k of appCache.keys()) {
      if (k.startsWith(API_CACHE_PREFIX)) {
        appCache.delete(k);
      }
    }
    inFlightRequests.clear();
  }
}

/**
 * Prefetch multiple API endpoints in parallel.
 * Results are cached for subsequent `cachedFetch` calls.
 */
export async function prefetch<T>(
  entries: Array<{ key: string; fetcher: () => Promise<T>; ttl?: number }>,
): Promise<void> {
  await Promise.allSettled(
    entries.map(({ key, fetcher, ttl }) => cachedFetch(key, fetcher, ttl)),
  );
}

/**
 * Get the number of in-flight requests (useful for debugging).
 */
export function getInFlightCount(): number {
  return inFlightRequests.size;
}
