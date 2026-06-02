import { Timer, Wind, Gauge, Camera, Wrench } from 'lucide-react'
import { formatTime, formatNumber } from './utils'

export const CHALLENGE_TYPES = {
  time_trial: {
    id: 'time_trial',
    label: 'Time Trial',
    short: 'Time',
    icon: Timer,
    accent: '#22d3ee',
    tint: 'cyan',
    cover: 'from-cyan-400/25 via-sky-500/10 to-transparent',
    unit: 'time',
    sort: 'asc',
    metricLabel: 'Best Lap',
    summary: 'Fastest clean lap on a fixed route and car restriction.',
    entryLabel: 'lap time',
    placeholder: '1:58.420',
    proofHint: 'Link a clip of the full lap ending on the results screen. Assists must match the rules.',
  },
  drift_score: {
    id: 'drift_score',
    label: 'Drift Score',
    short: 'Drift',
    icon: Wind,
    accent: '#e879f9',
    tint: 'fuchsia',
    cover: 'from-fuchsia-400/25 via-purple-500/10 to-transparent',
    unit: 'points',
    sort: 'desc',
    metricLabel: 'Score',
    summary: 'Biggest drift score in a single run through the zone.',
    entryLabel: 'drift score',
    placeholder: '1,284,500',
    proofHint: 'Link a clip of the full run ending on the score tally screen. No rewind.',
  },
  drag_time: {
    id: 'drag_time',
    label: 'Drag Time',
    short: 'Drag',
    icon: Gauge,
    accent: '#fb7185',
    tint: 'rose',
    cover: 'from-rose-400/25 via-orange-500/10 to-transparent',
    unit: 'time',
    sort: 'asc',
    metricLabel: 'Elapsed',
    summary: 'Lowest elapsed time over a set distance from a standing start.',
    entryLabel: 'elapsed time',
    placeholder: '13.842',
    proofHint: 'Link a clip showing the start line and the trap time at the finish.',
  },
  photo_contest: {
    id: 'photo_contest',
    label: 'Photo Contest',
    short: 'Photo',
    icon: Camera,
    accent: '#818cf8',
    tint: 'indigo',
    cover: 'from-indigo-400/25 via-violet-500/10 to-transparent',
    unit: 'votes',
    sort: 'desc',
    metricLabel: 'Votes',
    summary: 'Best shot around a theme, judged by community vote.',
    entryLabel: 'photo',
    placeholder: '',
    gallery: true,
    proofHint: 'Upload an in-game Photo Mode capture. No external overlays or watermarks.',
  },
  build_battle: {
    id: 'build_battle',
    label: 'Build Battle',
    short: 'Build',
    icon: Wrench,
    accent: '#fbbf24',
    tint: 'amber',
    cover: 'from-amber-400/25 via-emerald-500/10 to-transparent',
    unit: 'votes',
    sort: 'desc',
    metricLabel: 'Votes',
    summary: 'Cleanest build to a brief — tune and livery judged together.',
    entryLabel: 'build',
    placeholder: '',
    gallery: true,
    proofHint: 'Share the build share-code plus 3 photos: front, rear, and the tune sheet.',
  },
}

export const TYPE_LIST = Object.values(CHALLENGE_TYPES)

export function getType(id) {
  return CHALLENGE_TYPES[id] || CHALLENGE_TYPES.time_trial
}

export function formatMetric(typeId, value) {
  const t = getType(typeId)
  if (t.unit === 'time') return formatTime(value)
  return formatNumber(value)
}

export function formatGap(typeId, leaderValue, value) {
  const t = getType(typeId)
  if (value === leaderValue) return null
  if (t.unit === 'time') return '+' + formatTime(value - leaderValue)
  return formatNumber(value - leaderValue)
}

export function unitSuffix(typeId) {
  const t = getType(typeId)
  if (t.unit === 'points') return 'pts'
  if (t.unit === 'votes') return 'votes'
  return ''
}
