import { cn, hexToRgba } from '../../lib/utils'

export default function ClubMark({ club, size = 40, className }) {
  if (!club) return null
  const accent = club.accent || '#94a3b8'
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center rounded-lg font-display font-bold leading-none',
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.32),
        color: accent,
        backgroundColor: hexToRgba(accent, 0.1),
        border: `1px solid ${hexToRgba(accent, 0.2)}`,
      }}
      aria-hidden="true"
    >
      {club.tag}
    </span>
  )
}
