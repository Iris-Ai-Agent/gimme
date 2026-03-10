import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Round, Score, Game, GameResult, RoundPlayer, Course } from '@/types/database'

interface RoundState {
  currentRound: Round | null
  course: Course | null
  players: RoundPlayer[]
  scores: Map<string, Score[]>
  games: Game[]
  results: GameResult[]
  loading: boolean

  createRound: (courseName: string, pars: number[]) => Promise<string>
  joinRound: (roundId: string) => Promise<void>
  loadRound: (roundId: string) => Promise<void>
  postScore: (profileId: string, holeNumber: number, strokes: number) => Promise<void>
  addGame: (format: Game['format'], config: Record<string, unknown>) => Promise<void>
  startRound: () => Promise<void>
  completeRound: () => Promise<void>
  subscribeToRound: (roundId: string) => () => void
}

export const useRound = create<RoundState>((set, get) => ({
  currentRound: null,
  course: null,
  players: [],
  scores: new Map(),
  games: [],
  results: [],
  loading: false,

  createRound: async (courseName, pars) => {
    const { data: course } = await supabase
      .from('courses')
      .insert({ name: courseName, holes: pars.length, par: pars, created_by: '' })
      .select()
      .single()

    if (!course) throw new Error('Failed to create course')

    const { data: round } = await supabase
      .from('rounds')
      .insert({ course_id: course.id, created_by: '', status: 'setup' as const })
      .select()
      .single()

    if (!round) throw new Error('Failed to create round')

    set({ currentRound: round, course })
    return round.id
  },

  joinRound: async (roundId) => {
    await supabase.from('round_players').insert({ round_id: roundId, profile_id: '' })
    await get().loadRound(roundId)
  },

  loadRound: async (roundId) => {
    set({ loading: true })
    const [roundRes, playersRes, scoresRes, gamesRes] = await Promise.all([
      supabase.from('rounds').select('*').eq('id', roundId).single(),
      supabase.from('round_players').select('*').eq('round_id', roundId),
      supabase.from('scores').select('*').eq('round_id', roundId),
      supabase.from('games').select('*').eq('round_id', roundId),
    ])

    const scoreMap = new Map<string, Score[]>()
    scoresRes.data?.forEach((s) => {
      const key = s.profile_id
      const existing = scoreMap.get(key) || []
      existing.push(s)
      scoreMap.set(key, existing)
    })

    if (roundRes.data?.course_id) {
      const { data: course } = await supabase
        .from('courses')
        .select('*')
        .eq('id', roundRes.data.course_id)
        .single()
      set({ course })
    }

    set({
      currentRound: roundRes.data,
      players: playersRes.data || [],
      scores: scoreMap,
      games: gamesRes.data || [],
      loading: false,
    })
  },

  postScore: async (profileId, holeNumber, strokes) => {
    const { currentRound, scores } = get()
    if (!currentRound) return

    const { data } = await supabase
      .from('scores')
      .upsert(
        { round_id: currentRound.id, profile_id: profileId, hole_number: holeNumber, strokes },
        { onConflict: 'round_id,profile_id,hole_number' }
      )
      .select()
      .single()

    if (data) {
      const updated = new Map(scores)
      const playerScores = [...(updated.get(profileId) || [])]
      const idx = playerScores.findIndex((s) => s.hole_number === holeNumber)
      if (idx >= 0) playerScores[idx] = data
      else playerScores.push(data)
      updated.set(profileId, playerScores)
      set({ scores: updated })
    }
  },

  addGame: async (format, config) => {
    const { currentRound } = get()
    if (!currentRound) return
    const { data } = await supabase
      .from('games')
      .insert({ round_id: currentRound.id, format, config, status: 'active' as const })
      .select()
      .single()
    if (data) set({ games: [...get().games, data] })
  },

  startRound: async () => {
    const { currentRound } = get()
    if (!currentRound) return
    const { data } = await supabase
      .from('rounds')
      .update({ status: 'active' as const, started_at: new Date().toISOString() })
      .eq('id', currentRound.id)
      .select()
      .single()
    if (data) set({ currentRound: data })
  },

  completeRound: async () => {
    const { currentRound } = get()
    if (!currentRound) return
    const { data } = await supabase
      .from('rounds')
      .update({ status: 'complete' as const, completed_at: new Date().toISOString() })
      .eq('id', currentRound.id)
      .select()
      .single()
    if (data) set({ currentRound: data })
  },

  subscribeToRound: (roundId) => {
    const channel = supabase
      .channel(`round:${roundId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scores', filter: `round_id=eq.${roundId}` },
        (payload) => {
          const score = payload.new as Score
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
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  },
}))
