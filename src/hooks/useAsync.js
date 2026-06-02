import { useState, useEffect, useCallback } from 'react'

/**
 * Run an async function on mount (and when `deps` change). Returns
 * `{ data, loading, error, reload }`.
 *
 * Usage:
 *   const { data: challenges, loading } = useAsync(() => getChallenges(), [])
 */
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps)

  const load = useCallback(() => {
    let active = true
    setState((s) => ({ ...s, loading: true, error: null }))
    Promise.resolve()
      .then(run)
      .then((data) => {
        if (active) setState({ data, loading: false, error: null })
      })
      .catch((error) => {
        if (active) setState({ data: null, loading: false, error })
        // Surface in console for on-the-fly debugging during deploy.
        console.error('[useAsync]', error)
      })
    return () => {
      active = false
    }
  }, [run])

  useEffect(load, [load])

  return { ...state, reload: load }
}
