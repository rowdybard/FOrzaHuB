import { Link } from 'react-router-dom'
import { MessagesSquare } from 'lucide-react'
import Logo from '../ui/Logo'
import { useAuth } from '../../hooks/useAuth'

const DISCORD_URL = 'https://discord.gg/GJw3XRuCXr'

const columns = [
  {
    title: 'Explore',
    links: [
      { label: 'Challenges', to: '/challenges' },
      { label: 'Communities', to: '/clubs' },
      { label: 'Submit a score', to: '/submit' },
      { label: 'Results archive', to: '/archive' },
    ],
  },
  {
    title: 'For clubs',
    links: [
      { label: 'Create a challenge', to: '/create' },
      { label: 'Admin tools', to: '/admin' },
    ],
  },
]

export default function Footer() {
  const { enabled, profile } = useAuth()
  const isStaff = !enabled || ['admin', 'steward'].includes(profile?.role)
  const visibleColumns = columns.map((col) => ({
    ...col,
    links: col.links.filter((link) => isStaff || link.to !== '/admin'),
  }))

  return (
    <footer className="mt-24 border-t border-white/[0.06] bg-ink-900/60">
      <div className="container-page py-14">
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr_1fr]">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-zinc-400">
              The sponsored community event hub for sim racing. Weekly events,
              community prizes, proof-backed leaderboards, and a championship worth competing for.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <a
                href={DISCORD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white"
                aria-label="Discord"
              >
                <MessagesSquare className="h-[18px] w-[18px]" />
              </a>
            </div>
          </div>

          {visibleColumns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-white">{col.title}</h4>
              <ul className="mt-4 space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.to}
                      className="text-sm text-zinc-400 transition-colors hover:text-white"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/[0.06] pt-6 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl leading-relaxed">
            GripCafe is an unofficial, fan-made community project. Not affiliated with,
            endorsed by, or sponsored by any game publisher or developer. All trademarks belong to their respective owners.
          </p>
          <div className="flex items-center gap-4">
            <span>© {new Date().getFullYear()} GripCafe</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
