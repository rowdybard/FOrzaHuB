import { Link } from 'react-router-dom'
import { Users, Clock, Trophy, Hourglass, MapPin } from 'lucide-react'
import { StatusBadge } from '../ui/Badge'
import ClubMark from '../ui/ClubMark'
import Countdown from './Countdown'
import { getType } from '../../lib/challengeTypes'
import { formatNumber } from '../../lib/utils'

function Deadline({ challenge }) {
  if (challenge.status === 'live') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
        <Clock className="h-3 w-3 text-emerald-400" />
        <Countdown to={challenge.endDate} /> left
      </span>
    )
  }
  if (challenge.status === 'upcoming') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
        <Clock className="h-3 w-3 text-sky-400" />
        in <Countdown to={challenge.startDate} />
      </span>
    )
  }
  if (challenge.status === 'reviewing') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-amber-300/80">
        <Hourglass className="h-3 w-3" />
        Verifying
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
      <Trophy className="h-3 w-3" />
      Final
    </span>
  )
}

export default function ChallengeCard({ challenge, club: clubProp }) {
  const club = clubProp || challenge.club || null
  const to = `/c/${challenge.slug}`
  const t = getType(challenge.typeId)
  const top = t.gallery ? challenge.gallery?.[0] : challenge.entries?.[0]

  return (
    <Link
      to={to}
      className="card-readable group relative flex flex-col rounded-xl p-4 transition-all duration-200 hover:border-white/[0.16] hover:-translate-y-0.5"
    >
      {/* Top row: format label + status */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-500">
          {t.label}
        </span>
        <StatusBadge status={challenge.status} size="sm" />
      </div>

      {/* Title */}
      <h3 className="mt-2 text-[15px] font-semibold leading-snug text-white transition-colors group-hover:text-brand-300">
        {challenge.title}
      </h3>

      {/* Restriction + location */}
      <div className="mt-1.5 flex items-center gap-2 text-xs text-zinc-400">
        {challenge.restriction && <span className="truncate">{challenge.restriction}</span>}
        {challenge.restriction && challenge.location && <span className="text-zinc-600">·</span>}
        {challenge.location && (
          <span className="inline-flex items-center gap-1 truncate">
            <MapPin className="h-3 w-3 text-zinc-600" />
            {challenge.location}
          </span>
        )}
      </div>

      {/* Club */}
      {club && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-400">
          <ClubMark club={club} size={16} />
          <span className="truncate">{club.name}</span>
          {challenge.sponsored && (
            <>
              <span className="text-zinc-600">·</span>
              <span className="text-amber-400/80">Sponsored</span>
            </>
          )}
        </div>
      )}

      {/* Footer: racers + leader + deadline */}
      <div className="mt-4 flex items-center justify-between border-t border-white/[0.05] pt-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
            <Users className="h-3 w-3" />
            {formatNumber(challenge.participants)}
          </span>
          {top && (
            <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
              <Trophy className="h-3 w-3" style={{ color: t.accent }} />
              <span className="font-medium text-zinc-300">{top.user?.tag}</span>
            </span>
          )}
        </div>
        <Deadline challenge={challenge} />
      </div>
    </Link>
  )
}
