import { Trophy } from 'lucide-react'
import Avatar from '../ui/Avatar'
import EmptyState from './EmptyState'
import { formatNumber } from '../../lib/utils'

export default function SeriesStandings({ standings, compact = false }) {
  if (!standings || standings.length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title="No series standings yet"
        description="Standings appear once approved submissions come in from sponsored events."
      />
    )
  }

  const max = standings[0]?.totalPoints || 1

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.06] bg-white/[0.02] text-left text-xs text-zinc-500">
            <th className="w-10 px-4 py-2.5 font-medium">#</th>
            <th className="px-4 py-2.5 font-medium">Racer</th>
            <th className="hidden px-4 py-2.5 text-center font-medium sm:table-cell">Events</th>
            <th className="px-4 py-2.5 text-right font-medium">Points</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s) => (
            <tr
              key={s.userId}
              className="border-b border-white/[0.04] last:border-0 transition-colors hover:bg-white/[0.02]"
            >
              <td className="px-4 py-3">
                {s.rank <= 3 ? (
                  <span
                    className={
                      s.rank === 1
                        ? 'font-bold text-amber-400'
                        : s.rank === 2
                          ? 'font-bold text-zinc-300'
                          : 'font-bold text-orange-400/70'
                    }
                  >
                    {s.rank}
                  </span>
                ) : (
                  <span className="text-zinc-500">{s.rank}</span>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <Avatar name={s.displayName || s.gamertag} size={24} />
                  <div className="min-w-0">
                    <div className="truncate font-medium text-white">
                      {s.displayName || s.gamertag}
                    </div>
                    {!compact && (
                      <div className="truncate text-xs text-zinc-500">
                        {s.platform || ''}
                        {s.platform && s.bestFinish ? ' · ' : ''}
                        {s.bestFinish ? `Best P${s.bestFinish}` : ''}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="hidden px-4 py-3 text-center text-zinc-400 sm:table-cell">
                {s.eventsEntered}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  {!compact && (
                    <div className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-white/[0.06] sm:block">
                      <div
                        className="h-full rounded-full bg-brand-500"
                        style={{ width: `${(s.totalPoints / max) * 100}%` }}
                      />
                    </div>
                  )}
                  <span className="font-num font-semibold tabular-nums text-white">
                    {formatNumber(s.totalPoints)}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
