import { useEffect, useState } from 'react'
import { Check, Hash, MessagesSquare, Save, ShieldCheck, Sparkles, User, Inbox } from 'lucide-react'
import Button from '../components/ui/Button'
import Nameplate from '../components/ui/Nameplate'
import PageHero from '../components/common/PageHero'
import MySubmissions from '../components/common/MySubmissions'
import { useAuth } from '../hooks/useAuth'
import { useAsync } from '../hooks/useAsync'
import { getMyClub, updateMyProfile, getMySubmissions, withdrawSubmission } from '../data/api'
import { cn, hexToRgba } from '../lib/utils'
import {
  ACCENTS,
  BADGES,
  DEFAULT_ACCENT,
  DEFAULT_NAME_EFFECT,
  DEFAULT_PLATE_FRAME,
  EXCLUSIVE_BADGES,
  NAME_EFFECTS,
  PLATE_FRAMES,
  SELECTABLE_BADGES,
  resolveBadges,
} from '../lib/cosmetics'

const inputCls =
  'w-full rounded-lg border border-white/[0.08] bg-ink-900/70 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 transition-colors focus:border-brand-500/50 focus:outline-none'

export default function ProfilePage() {
  const { enabled, user, profile, loading, signIn, refreshProfile } = useAuth()

  const [accent, setAccent] = useState(DEFAULT_ACCENT)
  const [gradient, setGradient] = useState(false)
  const [nameEffect, setNameEffect] = useState(DEFAULT_NAME_EFFECT)
  const [plateFrame, setPlateFrame] = useState(DEFAULT_PLATE_FRAME)
  const [profileTitle, setProfileTitle] = useState('')
  const [badges, setBadges] = useState([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [primaryClub, setPrimaryClub] = useState(null)

  const { data: mySubs, reload: reloadSubs } = useAsync(
    () => (enabled && user ? getMySubmissions() : Promise.resolve([])),
    [enabled, user?.id],
  )

  const handleWithdraw = async (id) => {
    await withdrawSubmission(id)
    reloadSubs()
  }

  useEffect(() => {
    if (profile) {
      setAccent(profile.accent || DEFAULT_ACCENT)
      setGradient(!!profile.nameGradient)
      setNameEffect(profile.nameEffect || DEFAULT_NAME_EFFECT)
      setPlateFrame(profile.plateFrame || DEFAULT_PLATE_FRAME)
      setProfileTitle(profile.profileTitle || '')
      setBadges((profile.badges || []).filter((b) => SELECTABLE_BADGES.includes(b)))
    }
  }, [profile])

  useEffect(() => {
    if (!user) {
      setPrimaryClub(null)
      return
    }
    let active = true
    getMyClub(user.id)
      .then((club) => {
        if (active) setPrimaryClub(club)
      })
      .catch((err) => console.error('[profile] primary club lookup failed', err))
    return () => {
      active = false
    }
  }, [user?.id])

  if (!enabled) {
    return (
      <Centered
        title="Profiles need login"
        body="Connect Supabase and Discord auth to customize your racer profile."
      />
    )
  }
  if (loading) {
    return <Centered title="Loading..." body="" />
  }
  if (!user) {
    return (
      <Centered
        title="Sign in to customize"
        body="Your profile is tied to your Discord account."
        action={
          <Button onClick={signIn}>
            <MessagesSquare className="h-4 w-4" />
            Continue with Discord
          </Button>
        }
      />
    )
  }

  const exclusiveBadges = (profile?.badges || []).filter((id) => EXCLUSIVE_BADGES.includes(id))
  const previewUser = {
    ...profile,
    name: profile?.name || 'Your name',
    membershipRole: primaryClub?.membershipRole,
    accent,
    nameGradient: gradient,
    nameEffect,
    plateFrame,
    profileTitle,
    badges: [...exclusiveBadges, ...badges],
  }
  const autoBadges = resolveBadges({
    ...profile,
    membershipRole: primaryClub?.membershipRole,
    badges: exclusiveBadges,
  })
  const displayTag = profile?.tag || user.user_metadata?.preferred_username || 'Discord'
  const role = profile?.role || 'racer'

  const toggleBadge = (id) =>
    setBadges((cur) => (cur.includes(id) ? cur.filter((b) => b !== id) : [...cur, id]))

  const save = async () => {
    setSaving(true)
    setSaved(false)
    setSaveError('')
    try {
      await updateMyProfile(user.id, {
        accent,
        nameGradient: gradient,
        nameEffect,
        plateFrame,
        profileTitle: profileTitle.trim() || null,
        badges,
      })
      await refreshProfile()
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      console.error('[profile] save failed', err)
      const message = err?.message || ''
      setSaveError(
        /name_effect|plate_frame|profile_title/i.test(message)
          ? 'Run the profile flair migration, then save again.'
          : 'Could not save profile changes.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHero
        eyebrow="My profile"
        title={profile?.name || 'Racer profile'}
        description="Account details, badges, and display settings."
      />

      <div className="container-page py-8">
        <div className="grid items-start gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="space-y-6">
            <section className="card p-5">
              <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <User className="h-3.5 w-3.5" />
                Account
              </div>
              <div className="card-readable rounded-lg p-4">
                <Nameplate user={previewUser} size={52} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <InfoTile label="Discord" value={displayTag} />
                <InfoTile label="Role" value={role} />
                <InfoTile label="Platform" value={profile?.platform || 'Racer'} />
                <InfoTile label="Primary" value={primaryClub?.name || 'None'} />
              </div>
            </section>

            <section className="card p-5">
              <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <ShieldCheck className="h-3.5 w-3.5" />
                Status
              </div>
              {autoBadges.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {autoBadges.map((id) => (
                    <BadgeChip key={id} id={id} locked />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500">No automatic badges yet.</p>
              )}
            </section>
          </div>

          <section className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  <Sparkles className="h-3.5 w-3.5" />
                  Nameplate
                </div>
                <h2 className="mt-1 text-lg font-semibold text-white">Display settings</h2>
              </div>
              <div className="flex items-center gap-3">
                {saved && (
                  <span className="inline-flex items-center gap-1.5 text-sm text-emerald-300">
                    <Check className="h-4 w-4" />
                    Saved
                  </span>
                )}
                <Button onClick={save} disabled={saving} size="sm">
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>

            {saveError && (
              <div className="border-b border-rose-500/15 bg-rose-500/[0.06] px-5 py-3 text-sm text-rose-200">
                {saveError}
              </div>
            )}

            <div className="grid gap-6 p-5 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-6">
                <Section title="Title">
                  <input
                    className={inputCls}
                    value={profileTitle}
                    onChange={(e) => setProfileTitle(e.target.value.slice(0, 28))}
                    maxLength={28}
                    placeholder="Clean Racer"
                  />
                </Section>

                <Section title="Accent">
                  <div className="flex flex-wrap gap-2">
                    {ACCENTS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setAccent(color)}
                        aria-label={`Accent ${color}`}
                        className={cn(
                          'grid h-9 w-9 place-items-center rounded-full ring-2 transition-transform hover:scale-105',
                          accent === color ? 'ring-white' : 'ring-transparent',
                        )}
                        style={{
                          background: color,
                          boxShadow: `0 0 14px -4px ${hexToRgba(color, 0.72)}`,
                        }}
                      >
                        {accent === color && <Check className="h-4 w-4 text-black/70" />}
                      </button>
                    ))}
                  </div>
                </Section>

                <Section title="Fill">
                  <div className="grid grid-cols-2 gap-2">
                    <ModeButton active={!gradient} onClick={() => setGradient(false)}>
                      Solid
                    </ModeButton>
                    <ModeButton active={gradient} onClick={() => setGradient(true)}>
                      Duotone
                    </ModeButton>
                  </div>
                </Section>

                <Section title="Effect">
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {NAME_EFFECTS.map((effect) => (
                      <OptionCard
                        key={effect.id}
                        active={nameEffect === effect.id}
                        onClick={() => setNameEffect(effect.id)}
                        label={effect.label}
                      >
                        <Nameplate
                          user={{
                            ...previewUser,
                            name: effect.label,
                            nameEffect: effect.id,
                            plateFrame: DEFAULT_PLATE_FRAME,
                          }}
                          size={24}
                          showBadges={false}
                          showSub={false}
                        />
                      </OptionCard>
                    ))}
                  </div>
                </Section>

                <Section title="Frame">
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {PLATE_FRAMES.map((frame) => (
                      <OptionCard
                        key={frame.id}
                        active={plateFrame === frame.id}
                        onClick={() => setPlateFrame(frame.id)}
                        label={frame.label}
                      >
                        <Nameplate
                          user={{
                            ...previewUser,
                            name: frame.label,
                            nameEffect: DEFAULT_NAME_EFFECT,
                            plateFrame: frame.id,
                          }}
                          size={24}
                          showBadges={false}
                          showSub={false}
                        />
                      </OptionCard>
                    ))}
                  </div>
                </Section>

                <Section title="Flair badges">
                  <div className="flex flex-wrap gap-2">
                    {SELECTABLE_BADGES.map((id) => (
                      <BadgeChip
                        key={id}
                        id={id}
                        active={badges.includes(id)}
                        onClick={() => toggleBadge(id)}
                      />
                    ))}
                  </div>
                </Section>
              </div>

              <aside className="xl:sticky xl:top-20">
                <div className="card-readable rounded-lg p-4">
                  <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                      Preview
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded border border-white/[0.08] px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                      <Hash className="h-3 w-3" />
                      Live
                    </span>
                  </div>
                  <Nameplate user={previewUser} size={48} />
                </div>
              </aside>
            </div>
          </section>
        </div>
      </div>

      {/* My Submissions */}
      <div className="container-page pb-12">
        <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          <Inbox className="h-3.5 w-3.5" />
          My submissions
        </div>
        <MySubmissions submissions={mySubs || []} onWithdraw={handleWithdraw} />
      </div>
    </>
  )
}

function Section({ title, children }) {
  return (
    <section>
      <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {title}
      </h3>
      {children}
    </section>
  )
}

function OptionCard({ active, onClick, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        'flex h-16 min-w-0 items-center overflow-hidden rounded-lg border px-3 text-left transition-colors',
        active
          ? 'border-brand-500/45 bg-brand-500/[0.07]'
          : 'border-white/[0.08] bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.05]',
      )}
    >
      {children}
    </button>
  )
}

function ModeButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-10 rounded-lg border px-3 text-sm font-semibold transition-colors',
        active
          ? 'border-brand-500/45 bg-brand-500/[0.07] text-white'
          : 'border-white/[0.08] bg-white/[0.025] text-zinc-400 hover:text-white',
      )}
    >
      {children}
    </button>
  )
}

