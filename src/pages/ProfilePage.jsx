import { useState, useEffect } from 'react'
import { Check, MessagesSquare, Sparkles, Save } from 'lucide-react'
import Button from '../components/ui/Button'
import Nameplate from '../components/ui/Nameplate'
import PageHero from '../components/common/PageHero'
import { useAuth } from '../hooks/useAuth'
import { updateMyProfile } from '../data/api'
import { cn, hexToRgba } from '../lib/utils'
import {
  ACCENTS,
  DEFAULT_ACCENT,
  BADGES,
  SELECTABLE_BADGES,
  resolveBadges,
} from '../lib/cosmetics'

export default function ProfilePage() {
  const { enabled, user, profile, loading, signIn, refreshProfile } = useAuth()

  const [accent, setAccent] = useState(DEFAULT_ACCENT)
  const [gradient, setGradient] = useState(false)
  const [badges, setBadges] = useState([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (profile) {
      setAccent(profile.accent || DEFAULT_ACCENT)
      setGradient(!!profile.nameGradient)
      setBadges((profile.badges || []).filter((b) => SELECTABLE_BADGES.includes(b)))
    }
  }, [profile])

  // Signed-out / no-backend states ------------------------------------------
  if (!enabled) {
    return (
      <Centered
        title="Profiles need login"
        body="Connect Supabase + Discord auth to customize your racer nameplate."
      />
    )
  }
  if (loading) {
    return <Centered title="Loading…" body="" />
  }
  if (!user) {
    return (
      <Centered
        title="Sign in to customize"
        body="Your nameplate — color, style and badges — is tied to your Discord account."
        action={
          <Button onClick={signIn}>
            <MessagesSquare className="h-4 w-4" />
            Continue with Discord
          </Button>
        }
      />
    )
  }

  // Live preview user object
  const previewUser = {
    ...profile,
    name: profile?.name || 'Your name',
    accent,
    nameGradient: gradient,
    badges,
  }
  const autoBadges = resolveBadges({ ...profile, badges: [] })

  const toggleBadge = (id) =>
    setBadges((cur) => (cur.includes(id) ? cur.filter((b) => b !== id) : [...cur, id]))

  const save = async () => {
    setSaving(true)
    setSaved(false)
    try {
      await updateMyProfile(user.id, { accent, nameGradient: gradient, badges })
      await refreshProfile()
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      console.error('[profile] save failed', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHero
        eyebrow="Your profile"
        title="Customize your nameplate"
        description="Pick an accent color, style and badges. This is how your name appears across leaderboards and club rosters."
      />

      <div className="container-page py-8">
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_360px]">
          {/* Editor */}
          <div className="space-y-8">
            <Section title="Accent color">
              <div className="flex flex-wrap gap-2.5">
                {ACCENTS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setAccent(c)}
                    className={cn(
                      'h-10 w-10 rounded-full ring-2 transition-transform hover:scale-110',
                      accent === c ? 'ring-white' : 'ring-transparent',
                    )}
                    style={{ background: c, boxShadow: `0 0 16px -2px ${hexToRgba(c, 0.6)}` }}
                    aria-label={`Accent ${c}`}
                  >
                    {accent === c && <Check className="mx-auto h-4 w-4 text-black/70" />}
                  </button>
                ))}
              </div>
            </Section>

            <Section title="Name style">
              <div className="flex gap-2.5">
                <StyleOption active={!gradient} onClick={() => setGradient(false)} label="Solid">
                  <span className="font-semibold" style={{ color: accent }}>
                    Solid
                  </span>
                </StyleOption>
                <StyleOption active={gradient} onClick={() => setGradient(true)} label="Gradient">
                  <span
                    className="font-semibold"
                    style={{
                      backgroundImage: `linear-gradient(92deg, ${accent}, ${hexToRgba(accent, 0.6)})`,
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      color: 'transparent',
                    }}
                  >
                    Gradient
                  </span>
                </StyleOption>
              </div>
            </Section>

            <Section title="Badges" hint="Role badges are earned automatically.">
              {autoBadges.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {autoBadges.map((id) => (
                    <BadgeChip key={id} id={id} locked />
                  ))}
                </div>
              )}
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

            <div className="flex items-center gap-3">
              <Button onClick={save} disabled={saving}>
                <Save className="h-4 w-4" />
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
              {saved && (
                <span className="inline-flex items-center gap-1.5 text-sm text-emerald-300">
                  <Check className="h-4 w-4" />
                  Saved
                </span>
              )}
            </div>
          </div>

          {/* Live preview */}
          <aside className="lg:sticky lg:top-20">
            <div className="card p-6">
              <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <Sparkles className="h-3.5 w-3.5" />
                Live preview
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-ink-900/50 p-5">
                <Nameplate user={previewUser} size={48} />
              </div>
              <p className="mt-4 text-xs leading-relaxed text-zinc-500">
                This is exactly how your name renders in club rosters, standings and leaderboards.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}

function Section({ title, hint, children }) {
  return (
    <section>
      <div className="mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">{title}</h2>
        {hint && <p className="mt-0.5 text-xs text-zinc-500">{hint}</p>}
      </div>
      {children}
    </section>
  )
}

function StyleOption({ active, onClick, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        'grid h-16 flex-1 place-items-center rounded-xl border text-lg transition-colors',
        active
          ? 'border-brand-500/50 bg-brand-500/[0.06]'
          : 'border-white/[0.08] bg-ink-900/40 hover:border-white/20',
      )}
    >
      {children}
    </button>
  )
}

function BadgeChip({ id, active, locked, onClick }) {
  const b = BADGES[id]
  if (!b) return null
  const Icon = b.icon
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={locked}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
        locked && 'cursor-default opacity-90',
        active
          ? 'text-white'
          : 'border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:text-white',
      )}
      style={
        active || locked
          ? {
              color: b.color,
              backgroundColor: hexToRgba(b.color, 0.12),
              borderColor: hexToRgba(b.color, 0.3),
            }
          : undefined
      }
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
      {b.label}
      {locked && <span className="ml-0.5 text-[10px] uppercase tracking-wide opacity-70">auto</span>}
    </button>
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
