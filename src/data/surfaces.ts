import type { SurfaceProfile } from '../engine'

/**
 * The four profiles the brief names by name, plus one deliberately undersized
 * kiosk used to demonstrate priority degradation (branding drops; headline,
 * hero and CTA hold). Every field here is a real constraint the resolver
 * reads — none of them are surface ids the resolver branches on, which is
 * what lets a fifth, unseen profile resolve correctly with no code changes.
 */
export const SURFACES: SurfaceProfile[] = [
  {
    id: 'mobile-portrait',
    name: 'Mobile — portrait',
    width: 390,
    height: 844,
    safeArea: { top: 47, bottom: 34 },
    minTapTarget: 44,
    touchOnly: true,
    viewingDistance: 'near',
  },
  {
    id: 'mobile-landscape',
    name: 'Mobile — landscape',
    width: 844,
    height: 390,
    safeArea: { left: 47, right: 47, bottom: 21 },
    minTapTarget: 44,
    touchOnly: true,
    viewingDistance: 'near',
  },
  {
    id: 'broadcast-lower-third',
    name: 'Broadcast lower-third',
    width: 1920,
    height: 250,
    viewingDistance: 'far',
    minTextSize: 32,
  },
  {
    id: 'square-kiosk',
    name: 'Square kiosk',
    width: 1080,
    height: 1080,
    minTapTarget: 60,
    touchOnly: true,
    viewingDistance: 'near',
  },
  {
    id: 'kiosk-degraded',
    name: 'Kiosk — tight (degradation demo)',
    width: 480,
    height: 480,
    minTapTarget: 60,
    touchOnly: true,
    viewingDistance: 'near',
  },
]
