import { cn } from '../../lib/utils'
import { getType } from '../../lib/challengeTypes'

/**
 * Branded "event art" cover for a challenge — built from gradients, a grid
 * overlay and a large type icon. Used in cards and challenge headers.
 */
export default function Cover({ typeId, className, children, iconSize = 'h-40 w-40' }) {
  const t = getType(typeId)
  const Icon = t.icon
  return (
    <div className={cn('relative overflow-hidden bg-ink-900', className)}>
      <div className={cn('absolute inset-0 bg-gradient-to-br', t.cover)} />
      <div
        className="absolute -right-12 -top-16 h-52 w-52 rounded-full opacity-20 blur-3xl"
        style={{ background: t.accent }}
      />
      <Icon
        className={cn('absolute -bottom-6 -right-4 opacity-[0.06]', iconSize)}
        style={{ color: t.accent }}
        strokeWidth={1.2}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-transparent" />
      {children && <div className="relative h-full w-full">{children}</div>}
    </div>
  )
}
