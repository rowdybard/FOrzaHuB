// SSR entry point — renders the app to an HTML string with pre-loaded data.
// Used by the Cloudflare Pages Function.
// This file is pre-built by vite.config.ssr.js into dist-server/entry-server.js
// The Pages Function imports everything from that built bundle.

import React from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import { HelmetProvider } from 'react-helmet-async'
import { SSRDataContext } from './hooks/ssr-context'
import App from './App'
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
 * Render the app to an HTML string for SSR.
 *
 * @param {object} opts
 * @param {string} opts.url - The request URL path (e.g. "/challenges")
 * @param {object} opts.ssrData - Pre-fetched data keyed by route name
 * @param {object} opts.helmetContext - Helmet context for collecting head tags
 * @returns {string} - Rendered HTML string (body content only, not full document)
 */
export function renderApp({ url, ssrData, helmetContext }) {
  return renderToString(
    React.createElement(
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
            React.createElement(App),
          ),
        ),
      ),
    ),
  )
}
