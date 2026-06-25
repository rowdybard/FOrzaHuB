import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Check, CircleAlert, MessagesSquare, Save } from 'lucide-react'
import Button from '../components/ui/Button'
import ClubMark from '../components/ui/ClubMark'
import PageHero from '../components/common/PageHero'
import Loading from '../components/common/Loading'
import { createClub, getMyOwnedClub } from '../data/api'
import { useAuth } from '../hooks/useAuth'
import { ACCENTS, DEFAULT_ACCENT } from '../lib/cosmetics'
import { cn, hexToRgba } from '../lib/utils'

const inputCls =
  'w-full rounded-xl border border-white/[0.08] bg-ink-900/60 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 transition-colors focus:border-brand-500/50 focus:outline-none'

function cleanDiscordUrl(value) {
  const raw = value.trim()
  if (!raw) return ''
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  try {
    const url = new URL(withProtocol)
    const host = url.hostname.toLowerCase().replace(/^www\./, '')
    const isDiscord =
      host === 'discord.gg' ||
      host === 'discord.com' ||
      host.endsWith('.discord.com') ||
      host === 'discordapp.com' ||
      host.endsWith('.discordapp.com')
    return (url.protocol === 'https:' || url.protocol === 'http:') && isDiscord
      ? url.toString()
      : ''
  } catch {
    return ''
  }
}

