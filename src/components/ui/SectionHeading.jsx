import { cn } from '../../lib/utils'

export default function SectionHeading({ eyebrow, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="max-w-2xl">
        {eyebrow && (
          <div className="mb-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-brand-400">
            {eyebrow}
          </div>
        )}
        <h2 className="text-balance text-2xl font-bold sm:text-3xl">{title}</h2>
        {description && <p className="mt-2 text-balance text-zinc-400">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
