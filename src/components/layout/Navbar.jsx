import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Menu, X, MessagesSquare, Plus, ShieldCheck } from 'lucide-react'
import Logo from '../ui/Logo'
import Button from '../ui/Button'
import { cn } from '../../lib/utils'

const links = [
  { to: '/challenges', label: 'Challenges' },
  { to: '/archive', label: 'Archive' },
  { to: '/clubs', label: 'Communities' },
  { to: '/submit', label: 'Submit' },
  { to: '/admin', label: 'Admin' },
]

function navClass({ isActive }) {
  return cn(
    'relative rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'text-white' : 'text-zinc-400 hover:text-white',
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header className="sticky top-0 z-50">
      <div className="border-b border-white/[0.06] bg-ink-950/70 backdrop-blur-xl">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="hidden items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 lg:inline-flex">
              FH6 · Unofficial
            </span>
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className={navClass}>
                {({ isActive }) => (
                  <>
                    {l.label}
                    {isActive && (
                      <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand-500" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button href="#" variant="ghost" size="sm" className="hidden sm:inline-flex">
              <MessagesSquare className="h-4 w-4" />
              Discord
            </Button>
            <Button to="/create" size="sm" className="hidden sm:inline-flex">
              <Plus className="h-4 w-4" />
              New challenge
            </Button>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white md:hidden"
              aria-label="Toggle menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="fixed inset-0 top-16 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative mx-3 mt-3 animate-fade-up rounded-2xl border border-white/[0.08] bg-ink-850 p-3 shadow-pop">
            <nav className="flex flex-col">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center justify-between rounded-xl px-4 py-3 text-base font-medium transition-colors',
                      isActive ? 'bg-white/[0.06] text-white' : 'text-zinc-300 hover:bg-white/[0.04]',
                    )
                  }
                >
                  {l.label}
                  {l.to === '/admin' && <ShieldCheck className="h-4 w-4 text-zinc-500" />}
                </NavLink>
              ))}
            </nav>
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/[0.06] pt-3">
              <Button href="#" variant="secondary" size="md">
                <MessagesSquare className="h-4 w-4" />
                Discord
              </Button>
              <Button to="/create" size="md">
                <Plus className="h-4 w-4" />
                New
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
