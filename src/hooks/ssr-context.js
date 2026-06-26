import { createContext, useContext } from 'react'

/**
 * Context for passing server-side pre-fetched data to components.
 * When non-null, useAsync will use this data instead of fetching.
 *
 * Shape: { [routeKey]: data }
 * routeKey is determined by the route path + params.
 */
export const SSRDataContext = createContext(null)

/**
 * Get pre-loaded SSR data for a given key.
 * Returns undefined if no SSR data is available (client-side render).
 */
export function useSSRData(key) {
  const ctx = useContext(SSRDataContext)
  if (!ctx) return undefined
  return ctx[key]
}
