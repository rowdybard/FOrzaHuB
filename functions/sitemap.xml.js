// Dynamic sitemap.xml — queries Supabase for public challenges and clubs.
// Returns valid XML with real lastmod values from updated_at columns.

import {
  createServerClient,
  fetchSitemapChallenges,
  fetchSitemapClubs,
} from '../dist-server/entry-server.js'

const SITE_URL = 'https://gripcafe.com'

const STATIC_ROUTES = [
  { loc: '/', priority: '1.0', changefreq: 'daily' },
  { loc: '/beta-series', priority: '0.9', changefreq: 'daily' },
  { loc: '/challenges', priority: '0.9', changefreq: 'daily' },
  { loc: '/clubs', priority: '0.8', changefreq: 'weekly' },
  { loc: '/archive', priority: '0.6', changefreq: 'weekly' },
  { loc: '/official-rules', priority: '0.3', changefreq: 'monthly' },
]

function escapeXml(str) {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function formatDate(iso) {
  if (!iso) return null
  try {
    return new Date(iso).toISOString().split('T')[0]
  } catch {
    return null
  }
}

export async function onRequestGet({ request, env }) {
  const url = env.VITE_SUPABASE_URL
  const key = env.VITE_SUPABASE_ANON_KEY

  let challengeUrls = []
  let clubUrls = []

  if (url && key) {
    const supabase = createServerClient(url, key)
    try {
      const [challenges, clubs] = await Promise.all([
        fetchSitemapChallenges(supabase),
        fetchSitemapClubs(supabase),
      ])

      challengeUrls = challenges
        .filter((c) => c.slug)
        .map((c) => ({
          loc: `/c/${escapeXml(c.slug)}`,
          lastmod: formatDate(c.updated_at),
          priority: '0.7',
          changefreq: 'daily',
        }))

      clubUrls = clubs
        .filter((c) => c.slug)
        .map((c) => ({
          loc: `/club/${escapeXml(c.slug)}`,
          lastmod: formatDate(c.updated_at),
          priority: '0.6',
          changefreq: 'weekly',
        }))
    } catch (err) {
      console.error('[sitemap] fetch error:', err)
    }
  }

  const allUrls = [
    ...STATIC_ROUTES,
    ...challengeUrls,
    ...clubUrls,
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map((u) => {
    let url = `  <url>\n    <loc>${SITE_URL}${u.loc}</loc>\n`
    if (u.lastmod) url += `    <lastmod>${u.lastmod}</lastmod>\n`
    if (u.changefreq) url += `    <changefreq>${u.changefreq}</changefreq>\n`
    if (u.priority) url += `    <priority>${u.priority}</priority>\n`
    url += `  </url>`
    return url
  })
  .join('\n')}
</urlset>`

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
