import type { Surface } from '../engine'

export const SURFACES: Surface[] = [
  { id: 'mpu', name: 'MPU', width: 300, height: 250, channel: 'display' },
  { id: 'leaderboard', name: 'Leaderboard', width: 728, height: 90, channel: 'display' },
  { id: 'mobile-banner', name: 'Mobile banner', width: 320, height: 50, channel: 'display' },
  { id: 'skyscraper', name: 'Wide skyscraper', width: 160, height: 600, channel: 'display' },
  { id: 'billboard', name: 'Billboard', width: 970, height: 250, channel: 'display' },
  { id: 'half-page', name: 'Half page', width: 300, height: 600, channel: 'display' },
  { id: 'feed-square', name: 'Feed square', width: 1080, height: 1080, channel: 'social' },
  { id: 'feed-portrait', name: 'Feed portrait', width: 1080, height: 1350, channel: 'social' },
  {
    id: 'story',
    name: 'Story',
    width: 1080,
    height: 1920,
    channel: 'social',
    safeArea: { top: 180, bottom: 260 },
  },
  {
    id: 'ctv',
    name: 'Connected TV',
    width: 1920,
    height: 1080,
    channel: 'ctv',
    safeArea: { top: 54, right: 96, bottom: 54, left: 96 },
  },
  { id: 'dooh-portrait', name: 'DOOH portrait', width: 1080, height: 1920, channel: 'dooh' },
  { id: 'dooh-wide', name: 'DOOH wide', width: 2560, height: 720, channel: 'dooh' },
]

export const CHANNEL_LABEL: Record<Surface['channel'], string> = {
  display: 'Display',
  social: 'Social',
  ctv: 'CTV',
  dooh: 'DOOH',
}
