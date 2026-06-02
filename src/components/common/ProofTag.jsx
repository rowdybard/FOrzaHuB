import { Video, Image as ImageIcon, Camera } from 'lucide-react'
import { cn } from '../../lib/utils'

const MAP = {
  video: { icon: Video, label: 'Video' },
  screenshot: { icon: ImageIcon, label: 'Screenshot' },
  photo: { icon: Camera, label: 'Photo' },
}

export default function ProofTag({ proof, compact = false, className }) {
  const m = MAP[proof?.type] || MAP.screenshot
  const Icon = m.icon
  return (
    <a
      href={proof?.url || '#'}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-white/20 hover:text-white',
        className,
      )}
      title={`View ${m.label.toLowerCase()} proof`}
    >
      <Icon className="h-3.5 w-3.5" />
      {!compact && m.label}
    </a>
  )
}