function BadgeChip({ id, active, locked, onClick }) {
  const badge = BADGES[id]
  if (!badge) return null
  const Icon = badge.icon
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={locked}
      className={cn(
        'inline-flex items-center gap-1.5 rounded border px-3 py-1.5 text-sm font-medium transition-colors',
        locked && 'cursor-default opacity-90',
        active
          ? 'text-white'
          : 'border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:text-white',
      )}
      style={
        active || locked
          ? {
              color: badge.color,
              backgroundColor: hexToRgba(badge.color, 0.12),
              borderColor: hexToRgba(badge.color, 0.3),
            }
          : undefined
      }
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
      {badge.label}
      {locked && <span className="ml-0.5 text-[10px] uppercase tracking-wide opacity-70">auto</span>}
    </button>
  )
}

function InfoTile({ label, value }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 py-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">{label}</div>
      <div className="mt-1 truncate text-sm font-semibold text-zinc-200">{value}</div>
    </div>
  )
}

function Centered({ title, body, action }) {
  return (
    <div className="container-page grid min-h-[60vh] place-items-center py-16 text-center">
      <div className="max-w-md">
        <h1 className="text-2xl font-extrabold">{title}</h1>
        {body && <p className="mt-2 text-zinc-400">{body}</p>}
        {action && <div className="mt-6 flex justify-center">{action}</div>}
      </div>
    </div>
  )
}
