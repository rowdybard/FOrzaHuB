import { Link } from 'react-router-dom'
import { Flag } from 'lucide-react'
import Button from '../components/ui/Button'

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="card-readable grid h-14 w-14 place-items-center rounded-2xl text-brand-400">
        <Flag className="h-7 w-7" />
      </span>
      <h1 className="mt-6 font-num text-6xl font-extrabold text-white">404</h1>
      <p className="mt-3 max-w-sm text-zinc-400">
        This page spun off the track. The challenge or page you’re looking for doesn’t exist.
      </p>
      <div className="mt-7 flex gap-3">
        <Button to="/">Back to home</Button>
        <Button to="/challenges" variant="outline">
          Browse challenges
        </Button>
      </div>
    </div>
  )
}
