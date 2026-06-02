import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Users, ArrowRight } from 'lucide-react'
import PageHero from '../components/common/PageHero'
import ClubCard from '../components/common/ClubCard'
import Loading from '../components/common/Loading'
import Button from '../components/ui/Button'
import { getClubs } from '../data/api'
import { useAsync } from '../hooks/useAsync'
import { cn } from '../lib/utils'

function BringYourClubCard() {
  return (
    <Link
      to="/create"
      className="group flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/[0.12] bg-transparent p-6 text-center transition-colors hover:border-brand-500/40 hover:bg-brand-500/[0.04]"
    >
      <span className="grid h-12 w-12 place-items-center rounded-xl border border-white/[0.08] bg-ink-900 text-zinc-500 transition-colors group-hover:border-brand-500/30 group-hover:text-brand-400">
        <Plus className="h-5 w-5" />
      </span>
      <div>
        <p className="font-semibold text-zinc-300 group-hover:text-white">Your club here</p>
        <p className="mt-1 text-sm text-zinc-600 group-hover:text-zinc-400">
          Bring your Discord community and start running events with real leaderboards.
        </p>
      </div>
      <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 group-hover:text-brand-400">
        Get started <ArrowRight className="h-3 w-3" />
      </span>
    </Link>
  )
}

export default function ClubsPage() {
  const { data, loading } = useAsync(() => getClubs(), [])
  const clubs = data || []
  const regions = useMemo(
    () => ['All', ...Array.from(new Set(clubs.map((c) => c.region)))],
    [clubs],
  )
  const [region, setRegion] = useState('All')

  const filtered = region === 'All' ? clubs : clubs.filter((c) => c.region === region)

  return (
    <div>
      <PageHero
        eyebrow="Communities"
        title="Clubs on the grid"
        description="Find a community that fits your style of racing — or start your own and run events with proof and leaderboards built in."
      >
        <div className="mt-6 flex flex-wrap gap-3">
          <Button to="/create">
            <Plus className="h-4 w-4" />
            Start a community
          </Button>
        </div>
      </PageHero>

      <div className="container-page py-8">
        <div className="no-scrollbar -mx-1 mb-6 flex gap-2 overflow-x-auto px-1">
          {regions.map((r) => (
            <button
              key={r}
              onClick={() => setRegion(r)}
              className={cn(
                'shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                region === r
                  ? 'border-brand-500/40 bg-brand-500/15 text-brand-200'
                  : 'border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:border-white/20 hover:text-white',
              )}
            >
              {r}
            </button>
          ))}
        </div>

        {loading ? (
          <Loading label="Loading clubs…" />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((club) => (
              <ClubCard key={club.id} club={club} />
            ))}
            {region === 'All' && <BringYourClubCard />}
          </div>
        )}
      </div>
    </div>
  )
}
