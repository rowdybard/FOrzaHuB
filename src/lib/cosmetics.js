import {
  BadgeCheck,
  Camera,
  Crown,
  Flag,
  Gauge,
  Hash,
  Heart,
  Rocket,
  ShieldCheck,
  Star,
  Trophy,
  Wrench,
} from 'lucide-react'

// Curated accent palette - a hand-picked set keeps nameplates tasteful.
// (No free hex picker on purpose.)
export const ACCENTS = [
  '#ff6b2c', // brand orange
  '#ef4444', // red
  '#f43f5e', // rose
  '#ec4899', // magenta
  '#a855f7', // purple
  '#6366f1', // indigo
  '#3b82f6', // blue
  '#22d3ee', // cyan
  '#10b981', // emerald
  '#84cc16', // lime
  '#fbbf24', // amber
  '#e5e7eb', // silver
  '#94a3b8', // slate
]

export const DEFAULT_ACCENT = '#94a3b8'
export const DEFAULT_NAME_EFFECT = 'clean'
export const DEFAULT_PLATE_FRAME = 'none'

export const NAME_EFFECTS = [
  { id: 'clean', label: 'Clean' },
  { id: 'glow', label: 'Glow' },
  { id: 'chrome', label: 'Chrome' },
  { id: 'stripe', label: 'Stripe' },
  { id: 'terminal', label: 'Terminal' },
  { id: 'sticker', label: 'Sticker' },
]

export const PLATE_FRAMES = [
  { id: 'none', label: 'None' },
  { id: 'forum', label: 'Forum' },
  { id: 'carbon', label: 'Carbon' },
  { id: 'neon', label: 'Neon' },
  { id: 'chrome', label: 'Chrome' },
  { id: 'ribbon', label: 'Ribbon' },
]

// Badge registry. `auto` badges are derived from role/membership and can't be
// toggled by the user; the rest are selectable cosmetics.
export const BADGES = {
  owner: { label: 'Owner', icon: Crown, color: '#fbbf24', auto: true },
  steward: { label: 'Steward', icon: ShieldCheck, color: '#38bdf8', auto: true },
  verified: { label: 'Verified', icon: BadgeCheck, color: '#ff6b2c', auto: true },
  founder: { label: 'Founder', icon: Rocket, color: '#f472b6' },
  veteran: { label: 'Veteran', icon: Star, color: '#a855f7' },
  champion: { label: 'Champion', icon: Trophy, color: '#fbbf24' },
  tuner: { label: 'Tuner', icon: Wrench, color: '#22d3ee' },
  media: { label: 'Media', icon: Camera, color: '#84cc16' },
  pace: { label: 'Pace', icon: Gauge, color: '#38bdf8' },
  clean: { label: 'Clean', icon: Heart, color: '#10b981' },
  marshal: { label: 'Marshal', icon: Flag, color: '#ef4444' },
  bbs: { label: 'BBS', icon: Hash, color: '#e5e7eb' },
}

// Badges a user can pick in their profile editor.
export const SELECTABLE_BADGES = Object.entries(BADGES)
  .filter(([, b]) => !b.auto)
  .map(([id]) => id)

// Merge a user's stored cosmetic badges with badges derived from their role /
// club membership, de-duplicated, in a sensible display order.
export function resolveBadges(user = {}) {
  const out = []
  if (user.membershipRole === 'owner') out.push('owner')
  if (user.membershipRole === 'steward' || user.role === 'steward') out.push('steward')
  if (user.role === 'admin') out.push('verified')
  for (const b of user.badges || []) {
    if (BADGES[b] && !out.includes(b)) out.push(b)
  }
  return out
}
