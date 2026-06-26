import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Seo from '../components/Seo'
import {
  Upload,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Info,
  Link2,
  Image as ImageIcon,
  Video,
  ChevronRight,
  CircleAlert,
  MessagesSquare,
  Calendar,
} from 'lucide-react'
import PageHero from '../components/common/PageHero'
import Button from '../components/ui/Button'
import Cover from '../components/ui/Cover'
import ClubMark from '../components/ui/ClubMark'
import { TypeBadge } from '../components/ui/Badge'
import { getSubmittableChallenges, getChallengesWithClubs, createSubmission, uploadProof, getUserSubmission } from '../data/api'
import { useAsync } from '../hooks/useAsync'
import { useAuth } from '../hooks/useAuth'
import Loading from '../components/common/Loading'
import { getType } from '../lib/challengeTypes'
import { formatDate } from '../lib/utils'
import { containsBannedWord } from '../lib/moderation'

const inputCls =
  'w-full rounded-xl border border-white/[0.08] bg-ink-900/60 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 transition-colors focus:border-brand-500/50 focus:outline-none'

const ALLOWED_PROOF_EXTS = new Set(['png', 'jpg', 'jpeg', 'webp'])
const ALLOWED_PROOF_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
])
const DEFAULT_MAX_PROOF_MB = 10
const configuredMaxProofMb = Number(import.meta.env.VITE_MAX_PROOF_UPLOAD_MB)
const MAX_PROOF_MB =
  Number.isFinite(configuredMaxProofMb) && configuredMaxProofMb > 0
    ? configuredMaxProofMb
    : DEFAULT_MAX_PROOF_MB
const MAX_PROOF_BYTES = MAX_PROOF_MB * 1024 * 1024

