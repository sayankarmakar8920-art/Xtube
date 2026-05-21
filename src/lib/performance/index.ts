/**
 * Performance utilities barrel export for the Xtube OTT platform.
 */

// Cache
export { LRUCache, appCache } from './cache';
export type { CacheOptions, CacheStats } from './cache';

// API Cache
export { cachedFetch, invalidateCache, prefetch, getInFlightCount } from './api-cache';

// Image Optimization
export {
  getOptimizedImageUrl,
  generateSrcSet,
  generateSizesAttr,
  getPlaceholderBlur,
  preloadImage,
  getVideoCardImageUrls,
  LAZY_IMAGE_SIZES,
} from './image';
export type { ImageOptimizationOptions, LazyImageSizes } from './image';

// Performance Hooks (client-side only)
export {
  useDebounce,
  useThrottle,
  useIntersectionObserver,
  useMediaQuery,
  usePageVisibility,
  useNetworkStatus,
  usePrefetchOnHover,
  useVirtualScroll,
} from './hooks';
