import { Link } from 'react-router-dom'
import { Users, Clock, Trophy, Hourglass, ImagePlus, Sparkles } from 'lucide-react'
import { TypeBadge, StatusBadge } from '../ui/Badge'
import ClubMark from '../ui/ClubMark'
import Avatar from '../ui/Avatar'
import Countdown from './Countdown'
import { getType, formatMetric } from '../../lib/challengeTypes'
import { formatNumber, cn } from '../../lib/utils'

const COVER_BG = {
  time_trial: 'bg-[linear-gradient(135deg,#0c1a24_0%,#0e2a38_40%,#081218_100%)]',
  drift_score: 'bg-[linear-gradient(135deg,#160a1e_0%,#1e0a2e_40%,#0d0814_100%)]',
  drag_time: 'bg-[linear-gradient(135deg,#1e0a0e_0%,#2e0a14_40%,#14080a_100%)]',
  photo_contest: 'bg-[linear-gradient(135deg,#0a0e1e_0%,#0a1230_40%,#080a14_100%)]',
  build_battle: 'bg-[linear-gradient(135deg,#1e160a_0%,#2e2208_40%,#141008_100%)]',
}

function CardCover({ typeId, children }) {
  const t = getType(typeId)
  const Icon = t.icon
  const bg = COVER_BG[typeId] || COVER_BG.time_trial
  return (
    <div className={cn('relative h-32 overflow-hidden', bg)}>
      {/* Diagonal accent stripe */}
      <div
        className="absolute -right-8 -top-8 h-40 w-40 rotate-12 opacity-20"
        style={{
          background: `linear-gradient(135deg, ${t.accent}, transparent 70%)`,
        }}
      />
      {/* Large type icon watermark */}
      <Icon
        className="absolute -bottom-3 -right-2 h-24 w-24 opacity-[0.12]"
        style={{ color: t.accent }}
        strokeWidth={1.2}
      />
      {/* Bottom fade into card */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink-850 to-transparent" />
      {/* Content */}
      <div className="relative h-full w-full">{children}</div>
    </div>
  )
}

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
  const club = clubProp || challenge.club || null
  const to = `/c/${challenge.slug}`

  return (
    <article className="card card-hover group flex flex-col overflow-hidden">
      <Link to={to} className="block">
        <CardCover typeId={challenge.typeId}>
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
        </CardCover>
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
