import { useEffect, useState } from 'react'
import { getCountdown, cn } from '../../lib/utils'

const pad = (n) => String(n).padStart(2, '0')

export default function Countdown({ to, className, variant = 'inline', endedLabel = 'Ended' }) {
  const [c, setC] = useState(() => getCountdown(to))

  useEffect(() => {
    setC(getCountdown(to))
    const id = setInterval(() => setC(getCountdown(to)), 1000)
    return () => clearInterval(id)
  }, [to])

  if (c.ended) {
    return <span className={cn('text-zinc-500', className)}>{endedLabel}</span>
  }

  if (variant === 'blocks') {
    const blocks = [
      { v: c.days, l: 'days' },
      { v: c.hours, l: 'hrs' },
      { v: c.minutes, l: 'min' },
      { v: c.seconds, l: 'sec' },
    ]
    return (
      <div className={cn('flex items-center gap-1 sm:gap-2', className)}>
        {blocks.map((b, i) => (
          <div key={b.l} className="flex items-center gap-1 sm:gap-2">
            <div className="min-w-[2.25rem] rounded-xl border border-white/[0.07] bg-ink-800/80 px-1.5 py-2 text-center sm:min-w-[3.1rem] sm:px-2">
              <div className="font-num text-xl font-bold tabular-nums text-white">{pad(b.v)}</div>
              <div className="text-[10px] uppercase tracking-wider text-zinc-500">{b.l}</div>
            </div>
            {i < blocks.length - 1 && <span className="text-zinc-600">:</span>}
          </div>
        ))}
      </div>
    )
  }

  const parts =
    c.days > 0
      ? `${c.days}d ${c.hours}h ${pad(c.minutes)}m`
      : c.hours > 0
        ? `${c.hours}h ${pad(c.minutes)}m ${pad(c.seconds)}s`
        : `${c.minutes}m ${pad(c.seconds)}s`

  return <span className={cn('font-num tabular-nums', className)}>{parts}</span>
}
