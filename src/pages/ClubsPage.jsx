import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import Seo from '../components/Seo'
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
      to="/clubs/new"
      className="group flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/[0.08] bg-transparent p-6 text-center transition-colors hover:border-white/20 hover:bg-white/[0.02]"
    >
      <span className="grid h-10 w-10 place-items-center rounded-lg border border-white/[0.06] bg-ink-900 text-zinc-500 transition-colors group-hover:text-zinc-300">
        <Plus className="h-5 w-5" />
      </span>
      <div>
        <p className="font-medium text-zinc-300 group-hover:text-white">Your club here</p>
        <p className="mt-1 text-sm text-zinc-600 group-hover:text-zinc-400">
          Create a club for your Discord or racing group.
        </p>
      </div>
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
      <Seo title="Forza Horizon Racing Clubs & Communities" description="Join Forza Horizon racing clubs running verified tournaments on GripCafe. Find a community, or bring your Discord server and start competing." path="/clubs" />
      <PageHero
        eyebrow="Communities"
        title="Clubs"
        description="Forza clubs running events on GripCafe."
      >
        <div className="mt-6 flex flex-wrap gap-3">
          <Button to="/clubs/new">
            <Plus className="h-4 w-4" />
            Start a community
          </Button>
        </div>
      </PageHero>

      <div className="container-page py-8">
        <div className="no-scrollbar -mx-1 mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-white/[0.07] bg-ink-950/90 p-4 backdrop-blur-sm">
          {regions.map((r) => (
            <button
              key={r}
              onClick={() => setRegion(r)}
              className={cn(
                'shrink-0 rounded border px-3.5 py-1.5 text-sm font-medium transition-colors',
                region === r
                  ? 'border-white/[0.08] bg-white/[0.03] text-white'
                  : 'border-white/[0.06] bg-white/[0.01] text-zinc-400 hover:border-white/15 hover:text-white',
              )}
            >
              {r}
            </button>
          ))}
        </div>

        {loading ? (
          <Loading label="Loading clubs…" />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
