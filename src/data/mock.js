// Pitwall fallback data — used only when Supabase is NOT configured.
// One real founding club, two real members, no fake challenges or times.
// When VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are set, the app reads
// live data from the database instead (see src/data/api.js).

// Real members (with Option A "Nameplate" cosmetics)
const U = {
  rowdy: {
    id: 'u-rowdy',
    name: 'Rowdybard',
    tag: 'Rowdybard',
    country: '🏁',
    platform: 'Xbox',
    role: 'admin',
    accent: '#ff6b2c',
    nameGradient: true,
    badges: ['founder', 'verified'],
    avatarUrl: null,
  },
  cone: {
    id: 'u-cone',
    name: 'PurpleCone',
    tag: 'PurpleCone',
    country: '🏁',
    platform: 'Xbox',
    role: 'racer',
    accent: '#a855f7',
    nameGradient: false,
    badges: ['founder'],
    avatarUrl: null,
  },
}

// Club rosters: clubId -> [{ userKey, role }]
const MEMBERSHIPS = {
  pitwall: [
    { user: U.rowdy, role: 'owner' },
    { user: U.cone, role: 'member' },
  ],
}

export const clubs = [
  {
    id: 'pitwall',
    slug: 'pitwall',
    name: 'Pitwall',
    tag: 'PW',
    region: 'Global',
    members: 2,
    verified: true,
    accent: '#ff6b2c',
    tagline: 'The home base. More clubs coming.',
    about:
      'The founding club for Pitwall. Rowdybard and PurpleCone are here. Challenges, leaderboards and verified proof, just getting started.',
    discord: '',
    founded: 'Jun 2025',
    stats: { challenges: 0, podiums: 0, submissions: 0 },
  },
]

// No challenges yet — create the first one via /create once deployed.
export const challenges = []

// Sub-challenges (prerequisite qualifiers) — none yet.
export const subChallenges = []

// Admin review queue — empty until the first submission arrives.
export const submissions = []

// Recent activity feed — empty at launch.
export const recentActivity = []

export const siteStats = {
  clubs: clubs.length,
  challenges: 0,
  submissions: 0,
  racers: clubs.reduce((n, c) => n + (c.members || 0), 0),
  isLaunch: true,
}

// --- Selectors (mirror the async API in src/data/api.js) -------------------
export const allChallenges = [...challenges, ...subChallenges]

export const getChallengeBySlug = (slug) => allChallenges.find((c) => c.slug === slug)
export const getClubBySlug = (slug) => clubs.find((c) => c.slug === slug)
export const getClubById = (id) => clubs.find((c) => c.id === id)
export const challengesByClubId = (id) => challenges.filter((c) => c.clubId === id)
export const getSubChallenge = (id) => subChallenges.find((c) => c.id === id)
export const getPrerequisite = (challenge) =>
  challenge?.prerequisiteId
    ? subChallenges.find((c) => c.id === challenge.prerequisiteId)
    : null
export const liveChallenges = () => challenges.filter((c) => c.status === 'live')
export const featuredChallenge = () =>
  challenges.find((c) => c.featured) || challenges[0] || null
export const closedChallenges = () =>
  challenges
    .filter((c) => c.status === 'closed')
    .sort((a, b) => new Date(b.endDate) - new Date(a.endDate))

// Members / profiles
const ALL_USERS = Object.values(U)
export const clubMembers = (clubId) =>
  (MEMBERSHIPS[clubId] || []).map(({ user, role }) => ({
    ...user,
    membershipRole: role,
    joinedAt: null,
  }))
export const getProfileById = (id) => ALL_USERS.find((u) => u.id === id) || null
