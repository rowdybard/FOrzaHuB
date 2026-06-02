import { cn } from '../../lib/utils'

export default function StatTile({ icon: Icon, label, value, sub, className }) {
  return (
    <div className={cn('card p-5', className)}>
      <div className="flex items-center gap-3.5">
        {Icon && (
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.04] text-brand-400">
            <Icon className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0">
          <div className="font-num text-2xl font-bold leading-tight text-white">{value}</div>
          <div className="truncate text-sm text-zinc-400">{label}</div>
        </div>
      </div>
      {sub && <div className="mt-3 border-t border-white/[0.06] pt-3 text-xs text-zinc-500">{sub}</div>}
    </div>
  )
}
