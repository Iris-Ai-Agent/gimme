import { create } from 'zustand'
import { supabase, db } from '@/lib/supabase'
import { getErrorMessage } from '@/lib/utils'
import { toast } from '@/components/ui/Toast'
import { getPendingScores, addPendingScore, removePendingScore } from '@/lib/offline-queue'
import { useAuth } from './auth'
import type { Round, Score, Game, GameResult, RoundPlayer, Course, Profile, GameFormat } from '@/types/database'

interface RoundState {
  currentRound: Round | null
  course: Course | null
  players: RoundPlayer[]
  playerProfiles: Profile[]
  scores: Map<string, Score[]>
  games: Game[]
  results: GameResult[]
  loading: boolean
  error: string | null
  pendingCount: number

  createRound: (opts: {
    courseName: string
    pars: number[]
    games: Array<{ format: GameFormat; config: Record<string, unknown> }>
  }) => Promise<string>
  joinRound: (inviteCode: string) => Promise<string>
  loadRound: (roundId: string) => Promise<void>
  postScore: (profileId: string, holeNumber: number, strokes: number) => Promise<void>
  startRound: () => Promise<void>
  completeRound: () => Promise<void>
  subscribeToRound: (roundId: string) => () => void
  syncPendingScores: () => Promise<void>
  reset: () => void
}

