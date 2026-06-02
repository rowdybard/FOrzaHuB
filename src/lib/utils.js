import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/** Format seconds into a racing time string: `1:58.235` or `13.842`. */
export function formatTime(totalSeconds) {
  if (totalSeconds == null || Number.isNaN(totalSeconds)) return '—'
  const sign = totalSeconds < 0 ? '-' : ''
  const s = Math.abs(totalSeconds)
  const minutes = Math.floor(s / 60)
  const seconds = s - minutes * 60
  if (minutes > 0) {
    return `${sign}${minutes}:${seconds.toFixed(3).padStart(6, '0')}`
  }
  return `${sign}${seconds.toFixed(3)}`
}

export function formatNumber(n) {
  if (n == null) return '—'
  return Number(n).toLocaleString('en-US')
}

export function hexToRgba(hex, alpha = 1) {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function formatCompact(n) {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
}

export function formatDate(iso, opts) {
  return new Date(iso).toLocaleDateString(
    'en-US',
    opts || { month: 'short', day: 'numeric', year: 'numeric' },
  )
}

export function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const sec = Math.round(diff / 1000)
  if (sec < 60) return 'just now'
  const min = Math.round(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.round(hr / 24)
  if (day < 7) return `${day}d ago`
  const wk = Math.round(day / 7)
  if (wk < 5) return `${wk}w ago`
  return formatDate(iso)
}

export function getCountdown(iso) {
  const total = new Date(iso).getTime() - Date.now()
  const clamped = Math.max(0, total)
  return {
    total,
    days: Math.floor(clamped / 86400000),
    hours: Math.floor((clamped % 86400000) / 3600000),
    minutes: Math.floor((clamped % 3600000) / 60000),
    seconds: Math.floor((clamped % 60000) / 1000),
    ended: total <= 0,
  }
}

const AVATAR_PALETTE = [
  ['#ff8a4c', '#f0531b'],
  ['#22d3ee', '#3b82f6'],
  ['#e879f9', '#a855f7'],
  ['#fb7185', '#f43f5e'],
  ['#818cf8', '#6366f1'],
  ['#fbbf24', '#f59e0b'],
  ['#34d399', '#10b981'],
  ['#f472b6', '#db2777'],
]

function hash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

export function avatarColors(seed = '') {
  return AVATAR_PALETTE[hash(seed) % AVATAR_PALETTE.length]
}

export function initials(name = '') {
  const parts = name
    .replace(/[^a-zA-Z0-9 _]/g, '')
    .trim()
    .split(/[\s_]+/)
    .filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export function slugify(str = '') {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
