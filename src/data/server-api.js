// Server-side data fetchers for SSR.
// Each function accepts a Supabase client and returns data that matches
// the shape the client-side API returns (after normalization).
// This ensures the server-rendered HTML matches what the client would render.

import { getType } from '../lib/challengeTypes'

/* -------------------------------------------------------------------------- */
/*  Normalizers (mirrors src/data/api.js)                                     */
/* -------------------------------------------------------------------------- */

function normClub(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tag: row.tag,
    region: row.region,
    members: row.members ?? 0,
    verified: !!row.verified,
    accent: row.accent || '#06b6d4',
    tagline: row.tagline || '',
    about: row.about || '',
    discord: row.discord || '',
    founded: row.founded || '',
    ownerId: row.owner_id || null,
    stats: { challenges: 0, podiums: 0, submissions: 0 },
  }
}

function normChallenge(row) {
  return {
    id: row.id,
    slug: row.slug,
    typeId: row.type_id,
    title: row.title,
    clubId: row.club_id,
    status: row.status,
    season: row.season || null,
    featured: !!row.featured,
    startDate: row.start_date,
    endDate: row.end_date,
    region: row.region || '',
    restriction: row.restriction || '',
    location: row.location || '',
    prize: row.prize || '',
    description: row.description || '',
    rules: row.rules || [],
    visibility: row.visibility || 'public',
    prerequisiteId: row.prerequisite_id || null,
    isSubChallenge: !!row.is_sub_challenge,
    parentId: row.parent_id || null,
    sponsor: row.sponsor || null,
    sponsored: !!row.sponsored,
    entries: [],
    gallery: [],
    participants: 0,
    submissionCount: 0,
    pendingCount: 0,
  }
}

function normProfile(row) {
  if (!row) return { name: 'Unknown', tag: 'unknown', country: '', platform: '' }
  return {
    id: row.id,
    name: row.display_name || row.gamertag,
    tag: row.gamertag,
    country: row.country || '',
    platform: row.platform || '',
    role: row.role || 'racer',
    accent: row.accent || null,
    nameGradient: !!row.name_gradient,
    nameEffect: row.name_effect || 'clean',
    plateFrame: row.plate_frame || 'none',
    profileTitle: row.profile_title || '',
    badges: row.badges || [],
    avatarUrl: row.avatar_url || null,
  }
}

function normSubmission(row, { typeId } = {}) {
  return {
    id: row.id,
    challengeId: row.challenge_id,
    typeId: typeId || row.type_id || row.challenges?.type_id,
    user: normProfile(row.profiles),
    value: row.value,
    title: row.title || '',
    shareCode: row.share_code || '',
    votes: row.votes ?? 0,
    hue: row.hue ?? 24,
    proof: { type: row.proof_type, url: row.proof_url || '#' },
    note: row.note || '',
    status: row.status,
    flag: row.flag || '',
    submittedAt: row.created_at,
  }
}

function buildBoard(challenge, approvedSubs) {
  const t = getType(challenge.typeId)
  if (t.gallery) {
    const items = approvedSubs
      .slice()
      .sort((a, b) => {
        const dv = (b.votes || 0) - (a.votes || 0)
        if (dv !== 0) return dv
        return new Date(a.submittedAt || 0) - new Date(b.submittedAt || 0)
      })
      .map((s, i) => ({
        id: s.id,
        rank: i + 1,
        user: s.user,
        title: s.title,
        votes: s.votes || 0,
        hue: s.hue ?? 24,
        submittedAt: s.submittedAt,
        verified: true,
      }))
    return { gallery: items, entries: [] }
  }
  const entries = approvedSubs
    .filter((s) => s.value != null)
    .sort((a, b) => {
      const dv = t.sort === 'asc' ? a.value - b.value : b.value - a.value
      if (dv !== 0) return dv
      return new Date(a.submittedAt || 0) - new Date(b.submittedAt || 0)
    })
    .map((s, i) => ({
      rank: i + 1,
      user: s.user,
      value: s.value,
      proof: s.proof,
      submittedAt: s.submittedAt,
      verified: true,
    }))
  return { entries, gallery: [] }
}

/* -------------------------------------------------------------------------- */
/*  Data fetchers                                                             */
/* -------------------------------------------------------------------------- */

export async function fetchClubs(supabase) {
  const { data, error } = await supabase.from('clubs').select('*').order('name')
  if (error) throw error
  return (data || []).map(normClub)
}

export async function fetchClubBySlug(supabase, slug) {
  const { data, error } = await supabase.from('clubs').select('*').eq('slug', slug).maybeSingle()
  if (error) throw error
  return data ? normClub(data) : null
}

export async function fetchChallenges(supabase) {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('visibility', 'public')
    .order('end_date', { ascending: true })
  if (error) throw error
  return (data || []).map(normChallenge)
}

