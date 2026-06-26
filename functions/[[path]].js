// Cloudflare Pages Function — SSR for public routes, SPA fallback for private routes.
// Renders React app with pre-fetched Supabase data for SEO.
// Returns real HTTP 404 for unknown routes and missing dynamic records.
//
// Imports from the pre-built SSR bundle (dist-server/entry-server.js) which is
// produced by `vite build --config vite.config.ssr.js` before the Pages Function
// is bundled by Cloudflare.

import {
  renderApp,
  createServerClient,
  fetchChallengesWithClubs,
  fetchSiteStats,
  fetchClubs,
  fetchChallengeBySlug,
  fetchChallengesByClub,
  fetchClubBySlug,
  fetchClubMembers,
  fetchClosedChallenges,
  fetchSeriesStandings,
  getRouteMeta,
  isNoindexRoute,
  SITE_URL,
} from '../dist-server/entry-server.js'

// Routes that should be server-rendered with pre-fetched data
const SSR_ROUTES = new Set(['/', '/beta-series', '/challenges', '/archive', '/clubs', '/official-rules'])

// Routes that should NOT be SSR'd (private/utility — just serve the SPA shell)
const SPA_ONLY_ROUTES = new Set(['/admin', '/me', '/create', '/clubs/new', '/submit'])

function getEnv(env) {
  const url = env.VITE_SUPABASE_URL
  const key = env.VITE_SUPABASE_ANON_KEY
  return { url, key, enabled: Boolean(url && key) }
}

// Static routes that are always valid
const VALID_STATIC_ROUTES = new Set([
  '/', '/beta-series', '/challenges', '/archive', '/clubs', '/clubs/new',
  '/official-rules', '/admin', '/me', '/create', '/submit',
])

export async function onRequestGet({ request, env, next }) {
  const url = new URL(request.url)
  const pathname = url.pathname

  // Skip SSR for static assets
  if (/\.(js|css|png|jpg|jpeg|webp|svg|ico|woff|woff2|webmanifest|xml|txt|map)$/.test(pathname)) {
    return next()
  }

  // Skip sitemap (handled by separate function)
  if (pathname === '/sitemap.xml') {
    return next()
  }

  const { url: supabaseUrl, key: supabaseKey, enabled } = getEnv(env)

  // For private/utility routes, serve SPA shell with noindex meta
  if (SPA_ONLY_ROUTES.has(pathname) || pathname.startsWith('/create/') || pathname.startsWith('/submit/')) {
    return renderSSRResponse(pathname, {}, env, { isPrivate: true })
  }

  // Dynamic route: /c/:slug
  if (pathname.startsWith('/c/')) {
    const slug = pathname.slice(3)
    if (!slug || slug.includes('/')) {
      return render404(env)
    }
    if (!enabled) return renderSSRResponse(pathname, {}, env)

    const supabase = createServerClient(supabaseUrl, supabaseKey)
    try {
      const challenge = await fetchChallengeBySlug(supabase, slug)
      if (!challenge) return render404(env)

      const [clubChallenges, seriesStandings] = await Promise.all([
        fetchChallengesByClub(supabase, challenge.clubId),
        challenge.season ? fetchSeriesStandings(supabase, challenge.clubId, challenge.season) : Promise.resolve([]),
      ])
      const more = clubChallenges.filter((c) => c.id !== challenge.id)
      const ssrData = {
        [`challenge:${slug}`]: { challenge, more, seriesStandings },
        challenge,
      }
      return renderSSRResponse(pathname, ssrData, env)
    } catch (err) {
      console.error('[SSR] challenge fetch error:', err)
      return renderSSRResponse(pathname, {}, env)
    }
  }

  // Dynamic route: /club/:slug
  if (pathname.startsWith('/club/')) {
    const slug = pathname.slice(6)
    if (!slug || slug.includes('/')) {
      return render404(env)
    }
    if (!enabled) return renderSSRResponse(pathname, {}, env)

    const supabase = createServerClient(supabaseUrl, supabaseKey)
    try {
      const club = await fetchClubBySlug(supabase, slug)
      if (!club) return render404(env)

      const [all, members] = await Promise.all([
        fetchChallengesByClub(supabase, club.id),
        fetchClubMembers(supabase, club.id),
      ])
      const ssrData = {
        [`club:${slug}`]: { club, all, members },
        club,
      }
      return renderSSRResponse(pathname, ssrData, env)
    } catch (err) {
      console.error('[SSR] club fetch error:', err)
      return renderSSRResponse(pathname, {}, env)
    }
  }

  // Static SSR routes
  if (SSR_ROUTES.has(pathname)) {
    if (!enabled) return renderSSRResponse(pathname, {}, env)

    const supabase = createServerClient(supabaseUrl, supabaseKey)
    try {
      let ssrData = {}

      if (pathname === '/') {
        const [challenges, stats] = await Promise.all([
          fetchChallengesWithClubs(supabase),
          fetchSiteStats(supabase),
        ])
        ssrData = { landing: [challenges, stats] }
      } else if (pathname === '/beta-series') {
        const [clubs, challenges, stats] = await Promise.all([
          fetchClubs(supabase),
          fetchChallengesWithClubs(supabase),
          fetchSiteStats(supabase),
        ])
        ssrData = { 'beta-series': [clubs, challenges, stats] }
      } else if (pathname === '/challenges') {
        const challenges = await fetchChallengesWithClubs(supabase)
        ssrData = { challenges }
      } else if (pathname === '/archive') {
        const [events, clubs] = await Promise.all([
          fetchClosedChallenges(supabase),
          fetchClubs(supabase),
        ])
        const byId = new Map(clubs.map((c) => [c.id, c]))
        const archiveData = events.map((e) => ({ ...e, club: byId.get(e.clubId) || null }))
        ssrData = { archive: archiveData }
      } else if (pathname === '/clubs') {
        const clubs = await fetchClubs(supabase)
        ssrData = { clubs }
      }

      return renderSSRResponse(pathname, ssrData, env)
    } catch (err) {
      console.error('[SSR] static route fetch error:', err)
      return renderSSRResponse(pathname, {}, env)
    }
  }

  // Unknown route — check if it's a valid SPA route
  if (!VALID_STATIC_ROUTES.has(pathname) && !pathname.startsWith('/c/') && !pathname.startsWith('/club/')) {
    return render404(env)
  }

  // Fallback: serve SPA shell
  return renderSSRResponse(pathname, {}, env)
}

