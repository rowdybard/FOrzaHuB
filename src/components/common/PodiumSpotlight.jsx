import Avatar from '../ui/Avatar'
import { cn, formatNumber } from '../../lib/utils'
import { getType, formatMetric } from '../../lib/challengeTypes'

export default function PodiumSpotlight({ challenge, className }) {
  const t = getType(challenge.typeId)
  const top = ((t.gallery ? challenge.gallery : challenge.entries) || []).slice(0, 3)
  if (!top.length) return null

  return (
    <div className={cn('grid gap-2.5 sm:grid-cols-3', className)}>
      {top.map((e) => (
        <div
          key={e.rank}
          className={cn(
            'flex items-center gap-3 rounded-lg border p-3',
            e.rank === 1
              ? 'border-amber-500/15 bg-amber-500/[0.04]'
              : 'border-white/[0.05] bg-white/[0.02]',
          )}
        >
          <span
            className={cn(
              'grid h-6 w-6 shrink-0 place-items-center rounded text-xs font-bold',
              e.rank === 1 ? 'text-amber-400' : 'text-zinc-500',
            )}
          >
            {e.rank}
          </span>
          <Avatar name={e.user.name} size={28} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-white">{e.user.tag}</div>
            <div className="truncate font-num text-xs text-zinc-400">
              {t.gallery ? `${formatNumber(e.votes)} votes` : formatMetric(challenge.typeId, e.value)}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
