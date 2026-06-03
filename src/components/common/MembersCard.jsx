import { useEffect, useState } from 'react'
import { Users, ChevronDown, UserPlus, UserMinus, LogIn, Star } from 'lucide-react'
import Avatar from '../ui/Avatar'
import Nameplate from '../ui/Nameplate'
import Button from '../ui/Button'
import { cn, hexToRgba } from '../../lib/utils'
import { useAuth } from '../../hooks/useAuth'
import { getMyClubMemberships, joinClub, kickClubMember, leaveClub, setPrimaryClub } from '../../data/api'

// Expandable members card for the club aside. Collapsed by default (quiet
// avatar stack + count); click to reveal a height-capped, scrollable roster.
export default function MembersCard({ club, members = [], loading, onChanged, canManage = false }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [kickingId, setKickingId] = useState(null)
  const [error, setError] = useState('')
  const [memberships, setMemberships] = useState([])
  const { user, enabled, signIn } = useAuth()

  const count = members.length || club.members || 0
  const preview = members.slice(0, 5)
  const extra = Math.max(0, count - preview.length)
  const rosterMembership = user ? members.find((m) => m.id === user.id) : null
  const currentMembership = user
    ? memberships.find((m) => m.id === club.id) || rosterMembership
    : null
  const isMember = !!currentMembership
  const isOwner = currentMembership?.membershipRole === 'owner'
  const isPrimary = !!currentMembership?.isPrimary
  const atClubLimit = memberships.length >= 5 && !isMember

  const refreshMemberships = async () => {
    if (!user || !enabled) {
      setMemberships([])
      return
    }
    try {
      setMemberships(await getMyClubMemberships(user.id))
    } catch (err) {
      console.error('[members] membership lookup failed', err)
    }
  }

  useEffect(() => {
    refreshMemberships()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, enabled])

  const handleJoin = async () => {
    if (!user) return signIn()
    setBusy(true)
    setError('')
    try {
      await joinClub(club.id, user.id)
      await refreshMemberships()
      onChanged?.()
    } catch (err) {
      console.error('[members] join failed', err)
      setError(err?.message || 'Could not join club.')
    } finally {
      setBusy(false)
    }
  }

  const handleLeave = async () => {
    if (!user) return
    setBusy(true)
    setError('')
    try {
      await leaveClub(club.id, user.id)
      await refreshMemberships()
      onChanged?.()
    } catch (err) {
      console.error('[members] leave failed', err)
      setError(err?.message || 'Could not leave club.')
    } finally {
      setBusy(false)
    }
  }

  const handleSetPrimary = async () => {
    if (!user) return
    setBusy(true)
    setError('')
    try {
      await setPrimaryClub(user.id, club.id)
      await refreshMemberships()
      onChanged?.()
    } catch (err) {
      console.error('[members] primary club failed', err)
      setError(err?.message || 'Could not set primary club.')
    } finally {
      setBusy(false)
    }
  }

  const handleKick = async (member) => {
    if (!member || member.membershipRole === 'owner' || member.id === user?.id) return
    if (!window.confirm(`Remove ${member.tag || member.name} from ${club.name}?`)) return
    setBusy(true)
    setKickingId(member.id)
    setError('')
    try {
      await kickClubMember(club.id, member.id)
      await refreshMemberships()
      onChanged?.()
    } catch (err) {
      console.error('[members] kick failed', err)
      setError(err?.message || 'Could not remove this member.')
    } finally {
      setKickingId(null)
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
              {members.map((m) => {
                const canKick =
                  canManage &&
                  m.id !== user?.id &&
                  m.membershipRole !== 'owner' &&
                  !['admin', 'steward'].includes(m.role)
                return (
                  <div key={m.id} className="flex items-center gap-2 px-4 py-2.5">
                    <Nameplate user={m} size={34} className="flex-1" />
                    {canKick && (
                      <button
                        type="button"
                        title="Remove member"
                        onClick={() => handleKick(m)}
                        disabled={busy}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 text-zinc-500 transition-colors hover:border-rose-400/30 hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-40"
                      >
                        {kickingId === m.id ? (
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <UserMinus className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                )
              })}
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
              <div className="space-y-2">
                <Button
                  variant={isPrimary ? 'secondary' : 'outline'}
                  size="sm"
                  className="w-full"
                  onClick={isPrimary ? undefined : handleSetPrimary}
                  disabled={busy || isPrimary}
                >
                  <Star className="h-4 w-4" />
                  {isPrimary ? 'Primary club' : 'Set primary'}
                </Button>
                {isOwner ? (
                  <p className="px-1 text-center text-xs text-zinc-500">
                    Club owners cannot leave their owned club during beta.
                  </p>
                ) : (
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
                )}
              </div>
            ) : atClubLimit ? (
              <Button size="sm" className="w-full" disabled>
                <UserPlus className="h-4 w-4" />
                Club limit reached
              </Button>
            ) : (
              <Button size="sm" className="w-full" onClick={handleJoin} disabled={busy}>
                <UserPlus className="h-4 w-4" />
                Join this club
              </Button>
            )}
            {error && <p className="mt-2 px-1 text-center text-xs text-rose-300">{error}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
