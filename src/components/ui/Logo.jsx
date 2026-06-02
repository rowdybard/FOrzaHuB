import { Link } from 'react-router-dom'
import { ChevronsRight } from 'lucide-react'
import { cn } from '../../lib/utils'

export default function Logo({ className, showText = true, to = '/' }) {
  return (
    <Link to={to} className={cn('group inline-flex items-center gap-2.5', className)}>
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-[0_8px_20px_-8px_rgba(255,107,44,0.9)] transition-transform duration-200 group-hover:scale-105">
        <ChevronsRight className="h-5 w-5 text-ink-950" strokeWidth={3} />
      </span>
      {showText && (
        <span className="font-display text-lg font-extrabold tracking-tight text-white">
          Pitwall
        </span>
      )}
    </Link>
  )
}