export const useRound = create<RoundState>((set, get) => ({
  currentRound: null,
  course: null,
  players: [],
  playerProfiles: [],
  scores: new Map(),
  games: [],
  results: [],
  loading: false,
  error: null,
  pendingCount: getPendingScores().length,

  createRound: async ({ courseName, pars, games: gameDefs }) => {
    set({ loading: true, error: null })
    try {
      const user = useAuth.getState().user
      if (!user) throw new Error('You must be signed in to create a round')



      // 1. Create course
      const { data: course, error: courseErr } = await db
        .from('courses')
        .insert({ name: courseName, holes: pars.length, par: pars, created_by: user.id })
        .select()
        .single()
      if (courseErr || !course) throw new Error(courseErr?.message || 'Failed to create course')

      // 2. Create round
      const { data: round, error: roundErr } = await db
        .from('rounds')
        .insert({
          course_id: course.id,
          created_by: user.id,
          status: 'active',
          started_at: new Date().toISOString(),
        })
        .select()
        .single()
      if (roundErr || !round) throw new Error(roundErr?.message || 'Failed to create round')

      // 3. Add creator as player, games, and fetch profile in parallel
      const [rpRes, , profileRes] = await Promise.all([
        db
          .from('round_players')
          .insert({ round_id: round.id, profile_id: user.id }),
        gameDefs.length > 0
          ? db.from('games').insert(
              gameDefs.map((g: any) => ({ round_id: round.id, format: g.format, config: g.config, status: 'active' }))
            )
          : Promise.resolve({ error: null }),
        db
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single(),
      ])
      if (rpRes.error) throw new Error(rpRes.error.message)
      const creatorProfile = profileRes.data

      set({
        currentRound: round,
        course,
        players: [{ round_id: round.id, profile_id: user.id, tee_set: null, handicap_at_time: null }],
        playerProfiles: creatorProfile ? [creatorProfile] : [],
        scores: new Map(),
        games: [],
        results: [],
        loading: false,
      })

      return round.id
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to create round')
      set({ error: msg, loading: false })
      throw err
    }
  },

  joinRound: async (inviteCode: string) => {
    set({ loading: true, error: null })
    try {
      const user = useAuth.getState().user
      if (!user) throw new Error('You must be signed in to join a round')

      const { data: roundId, error: rpcErr } = await (db)
        .rpc('join_round_by_invite_code', { code: inviteCode.trim().toLowerCase() })
      if (rpcErr || !roundId) throw new Error(rpcErr?.message || 'Round not found. Check the invite code.')

      await get().loadRound(roundId)
      return roundId
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to join round')
      set({ error: msg, loading: false })
      throw err
    }
  },

  loadRound: async (roundId) => {
    set({ loading: true, error: null })
    try {

      const [roundRes, playersRes, scoresRes, gamesRes] = await Promise.all([
        db.from('rounds').select('*, courses(*)').eq('id', roundId).single(),
        db.from('round_players').select('round_id, profile_id, tee_set, handicap_at_time').eq('round_id', roundId),
        db.from('scores').select('id, round_id, profile_id, hole_number, strokes, updated_at').eq('round_id', roundId),
        db.from('games').select('id, round_id, format, config, status').eq('round_id', roundId),
      ])

      if (roundRes.error) throw new Error(roundRes.error.message)

      const scoreMap = new Map<string, Score[]>()
      scoresRes.data?.forEach((s: any) => {
        const existing = scoreMap.get(s.profile_id) || []
        existing.push(s)
        scoreMap.set(s.profile_id, existing)
      })

      // Extract inline course from join, then fetch profiles and game results concurrently
      const { courses: inlineCourse, ...roundData } = roundRes.data as (Round & { courses: Course | null })
      const course = inlineCourse || null

      const playerIds = (playersRes.data || []).map((p: any) => p.profile_id)
      const gameIds = (gamesRes.data || []).map((g: any) => g.id)

      const [profilesRes, resultsRes] = await Promise.all([
        playerIds.length > 0
          ? db.from('profiles').select('id, display_name, avatar_url, handicap_index, venmo_handle, cashapp_handle, created_at').in('id', playerIds)
          : Promise.resolve({ data: [] as Profile[] }),
        gameIds.length > 0
          ? db.from('game_results').select('game_id, profile_id, net_amount, details').in('game_id', gameIds)
          : Promise.resolve({ data: [] as GameResult[] }),
      ])

      const playerProfiles = (profilesRes.data as Profile[] | null) || []
      const results = (resultsRes.data as GameResult[] | null) || []

      set({
        currentRound: roundData,
        course,
        players: playersRes.data || [],
        playerProfiles,
        scores: scoreMap,
        games: gamesRes.data || [],
        results,
        loading: false,
      })
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to load round')
      set({ error: msg, loading: false })
    }
  },

  postScore: async (profileId, holeNumber, strokes) => {
    const { currentRound, scores } = get()
    if (!currentRound) return

    // Optimistic update
    const updated = new Map(scores)
    const playerScores = [...(updated.get(profileId) || [])]
    const optimisticScore: Score = {
      id: `optimistic-${profileId}-${holeNumber}`,
      round_id: currentRound.id,
      profile_id: profileId,
      hole_number: holeNumber,
      strokes,
      updated_at: new Date().toISOString(),
    }
    const idx = playerScores.findIndex((s) => s.hole_number === holeNumber)
    if (idx >= 0) playerScores[idx] = optimisticScore
    else playerScores.push(optimisticScore)
    updated.set(profileId, playerScores)
    set({ scores: updated })

    try {
      const { error } = await (db)
        .from('scores')
        .upsert({
          round_id: currentRound.id,
          profile_id: profileId,
          hole_number: holeNumber,
          strokes,
        }, { onConflict: 'round_id,profile_id,hole_number' })

      if (error) throw error
    } catch {
      // Network or server failure — save to offline queue, keep optimistic state
      addPendingScore({
        roundId: currentRound.id,
        profileId,
        holeNumber,
        strokes,
        timestamp: Date.now(),
      })
      set({ pendingCount: getPendingScores().length })
      toast('info', 'Score saved offline \u2014 will sync when connected')
    }
  },

  startRound: async () => {
    const { currentRound } = get()
    if (!currentRound) return
    const { data } = await (db)
      .from('rounds')
      .update({ status: 'active', started_at: new Date().toISOString() })
      .eq('id', currentRound.id)
      .select()
      .single()
    if (data) set({ currentRound: data })
  },

  completeRound: async () => {
    const { currentRound } = get()
    if (!currentRound) return
    const { data } = await (db)
      .from('rounds')
      .update({ status: 'complete', completed_at: new Date().toISOString() })
      .eq('id', currentRound.id)
      .select()
      .single()
    if (data) set({ currentRound: data })
  },

  subscribeToRound: (roundId) => {
    const currentUserId = useAuth.getState().user?.id ?? null

    let reconnectAttempts = 0
    const MAX_RECONNECT_ATTEMPTS = 3

    const channel = supabase
      .channel(`round:${roundId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scores', filter: `round_id=eq.${roundId}` },
        (payload) => {
          const score = payload.new as Score
          if (score.profile_id === currentUserId) return
          const { scores } = get()
          const updated = new Map(scores)
          const playerScores = [...(updated.get(score.profile_id) || [])]
          const idx = playerScores.findIndex((s) => s.hole_number === score.hole_number)
          if (idx >= 0) playerScores[idx] = score
          else playerScores.push(score)
          updated.set(score.profile_id, playerScores)
          set({ scores: updated })
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          reconnectAttempts++
          if (reconnectAttempts <= MAX_RECONNECT_ATTEMPTS) {
            // Reconcile state on reconnection by reloading round data
            get().loadRound(roundId)
          }
        } else if (status === 'SUBSCRIBED') {
          // Reset counter on successful subscription
          if (reconnectAttempts > 0) {
            // Reconcile state after reconnection
            get().loadRound(roundId)
          }
          reconnectAttempts = 0
        }
      })

    return () => { supabase.removeChannel(channel) }
  },

  syncPendingScores: async () => {
    if (!navigator.onLine) return
    const pending = getPendingScores()
    if (!pending.length) return
    for (const score of pending) {
      const { error } = await (db).from('scores').upsert({
        round_id: score.roundId,
        profile_id: score.profileId,
        hole_number: score.holeNumber,
        strokes: score.strokes,
      }, { onConflict: 'round_id,profile_id,hole_number' })
      if (!error) removePendingScore(score)
    }
    set({ pendingCount: getPendingScores().length })
  },

  reset: () => {
    set({
      currentRound: null,
      course: null,
      players: [],
      playerProfiles: [],
      scores: new Map(),
      games: [],
      results: [],
      loading: false,
      error: null,
      pendingCount: 0,
    })
  },
}))
