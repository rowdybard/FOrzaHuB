import { useState } from 'react'
import { Users, ChevronDown, UserPlus, UserMinus, LogIn } from 'lucide-react'
import Avatar from '../ui/Avatar'
import Nameplate from '../ui/Nameplate'
import Button from '../ui/Button'
import { cn, hexToRgba } from '../../lib/utils'
import { useAuth } from '../../hooks/useAuth'
import { joinClub, leaveClub } from '../../data/api'

// Expandable members card for the club aside. Collapsed by default (quiet
// avatar stack + count); click to reveal a height-capped, scrollable roster.
export default function MembersCard({ club, members = [], loading, onChanged }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const { user, enabled, signIn } = useAuth()

  const count = members.length || club.members || 0
  const preview = members.slice(0, 5)
  const extra = Math.max(0, count - preview.length)
  const isMember = user ? members.some((m) => m.id === user.id) : false

  const handleJoin = async () => {
    if (!user) return signIn()
    setBusy(true)
    try {
      await joinClub(club.id, user.id)
      onChanged?.()
    } catch (err) {
      console.error('[members] join failed', err)
    } finally {
      setBusy(false)
    }
  }

  const handleLeave = async () => {
    if (!user) return
    setBusy(true)
    try {
      await leaveClub(club.id, user.id)
      onChanged?.()
    } catch (err) {
      console.error('[members] leave failed', err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card overflow-hidden">
      {/* Header — the whole thing is the expand toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-white/[0.03]"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/[0.05] text-brand-300">
          <Users className="h-4.5 w-4.5" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-white">
            Members
            <span className="font-num text-zinc-500">· {count}</span>
          </div>
          <div className="text-xs text-zinc-500">
            {open ? 'Tap to collapse' : 'Tap to view the roster'}
          </div>
        </div>

        {/* Avatar stack preview (collapsed affordance) */}
        {!open && preview.length > 0 && (
          <div className="flex -space-x-2.5">
            {preview.map((m) => (
              <span
                key={m.id}
                className="rounded-full ring-2 ring-ink-900"
                style={{ boxShadow: `0 0 0 1.5px ${hexToRgba(m.accent || '#94a3b8', 0.6)}` }}
              >
                <Avatar name={m.name} size={26} ring={false} />
              </span>
            ))}
            {extra > 0 && (
              <span className="grid h-[26px] min-w-[26px] place-items-center rounded-full bg-white/[0.08] px-1 text-[10px] font-semibold text-zinc-300 ring-2 ring-ink-900">
                +{extra}
              </span>
            )}
          </div>
        )}

        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-zinc-500 transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      {/* Expanded roster — height-capped + scrollable so it never fatigues */}
      {open && (
        <div className="border-t border-white/[0.06]">
          {loading ? (
            <div className="p-4 text-sm text-zinc-500">Loading roster…</div>
          ) : count === 0 ? (
            <div className="p-4 text-sm text-zinc-500">
              No members yet. Be the first to join.
            </div>
          ) : (
            <div className="no-scrollbar max-h-[320px] divide-y divide-white/[0.05] overflow-y-auto">
              {members.map((m) => (
                <div key={m.id} className="px-4 py-2.5">
                  <Nameplate user={m} size={34} />
                </div>
              ))}
            </div>
          )}

          {/* Join / Leave */}
          <div className="border-t border-white/[0.06] p-3">
            {!enabled ? (
              <p className="px-1 text-center text-xs text-zinc-500">
                Connect Discord login to join clubs.
              </p>
            ) : !user ? (
              <Button variant="secondary" size="sm" className="w-full" onClick={signIn}>
                <LogIn className="h-4 w-4" />
                Sign in to join
              </Button>
            ) : isMember ? (
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={handleLeave}
                disabled={busy}
              >
                <UserMinus className="h-4 w-4" />
                Leave club
              </Button>
            ) : (
              <Button size="sm" className="w-full" onClick={handleJoin} disabled={busy}>
                <UserPlus className="h-4 w-4" />
                Join this club
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
