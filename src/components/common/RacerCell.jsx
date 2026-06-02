import Avatar from '../ui/Avatar'
import { cn } from '../../lib/utils'

export default function RacerCell({ user, size = 38, showName = true, className }) {
  return (
    <div className={cn('flex min-w-0 items-center gap-3', className)}>
      <Avatar name={user.name} size={size} />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 truncate font-medium text-white">
          <span className="truncate">{user.tag}</span>
          {user.country && <span className="text-xs leading-none">{user.country}</span>}
        </div>
        {showName && (
          <div className="truncate text-xs text-zinc-500">
            {user.name} · {user.platform}
          </div>
        )}
      </div>
    </div>
  )
}
