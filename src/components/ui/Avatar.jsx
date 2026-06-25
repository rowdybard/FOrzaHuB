import { avatarColors, initials, cn, hexToRgba } from '../../lib/utils'

export default function Avatar({ name = '', size = 36, className, ring = true }) {
  const [accent] = avatarColors(name)
  return (
    <span
      className={cn(
        'inline-grid shrink-0 place-items-center rounded-full font-semibold leading-none',
        ring && 'ring-1 ring-white/10',
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.36),
        color: accent,
        backgroundColor: hexToRgba(accent, 0.1),
        border: `1px solid ${hexToRgba(accent, 0.2)}`,
      }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  )
}
