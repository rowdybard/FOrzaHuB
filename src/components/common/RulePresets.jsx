import { useState, useRef, useEffect } from 'react'
import { Search, Plus, Check } from 'lucide-react'
import { cn } from '../../lib/utils'

const PRESETS = [
  // Assists & Controls
  'No ABS (anti-lock brakes)',
  'No TCS (traction control)',
  'No STM (stability management)',
  'Manual transmission required',
  'No rewind feature',
  'No driving assists of any kind',

  // Car & Build Restrictions
  'Stock tuning only — no upgrades',
  'No engine swaps',
  'No drivetrain swaps',
  'No aero modifications',
  'No weight reduction',
  'No tire compound changes',
  'No rim/wheel size changes',
  'No platform swaps',
  'Open tuning allowed',
  'Must use provided tune/setup',

  // Track & Conditions
  'Clean lap only — no wall contact',
  'No track cutting — 2 wheels must stay on track',
  'No wall riding',
  'No bump drafting',
  'Weather: clear/dry conditions only',
  'Time of day: daytime only',
  'No AI traffic',
  'Solo mode only — no multiplayer lobbies',
  'No spectator mode',

  // Proof & Verification
  'Screenshot must show results screen with time visible',
  'Video must be unedited, continuous footage',
  'Must show full lap — no clipped segments',
  'Gamertag must be visible in proof',
  'No photo editing or filters',
  'Must be your own run — no account sharing',
  'No mods, hacks, or cheats',
  'No bug/glitch exploitation',
  'No telemetry overlays that obscure HUD',

  // Format-Specific
  'Drag: best 2 of 3 runs counts',
  'Drift: must maintain drift through entire sector',
  'Photo: car and track must both be visible',
  'Photo: no replay mode — in-race capture only',
  'Hot lap: flying lap start (no standstill)',
  'Hot lap: must start from standstill',
  'Build battle: must list all parts used',

  // Submission & Scoring
  'One submission per event',
  'Submit time in MM:SS.mmm format',
  'Late submissions not accepted',
  'Ties broken by earliest submission',
  'Points: 1st=25, 2nd=18, 3rd=15 (F1-style)',
  'Points: 1st=10, 2nd=8, 3rd=6',
  'Drop lowest score — best N of M events count',
  'Steward decisions are final',
  'DQ for intentional rule violations',
  'No team collusion or sandbagging',
]

export default function RulePresets({ existingRules, onAdd, disabled }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = PRESETS.filter((p) => {
    if (!query) return true
    return p.toLowerCase().includes(query.toLowerCase())
  })

  const isAlreadyAdded = (preset) =>
    existingRules.some((r) => r.trim().toLowerCase() === preset.toLowerCase())

  const handleAdd = (preset) => {
    if (isAlreadyAdded(preset)) return
    onAdd(preset)
  }

  const handleAddAll = () => {
    filtered.forEach((p) => {
      if (!isAlreadyAdded(p)) onAdd(p)
    })
  }

  if (disabled) return null

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder="Search preset rules…"
            className="w-full rounded-xl border border-white/[0.08] bg-ink-900/60 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-zinc-500 transition-colors focus:border-brand-500/50 focus:outline-none"
          />
        </div>
        {open && filtered.length > 0 && (
          <button
            type="button"
            onClick={handleAddAll}
            className="shrink-0 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            Add all ({filtered.length})
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-white/[0.08] bg-ink-850 p-1.5 shadow-pop">
          {filtered.length === 0 ? (
            <div className="px-3 py-4 text-center text-sm text-zinc-500">
              No matching rules. Type your own below.
            </div>
          ) : (
            filtered.map((preset) => {
              const added = isAlreadyAdded(preset)
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleAdd(preset)}
                  disabled={added}
                  className={cn(
                    'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                    added
                      ? 'cursor-default text-zinc-600'
                      : 'text-zinc-300 hover:bg-white/[0.06] hover:text-white',
                  )}
                >
                  <span>{preset}</span>
                  {added ? (
                    <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                  ) : (
                    <Plus className="h-4 w-4 shrink-0 text-zinc-500" />
                  )}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
