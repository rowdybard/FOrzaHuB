import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import ScrollToTop from './ScrollToTop'
import ParallaxBackground from './ParallaxBackground'
import { isSupabaseEnabled } from '../../lib/supabase'

function MockBanner() {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed || isSupabaseEnabled) return null
  return (
    <div className="flex items-center justify-center gap-3 border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-200/90">
      <span>
        <strong className="font-semibold">Demo mode</strong> — changes won't be saved. Configure Supabase env vars to enable persistence.
      </span>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 text-amber-300/60 hover:text-amber-200"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  )
}

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <ParallaxBackground />
      <ScrollToTop />
      <Navbar />
      <MockBanner />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
