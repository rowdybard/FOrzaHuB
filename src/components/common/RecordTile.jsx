import { Link } from 'react-router-dom'
import { Trophy } from 'lucide-react'
import Avatar from '../ui/Avatar'
import { formatNumber } from '../../lib/utils'
import { getType, formatMetric } from '../../lib/challengeTypes'

export default function RecordTile({ typeId, record }) {
  const t = getType(typeId)
  const Icon = t.icon

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.06] bg-white/[0.03]">
          <Icon className="h-4 w-4" style={{ color: t.accent }} />
        </span>
        <div>
          <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            All-time best
          </div>
          <div className="text-sm font-semibold text-white">{t.label}</div>
        </div>
      </div>

      {record ? (
        <>
          <div className="mt-4 font-num text-2xl font-bold tracking-tight text-white">
            {t.gallery ? formatNumber(record.votes) : formatMetric(typeId, record.value)}
            {t.gallery && <span className="ml-1.5 text-sm font-medium text-zinc-500">votes</span>}
          </div>
          <div className="mt-3 flex items-center gap-2 border-t border-white/[0.06] pt-3">
            <Avatar name={record.user.name} size={24} />
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-white">{record.user.tag}</div>
              <Link
                to={`/c/${record.slug}`}
                className="block truncate text-xs text-zinc-500 transition-colors hover:text-brand-300"
              >
                {record.challengeTitle}
              </Link>
            </div>
            <Trophy className="ml-auto h-4 w-4 shrink-0 text-amber-400" />
          </div>
        </>
      ) : (
        <div className="mt-4 text-sm text-zinc-500">No verified results yet.</div>
      )}
    </div>
  )
}