async function renderSSRResponse(pathname, ssrData, env, opts = {}) {
  const helmetContext = {}
  let appHtml = ''

  try {
    appHtml = renderApp({ url: pathname, ssrData, helmetContext })
  } catch (err) {
    console.error('[SSR] render error:', err)
    // Fall back to SPA shell
    return serveSpaShell(env, pathname)
  }

  const routeMeta = getRouteMeta(pathname, ssrData)
  const helmet = helmetContext.helmet || {}

  // Build the full HTML document
  const html = buildHtmlDocument({
    appHtml,
    helmet,
    routeMeta,
    ssrData,
    isPrivate: opts.isPrivate || routeMeta.noindex,
  })

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
    },
  })
}

function render404(env) {
  const helmetContext = {}
  let appHtml = ''

  try {
    appHtml = renderApp({ url: '/__not_found__', ssrData: {}, helmetContext })
  } catch (err) {
    console.error('[SSR] 404 render error:', err)
    return new Response('Not Found', { status: 404, headers: { 'Content-Type': 'text/plain' } })
  }

  const routeMeta = {
    title: 'Page Not Found — GripCafe',
    description: 'This page does not exist.',
    canonical: `${SITE_URL}`,
    ogType: 'website',
    noindex: true,
    jsonLd: null,
  }

  const html = buildHtmlDocument({
    appHtml,
    helmet: helmetContext.helmet || {},
    routeMeta,
    ssrData: {},
    isPrivate: true,
  })

  return new Response(html, {
    status: 404,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}

async function serveSpaShell(env, pathname) {
  // Fetch the static index.html from assets
  try {
    const response = await env.ASSETS.fetch(new Request(new URL(pathname, 'https://placeholder.com')))
    if (response.ok) return response
  } catch {}
  return new Response('Internal Server Error', { status: 500 })
}

function buildHtmlDocument({ appHtml, helmet, routeMeta, ssrData, isPrivate }) {
  const title = routeMeta.title || 'GripCafe'
  const description = routeMeta.description || ''
  const canonical = routeMeta.canonical || SITE_URL
  const ogType = routeMeta.ogType || 'website'

  // Serialize SSR data for client hydration
  const ssrDataScript = Object.keys(ssrData).length > 0
    ? `<script>window.__SSR_DATA__ = ${JSON.stringify(ssrData).replace(/</g, '\\u003c')}</script>`
    : ''

  // JSON-LD structured data
  const jsonLdScripts = routeMeta.jsonLd
    ? (Array.isArray(routeMeta.jsonLd) ? routeMeta.jsonLd : [routeMeta.jsonLd])
        .map((ld) => `<script type="application/ld+json">${JSON.stringify(ld)}</script>`)
        .join('\n    ')
    : ''

  // Helmet head tags (from react-helmet-async in components)
  const helmetTitle = helmet.title?.toString() || ''
  const helmetMeta = helmet.meta?.toString() || ''
  const helmetLink = helmet.link?.toString() || ''

  // Noindex meta for private routes
  const noindexMeta = isPrivate ? '<meta name="robots" content="noindex, nofollow">' : ''

  return `<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="manifest" href="/site.webmanifest" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#0a0b0d" />
    ${noindexMeta}
    <title>${title}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:type" content="${ogType}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:site_name" content="GripCafe" />
    <meta property="og:image" content="${SITE_URL}/og-image.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${SITE_URL}/og-image.png" />
    ${helmetTitle}
    ${helmetMeta}
    ${helmetLink}
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-89G54G0YVL"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-89G54G0YVL');
    </script>
    ${jsonLdScripts}
    ${ssrDataScript}
  </head>
  <body>
    <div id="root">${appHtml}</div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`
}

function escapeHtml(str) {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
