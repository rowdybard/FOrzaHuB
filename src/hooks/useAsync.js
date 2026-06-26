import { useState, useEffect, useCallback, useRef } from 'react'
import { useSSRData } from './ssr-context'

/**
 * Run an async function on mount (and when `deps` change). Returns
 * `{ data, loading, error, reload }`.
 *
 * When SSR data is available (via SSRDataContext), it is used immediately
 * without a client-side fetch. A `ssrKey` can be passed as the third argument
 * to look up pre-loaded data.
 *
 * Usage:
 *   const { data: challenges, loading } = useAsync(() => getChallenges(), [], 'challenges')
 */
export function useAsync(fn, deps = [], ssrKey) {
  const ssrData = useSSRData(ssrKey)
  const ssrConsumed = useRef(false)

  const [state, setState] = useState(() => {
    if (ssrData !== undefined) {
      return { data: ssrData, loading: false, error: null }
    }
    return { data: null, loading: true, error: null }
  })

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

  useEffect(() => {
    // If we have SSR data, don't fetch on mount — but allow manual reload
    if (ssrData !== undefined && !ssrConsumed.current) {
      ssrConsumed.current = true
      return
    }
    load()
  }, [load, ssrData])

  return { ...state, reload: load }
}
