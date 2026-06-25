import { Link } from 'react-router-dom'
import { Users, ShieldCheck } from 'lucide-react'
import ClubMark from '../ui/ClubMark'
import { formatNumber } from '../../lib/utils'

export default function ClubCard({ club }) {
  return (
    <Link
      to={`/club/${club.slug}`}
      className="card-readable group flex flex-col rounded-xl p-4 transition-all duration-200 hover:border-white/[0.16] hover:-translate-y-0.5"
    >
      <div className="flex items-center gap-3">
        <ClubMark club={club} size={44} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-semibold text-white transition-colors group-hover:text-brand-300">
              {club.name}
            </h3>
            {club.verified && <ShieldCheck className="h-4 w-4 shrink-0 text-brand-400" />}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
            <span className="chip">[{club.tag}]</span>
            <span>{club.region}</span>
          </div>
        </div>
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-zinc-400">{club.tagline}</p>
      <div className="mt-3 flex items-center gap-3 border-t border-white/[0.05] pt-3 text-xs text-zinc-500">
        <span className="inline-flex items-center gap-1.5">
          <Users className="h-3 w-3" />
          {formatNumber(club.members)} members
        </span>
        <span className="text-zinc-600">·</span>
        <span>{club.stats.challenges} events</span>
      </div>
    </Link>
  )
}
