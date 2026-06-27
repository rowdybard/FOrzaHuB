// SSR entry point — renders the app to an HTML string with pre-loaded data.
// Used by the Cloudflare Pages Function.
// This file is pre-built by vite.config.ssr.js into dist-server/entry-server.js
// The Pages Function imports everything from that built bundle.
//
// Uses renderToReadableStream (Web Streams) instead of renderToString so that
// the full page content is awaited before sending the response.
// Uses AppServer (eager imports, no React.lazy/Suspense) so that every page's
// H1 and visible content appear in the initial HTML — not a "Loading…" fallback.

import React from 'react'
import { renderToReadableStream } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import { HelmetProvider } from 'react-helmet-async'
import { SSRDataContext } from './hooks/ssr-context'
import AppServer from './AppServer'
import { AuthProvider } from './hooks/useAuth'

// Re-export server data fetchers and SEO helpers for the Pages Function
export {
  fetchChallengesWithClubs,
  fetchSiteStats,
  fetchClubs,
  fetchChallengeBySlug,
  fetchChallengesByClub,
  fetchClubBySlug,
  fetchClubMembers,
  fetchClosedChallenges,
  fetchSeriesStandings,
  fetchSitemapChallenges,
  fetchSitemapClubs,
} from './data/server-api'
export { createServerClient } from './lib/supabase-server'
export { getRouteMeta, isNoindexRoute, SITE_URL } from './lib/seo-meta'

/**
 * Render the app to an HTML string for SSR using renderToReadableStream.
 * Awaits the full stream so the returned string contains all page content.
 *
 * @param {object} opts
 * @param {string} opts.url - The request URL path (e.g. "/challenges")
 * @param {object} opts.ssrData - Pre-fetched data keyed by route name
 * @param {object} opts.helmetContext - Helmet context for collecting head tags
 * @returns {Promise<string>} - Rendered HTML string (body content only, not full document)
 */
export async function renderApp({ url, ssrData, helmetContext }) {
  const element = React.createElement(
    HelmetProvider,
    { context: helmetContext },
    React.createElement(
      SSRDataContext.Provider,
      { value: ssrData },
      React.createElement(
        StaticRouter,
        { location: url },
        React.createElement(
          AuthProvider,
          null,
          React.createElement(AppServer),
        ),
      ),
    ),
  )

  const stream = await renderToReadableStream(element)
  const response = new Response(stream)
  return await response.text()
}
