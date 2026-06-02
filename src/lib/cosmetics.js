import { Crown, ShieldCheck, BadgeCheck, Rocket, Star, Trophy } from 'lucide-react'

// Curated accent palette — a hand-picked set keeps nameplates tasteful.
// (No free hex picker on purpose.)
export const ACCENTS = [
  '#ff6b2c', // brand orange
  '#f43f5e', // rose
  '#a855f7', // purple
  '#6366f1', // indigo
  '#3b82f6', // blue
  '#22d3ee', // cyan
  '#10b981', // emerald
  '#fbbf24', // amber
  '#f472b6', // pink
  '#94a3b8', // slate
]

export const DEFAULT_ACCENT = '#94a3b8'

// Badge registry. `auto` badges are derived from role/membership and can't be
// toggled by the user; the rest are selectable cosmetics.
export const BADGES = {
  owner:    { label: 'Owner',    icon: Crown,       color: '#fbbf24', auto: true },
  steward:  { label: 'Steward',  icon: ShieldCheck, color: '#38bdf8', auto: true },
  verified: { label: 'Verified', icon: BadgeCheck,  color: '#ff6b2c', auto: true },
  founder:  { label: 'Founder',  icon: Rocket,      color: '#f472b6' },
  veteran:  { label: 'Veteran',  icon: Star,        color: '#a855f7' },
  champion: { label: 'Champion', icon: Trophy,      color: '#fbbf24' },
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
