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
  invite_code: string
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

export interface RoundWithCourse extends Round {
  courses: Course
}

export interface RoundWithGames extends RoundWithCourse {
  games?: { format: GameFormat }[]
}

export const FORMAT_LABELS: Record<GameFormat, string> = {
  skins: 'Skins',
  nassau: 'Nassau',
  wolf: 'Wolf',
  bingo_bango_bongo: 'BBB',
}

export interface Settlement {
  id: string
  round_id: string
  payer_id: string
  payee_id: string
  amount: number
  status: SettlementStatus
  settled_at: string | null
  created_at: string
}

interface Rel {
  foreignKeyName: string
  columns: string[]
  isOneToOne?: boolean
  referencedRelation: string
  referencedColumns: string[]
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Partial<Profile> & { id: string }
        Update: Partial<Profile>
        Relationships: Rel[]
      }
      crews: {
        Row: Crew
        Insert: Partial<Crew> & { name: string; created_by: string }
        Update: Partial<Crew>
        Relationships: Rel[]
      }
      crew_members: {
        Row: CrewMember
        Insert: Partial<CrewMember> & { crew_id: string; profile_id: string }
        Update: Partial<CrewMember>
        Relationships: Rel[]
      }
      courses: {
        Row: Course
        Insert: Partial<Course> & { name: string; holes: number; par: number[]; created_by: string }
        Update: Partial<Course>
        Relationships: Rel[]
      }
      rounds: {
        Row: Round
        Insert: Partial<Round> & { course_id: string; created_by: string; status: RoundStatus }
        Update: Partial<Round>
        Relationships: Rel[]
      }
      round_players: {
        Row: RoundPlayer
        Insert: Partial<RoundPlayer> & { round_id: string; profile_id: string }
        Update: Partial<RoundPlayer>
        Relationships: Rel[]
      }
      scores: {
        Row: Score
        Insert: Partial<Score> & { round_id: string; profile_id: string; hole_number: number; strokes: number }
        Update: Partial<Score>
        Relationships: Rel[]
      }
      games: {
        Row: Game
        Insert: Partial<Game> & { round_id: string; format: GameFormat; config: Record<string, unknown>; status: GameStatus }
        Update: Partial<Game>
        Relationships: Rel[]
      }
      game_results: {
        Row: GameResult
        Insert: Partial<GameResult> & { game_id: string; profile_id: string }
        Update: Partial<GameResult>
        Relationships: Rel[]
      }
      settlements: {
        Row: Settlement
        Insert: Partial<Settlement> & { round_id: string; payer_id: string; payee_id: string; amount: number }
        Update: Partial<Settlement>
        Relationships: Rel[]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      join_round_by_invite_code: {
        Args: { code: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
