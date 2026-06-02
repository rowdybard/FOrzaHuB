import Avatar from './Avatar'
import { cn, hexToRgba } from '../../lib/utils'
import { BADGES, DEFAULT_ACCENT, resolveBadges } from '../../lib/cosmetics'

// A racer's name styled with their chosen accent + badges (Option A nameplate).
// Used in the club roster, standings, and the profile editor preview.
export default function Nameplate({
  user,
  size = 36,
  showBadges = true,
  showSub = true,
  className,
}) {
  if (!user) return null
  const accent = user.accent || DEFAULT_ACCENT
  const badges = showBadges ? resolveBadges(user) : []

  const nameStyle = user.nameGradient
    ? {
        backgroundImage: `linear-gradient(92deg, ${accent}, ${hexToRgba(accent, 0.65)})`,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
      }
    : { color: accent }

  return (
    <div className={cn('flex min-w-0 items-center gap-3', className)}>
      <span
        className="relative grid shrink-0 place-items-center rounded-full"
        style={{ boxShadow: `0 0 0 2px ${hexToRgba(accent, 0.55)}` }}
      >
        <Avatar name={user.name} size={size} ring={false} />
      </span>

      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-semibold leading-tight" style={nameStyle}>
            {user.name}
          </span>
          {badges.map((id) => {
            const b = BADGES[id]
            if (!b) return null
            const Icon = b.icon
            return (
              <span
                key={id}
                title={b.label}
                className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full ring-1"
                style={{
                  color: b.color,
                  backgroundColor: hexToRgba(b.color, 0.12),
                  '--tw-ring-color': hexToRgba(b.color, 0.3),
                }}
              >
                <Icon className="h-3 w-3" strokeWidth={2.4} />
              </span>
            )
          })}
        </div>
        {showSub && (
          <div className="truncate text-xs text-zinc-500">
            {user.country && <span className="mr-1">{user.country}</span>}
            {user.platform || 'Racer'}
          </div>
        )}
      </div>
    </div>
  )
}
