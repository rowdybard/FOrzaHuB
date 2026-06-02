import { Heart } from 'lucide-react'
import Avatar from '../ui/Avatar'
import { cn, formatNumber } from '../../lib/utils'
import { getType } from '../../lib/challengeTypes'

function RankBadge({ rank }) {
  const medal = {
    1: 'bg-gradient-to-br from-amber-300 to-yellow-500 text-ink-950',
    2: 'bg-gradient-to-br from-zinc-200 to-zinc-400 text-ink-950',
    3: 'bg-gradient-to-br from-orange-400 to-amber-700 text-ink-950',
  }
  if (rank > 3) return null
  return (
    <span
      className={cn(
        'grid h-7 w-7 place-items-center rounded-full text-xs font-bold shadow-lg',
        medal[rank],
      )}
    >
      {rank}
    </span>
  )
}

function GalleryCard({ item, typeId }) {
  const t = getType(typeId)
  const Icon = t.icon
  const bg = `linear-gradient(140deg, hsl(${item.hue} 62% 24%), hsl(${(item.hue + 45) % 360} 58% 11%))`
  return (
    <figure className="card card-hover group overflow-hidden">
      <div className="relative aspect-[4/3] overflow-hidden" style={{ background: bg }}>
        <div className="absolute inset-0 bg-grid-sm opacity-30" />
        <Icon
          className="absolute -bottom-5 -right-3 h-32 w-32 opacity-[0.12] text-white"
          strokeWidth={1.1}
        />
        <div className="absolute left-3 top-3">
          <RankBadge rank={item.rank} />
        </div>
        <div className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-ink-950/50 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md">
          <Heart className="h-3.5 w-3.5 text-rose-400" />
          {formatNumber(item.votes)}
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950/90 to-transparent p-4 pt-10">
          <h3 className="truncate font-semibold text-white">{item.title}</h3>
          <div className="mt-2 flex items-center gap-2">
            <Avatar name={item.user.name} size={22} />
            <span className="truncate text-xs text-zinc-300">{item.user.tag}</span>
            <span className="text-xs">{item.user.country}</span>
          </div>
        </div>
      </div>
    </figure>
  )
}

export default function Gallery({ items = [], typeId, className }) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {items.map((item) => (
        <GalleryCard key={item.id} item={item} typeId={typeId} />
      ))}
    </div>
  )
}
