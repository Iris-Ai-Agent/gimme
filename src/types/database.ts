export type GameFormat = 'nassau' | 'skins' | 'wolf' | 'bingo_bango_bongo'
export type RoundStatus = 'setup' | 'active' | 'complete'
export type GameStatus = 'active' | 'complete'
export type SettlementStatus = 'pending' | 'settled'

export interface Profile {
  id: string
  display_name: string
  avatar_url: string | null
  handicap_index: number | null
  venmo_handle: string | null
  cashapp_handle: string | null
  created_at: string
}

export interface Crew {
  id: string
  name: string
  created_by: string
  invite_code: string
  created_at: string
}

export interface CrewMember {
  crew_id: string
  profile_id: string
  joined_at: string
}

export interface Course {
  id: string
  name: string
  holes: number
  par: number[]
  created_by: string
}

export interface Round {
  id: string
  course_id: string
  crew_id: string | null
  created_by: string
  status: RoundStatus
  started_at: string | null
  completed_at: string | null
  created_at: string
}

export interface RoundPlayer {
  round_id: string
  profile_id: string
  tee_set: string | null
  handicap_at_time: number | null
}

export interface Score {
  id: string
  round_id: string
  profile_id: string
  hole_number: number
  strokes: number
  updated_at: string
}

export interface Game {
  id: string
  round_id: string
  format: GameFormat
  config: Record<string, unknown>
  status: GameStatus
}

export interface GameResult {
  game_id: string
  profile_id: string
  net_amount: number
  details: Record<string, unknown>
}

export interface Settlement {
  id: string
  round_id: string
  payer_id: string
  payee_id: string
  amount: number
  status: SettlementStatus
  settled_at: string | null
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile> & { id: string }; Update: Partial<Profile> }
      crews: { Row: Crew; Insert: Omit<Crew, 'id' | 'created_at'>; Update: Partial<Crew> }
      crew_members: { Row: CrewMember; Insert: CrewMember; Update: Partial<CrewMember> }
      courses: { Row: Course; Insert: Omit<Course, 'id'>; Update: Partial<Course> }
      rounds: { Row: Round; Insert: Omit<Round, 'id' | 'created_at'>; Update: Partial<Round> }
      round_players: { Row: RoundPlayer; Insert: RoundPlayer; Update: Partial<RoundPlayer> }
      scores: { Row: Score; Insert: Omit<Score, 'id' | 'updated_at'>; Update: Partial<Score> }
      games: { Row: Game; Insert: Omit<Game, 'id'>; Update: Partial<Game> }
      game_results: { Row: GameResult; Insert: GameResult; Update: Partial<GameResult> }
      settlements: { Row: Settlement; Insert: Omit<Settlement, 'id'>; Update: Partial<Settlement> }
    }
  }
}
