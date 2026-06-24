import { cn } from '../../lib/utils'

export default function PageHero({ eyebrow, title, description, children, className }) {
  return (
    <section className={cn('relative border-b border-white/[0.06] bg-ink-950', className)}>
      <div className="container-page relative py-10 sm:py-12">
        {eyebrow && (
          <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            {eyebrow}
          </div>
        )}
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">{description}</p>
        )}
        {children}
      </div>
    </section>
  )
}
