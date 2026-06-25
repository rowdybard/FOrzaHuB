import { cn } from '../../lib/utils'
import { getType } from '../../lib/challengeTypes'

export function Badge({ children, className, tone = 'neutral' }) {
  const tones = {
    neutral: 'border-white/[0.08] bg-white/[0.02] text-zinc-400',
    brand: 'border-brand-500/20 bg-brand-500/[0.04] text-brand-300',
    success: 'border-emerald-500/20 bg-emerald-500/[0.04] text-emerald-300',
    warn: 'border-amber-500/20 bg-amber-500/[0.04] text-amber-300',
    danger: 'border-rose-500/20 bg-rose-500/[0.04] text-rose-300',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function TypeBadge({ typeId, className, withIcon = true, size = 'md' }) {
  const t = getType(typeId)
  const Icon = t.icon
  const sz = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded border border-white/[0.06] bg-white/[0.02] font-medium uppercase tracking-wide text-zinc-400',
        sz,
        className,
      )}
    >
      {withIcon && <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} style={{ color: t.accent }} />}
      {t.label}
    </span>
  )
}

const STATUS = {
  live: {
    label: 'Live',
    dot: 'bg-emerald-400',
    cls: 'border-emerald-500/20 bg-emerald-500/[0.04] text-emerald-300',
    pulse: true,
  },
  upcoming: {
    label: 'Upcoming',
    dot: 'bg-sky-400',
    cls: 'border-sky-500/20 bg-sky-500/[0.04] text-sky-300',
  },
  reviewing: {
    label: 'Reviewing',
    dot: 'bg-amber-400',
    cls: 'border-amber-500/20 bg-amber-500/[0.04] text-amber-300',
  },
  closed: {
    label: 'Closed',
    dot: 'bg-zinc-500',
    cls: 'border-white/[0.06] bg-white/[0.02] text-zinc-400',
  },
}

export function StatusBadge({ status = 'live', className, size = 'md' }) {
  const s = STATUS[status] || STATUS.closed
  const sz = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded border font-semibold uppercase tracking-wide',
        sz,
        s.cls,
        className,
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        {s.pulse && (
          <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-75', s.dot)} />
        )}
        <span className={cn('relative inline-flex h-1.5 w-1.5 rounded-full', s.dot)} />
      </span>
      {s.label}
    </span>
  )
}
