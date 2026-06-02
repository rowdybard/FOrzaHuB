import { cn } from '../../lib/utils'

export default function PageHero({ eyebrow, title, description, children, className }) {
  return (
    <section className={cn('relative overflow-hidden border-b border-white/[0.06] bg-festival', className)}>
      <div className="absolute inset-0 bg-grid opacity-50 mask-fade-b" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-ink-950/60" />
      <div className="container-page relative py-12 sm:py-16">
        {eyebrow && (
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-400">
            {eyebrow}
          </div>
        )}
        <h1 className="mt-2 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-2xl text-balance text-zinc-400">{description}</p>
        )}
        {children}
      </div>
    </section>
  )
}