export async function fetchChallengesWithClubs(supabase) {
  const [challenges, clubs] = await Promise.all([fetchChallenges(supabase), fetchClubs(supabase)])
  const byId = new Map(clubs.map((c) => [c.id, c]))
  return challenges.map((c) => ({ ...c, club: byId.get(c.clubId) || null }))
}

export async function fetchChallengeBySlug(supabase, slug) {
  const { data: row, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw error
  if (!row) return null

  const challenge = normChallenge(row)

  const { data: subs, error: subErr } = await supabase
    .from('submissions')
    .select('*, profiles:user_id(*)')
    .eq('challenge_id', challenge.id)
  if (subErr) throw subErr

  const normed = (subs || []).map((s) => normSubmission({ ...s, type_id: challenge.typeId }))
  const approved = normed.filter((s) => s.status === 'approved')
  const { entries, gallery } = buildBoard(challenge, approved)

  challenge.entries = entries
  challenge.gallery = gallery
  challenge.submissionCount = normed.length
  challenge.participants = new Set(normed.map((s) => s.user?.tag).filter(Boolean)).size
  challenge.pendingCount = normed.filter((s) => s.status === 'pending').length

  // Fetch club
  const { data: clubRow } = await supabase.from('clubs').select('*').eq('id', challenge.clubId).maybeSingle()
  challenge.club = clubRow ? normClub(clubRow) : null

  return challenge
}

export async function fetchChallengesByClub(supabase, clubId) {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('club_id', clubId)
    .order('end_date', { ascending: false })
  if (error) throw error

  const challenges = (data || []).map(normChallenge)
  if (challenges.length === 0) return challenges

  // Hydrate boards
  const { data: subs, error: subErr } = await supabase
    .from('submissions')
    .select('*, profiles:user_id(*)')
    .in('challenge_id', challenges.map((c) => c.id))
  if (subErr) throw subErr

  return challenges.map((challenge) => {
    const challengeSubs = (subs || [])
      .filter((s) => s.challenge_id === challenge.id)
      .map((s) => normSubmission({ ...s, type_id: challenge.typeId }))
    const approved = challengeSubs.filter((s) => s.status === 'approved')
    const { entries, gallery } = buildBoard(challenge, approved)
    return {
      ...challenge,
      entries,
      gallery,
      submissionCount: challengeSubs.length,
      participants: new Set(challengeSubs.map((s) => s.user?.tag).filter(Boolean)).size,
      pendingCount: challengeSubs.filter((s) => s.status === 'pending').length,
    }
  })
}

export async function fetchClubMembers(supabase, clubId) {
  const { data, error } = await supabase
    .from('club_members')
    .select('role, joined_at, is_primary, profiles:user_id(*)')
    .eq('club_id', clubId)
    .order('joined_at', { ascending: true })
  if (error) throw error
  return (data || []).map((row) => ({
    ...normProfile(row.profiles),
    membershipRole: row.role,
    isPrimary: !!row.is_primary,
    joinedAt: row.joined_at,
  }))
}

export async function fetchSiteStats(supabase) {
  const [clubsRes, challengesRes, subsRes, racersRes] = await Promise.all([
    supabase.from('clubs').select('id', { count: 'exact', head: true }),
    supabase.from('challenges').select('id', { count: 'exact', head: true }),
    supabase.from('submissions').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('submissions').select('user_id'),
  ])
  return {
    clubs: clubsRes.count ?? 0,
    challenges: challengesRes.count ?? 0,
    submissions: subsRes.count ?? 0,
    racers: new Set((racersRes.data || []).map((r) => r.user_id).filter(Boolean)).size,
    isLaunch: (subsRes.count ?? 0) === 0,
  }
}

export async function fetchClosedChallenges(supabase) {
  const all = await fetchChallenges(supabase)
  return all
    .filter((c) => c.status === 'closed')
    .sort((a, b) => new Date(b.endDate) - new Date(a.endDate))
}

export async function fetchSeriesStandings(supabase, clubId, season) {
  let query = supabase
    .from('series_standings')
    .select('*')
    .order('total_points', { ascending: false })
    .order('best_finish', { ascending: true })
  if (clubId) query = query.eq('club_id', clubId)
  if (season) query = query.eq('season', season)
  const { data, error } = await query.limit(50)
  if (error) throw error
  return (data || []).map((row, i) => ({
    rank: i + 1,
    userId: row.user_id,
    gamertag: row.gamertag,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    platform: row.platform,
    eventsEntered: row.events_entered,
    totalPoints: row.total_points,
    bestFinish: row.best_finish,
  }))
}

/* -------------------------------------------------------------------------- */
/*  Sitemap data                                                              */
/* -------------------------------------------------------------------------- */

export async function fetchSitemapChallenges(supabase) {
  const { data, error } = await supabase
    .from('challenges')
    .select('slug, updated_at')
    .eq('visibility', 'public')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function fetchSitemapClubs(supabase) {
  const { data, error } = await supabase
    .from('clubs')
    .select('slug, updated_at')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data || []
}
