import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

export default function Loading({ label = 'Loading…', className }) {
  return (
    <div className={cn('flex items-center justify-center gap-2.5 py-16 text-sm text-zinc-500', className)}>
      <Loader2 className="h-4 w-4 animate-spin text-brand-400" />
      {label}
    </div>
  )
}
