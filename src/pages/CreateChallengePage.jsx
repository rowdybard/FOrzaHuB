import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Check,
  Plus,
  Trash2,
  Eye,
  Send,
  Save,
  Info,
  Globe,
  Lock,
  PartyPopper,
  ArrowLeft,
} from 'lucide-react'
import Button from '../components/ui/Button'
import ChallengeCard from '../components/common/ChallengeCard'
import { clubs, getChallengeBySlug } from '../data/mock'
import { TYPE_LIST, getType } from '../lib/challengeTypes'
import { cn, hexToRgba } from '../lib/utils'

const inputCls =
  'w-full rounded-xl border border-white/[0.08] bg-ink-900/60 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 transition-colors focus:border-brand-500/50 focus:outline-none'

const toDateInput = (iso) => {
  try {
    return new Date(iso).toISOString().slice(0, 10)
  } catch {
    return ''
  }
}
const todayISO = new Date().toISOString().slice(0, 10)
const plusDays = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10)

const RANKING = {
  asc: 'Lowest value wins',
  desc: 'Highest value wins',
}

export default function CreateChallengePage() {
  const { slug } = useParams()
  const existing = slug ? getChallengeBySlug(slug) : null
  const isEdit = Boolean(existing)

  const [form, setForm] = useState(() => ({
    typeId: existing?.typeId || 'time_trial',
    title: existing?.title || '',
    clubId: existing?.clubId || clubs[0].id,
    description: existing?.description || '',
    restriction: existing?.restriction || '',
    location: existing?.location || '',
    region: existing?.region || '',
    prize: existing?.prize || '',
    startDate: existing ? toDateInput(existing.startDate) : todayISO,
    endDate: existing ? toDateInput(existing.endDate) : plusDays(7),
    rules: existing?.rules?.length ? [...existing.rules] : [''],
    visibility: 'public',
  }))
  const [published, setPublished] = useState(false)

  const t = getType(form.typeId)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const setRule = (i, v) => setForm((f) => ({ ...f, rules: f.rules.map((r, idx) => (idx === i ? v : r)) }))
  const addRule = () => setForm((f) => ({ ...f, rules: [...f.rules, ''] }))
  const removeRule = (i) => setForm((f) => ({ ...f, rules: f.rules.filter((_, idx) => idx !== i) }))

  const startInFuture = new Date(form.startDate).getTime() > Date.now()
  const previewChallenge = {
    id: 'preview',
    slug: 'preview',
    typeId: form.typeId,
    title: form.title.trim() || 'Your challenge title',
    clubId: form.clubId,
    status: startInFuture ? 'upcoming' : 'live',
    startDate: new Date(form.startDate || todayISO).toISOString(),
    endDate: new Date(form.endDate || plusDays(7)).toISOString(),
    region: form.region.trim() || 'Festival map',
    restriction: form.restriction.trim() || 'Set a car restriction',
    location: form.location.trim() || 'Pick a location',
    participants: 0,
    submissionCount: 0,
    entries: [],
    gallery: t.gallery ? [] : undefined,
  }

  const canPublish = form.title.trim() && form.restriction.trim() && form.location.trim()

  if (published) {
    return <PublishedView isEdit={isEdit} title={previewChallenge.title} />
  }

  return (
    <div>
      <div className="border-b border-white/[0.06] bg-ink-900/40">
        <div className="container-page flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link to="/challenges" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Back to challenges
            </Link>
            <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">
              {isEdit ? 'Edit challenge' : 'Create a challenge'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setPublished(true)}>
              <Save className="h-4 w-4" />
              Save draft
            </Button>
            <Button onClick={() => canPublish && setPublished(true)} disabled={!canPublish}>
              <Send className="h-4 w-4" />
              {isEdit ? 'Save & publish' : 'Publish'}
            </Button>
          </div>
        </div>
      </div>

      <div className="container-page py-8">
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            {/* Format */}
            <Panel step="1" title="Format" subtitle="What kind of challenge is this?">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {TYPE_LIST.map((type) => {
                  const Icon = type.icon
                  const active = form.typeId === type.id
                  return (
                    <button
                      type="button"
                      key={type.id}
                      onClick={() => set('typeId', type.id)}
                      className={cn(
                        'relative rounded-xl border p-3.5 text-left transition-all',
                        !active && 'border-white/[0.06] bg-ink-850/60 hover:border-white/[0.15]',
                      )}
                      style={
                        active
                          ? { borderColor: hexToRgba(type.accent, 0.5), background: hexToRgba(type.accent, 0.08) }
                          : undefined
                      }
                    >
                      {active && (
                        <span
                          className="absolute right-2.5 top-2.5 grid h-5 w-5 place-items-center rounded-full text-ink-950"
                          style={{ background: type.accent }}
                        >
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                      )}
                      <span
                        className="grid h-9 w-9 place-items-center rounded-lg"
                        style={{ color: type.accent, backgroundColor: hexToRgba(type.accent, 0.14) }}
                      >
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      <div className="mt-2.5 text-sm font-semibold text-white">{type.label}</div>
                    </button>
                  )
                })}
              </div>
              <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-sm text-zinc-400">
                <Info className="h-4 w-4 shrink-0 text-brand-400" />
                <span>{t.summary} · Ranking: <span className="text-zinc-200">{t.gallery ? 'Most votes wins' : RANKING[t.sort]}</span></span>
              </div>
            </Panel>

            {/* Details */}
            <Panel step="2" title="Details">
              <Field label="Challenge title" required>
                <input
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="e.g. Sierra Verde Clean Lap Sprint"
                  className={inputCls}
                />
              </Field>
              <Field label="Hosting club">
                <select value={form.clubId} onChange={(e) => set('clubId', e.target.value)} className={inputCls}>
                  {clubs.map((c) => (
                    <option key={c.id} value={c.id} className="bg-ink-850">
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Description" hint="Sets the tone for racers">
                <textarea
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  rows={3}
                  placeholder="Explain the challenge, the vibe and anything racers should know…"
                  className={`${inputCls} resize-none`}
                />
              </Field>
            </Panel>

            {/* Restrictions */}
            <Panel step="3" title="Restrictions & location">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Car restriction" required>
                  <input
                    value={form.restriction}
                    onChange={(e) => set('restriction', e.target.value)}
                    placeholder="e.g. A-Class (800 PI) · AWD"
                    className={inputCls}
                  />
                </Field>
                <Field label="Location" required>
                  <input
                    value={form.location}
                    onChange={(e) => set('location', e.target.value)}
                    placeholder="e.g. Sierra Verde Circuit"
                    className={inputCls}
                  />
                </Field>
              </div>
              <Field label="Region / map area">
                <input
                  value={form.region}
                  onChange={(e) => set('region', e.target.value)}
                  placeholder="e.g. Festival Circuit"
                  className={inputCls}
                />
              </Field>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-300">Rules</span>
                  <span className="text-xs text-zinc-500">{form.rules.length} rules</span>
                </div>
                <div className="space-y-2">
                  {form.rules.map((rule, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/[0.06] font-num text-xs font-semibold text-zinc-400">
                        {i + 1}
                      </span>
                      <input
                        value={rule}
                        onChange={(e) => setRule(i, e.target.value)}
                        placeholder="Add a rule…"
                        className={inputCls}
                      />
                      <button
                        type="button"
                        onClick={() => removeRule(i)}
                        disabled={form.rules.length === 1}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-rose-300 disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addRule}
                  className="mt-2.5 inline-flex items-center gap-1.5 text-sm font-medium text-brand-300 hover:text-brand-200"
                >
                  <Plus className="h-4 w-4" />
                  Add rule
                </button>
              </div>
            </Panel>

            {/* Schedule */}
            <Panel step="4" title="Schedule & prize">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Opens">
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => set('startDate', e.target.value)}
                    className={`${inputCls} [color-scheme:dark]`}
                  />
                </Field>
                <Field label="Closes">
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => set('endDate', e.target.value)}
                    className={`${inputCls} [color-scheme:dark]`}
                  />
                </Field>
              </div>
              <Field label="Prize / reward" hint="Optional">
                <input
                  value={form.prize}
                  onChange={(e) => set('prize', e.target.value)}
                  placeholder="e.g. Winner livery feature + season points"
                  className={inputCls}
                />
              </Field>
            </Panel>

            {/* Visibility */}
            <Panel step="5" title="Visibility">
              <div className="grid gap-3 sm:grid-cols-2">
                <VisibilityOption
                  active={form.visibility === 'public'}
                  onClick={() => set('visibility', 'public')}
                  icon={Globe}
                  title="Public"
                  desc="Anyone with the link can view and submit."
                />
                <VisibilityOption
                  active={form.visibility === 'club'}
                  onClick={() => set('visibility', 'club')}
                  icon={Lock}
                  title="Club only"
                  desc="Only verified club members can enter."
                />
              </div>
            </Panel>
          </div>

          {/* Live preview */}
          <aside className="lg:sticky lg:top-20">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-400">
              <Eye className="h-4 w-4" />
              Live preview
            </div>
            <div className="pointer-events-none select-none">
              <ChallengeCard challenge={previewChallenge} />
            </div>
            <p className="mt-3 text-center text-xs text-zinc-500">
              This is how your challenge appears in listings and on Discord.
            </p>
          </aside>
        </div>
      </div>
    </div>
  )
}

function Panel({ step, title, subtitle, children }) {
  return (
    <section className="card p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-500/15 font-num text-sm font-bold text-brand-300">
          {step}
        </span>
        <div>
          <h2 className="text-base font-bold">{title}</h2>
          {subtitle && <p className="text-xs text-zinc-500">{subtitle}</p>}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function Field({ label, required, hint, children }) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-300">
          {label}
          {required && <span className="ml-1 text-brand-400">*</span>}
        </span>
        {hint && <span className="text-xs text-zinc-500">{hint}</span>}
      </div>
      {children}
    </label>
  )
}

function VisibilityOption({ active, onClick, icon: Icon, title, desc }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-start gap-3 rounded-xl border p-4 text-left transition-all',
        active ? 'border-brand-500/40 bg-brand-500/[0.06]' : 'border-white/[0.06] hover:border-white/[0.15]',
      )}
    >
      <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-lg', active ? 'bg-brand-500/15 text-brand-300' : 'bg-white/[0.05] text-zinc-400')}>
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span>
        <span className="block text-sm font-semibold text-white">{title}</span>
        <span className="mt-0.5 block text-xs text-zinc-500">{desc}</span>
      </span>
    </button>
  )
}

function PublishedView({ isEdit, title }) {
  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <div className="card w-full max-w-md overflow-hidden text-center">
        <div className="border-b border-white/[0.06] bg-brand-500/[0.06] px-6 py-10">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-500/15 text-brand-300">
            <PartyPopper className="h-8 w-8" />
          </span>
          <h1 className="mt-5 text-2xl font-bold">{isEdit ? 'Challenge updated' : 'Challenge published'}</h1>
          <p className="mt-2 text-sm text-zinc-400">
            <span className="text-zinc-200">{title}</span> is ready to share with your community.
          </p>
        </div>
        <div className="space-y-3 p-6">
          <p className="text-sm text-zinc-400">
            Drop the link in your Discord and racers can start submitting right away.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button to="/challenges" variant="secondary">
              All challenges
            </Button>
            <Button to="/admin">Open review queue</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
