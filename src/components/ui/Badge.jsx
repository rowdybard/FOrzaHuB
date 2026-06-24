import { cn } from '../../lib/utils'
import { getType } from '../../lib/challengeTypes'

export function Badge({ children, className, tone = 'neutral' }) {
  const tones = {
    neutral: 'border-white/10 bg-white/[0.04] text-zinc-300',
    brand: 'border-brand-500/30 bg-brand-500/10 text-brand-300',
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    warn: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    danger: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
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
  const sz = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] font-medium text-zinc-300',
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
    cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    pulse: true,
  },
  upcoming: {
    label: 'Upcoming',
    dot: 'bg-sky-400',
    cls: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
  },
  reviewing: {
    label: 'Reviewing',
    dot: 'bg-amber-400',
    cls: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  },
  closed: {
    label: 'Closed',
    dot: 'bg-zinc-500',
    cls: 'border-white/10 bg-white/[0.04] text-zinc-400',
  },
}

export function StatusBadge({ status = 'live', className, size = 'md' }) {
  const s = STATUS[status] || STATUS.closed
  const sz = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-semibold backdrop-blur-md',
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
