import { Link } from 'react-router-dom'
import { Users, Clock, Trophy, Hourglass, ImagePlus, Sparkles } from 'lucide-react'
import Cover from '../ui/Cover'
import { TypeBadge, StatusBadge } from '../ui/Badge'
import ClubMark from '../ui/ClubMark'
import Avatar from '../ui/Avatar'
import Countdown from './Countdown'
import { getClubById } from '../../data/mock'
import { getType, formatMetric } from '../../lib/challengeTypes'
import { formatNumber } from '../../lib/utils'

function Deadline({ challenge }) {
  if (challenge.status === 'live') {
    return (
      <span className="inline-flex items-center gap-1.5 text-zinc-300">
        <Clock className="h-3.5 w-3.5 text-brand-400" />
        <Countdown to={challenge.endDate} /> left
      </span>
    )
  }
  if (challenge.status === 'upcoming') {
    return (
      <span className="inline-flex items-center gap-1.5 text-zinc-300">
        <Clock className="h-3.5 w-3.5 text-sky-400" />
        in <Countdown to={challenge.startDate} />
      </span>
    )
  }
  if (challenge.status === 'reviewing') {
    return (
      <span className="inline-flex items-center gap-1.5 text-amber-300/90">
        <Hourglass className="h-3.5 w-3.5" />
        Verifying
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-zinc-500">
      <Trophy className="h-3.5 w-3.5" />
      Final results
    </span>
  )
}

function LeaderStrip({ challenge }) {
  const t = getType(challenge.typeId)
  const top = t.gallery ? challenge.gallery?.[0] : challenge.entries?.[0]

  if (!top) {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <ImagePlus className="h-4 w-4" />
        {challenge.status === 'upcoming' ? 'Be the first to enter' : 'No entries yet'}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          {t.gallery ? 'Top' : 'Leader'}
        </span>
        <Avatar name={top.user.name} size={22} />
        <span className="truncate text-sm text-white">{top.user.tag}</span>
      </div>
      <span className="shrink-0 font-num text-sm font-bold tabular-nums text-white">
        {t.gallery ? `${formatNumber(top.votes)} votes` : formatMetric(challenge.typeId, top.value)}
      </span>
    </div>
  )
}

export default function ChallengeCard({ challenge, club: clubProp }) {
  const club = clubProp || challenge.club || getClubById(challenge.clubId)
  const to = `/c/${challenge.slug}`

  return (
    <article className="card card-hover group flex flex-col overflow-hidden">
      <Link to={to} className="block">
        <Cover typeId={challenge.typeId} className="h-36">
          <div className="flex items-start justify-between p-3">
            <div className="flex items-center gap-1.5">
              <TypeBadge typeId={challenge.typeId} size="sm" />
              {challenge.sponsored && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                  <Sparkles className="h-2.5 w-2.5" />
                  {challenge.sponsor || 'Sponsored'}
                </span>
              )}
            </div>
            <StatusBadge status={challenge.status} />
          </div>
        </Cover>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          {club && (
            <>
              <ClubMark club={club} size={20} />
              <Link to={`/club/${club.slug}`} className="truncate font-medium hover:text-white">
                {club.name}
              </Link>
            </>
          )}
          <span className="text-zinc-600">·</span>
          <span className="truncate">{challenge.region}</span>
        </div>

        <h3 className="mt-2.5 text-[15px] font-semibold leading-snug text-white">
          <Link to={to} className="transition-colors hover:text-brand-300">
            {challenge.title}
          </Link>
        </h3>

        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <span className="chip">{challenge.restriction}</span>
        </div>

        <div className="mt-auto pt-4">
          <div className="border-t border-white/[0.06] pt-3">
            <LeaderStrip challenge={challenge} />
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1.5 text-zinc-400">
              <Users className="h-3.5 w-3.5" />
              {formatNumber(challenge.participants)} racers
            </span>
            <Deadline challenge={challenge} />
          </div>
        </div>
      </div>
    </article>
  )
}
