/**
 * Image optimization utilities for the Xtube OTT platform.
 * Supports Cloudflare Image Resizing for R2-hosted images.
 */

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number; // 1-100, default 85
  format?: 'webp' | 'avif' | 'json';
  fit?: 'contain' | 'cover' | 'crop' | 'scale-down';
  dpr?: number; // device pixel ratio
  metadata?: 'keep' | 'copyright' | 'none';
}

export interface LazyImageSizes {
  sm: string; // e.g. "100vw" or "300px"
  md: string;
  lg: string;
  xl: string;
}

/** Default responsive sizes for common layouts */
export const LAZY_IMAGE_SIZES: Record<string, LazyImageSizes> = {
  videoCard: {
    sm: '100vw',
    md: '50vw',
    lg: '33vw',
    xl: '25vw',
  },
  heroBanner: {
    sm: '100vw',
    md: '100vw',
    lg: '100vw',
    xl: '100vw',
  },
  thumbnail: {
    sm: '150px',
    md: '200px',
    lg: '256px',
    xl: '320px',
  },
} as const;

const DEFAULT_QUALITY = 85;
const DEFAULT_FORMAT = 'webp';

/**
 * Transform an image URL for optimization.
 * - For R2 / external CDN images: uses Cloudflare Image Resizing via /cdn-cgi/image/
 * - For local images: returns as-is (Next.js Image handles optimization)
 */
export function getOptimizedImageUrl(
  url: string,
  options: ImageOptimizationOptions = {},
): string {
  if (!url) return url;

  // Local/relative paths — let Next.js handle optimization
  if (url.startsWith('/') && !url.startsWith('//')) {
    return url;
  }

  // Data URIs — no optimization needed
  if (url.startsWith('data:')) {
    return url;
  }

  // Build Cloudflare Image Resizing options
  const params: string[] = [];

  if (options.width) params.push(`width=${options.width}`);
  if (options.height) params.push(`height=${options.height}`);
  if (options.quality) params.push(`quality=${options.quality}`);
  if (options.format) params.push(`format=${options.format}`);
  if (options.fit) params.push(`fit=${options.fit}`);
  if (options.dpr) params.push(`dpr=${options.dpr}`);
  if (options.metadata) params.push(`metadata=${options.metadata}`);

  // If no meaningful options, return original
  if (params.length === 0) return url;

  // Cloudflare Image Resizing path
  const cfOptions = params.join(',');
  return `/cdn-cgi/image/${cfOptions}/${url}`;
}

/**
 * Generate a srcset string for responsive images.
 */
export function generateSrcSet(
  baseUrl: string,
  widths: number[],
  options: Omit<ImageOptimizationOptions, 'width'> = {},
): string {
  return widths
    .map((w) => {
      const optimizedUrl = getOptimizedImageUrl(baseUrl, { ...options, width: w });
      return `${optimizedUrl} ${w}w`;
    })
    .join(', ');
}

/**
 * Generate a sizes attribute string from LazyImageSizes.
 */
export function generateSizesAttr(sizes: LazyImageSizes): string {
  return `(min-width: 1280px) ${sizes.xl}, (min-width: 1024px) ${sizes.lg}, (min-width: 768px) ${sizes.md}, ${sizes.sm}`;
}

/**
 * Generate a simple blur placeholder data URL.
 * Creates a tiny colored placeholder image.
 * For production, pre-generate blur hashes at build time.
 */
export function getPlaceholderBlur(
  _url: string,
  color: string = '1a1a2e',
): string {
  // Minimal 1x1 SVG encoded as data URL for blur placeholder
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect fill="#${color}" width="1" height="1"/></svg>`;
  return `data:image/svg+xml;base64,${typeof btoa !== 'undefined' ? btoa(svg) : Buffer.from(svg).toString('base64')}`;
}

/**
 * Preload an image with high priority.
 * Useful for hero banners and above-the-fold content.
 */
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to preload image: ${url}`));
    document.head.appendChild(link);
  });
}

/**
 * Generate optimized image URLs for common video card sizes.
 * Returns an object with different resolution URLs.
 */
export function getVideoCardImageUrls(baseUrl: string): {
  sm: string; // ~320w
  md: string; // ~640w
  lg: string; // ~960w
  xl: string; // ~1280w
} {
  const opts: Omit<ImageOptimizationOptions, 'width'> = {
    quality: DEFAULT_QUALITY,
    format: DEFAULT_FORMAT,
    fit: 'cover',
  };

  return {
    sm: getOptimizedImageUrl(baseUrl, { ...opts, width: 320 }),
    md: getOptimizedImageUrl(baseUrl, { ...opts, width: 640 }),
    lg: getOptimizedImageUrl(baseUrl, { ...opts, width: 960 }),
    xl: getOptimizedImageUrl(baseUrl, { ...opts, width: 1280 }),
  };
}
