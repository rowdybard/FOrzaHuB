import { useState, useMemo } from 'react'
import { Plus, Users } from 'lucide-react'
import PageHero from '../components/common/PageHero'
import ClubCard from '../components/common/ClubCard'
import Button from '../components/ui/Button'
import { clubs } from '../data/mock'
import { cn } from '../lib/utils'

export default function ClubsPage() {
  const regions = useMemo(
    () => ['All', ...Array.from(new Set(clubs.map((c) => c.region)))],
    [],
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

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((club) => (
            <ClubCard key={club.id} club={club} />
          ))}
        </div>
      </div>
    </div>
  )
}
