# Task: HeroAdsSlider Component

## Task ID: hero-ads-slider

## Summary
Created the premium Hero Ads Slider component at `/home/z/my-project/src/components/streaming/HeroAdsSlider.tsx`.

## Key Features Implemented
- **Fade transitions** (NOT slide) with 1200ms duration via Framer Motion AnimatePresence
- **Autoplay** every 30 seconds with pause-on-hover (desktop only)
- **Video ad support**: autoplay muted, loop, HTML5 `<video>`, shimmer loading state, pause when not active
- **Image ad support**: parallax zoom effect (scale 1 → 1.05 over duration), cinematic dark overlay
- **Touch/swipe support**: track touchstart/touchend, 50px minimum threshold
- **Keyboard support**: left/right arrow navigation (desktop only, ignores inputs)
- **Responsive heights**: h-[48vh] mobile, h-[60vh] tablet, h-[78vh] desktop
- **Staggered content animations**: Sponsored badge → Category → Title → Description → Buttons
- **Premium dot indicators**: Framer Motion layoutId, red active dot expands width, gray inactive dots
- **Prev/Next arrows**: hidden on mobile (< md), glass styled, vertical center
- **Video mute toggle**: top-right corner with VolumeX/Volume2 icons
- **Preloading**: next slide preloaded in hidden div
- **Single ad mode**: static, no autoplay, no navigation elements
- **GPU acceleration**: will-change: transform, will-change: opacity
- **Zustand integration**: navigateToVideo from @/lib/store

## File Created
- `/home/z/my-project/src/components/streaming/HeroAdsSlider.tsx`

## Lint Status
✅ Passes with zero errors