export default function CreateClubPage() {
  const navigate = useNavigate()
  const { enabled, user, loading: authLoading, signIn } = useAuth()
  const [ownedClub, setOwnedClub] = useState(null)
  const [checkingOwned, setCheckingOwned] = useState(false)
  const [form, setForm] = useState({
    name: '',
    tag: '',
    region: 'Global',
    tagline: '',
    about: '',
    discord: '',
    accent: DEFAULT_ACCENT,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) {
      setOwnedClub(null)
      return
    }
    let active = true
    setCheckingOwned(true)
    getMyOwnedClub(user.id)
      .then((club) => {
        if (active) setOwnedClub(club)
      })
      .catch((err) => {
        console.error('[clubs] owned club lookup failed', err)
        if (active) setError('Could not check your club status.')
      })
      .finally(() => {
        if (active) setCheckingOwned(false)
      })
    return () => {
      active = false
    }
  }, [user])

  const preview = useMemo(
    () => ({
      name: form.name.trim() || 'Your club',
      tag: form.tag.trim().toUpperCase() || 'CLB',
      region: form.region.trim() || 'Global',
      accent: form.accent,
      tagline: form.tagline.trim() || 'Club tagline',
      members: 1,
      stats: { challenges: 0 },
    }),
    [form],
  )

  const set = (key) => (event) => {
    const value = event.target.value
    setError('')
    setForm((current) => ({
      ...current,
      [key]: key === 'tag' ? value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5) : value,
    }))
  }

  const canSubmit =
    form.name.trim().length >= 3 &&
    form.tag.trim().length >= 2 &&
    form.region.trim().length >= 2 &&
    !saving

  const submit = async (event) => {
    event.preventDefault()
    if (!user) {
      signIn()
      return
    }
    if (!canSubmit) {
      setError('Add a club name, tag, and region.')
      return
    }
    const discord = cleanDiscordUrl(form.discord)
    if (form.discord.trim() && !discord) {
      setError('Use a valid Discord invite link.')
      return
    }

    setSaving(true)
    setError('')
    try {
      const result = await createClub({
        ...form,
        discord,
        ownerId: user.id,
      })
      const slug = result.club?.slug
      navigate(slug ? `/club/${slug}` : '/clubs')
    } catch (err) {
      console.error('[clubs] create failed', err)
      setError(err?.message || 'Could not create club.')
    } finally {
      setSaving(false)
    }
  }

  if (!enabled) {
    return (
      <Centered
        title="Supabase required"
        body="Community creation needs Discord login and the database backend."
      />
    )
  }

  if (authLoading || checkingOwned) return <Loading label="Checking account..." className="min-h-[60vh]" />

  if (!user) {
    return (
      <Centered
        title="Sign in required"
        body="Sign in with Discord before creating a community."
        action={
          <Button onClick={signIn}>
            <MessagesSquare className="h-4 w-4" />
            Sign in with Discord
          </Button>
        }
      />
    )
  }

  if (ownedClub) {
    return (
      <div>
        <PageHero
          eyebrow="Communities"
          title="You already own a club"
          description="During beta, each account can own one club."
        />
        <div className="container-page grid min-h-[42vh] place-items-center py-10">
          <div className="card w-full max-w-lg p-5">
            <div className="flex items-center gap-4">
              <ClubMark club={ownedClub} size={56} />
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-bold text-white">{ownedClub.name}</h2>
                <p className="text-sm text-zinc-500">{ownedClub.region || 'Global'}</p>
              </div>
            </div>
            <Button to={`/club/${ownedClub.slug}`} className="mt-5 w-full">
              View club
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHero
        eyebrow="Communities"
        title="Start a community"
        description="Create one club for your Discord or racing group."
      />

      <div className="container-page py-8">
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <form onSubmit={submit} className="card p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Club name" required>
                <input
                  value={form.name}
                  onChange={set('name')}
                  maxLength={48}
                  placeholder="e.g. Apex Union"
                  className={inputCls}
                />
              </Field>
              <Field label="Tag" required>
                <input
                  value={form.tag}
                  onChange={set('tag')}
                  maxLength={5}
                  placeholder="APEX"
                  className={`${inputCls} font-mono uppercase`}
                />
              </Field>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Region" required>
                <input
                  value={form.region}
                  onChange={set('region')}
                  maxLength={32}
                  placeholder="Global"
                  className={inputCls}
                />
              </Field>
              <Field label="Discord link">
                <input
                  value={form.discord}
                  onChange={set('discord')}
                  maxLength={160}
                  placeholder="https://discord.gg/..."
                  className={inputCls}
                />
              </Field>
            </div>

            <Field label="Tagline" className="mt-4">
              <input
                value={form.tagline}
                onChange={set('tagline')}
                maxLength={120}
                placeholder="Short roster line"
                className={inputCls}
              />
            </Field>

            <Field label="About" className="mt-4">
              <textarea
                value={form.about}
                onChange={set('about')}
                rows={4}
                maxLength={800}
                placeholder="What kind of events this club runs"
                className={`${inputCls} resize-none`}
              />
            </Field>

            <div className="mt-5">
              <div className="mb-2.5 text-sm font-medium text-zinc-300">Accent</div>
              <div className="flex flex-wrap gap-2">
                {ACCENTS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, accent: color }))}
                    aria-label={`Accent ${color}`}
                    className={cn(
                      'grid h-9 w-9 place-items-center rounded-full ring-2 transition-transform hover:scale-105',
                      form.accent === color ? 'ring-white' : 'ring-transparent',
                    )}
                    style={{
                      background: color,
                      boxShadow: `0 0 14px -4px ${hexToRgba(color, 0.72)}`,
                    }}
                  >
                    {form.accent === color && <Check className="h-4 w-4 text-black/70" />}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="mt-5 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] px-3 py-2 text-sm text-rose-200">
                <CircleAlert className="h-4 w-4 shrink-0" />
                {error}
              </p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Link to="/clubs" className="text-sm text-zinc-400 hover:text-white">
                Cancel
              </Link>
              <Button type="submit" disabled={!canSubmit}>
                <Save className="h-4 w-4" />
                {saving ? 'Creating...' : 'Create club'}
              </Button>
            </div>
          </form>

          <aside className="card p-5 lg:sticky lg:top-20">
            <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Preview
            </div>
            <div className="card-readable rounded-xl p-4">
              <div className="flex items-center gap-3">
                <ClubMark club={preview} size={52} />
                <div className="min-w-0">
                  <h2 className="truncate font-semibold text-white">{preview.name}</h2>
                  <p className="text-sm text-zinc-500">{preview.region}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-zinc-400">{preview.tagline}</p>
            </div>
            <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3 text-sm text-zinc-400">
              One owned club per account during beta. You can still join multiple clubs and set one primary club.
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

function Field({ label, required, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <div className="mb-1.5 text-sm font-medium text-zinc-300">
        {label}
        {required && <span className="ml-1 text-brand-400">*</span>}
      </div>
      {children}
    </label>
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