// Parse a typed result into a numeric value. Times like "1:58.420" become
// seconds; plain numbers (scores) keep their value.
function parseResult(raw) {
  if (!raw) return null
  const s = String(raw).trim().replace(/,/g, '')
  if (s.includes(':')) {
    const [m, rest] = s.split(':')
    return Number(m) * 60 + Number(rest)
  }
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

const VIDEO_HOSTS = ['youtube.com', 'youtu.be', 'medal.tv', 'tiktok.com', 'streamable.com', 'xbox.com']

function deriveProofType(form, isGallery) {
  if (form.file) return isGallery ? 'photo' : 'screenshot'
  const link = (form.link || '').trim().toLowerCase()
  if (link) {
    const isVideo = VIDEO_HOSTS.some((h) => link.includes(h))
    return isVideo ? 'video' : isGallery ? 'photo' : 'screenshot'
  }
  return isGallery ? 'photo' : 'screenshot'
}

export default function SubmitScorePage() {
  const { slug } = useParams()
  const { enabled, user, profile, loading: authLoading, signIn } = useAuth()
  const { data: options, loading } = useAsync(() => getSubmittableChallenges(), [])
  const { data: allChallenges } = useAsync(() => getChallengesWithClubs(), [])
  const list = options || []

  const [challengeId, setChallengeId] = useState(null)
  const [form, setForm] = useState({
    gamertag: '',
    platform: 'PC',
    result: '',
    title: '',
    shareCode: '',
    link: '',
    notes: '',
    agree: false,
    fileName: '',
    file: null,
  })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [existingSubmission, setExistingSubmission] = useState(null)
  const [checkingExisting, setCheckingExisting] = useState(false)

  // Default selection: URL slug match, else first live challenge.
  const selectedId = challengeId ?? (list.find((c) => c.slug === slug)?.id || list[0]?.id)
  const challenge = list.find((c) => c.id === selectedId) || null
  const t = challenge ? getType(challenge.typeId) : null
  const club = challenge?.club || null
  const isGallery = t?.gallery

  // Check if user already has a pending/approved submission for the selected challenge
  useEffect(() => {
    if (!enabled || !user || !challenge) {
      setExistingSubmission(null)
      return
    }
    let cancelled = false
    setCheckingExisting(true)
    getUserSubmission(challenge.id, user.id)
      .then((sub) => {
        if (!cancelled) setExistingSubmission(sub)
      })
      .catch(() => {
        if (!cancelled) setExistingSubmission(null)
      })
      .finally(() => {
        if (!cancelled) setCheckingExisting(false)
      })
    return () => { cancelled = true }
  }, [enabled, user, challenge?.id])

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [k]: v }))
  }

  const setProofFile = (file) => {
    setError('')
    if (!file) {
      setForm((f) => ({ ...f, file: null, fileName: '' }))
      return
    }

    const ext = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : ''
    const typeAllowed = ALLOWED_PROOF_TYPES.has(file.type)
    const extAllowed = ALLOWED_PROOF_EXTS.has(ext)

    if (!extAllowed || (file.type && !typeAllowed)) {
      setForm((f) => ({ ...f, file: null, fileName: '' }))
      setError('Proof file must be PNG, JPG, or WEBP.')
      return
    }

    if (file.size > MAX_PROOF_BYTES) {
      setForm((f) => ({ ...f, file: null, fileName: '' }))
      setError(`Proof file must be ${MAX_PROOF_MB}MB or smaller.`)
      return
    }

    setForm((f) => ({ ...f, file, fileName: file.name }))
  }

  const resultFilled = isGallery ? form.title.trim() : form.result.trim()
  const parsedResult = isGallery ? null : parseResult(form.result)
  const hasProof = form.file || form.link.trim()
  const authReady = !!user
  const canSubmit = authReady && form.gamertag.trim() && resultFilled && (isGallery || parsedResult !== null) && hasProof && form.agree && !submitting && !checkingExisting && !existingSubmission

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) {
      setError('Sign in with Discord before submitting.')
      return
    }
    if (!canSubmit || !challenge) return
    if (!isGallery && parseResult(form.result) == null) {
      setError('Enter a valid time (e.g. 1:58.420) or score.')
      return
    }
    if (containsBannedWord(form.gamertag)) {
      setError('Gamertag contains language that is not allowed.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      let proofUrl = form.link.trim()
      if (form.file) {
        try {
          proofUrl = await uploadProof({ file: form.file, challengeId: challenge.id, userId: user?.id || 'demo' })
        } catch (uploadErr) {
          throw new Error(uploadErr?.message || 'Proof upload failed. Try another file or paste a link.')
        }
      }

      await createSubmission({
        challenge_id: challenge.id,
        user_id: user?.id,
        value: isGallery ? null : parseResult(form.result),
        title: isGallery ? form.title : null,
        share_code: form.shareCode || null,
        proof_type: deriveProofType(form, isGallery),
        proof_url: proofUrl || null,
        note: form.notes || null,
        status: 'pending',
      })
      setSubmitted(true)
    } catch (err) {
      console.error('[submit] createSubmission failed', err)
      setError(err.message || 'Submission failed. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!enabled) {
    return (
      <Centered
        title="Supabase required"
        body="Submissions need Discord login and the database backend."
      />
    )
  }

  if (authLoading) {
    return <Loading label="Checking account..." className="min-h-[60vh]" />
  }

  if (!user) {
    return (
      <Centered
        title="Sign in required"
        body="Sign in with Discord before submitting results or proof."
        action={<Button onClick={signIn}>Sign in with Discord</Button>}
      />
    )
  }

  if (loading) {
    return <Loading label="Loading challenges…" className="min-h-[60vh]" />
  }

  if (!challenge) {
    const upcoming = (allChallenges || [])
      .filter((c) => c.status === 'upcoming')
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    const nextEvent = upcoming[0] || null
    return (
      <div>
        <Seo title="Submit Your Score" description="Submit your Forza Horizon 6 tournament result with screenshot or video proof. Every entry is verified by club staff before appearing on the leaderboard." path="/submit" />
        <PageHero
          eyebrow="Submit"
          title="No live events right now"
          description="Events open and close throughout the week. Here's what's coming up."
        />
        <div className="container-page py-8">
          <div className="mx-auto max-w-lg space-y-6">
            {nextEvent && (
              <Link
                to={`/c/${nextEvent.slug}`}
                className="block rounded-2xl border border-white/[0.08] bg-ink-900/60 p-5 transition-colors hover:border-white/[0.15]"
              >
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-400">
                  <Calendar className="h-3.5 w-3.5" />
                  Next event
                </div>
                <h2 className="mt-2 text-lg font-bold text-white">{nextEvent.title}</h2>
                {nextEvent.club && (
                  <p className="mt-0.5 text-sm text-zinc-400">Hosted by {nextEvent.club.name}</p>
                )}
                <p className="mt-2 text-sm text-zinc-400">
                  Opens {formatDate(nextEvent.startDate, { month: 'short', day: 'numeric' })}
                </p>
              </Link>
            )}
            <div className="rounded-2xl border border-white/[0.1] bg-black/90 p-5 text-center">
              <p className="text-sm text-zinc-400">
                {nextEvent
                  ? "Check back when the event goes live, or join the Discord to get notified."
                  : "No events scheduled yet. Join the Discord to get notified when events open."}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Button
                  href="https://discord.gg/GJw3XRuCXr"
                  variant="secondary"
                >
                  <MessagesSquare className="h-4 w-4" />
                  Join Discord
                </Button>
                <Button to="/challenges" variant="ghost">Browse all events</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (submitted) {
    return <SuccessView challenge={challenge} club={club} t={t} form={form} onReset={() => setSubmitted(false)} />
  }

  if (existingSubmission) {
    const isPending = existingSubmission.status === 'pending'
    return (
      <div>
        <PageHero
          eyebrow="Submit"
          title="Already entered"
          description="You have an existing submission for this event."
        />
        <div className="container-page py-8">
          <div className="mx-auto max-w-md card-readable rounded-2xl p-6 text-center">
            {isPending ? (
              <>
                <Clock className="mx-auto h-10 w-10 text-amber-400" />
                <h2 className="mt-4 text-lg font-bold text-white">Your submission is awaiting review</h2>
                <p className="mt-2 text-sm text-zinc-400">
                  You already have a pending submission for <span className="font-semibold text-white">{challenge.title}</span>. Wait for a steward to approve it before submitting again.
                </p>
              </>
            ) : (
              <>
                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
                <h2 className="mt-4 text-lg font-bold text-white">Your result is on the leaderboard</h2>
                <p className="mt-2 text-sm text-zinc-400">
                  You already have an approved submission for <span className="font-semibold text-white">{challenge.title}</span>. Check the leaderboard to see your rank.
                </p>
              </>
            )}
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button to={`/c/${challenge.slug}`}>View challenge</Button>
              <Button to="/challenges" variant="secondary">Browse events</Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Seo title="Submit Your Score" description="Submit your sim racing tournament result with screenshot or video proof. Every entry is verified by club staff before appearing on the leaderboard." path="/submit" />
      <PageHero
        eyebrow="Submit"
        title={isGallery ? 'Submit your entry' : 'Submit your result'}
        description="Result, proof, and review status."
      />

      <div className="container-page py-8">
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_340px]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Challenge + identity */}
            <Panel title="Your entry" step="1">
              <Field label="Challenge" required>
                <select
                  value={selectedId}
                  onChange={(e) => setChallengeId(e.target.value)}
                  className={inputCls}
                >
                  {list.map((c) => (
                    <option key={c.id} value={c.id} className="bg-ink-850">
                      {c.title}{c.visibility === 'club' ? ' (Members only)' : ''}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Gamertag" required>
                  <input
                    value={form.gamertag}
                    onChange={set('gamertag')}
                    placeholder="e.g. Vortex_Apex"
                    className={inputCls}
                  />
                </Field>
                <Field label="Platform" required>
                  <select value={form.platform} onChange={set('platform')} className={inputCls}>
                    <option className="bg-ink-850">Xbox</option>
                    <option className="bg-ink-850">PC</option>
                    <option className="bg-ink-850">Cloud</option>
                  </select>
                </Field>
                {profile?.tag && (
                  <p className="-mt-2 text-xs text-zinc-400 sm:col-span-2">
                    Signed in as {profile.tag}. Use the gamertag field for the name shown in proof.
                  </p>
                )}
              </div>
            </Panel>

            {/* Result */}
            <Panel title={isGallery ? 'Your submission' : 'Your result'} step="2">
              {isGallery ? (
                <>
                  <Field label="Title" required>
                    <input
                      value={form.title}
                      onChange={set('title')}
                      placeholder={t.id === 'build_battle' ? 'e.g. Sunset Wedge — Group B tribute' : 'e.g. Last light over the ridge'}
                      className={inputCls}
                    />
                  </Field>
                  {t.id === 'build_battle' && (
                    <Field label="Share code" hint="So others can drive your build">
                      <input
                        value={form.shareCode}
                        onChange={set('shareCode')}
                        placeholder="123 456 789"
                        className={`${inputCls} font-num`}
                      />
                    </Field>
                  )}
                </>
              ) : (
                <Field
                  label={`Your ${t.entryLabel}`}
                  required
                  hint={t.unit === 'time' ? 'Format as shown — minutes:seconds.thousandths' : 'Enter the final number on screen'}
                >
                  <div className="relative">
                    <input
                      value={form.result}
                      onChange={set('result')}
                      placeholder={t.placeholder}
                      className={`${inputCls} font-num text-base`}
                      inputMode={t.unit === 'time' ? 'text' : 'numeric'}
                    />
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs uppercase tracking-wider text-zinc-500">
                      {t.unit === 'time' ? 'time' : t.unit}
                    </span>
                  </div>
                  {form.result.trim() && parseResult(form.result) == null && (
                    <p className="mt-1.5 text-sm text-rose-300">Enter a valid time or score.</p>
                  )}
                </Field>
              )}
            </Panel>

            {/* Proof */}
            <Panel title="Proof" step="3">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-300">
                  Proof
                  <span className="ml-1 text-rose-500">*</span>
                </span>
              </div>
              <div className="rounded-xl border border-sky-500/25 bg-sky-500/[0.1] p-3.5">
                <div className="flex gap-2.5 text-sm text-sky-200/90">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
                  <p>{t.proofHint}</p>
                </div>
              </div>

              <label className="group mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.12] bg-white/[0.02] px-6 py-9 text-center transition-colors hover:border-brand-500/40 hover:bg-white/[0.04]">
                <span className="grid h-12 w-12 place-items-center rounded-xl border border-white/[0.08] bg-ink-800 text-brand-400">
                  {isGallery ? <ImageIcon className="h-6 w-6" /> : <Video className="h-6 w-6" />}
                </span>
                <span className="mt-3 text-sm font-medium text-white">
                  {form.fileName || (isGallery ? 'Upload your photo' : 'Upload your screenshot')}
                </span>
                <span className="mt-1 text-sm text-zinc-400">
                  PNG, JPG, or WEBP. Max {MAX_PROOF_MB}MB.
                </span>
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null
                    setProofFile(file)
                    e.target.value = ''
                  }}
                />
              </label>

              <div className="my-4 flex items-center gap-3 text-xs text-zinc-600">
                <span className="h-px flex-1 bg-white/[0.06]" />
                or paste a link
                <span className="h-px flex-1 bg-white/[0.06]" />
              </div>

              <Field label="Link">
                <div className="relative">
                  <Link2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    value={form.link}
                    onChange={set('link')}
                    placeholder="YouTube, Xbox clip, Medal, TikTok, Streamable, or image link"
                    className={`${inputCls} pl-10`}
                  />
                </div>
              </Field>

              <Field label="Notes for the steward" className="mt-4" hint="Optional">
                <textarea
                  value={form.notes}
                  onChange={set('notes')}
                  rows={3}
                  placeholder="Anything that helps verify your run (PI, assists, timestamp)…"
                  className={`${inputCls} resize-none`}
                />
              </Field>
              <p className="text-sm leading-relaxed text-zinc-400">
                Uploaded proof is stored in the public proofs bucket for V1 and may be viewable by anyone with the file URL.
              </p>
            </Panel>

            <label className="flex cursor-pointer items-start gap-3 card-readable rounded-xl p-4">
              <input
                type="checkbox"
                checked={form.agree}
                onChange={set('agree')}
                className="mt-0.5 h-4 w-4 rounded border-white/20 bg-transparent accent-brand-500"
              />
              <span className="text-sm text-zinc-300">
                I confirm this run follows the challenge rules and the proof is unedited and my own.
              </span>
            </label>

            <div className="flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-between">
              <Link to={`/c/${challenge.slug}`} className="text-sm text-zinc-400 hover:text-white">
                Cancel
              </Link>
              <Button type="submit" size="lg" disabled={!canSubmit} className="w-full sm:w-auto">
                <Upload className="h-4 w-4" />
                {submitting ? 'Submitting...' : 'Submit for review'}
              </Button>
            </div>
            {error && (
              <p className="flex items-center gap-1.5 text-sm text-rose-400">
                <CircleAlert className="h-3.5 w-3.5" />
                {error}
              </p>
            )}
            {!canSubmit ? (
              <p className="flex items-center gap-1.5 text-sm text-zinc-400">
                <CircleAlert className="h-3.5 w-3.5" />
                {!authReady ? 'Sign in with Discord to submit.' : !form.gamertag.trim() ? 'Add your gamertag to submit.' : !resultFilled ? `Add your ${t.entryLabel.toLowerCase()} to submit.` : !isGallery && parsedResult == null ? 'Enter a valid time or score to submit.' : !hasProof ? 'Add proof (upload or link) to submit.' : !form.agree ? 'Confirm the rules to submit.' : checkingExisting ? 'Checking for existing submissions...' : existingSubmission ? 'You already have a pending submission for this event.' : 'Complete all fields to submit.'}
              </p>
            ) : null}
          </form>

          <aside className="space-y-5 lg:sticky lg:top-20">
            <SummaryCard challenge={challenge} club={club} t={t} />
            <Checklist t={t} />
          </aside>
        </div>
      </div>
    </div>
  )
}

function Centered({ title, body, action }) {
  return (
    <div className="container-page grid min-h-[60vh] place-items-center py-16 text-center">
      <div className="max-w-md rounded-3xl border border-white/[0.08] bg-ink-900/60 p-8 backdrop-blur-md sm:p-10">
        <h1 className="text-2xl font-extrabold">{title}</h1>
        {body && <p className="mt-2 text-zinc-400">{body}</p>}
        {action && <div className="mt-6 flex justify-center">{action}</div>}
      </div>
    </div>
  )
}

function Panel({ title, step, children }) {
  return (
    <section className="card p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-500/15 font-num text-sm font-bold text-brand-300">
          {step}
        </span>
        <h2 className="text-base font-bold">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function Field({ label, required, hint, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-300">
          {label}
          {required && <span className="ml-1 text-rose-500">*</span>}
        </span>
        {hint && <span className="text-xs text-zinc-400">{hint}</span>}
      </div>
      {children}
    </label>
  )
}

function SummaryCard({ challenge, club, t }) {
  return (
    <div className="card overflow-hidden">
      <Cover typeId={challenge.typeId} className="h-24">
        <div className="flex h-full items-start justify-between p-3">
          <TypeBadge typeId={challenge.typeId} size="sm" />
        </div>
      </Cover>
      <div className="p-5">
        <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Submitting to
        </div>
        <h3 className="mt-1.5 font-bold leading-snug text-white">{challenge.title}</h3>
        {club && (
          <div className="mt-2 flex items-center gap-2 text-sm text-zinc-400">
            <ClubMark club={club} size={20} />
            {club.name}
          </div>
        )}
        <div className="mt-4 space-y-2 border-t border-white/[0.06] pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-400">Format</span>
            <span className="font-medium text-white">{t.label}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Restriction</span>
            <span className="font-medium text-white">{challenge.restriction}</span>
          </div>
        </div>
        <Link
          to={`/c/${challenge.slug}`}
          className="mt-4 inline-flex items-center gap-1 text-sm text-brand-300 hover:text-brand-200"
        >
          View full rules
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}

function Checklist({ t }) {
  const items = [
    `Your ${t.gallery ? 'capture' : 'result'} is clearly visible in the proof`,
    'No edits, overlays, watermarks or rewinds',
    'Your settings match the challenge rules',
    'You can be pinged on Discord if we have questions',
  ]
  return (
    <div className="card p-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <ShieldCheck className="h-4 w-4 text-emerald-400" />
        Before you submit
      </h3>
      <ul className="mt-3 space-y-2.5">
        {items.map((i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-400">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400/70" />
            {i}
          </li>
        ))}
      </ul>
    </div>
  )
}

function SuccessView({ challenge, club, t, form, onReset }) {
  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <div className="card w-full max-w-md overflow-hidden text-center">
        <div className="relative border-b border-white/[0.08] bg-emerald-500/[0.1] px-6 py-10">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-400">
            <CheckCircle2 className="h-8 w-8" />
          </span>
          <h1 className="mt-5 text-2xl font-bold">Submitted for review</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Thanks {form.gamertag || 'racer'} — your entry is in the queue.
          </p>
        </div>
        <div className="space-y-4 p-6">
          <div className="card-readable rounded-xl p-4 text-left">
            <div className="text-xs text-zinc-500">{club?.name} · {t.label}</div>
            <div className="mt-1 font-semibold text-white">{challenge.title}</div>
            <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3">
              <span className="text-sm text-zinc-400">{t.gallery ? 'Entry' : 'Result'}</span>
              <span className="font-num font-bold text-white">
                {t.gallery ? form.title : form.result || '—'}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 rounded-xl border border-sky-500/25 bg-sky-500/[0.1] py-2.5 text-sm text-sky-200/90">
            <Clock className="h-4 w-4" />
            Pending verification by a steward
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button to={`/c/${challenge.slug}`} variant="secondary">
              View challenge
            </Button>
            <Button onClick={onReset}>Submit another</Button>
          </div>
          <Link to="/me" className="block text-center text-sm text-brand-400 hover:text-brand-300">
            Track your submissions →
          </Link>
        </div>
      </div>
    </div>
  )
}
