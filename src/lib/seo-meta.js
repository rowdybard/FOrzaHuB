// Route-specific SEO metadata for SSR.
// Generates title, description, canonical, OG tags, and JSON-LD per route.
// This is used by the Pages Function to inject metadata into the HTML head
// before sending the response.

const SITE_URL = 'https://gripcafe.com'

const NOINDEX_ROUTES = new Set([
  '/admin',
  '/me',
  '/create',
  '/clubs/new',
  '/submit',
])

const NOINDEX_PREFIXES = [
  '/create/',
  '/submit/',
]

export function isNoindexRoute(pathname) {
  if (NOINDEX_ROUTES.has(pathname)) return true
  return NOINDEX_PREFIXES.some((p) => pathname.startsWith(p))
}

const STATIC_META = {
  '/': {
    title: 'Forza Horizon 6 Clubs, Community Challenges & Leaderboards — GripCafe',
    description: 'Run a Forza Horizon 6 tournament for your Discord community. Time trials, drift, drag, build battles, and photo contests with verified proof and public leaderboards.',
    h1: 'Forza Horizon 6 Clubs, Community Challenges & Leaderboards',
  },
  '/beta-series': {
    title: 'Beta Race Series — GripCafe',
    description: '7 events. 1 week. Most points wins the $50 Series Champion Reward. Free to enter — join a club and compete in the GripCafe Beta Race Series.',
  },
  '/challenges': {
    title: 'Forza Horizon 6 Community Challenges & Tournaments — GripCafe',
    description: 'Browse live and upcoming Forza Horizon 6 community challenges. Time trials, drift battles, drag races, photo contests, and build battles with verified proof and community prizes.',
  },
  '/archive': {
    title: 'Completed FH6 Tournaments — Results Archive — GripCafe',
    description: 'Browse completed Forza Horizon 6 tournaments with podium finishes, records, and verified results. See past champions and leaderboard standings.',
  },
  '/clubs': {
    title: 'Forza Horizon 6 Community Clubs — GripCafe',
    description: 'Join Forza Horizon 6 clubs running verified community tournaments on GripCafe. Find a club, or bring your Discord server and start competing.',
  },
  '/official-rules': {
    title: 'Official Rules — GripCafe',
    description: 'Official rules for GripCafe free-to-enter Forza Horizon 6 community challenges. Proof requirements, steward review, and community reward terms.',
  },
}

/**
 * Generate route-specific metadata for SSR.
 * @param {string} pathname - The request pathname
 * @param {object} ssrData - Pre-fetched data (may contain challenge/club data)
 * @returns {object} { title, description, canonical, ogType, jsonLd, noindex }
 */
export function getRouteMeta(pathname, ssrData) {
  const noindex = isNoindexRoute(pathname)

  // Static routes
  const staticMeta = STATIC_META[pathname]
  if (staticMeta) {
    const meta = {
      ...staticMeta,
      canonical: `${SITE_URL}${pathname}`,
      ogType: 'website',
      noindex,
      jsonLd: pathname === '/' ? getHomepageJsonLd() : null,
    }
    return meta
  }

  // Dynamic: /c/:slug
  if (pathname.startsWith('/c/')) {
    const challenge = ssrData?.challenge
    if (!challenge) {
      return {
        title: 'Challenge Not Found — GripCafe',
        description: 'This challenge does not exist or has been removed.',
        canonical: `${SITE_URL}${pathname}`,
        ogType: 'website',
        noindex: true,
        jsonLd: null,
      }
    }
    const t = getChallengeTypeLabel(challenge.typeId)
    const status = getEffectiveStatus(challenge)
    const clubName = challenge.club?.name || 'Community'
    const location = challenge.location ? ` at ${challenge.location}` : ''
    const restriction = challenge.restriction ? ` · ${challenge.restriction}` : ''
    const title = `${challenge.title} — ${t}${location} | ${clubName}`
    const description = `${challenge.title}: ${t} challenge${location}${restriction}. Organized by ${clubName}. Status: ${status}. ${challenge.description || ''}`.trim()
    return {
      title,
      description,
      canonical: `${SITE_URL}/c/${challenge.slug}`,
      ogType: 'article',
      noindex: false,
      jsonLd: getChallengeJsonLd(challenge),
    }
  }

  // Dynamic: /club/:slug
  if (pathname.startsWith('/club/')) {
    const club = ssrData?.club
    if (!club) {
      return {
        title: 'Club Not Found — GripCafe',
        description: 'This club does not exist or has been removed.',
        canonical: `${SITE_URL}${pathname}`,
        ogType: 'website',
        noindex: true,
        jsonLd: null,
      }
    }
    const title = `${club.name} — FH6 Club Events & Leaderboards | GripCafe`
    const description = `${club.name} [${club.tag}] is a Forza Horizon 6 community club${club.region ? ` based in ${club.region}` : ''}. ${club.tagline || 'Running verified community tournaments with public leaderboards.'}`.trim()
    return {
      title,
      description,
      canonical: `${SITE_URL}/club/${club.slug}`,
      ogType: 'website',
      noindex: false,
      jsonLd: getClubJsonLd(club),
    }
  }

  // Fallback for unknown routes (will be 404)
  return {
    title: 'Page Not Found — GripCafe',
    description: 'This page does not exist.',
    canonical: `${SITE_URL}${pathname}`,
    ogType: 'website',
    noindex: true,
    jsonLd: null,
  }
}

