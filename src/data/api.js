// Pitwall data access layer.
// Every page imports from here. When Supabase is configured the functions hit
// the database; otherwise they fall back to the honest mock data in mock.js.
//
// DB columns are snake_case; the UI expects camelCase. All normalization lives
// in this file so components never see raw rows.

import { supabase, isSupabaseEnabled } from '../lib/supabase'
import { getType } from '../lib/challengeTypes'
import { slugify } from '../lib/utils'
import * as mock from './mock'

/* -------------------------------------------------------------------------- */
/*  Normalizers                                                               */
/* -------------------------------------------------------------------------- */

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

function normClub(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tag: row.tag,
    region: row.region,
    members: row.members ?? 0,
    verified: !!row.verified,
    accent: row.accent || '#ff6b2c',
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
    entries: [],
    gallery: [],
    participants: 0,
    submissionCount: 0,
    pendingCount: 0,
  }
}

function normSubmission(row, { profile, challengeTitle } = {}) {
  const user = profile ? normProfile(profile) : normProfile(row.profiles)
  return {
    id: row.id,
    challengeId: row.challenge_id,
    challengeTitle: challengeTitle || row.challenge_title || '',
    typeId: row.type_id || row.challenges?.type_id,
    user,
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

/* -------------------------------------------------------------------------- */
/*  Leaderboard assembly                                                      */
/* -------------------------------------------------------------------------- */

// Turn approved submissions into ranked entries (or a gallery for vote types).
function buildBoard(challenge, approvedSubs) {
  const t = getType(challenge.typeId)
  if (t.gallery) {
    const items = approvedSubs
      .slice()
      .sort((a, b) => (b.votes || 0) - (a.votes || 0))
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
    .sort((a, b) => (t.sort === 'asc' ? a.value - b.value : b.value - a.value))
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
/*  Clubs                                                                     */
/* -------------------------------------------------------------------------- */

export async function getClubs() {
  if (!isSupabaseEnabled) return mock.clubs
  const { data, error } = await supabase.from('clubs').select('*').order('name')
  if (error) throw error
  return (data || []).map(normClub)
}

export async function getClubBySlug(slug) {
  if (!isSupabaseEnabled) return mock.getClubBySlug(slug) || null
  const { data, error } = await supabase.from('clubs').select('*').eq('slug', slug).maybeSingle()
  if (error) throw error
  return data ? normClub(data) : null
}

/* -------------------------------------------------------------------------- */
/*  Challenges                                                                */
/* -------------------------------------------------------------------------- */

export async function getChallenges() {
  if (!isSupabaseEnabled) return mock.challenges
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('visibility', 'public')
    .order('end_date', { ascending: true })
  if (error) throw error
  return (data || []).map(normChallenge)
}

// List challenges with their club attached (for grids / cards).
export async function getChallengesWithClubs() {
  const [challenges, clubs] = await Promise.all([getChallenges(), getClubs()])
  const byId = new Map(clubs.map((c) => [c.id, c]))
  return challenges.map((c) => ({ ...c, club: byId.get(c.clubId) || null }))
}

export async function getChallengesByClub(clubId) {
  if (!isSupabaseEnabled) return mock.challengesByClubId(clubId)
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('club_id', clubId)
    .order('end_date', { ascending: false })
  if (error) throw error
  return (data || []).map(normChallenge)
}

export async function getChallengeBySlug(slug) {
  if (!isSupabaseEnabled) {
    const c = mock.getChallengeBySlug(slug)
    return c ? { ...c, club: mock.getClubById(c.clubId) || null } : null
  }
  const { data: row, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw error
  if (!row) return null

  const challenge = normChallenge(row)

  // Pull all submissions for this challenge (RLS lets the public see approved
  // rows; staff/owner see more). Join the submitter profile.
  const { data: subs, error: subErr } = await supabase
    .from('submissions')
    .select('*, profiles:user_id(*)')
    .eq('challenge_id', challenge.id)
  if (subErr) throw subErr

  const normed = (subs || []).map((s) =>
    normSubmission({ ...s, type_id: challenge.typeId }),
  )
  const approved = normed.filter((s) => s.status === 'approved')
  const { entries, gallery } = buildBoard(challenge, approved)

  challenge.entries = entries
  challenge.gallery = gallery
  challenge.submissionCount = normed.length
  challenge.participants = new Set(normed.map((s) => s.user?.tag)).size
  challenge.pendingCount = normed.filter((s) => s.status === 'pending').length

  const club = await getClubById(challenge.clubId)
  challenge.club = club
  return challenge
}

export async function getClubById(id) {
  if (!isSupabaseEnabled) return mock.getClubById(id) || null
  const { data, error } = await supabase.from('clubs').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data ? normClub(data) : null
}

export async function getPrerequisite(challenge) {
  if (!challenge?.prerequisiteId) return null
  if (!isSupabaseEnabled) return mock.getPrerequisite(challenge)
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', challenge.prerequisiteId)
    .maybeSingle()
  if (error) throw error
  return data ? normChallenge(data) : null
}

/* -------------------------------------------------------------------------- */
/*  Submissions / admin                                                       */
/* -------------------------------------------------------------------------- */

export async function getReviewQueue() {
  if (!isSupabaseEnabled) return mock.submissions
  const { data, error } = await supabase
    .from('submissions')
    .select('*, profiles:user_id(*), challenges:challenge_id(title, type_id)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map((s) =>
    normSubmission(s, {
      challengeTitle: s.challenges?.title,
    }),
  )
}

export async function createSubmission(payload) {
  if (!isSupabaseEnabled) {
    // No backend: pretend success so the UI flow works in demo mode.
    return { ok: true, demo: true }
  }
  const { error } = await supabase.from('submissions').insert(payload)
  if (error) throw error
  return { ok: true }
}

export async function uploadProof({ file, challengeId, userId }) {
  if (!file || !isSupabaseEnabled) return null
  if (!challengeId || !userId) throw new Error('Missing challenge or user for proof upload')

  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'upload'
  const safeName = slugify(file.name.replace(/\.[^.]+$/, '')) || 'proof'
  const path = `${challengeId}/${userId}/${crypto.randomUUID()}-${safeName}.${ext}`
  const { error } = await supabase.storage.from('proofs').upload(path, file, {
    contentType: file.type || undefined,
  })
  if (error) throw error

  const { data } = supabase.storage.from('proofs').getPublicUrl(path)
  return data.publicUrl
}

export async function reviewSubmission(id, status) {
  if (!isSupabaseEnabled) return { ok: true, demo: true }
  const { error } = await supabase
    .from('submissions')
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: (await supabase.auth.getUser()).data.user?.id ?? null,
    })
    .eq('id', id)
  if (error) throw error
  return { ok: true }
}

export async function createChallenge(payload) {
  if (!isSupabaseEnabled) return { ok: true, demo: true }
  const { data, error } = await supabase.from('challenges').insert(payload).select().maybeSingle()
  if (error) throw error
  return { ok: true, challenge: data ? normChallenge(data) : null }
}

export async function updateChallenge(id, payload) {
  if (!isSupabaseEnabled) return { ok: true, demo: true }
  const { data, error } = await supabase
    .from('challenges')
    .update(payload)
    .eq('id', id)
    .select()
    .maybeSingle()
  if (error) throw error
  return { ok: true, challenge: data ? normChallenge(data) : null }
}

/* -------------------------------------------------------------------------- */
/*  Derived collections + stats                                               */
/* -------------------------------------------------------------------------- */

export async function getLiveChallenges() {
  const all = await getChallenges()
  return all.filter((c) => c.status === 'live')
}

// Live challenges with club + prerequisite attached, for the submit form.
export async function getSubmittableChallenges() {
  const [live, clubs] = await Promise.all([getLiveChallenges(), getClubs()])
  const byId = new Map(clubs.map((c) => [c.id, c]))
  return Promise.all(
    live.map(async (c) => ({
      ...c,
      club: byId.get(c.clubId) || null,
      prereq: await getPrerequisite(c),
    })),
  )
}

export async function getClosedChallenges() {
  const all = await getChallenges()
  return all
    .filter((c) => c.status === 'closed')
    .sort((a, b) => new Date(b.endDate) - new Date(a.endDate))
}

export async function getFeaturedChallenge() {
  const all = await getChallenges()
  return all.find((c) => c.featured) || all[0] || null
}

export async function getSiteStats() {
  if (!isSupabaseEnabled) return mock.siteStats
  const [clubsRes, challengesRes, subsRes] = await Promise.all([
    supabase.from('clubs').select('id', { count: 'exact', head: true }),
    supabase.from('challenges').select('id', { count: 'exact', head: true }),
    supabase.from('submissions').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
  ])
  const clubs = clubsRes.count ?? 0
  const challenges = challengesRes.count ?? 0
  const submissions = subsRes.count ?? 0
  return {
    clubs,
    challenges,
    submissions,
    racers: submissions, // refined later via distinct user count
    isLaunch: submissions === 0,
  }
}

/* -------------------------------------------------------------------------- */
/*  Members + profiles                                                        */
/* -------------------------------------------------------------------------- */

// Roster for a club: list of { ...profile, membershipRole, joinedAt }.
export async function getClubMembers(clubId) {
  if (!isSupabaseEnabled) return mock.clubMembers(clubId)
  const { data, error } = await supabase
    .from('club_members')
    .select('role, joined_at, profiles:user_id(*)')
    .eq('club_id', clubId)
    .order('joined_at', { ascending: true })
  if (error) throw error
  return (data || []).map((row) => ({
    ...normProfile(row.profiles),
    membershipRole: row.role,
    joinedAt: row.joined_at,
  }))
}

export async function joinClub(clubId, userId) {
  if (!isSupabaseEnabled) return { ok: true, demo: true }
  const { error } = await supabase
    .from('club_members')
    .insert({ club_id: clubId, user_id: userId })
  if (error) throw error
  return { ok: true }
}

export async function leaveClub(clubId, userId) {
  if (!isSupabaseEnabled) return { ok: true, demo: true }
  const { error } = await supabase
    .from('club_members')
    .delete()
    .eq('club_id', clubId)
    .eq('user_id', userId)
  if (error) throw error
  return { ok: true }
}

export async function getProfile(userId) {
  if (!userId) return null
  if (!isSupabaseEnabled) return mock.getProfileById(userId) || null
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data ? normProfile(data) : null
}

// Save the current user's name cosmetics. `patch` uses camelCase keys.
export async function updateMyProfile(userId, patch) {
  if (!isSupabaseEnabled) return { ok: true, demo: true }
  const row = {}
  if ('accent' in patch) row.accent = patch.accent
  if ('nameGradient' in patch) row.name_gradient = patch.nameGradient
  if ('nameEffect' in patch) row.name_effect = patch.nameEffect
  if ('plateFrame' in patch) row.plate_frame = patch.plateFrame
  if ('profileTitle' in patch) row.profile_title = patch.profileTitle
  if ('badges' in patch) row.badges = patch.badges
  if ('displayName' in patch) row.display_name = patch.displayName
  const { error } = await supabase.from('profiles').update(row).eq('id', userId)
  if (error) throw error
  return { ok: true }
}

export { isSupabaseEnabled }
