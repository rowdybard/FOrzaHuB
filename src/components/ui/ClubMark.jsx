import { cn } from '../../lib/utils'

export default function ClubMark({ club, size = 40, className }) {
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center rounded-xl font-display font-bold leading-none text-white ring-1 ring-white/15',
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.32),
        background: `radial-gradient(120% 120% at 0% 0%, rgba(255,255,255,0.28), transparent 55%), ${club.accent}`,
        textShadow: '0 1px 2px rgba(0,0,0,0.35)',
      }}
      aria-hidden="true"
    >
      {club.tag}
    </span>
  )
}
