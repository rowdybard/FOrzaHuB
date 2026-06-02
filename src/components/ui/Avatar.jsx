import { avatarColors, initials, cn } from '../../lib/utils'

export default function Avatar({ name = '', size = 36, className, ring = true }) {
  const [a, b] = avatarColors(name)
  return (
    <span
      className={cn(
        'inline-grid shrink-0 place-items-center rounded-full font-semibold leading-none text-white',
        ring && 'ring-1 ring-white/10',
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.36),
        background: `linear-gradient(135deg, ${a}, ${b})`,
      }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  )
}