function getChallengeTypeLabel(typeId) {
  const labels = {
    time_trial: 'Time Trial',
    drift_score: 'Drift Score',
    drag_time: 'Drag Time',
    photo_contest: 'Photo Contest',
    build_battle: 'Build Battle',
  }
  return labels[typeId] || 'Challenge'
}

function getEffectiveStatus(challenge) {
  const now = Date.now()
  const ended = new Date(challenge.endDate).getTime() <= now
  const started = new Date(challenge.startDate).getTime() <= now
  if (ended) return 'closed'
  if (!started) return 'upcoming'
  return challenge.status
}

function getHomepageJsonLd() {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'GripCafe',
      url: SITE_URL,
      description: 'Community tournament platform for Forza Horizon 6 with verified proof, leaderboards, and community prizes.',
      sameAs: ['https://discord.gg/GJw3XRuCXr'],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'GripCafe',
      publisher: { '@id': `${SITE_URL}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/challenges?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How do I run a Forza Horizon 6 tournament?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Create a free GripCafe account, start or join a club, then use the Create Challenge page to set up a tournament. Choose a format like time trial, drift, drag, or photo contest, set the rules and schedule, and share the invite link with your Discord community.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is a verified gaming competition?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Every submission on GripCafe requires proof — a screenshot or video clip showing your result. Staff reviewers verify each entry before it appears on the public leaderboard, so standings are always legitimate.',
          },
        },
        {
          '@type': 'Question',
          name: 'How do proof-backed leaderboards work?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Players submit their time or score with a screenshot or video. Each submission is reviewed by club staff before it is approved. Only verified entries appear on the leaderboard, and every result links back to its proof.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I win community prizes in Forza Horizon 6?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. Sponsored events on GripCafe offer community prizes like Steam and Xbox gift cards. Join a club, enter sponsored challenges, and climb the championship leaderboard to qualify.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is GripCafe free to use?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. Creating an account, joining clubs, and entering challenges is completely free. Clubs can run free-to-enter events at no cost.',
          },
        },
      ],
    },
  ]
}

function getChallengeJsonLd(challenge) {
  const items = []
  const clubName = challenge.club?.name || 'Community'

  // Event schema
  items.push({
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: challenge.title,
    startDate: challenge.startDate,
    endDate: challenge.endDate,
    eventStatus: getEventStatus(challenge),
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    location: {
      '@type': 'VirtualLocation',
      url: `${SITE_URL}/c/${challenge.slug}`,
    },
    organizer: {
      '@type': 'Organization',
      name: clubName,
      url: challenge.club?.slug ? `${SITE_URL}/club/${challenge.club.slug}` : SITE_URL,
    },
    description: challenge.description || `${getChallengeTypeLabel(challenge.typeId)} challenge${challenge.location ? ` at ${challenge.location}` : ''}`,
  })

  // BreadcrumbList
  items.push({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Challenges', item: `${SITE_URL}/challenges` },
      { '@type': 'ListItem', position: 3, name: challenge.title, item: `${SITE_URL}/c/${challenge.slug}` },
    ],
  })

  return items
}

function getClubJsonLd(club) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: club.name,
      alternateName: club.tag,
      url: `${SITE_URL}/club/${club.slug}`,
      description: club.tagline || club.about || `Forza Horizon 6 community club`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Clubs', item: `${SITE_URL}/clubs` },
        { '@type': 'ListItem', position: 3, name: club.name, item: `${SITE_URL}/club/${club.slug}` },
      ],
    },
  ]
}

function getEventStatus(challenge) {
  const status = getEffectiveStatus(challenge)
  if (status === 'upcoming') return 'https://schema.org/EventScheduled'
  if (status === 'live') return 'https://schema.org/EventScheduled'
  if (status === 'closed') return 'https://schema.org/EventCompleted'
  return 'https://schema.org/EventScheduled'
}

export { SITE_URL }
