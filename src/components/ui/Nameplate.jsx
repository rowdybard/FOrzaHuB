import Avatar from './Avatar'
import { cn, hexToRgba } from '../../lib/utils'
import {
  BADGES,
  DEFAULT_ACCENT,
  DEFAULT_NAME_EFFECT,
  DEFAULT_PLATE_FRAME,
  NAME_EFFECTS,
  PLATE_FRAMES,
  resolveBadges,
} from '../../lib/cosmetics'

const EFFECT_IDS = new Set(NAME_EFFECTS.map((effect) => effect.id))
const FRAME_IDS = new Set(PLATE_FRAMES.map((frame) => frame.id))

// A racer's name styled with their chosen accent, frame, effect, and badges.
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
  const effectId = EFFECT_IDS.has(user.nameEffect) ? user.nameEffect : DEFAULT_NAME_EFFECT
  const frameId = FRAME_IDS.has(user.plateFrame) ? user.plateFrame : DEFAULT_PLATE_FRAME
  const title = cleanTitle(user.profileTitle)
  const subParts = [title, user.country, user.platform || 'Racer'].filter(Boolean)
  const nameStyle = getNameStyle(effectId, accent, !!user.nameGradient)
  const frame = getFrameProps(frameId, accent)

  return (
    <div className={cn('flex min-w-0 items-center gap-3', className)}>
      <span
        className="relative grid shrink-0 place-items-center rounded-full"
        style={{ boxShadow: `0 0 0 2px ${hexToRgba(accent, 0.55)}` }}
      >
        <Avatar name={user.name} size={size} ring={false} />
      </span>

      <div className="min-w-0">
        <div
          className={cn(
            'inline-flex max-w-full min-w-0 items-center gap-1.5 align-middle',
            frame.className,
          )}
          style={frame.style}
        >
          <span
            className={cn(
              'min-w-0 truncate font-semibold leading-tight',
              effectId === 'terminal' && 'font-mono text-[0.95em]',
              effectId === 'sticker' && 'rounded px-1.5 py-0.5',
              effectId === 'stripe' && 'pb-0.5',
            )}
            style={nameStyle}
          >
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
            {subParts.map((part, index) => (
              <span key={`${part}-${index}`}>
                {index > 0 && <span className="mx-1 text-zinc-700">/</span>}
                {part}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function cleanTitle(value) {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, 28)
}

function getNameStyle(effectId, accent, gradient) {
  const fill = gradient
    ? {
        backgroundImage: `linear-gradient(92deg, ${accent}, #ffffff 52%, ${hexToRgba(accent, 0.72)})`,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
      }
    : { color: accent }

  switch (effectId) {
    case 'glow':
      return {
        ...fill,
        filter: `drop-shadow(0 0 7px ${hexToRgba(accent, 0.42)})`,
        textShadow: `0 0 1px ${hexToRgba('#ffffff', 0.8)}`,
      }
    case 'chrome':
      return {
        backgroundImage: `linear-gradient(180deg, #ffffff 6%, #d4d4d8 38%, ${accent} 55%, #ffffff 82%)`,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
        textShadow: '0 1px 0 rgba(255,255,255,0.14)',
      }
    case 'stripe':
      return {
        ...fill,
        boxShadow: `0 2px 0 ${hexToRgba(accent, 0.78)}`,
        textShadow: `1px 1px 0 ${hexToRgba('#000000', 0.45)}`,
      }
    case 'terminal':
      return gradient
        ? {
            backgroundImage: `linear-gradient(92deg, #86efac, ${accent} 58%, #d9f99d)`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            textShadow: '0 0 8px rgba(134,239,172,0.24)',
          }
        : {
            color: '#86efac',
            textShadow: '0 0 8px rgba(134,239,172,0.32)',
          }
    case 'sticker':
      return {
        color: '#ffffff',
        backgroundColor: hexToRgba(accent, 0.18),
        backgroundImage: gradient
          ? `linear-gradient(92deg, ${hexToRgba(accent, 0.48)}, rgba(255,255,255,0.14) 52%, ${hexToRgba(accent, 0.28)})`
          : undefined,
        boxShadow: `inset 0 0 0 1px ${hexToRgba(accent, 0.36)}`,
        textShadow: `1px 1px 0 ${hexToRgba('#000000', 0.55)}`,
      }
    default:
      return fill
  }
}

function getFrameProps(frameId, accent) {
  const borderColor = hexToRgba(accent, 0.34)
  switch (frameId) {
    case 'forum':
      return {
        className: 'rounded-md border px-2 py-1',
        style: {
          backgroundColor: 'rgba(255,255,255,0.035)',
          borderColor,
        },
      }
    case 'carbon':
      return {
        className: 'rounded-md border px-2 py-1',
        style: {
          backgroundColor: '#0b0c0f',
          backgroundImage:
            'linear-gradient(135deg, rgba(255,255,255,0.055) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.055) 50%, rgba(255,255,255,0.055) 75%, transparent 75%, transparent)',
          backgroundSize: '10px 10px',
          borderColor,
        },
      }
    case 'neon':
      return {
        className: 'rounded-md border px-2 py-1',
        style: {
          backgroundColor: 'rgba(8,9,11,0.72)',
          borderColor,
          boxShadow: `0 0 14px -7px ${accent}, inset 0 0 14px -12px ${accent}`,
        },
      }
    case 'chrome':
      return {
        className: 'rounded-md border px-2 py-1',
        style: {
          backgroundImage:
            'linear-gradient(180deg, rgba(255,255,255,0.11), rgba(255,255,255,0.025) 46%, rgba(0,0,0,0.2))',
          borderColor: 'rgba(255,255,255,0.16)',
        },
      }
    case 'ribbon':
      return {
        className: 'rounded-md border px-2 py-1',
        style: {
          backgroundImage: `linear-gradient(90deg, ${hexToRgba(accent, 0.22)}, rgba(255,255,255,0.035) 42%, ${hexToRgba('#000000', 0.12)})`,
          borderColor,
        },
      }
    default:
      return { className: '', style: undefined }
  }
}
