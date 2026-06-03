import { useState, useEffect } from 'react'
import { NavLink, useLocation, Link } from 'react-router-dom'
import { Menu, X, MessagesSquare, Plus, ShieldCheck, LogOut, User } from 'lucide-react'
import Logo from '../ui/Logo'
import Button from '../ui/Button'
import Avatar from '../ui/Avatar'
import { cn } from '../../lib/utils'
import { useAuth } from '../../hooks/useAuth'

const links = [
  { to: '/challenges', label: 'Challenges' },
  { to: '/archive', label: 'Archive' },
  { to: '/clubs', label: 'Communities' },
  { to: '/submit', label: 'Submit' },
]

const staffLinks = [{ to: '/admin', label: 'Admin' }]

function navClass({ isActive }) {
  return cn(
    'relative rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'text-white' : 'text-zinc-400 hover:text-white',
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const { enabled, profile } = useAuth()
  const isStaff = !enabled || ['admin', 'steward'].includes(profile?.role)
  const visibleLinks = isStaff ? [...links, ...staffLinks] : links

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
            {visibleLinks.map((l) => (
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
            <AuthControl />
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
              {visibleLinks.map((l) => (
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

function AuthControl() {
  const { enabled, user, profile, loading, signIn, signOut } = useAuth()
  const [menu, setMenu] = useState(false)

  // No backend configured — keep the simple Discord community link.
  if (!enabled) {
    return (
      <Button href="#" variant="ghost" size="sm" className="hidden sm:inline-flex">
        <MessagesSquare className="h-4 w-4" />
        Discord
      </Button>
    )
  }

  if (loading) {
    return <span className="hidden h-9 w-9 animate-pulse rounded-full bg-white/[0.06] sm:block" />
  }

  if (!user) {
    return (
      <Button variant="secondary" size="sm" onClick={signIn} className="hidden sm:inline-flex">
        <MessagesSquare className="h-4 w-4" />
        Sign in
      </Button>
    )
  }

  const name = profile?.name || user.user_metadata?.full_name || 'Racer'

  return (
    <div className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setMenu((v) => !v)}
        className="grid place-items-center rounded-full ring-1 ring-white/10 transition-transform hover:scale-105"
        aria-label="Account menu"
      >
        <Avatar name={name} size={36} ring={false} />
      </button>
      {menu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />
          <div className="absolute right-0 z-50 mt-2 w-52 animate-fade-up rounded-xl border border-white/[0.08] bg-ink-850 p-1.5 shadow-pop">
            <div className="px-3 py-2 text-sm">
              <div className="truncate font-semibold text-white">{name}</div>
              <div className="truncate text-xs text-zinc-500">Signed in with Discord</div>
            </div>
            <div className="my-1 border-t border-white/[0.06]" />
            <Link
              to="/me"
              onClick={() => setMenu(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/[0.06] hover:text-white"
            >
              <User className="h-4 w-4" />
              My profile
            </Link>
            <button
              type="button"
              onClick={() => {
                setMenu(false)
                signOut()
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/[0.06] hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  )
}
