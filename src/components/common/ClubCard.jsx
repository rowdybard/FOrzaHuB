import { Link } from 'react-router-dom'
import { Users, ShieldCheck } from 'lucide-react'
import ClubMark from '../ui/ClubMark'
import { formatNumber, hexToRgba } from '../../lib/utils'

export default function ClubCard({ club }) {
  return (
    <Link to={`/club/${club.slug}`} className="card card-hover group block overflow-hidden">
      <div className="relative h-20 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(120% 140% at 0% 0%, ${hexToRgba(club.accent, 0.55)}, transparent 60%), linear-gradient(120deg, ${hexToRgba(club.accent, 0.25)}, transparent)`,
          }}
        />
        <div className="absolute inset-0 bg-grid-sm opacity-40" />
      </div>
      <div className="px-5 pb-5">
        <div className="-mt-8 flex items-end justify-between">
          <ClubMark club size={56} className="ring-4 ring-ink-850" />
          <span className="chip">{club.region}</span>
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          <h3 className="font-semibold text-white transition-colors group-hover:text-brand-300">
            {club.name}
          </h3>
          {club.verified && <ShieldCheck className="h-4 w-4 text-brand-400" />}
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{club.tagline}</p>
        <div className="mt-4 flex items-center gap-4 border-t border-white/[0.06] pt-3 text-xs text-zinc-400">
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {formatNumber(club.members)} members
          </span>
          <span className="text-zinc-600">·</span>
          <span>{club.stats.challenges} events</span>
        </div>
      </div>
    </Link>
  )
}
