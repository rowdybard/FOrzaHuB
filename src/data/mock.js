// GripCafe fallback data — used only when Supabase is NOT configured.
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
    platform: 'PC',
    role: 'admin',
    accent: '#06b6d4',
    nameGradient: true,
    nameEffect: 'glow',
    plateFrame: 'carbon',
    profileTitle: 'GripCafe Founder',
    badges: ['founder', 'verified'],
    avatarUrl: null,
  },
  cone: {
    id: 'u-cone',
    name: 'PurpleCone',
    tag: 'PurpleCone',
    country: '🏁',
    platform: 'PC',
    role: 'racer',
    accent: '#a855f7',
    nameGradient: false,
    nameEffect: 'chrome',
    plateFrame: 'forum',
    profileTitle: 'Club Regular',
    badges: ['founder', 'verified'],
    avatarUrl: null,
  },
}

export const profiles = Object.values(U)

// Club rosters: clubId -> [{ userKey, role }]
const MEMBERSHIPS = {
  gripcafe: [
    { user: U.rowdy, role: 'owner', isPrimary: true },
    { user: U.cone, role: 'member', isPrimary: true },
  ],
}

export const clubs = [
  {
    id: 'gripcafe',
    slug: 'gripcafe',
    name: 'GripCafe',
    tag: 'GC',
    region: 'Global',
    members: 2,
    verified: true,
    accent: '#06b6d4',
    tagline: 'The home base. More clubs coming.',
    about:
      'The founding club for GripCafe. Rowdybard and PurpleCone are here. Challenges, leaderboards and verified proof.',
    discord: '',
    founded: 'Jun 2025',
    ownerId: 'u-rowdy',
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

// Sponsored event hub data
export const siteStats = {
  clubs: clubs.length,
  challenges: 0,
  submissions: 0,
  racers: clubs.reduce((n, c) => n + (c.members || 0), 0),
  isLaunch: true,
}

function nextSunday() {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? 7 : 7 - day
  const sunday = new Date(now)
  sunday.setDate(now.getDate() + diff)
  sunday.setHours(18, 0, 0, 0)
  return sunday.toISOString()
}

function addDays(iso, days) {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

const _eventStart = nextSunday()

export const sponsoredEvent = {
  id: 'evt-1',
  title: 'GripCafe Beta Race Series',
  tagline: '7 events. 1 week. Most points wins the $50 prize.',
  description:
    'A seven-day community showdown. Seven events, cumulative season points, and a $50 gift card for the overall champion.',
  startDate: _eventStart,
  endDate: addDays(_eventStart, 6),
  prize: '$50',
  prizeDescription: 'Steam or Xbox gift card (winner\'s choice)',
  prizeValue: 50,
  status: 'upcoming',
  season: 'beta-1',
  accent: '#06b6d4',
}

export const eventSchedule = [
  { day: 1, label: 'Sunday',    date: _eventStart,              title: 'A-Class Festival Circuit',  typeId: 'time_trial',   description: 'Single flying lap on the festival circuit. Fastest time sets the tone.',  status: 'upcoming' },
  { day: 2, label: 'Monday',    date: addDays(_eventStart, 1),  title: 'S2 Drift Zone Trial',       typeId: 'drift_score',  description: 'Highest single drift score under the night sky.',                         status: 'upcoming' },
  { day: 3, label: 'Tuesday',   date: addDays(_eventStart, 2),  title: 'R-Class Drag Sprint',       typeId: 'drag_time',    description: 'Standing start to finish. Lowest elapsed time wins.',                     status: 'upcoming' },
  { day: 4, label: 'Wednesday', date: addDays(_eventStart, 3),  title: 'B-Class Street Build',     typeId: 'build_battle', description: 'Build a car to the brief. Community vote decides the cleanest build.',     status: 'upcoming' },
  { day: 5, label: 'Thursday',  date: addDays(_eventStart, 4),  title: 'Photo Challenge: Rally Theme', typeId: 'photo_contest',description: 'Capture the perfect shot. Most votes takes the day.',                     status: 'upcoming' },
  { day: 6, label: 'Friday',    date: addDays(_eventStart, 5),  title: 'S1 Road Circuit Trial',    typeId: 'time_trial',   description: 'Three-lap average on the GP circuit. Consistency is king.',               status: 'upcoming' },
  { day: 7, label: 'Saturday',  date: addDays(_eventStart, 6),  title: 'Finale: Clean Lap Challenge',  typeId: 'time_trial',   description: 'Winner-takes-all final race. Champion crowned, gift card awarded.',       status: 'upcoming' },
]

export const sponsors = [
  { id: 'sp-gripcafe', name: 'GripCafe',           tier: 'organizer', blurb: 'Community-run event platform' },
  { id: 'sp-rowdy',   name: 'Rowdybard Racing',   tier: 'prize',     blurb: 'Sponsoring the $50 gift card prize pool' },
  { id: 'sp-cone',    name: 'PurpleCone Garage',  tier: 'supporter', blurb: 'Build battle judge and community support' },
]

export const eventLeaderboard = [
  { rank: 1, tag: 'Rowdybard',  club: 'GC', points: 0, events: 0, accent: '#06b6d4' },
  { rank: 2, tag: 'PurpleCone', club: 'GC', points: 0, events: 0, accent: '#a855f7' },
]

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
  (MEMBERSHIPS[clubId] || []).map(({ user, role, isPrimary }) => ({
    ...user,
    membershipRole: role,
    isPrimary: !!isPrimary,
    joinedAt: null,
  }))
export const getProfileById = (id) => ALL_USERS.find((u) => u.id === id) || null
export const getClubsForUser = (userId) =>
  Object.entries(MEMBERSHIPS).flatMap(([clubId, rows]) =>
    rows
      .filter(({ user }) => user.id === userId)
      .map(({ role, isPrimary }) => ({
        ...getClubById(clubId),
        membershipRole: role,
        joinedAt: null,
        isPrimary: !!isPrimary,
      })),
  )
export const getPrimaryClubForUser = (userId) => {
  const memberships = getClubsForUser(userId)
  return memberships.find((club) => club.isPrimary) || memberships[0] || null
}
export const getOwnedClubForUser = (userId) =>
  clubs.find((club) => club.ownerId === userId) || null
