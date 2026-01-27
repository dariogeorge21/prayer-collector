export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string | null
          is_admin: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          is_admin?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          is_admin?: boolean
          created_at?: string
        }
        Relationships: []
      }
      daily_entries: {
        Row: {
          id: string
          user_id: string
          entry_date: string
          rosary_completed: boolean
          holy_mass_attended: boolean
          prayer_time_minutes: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          entry_date: string
          rosary_completed?: boolean
          holy_mass_attended?: boolean
          prayer_time_minutes?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          entry_date?: string
          rosary_completed?: boolean
          holy_mass_attended?: boolean
          prayer_time_minutes?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_entries_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      leaderboard_stats: {
        Row: {
          user_id: string
          name: string
          total_days_logged: number
          rosary_days: number
          mass_days: number
          total_prayer_minutes: number
          avg_prayer_minutes: number
          total_score: number
          last_activity_date: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_or_create_daily_entry: {
        Args: {
          p_user_id: string
          p_date?: string
        }
        Returns: Database['public']['Tables']['daily_entries']['Row']
      }
      get_user_streak: {
        Args: {
          p_user_id: string
        }
        Returns: number
      }
      calculate_user_streak: {
        Args: {
          p_user_id: string
        }
        Returns: number
      }
      get_leaderboard_with_streaks: {
        Args: Record<string, never>
        Returns: {
          user_id: string
          name: string
          total_days_logged: number
          rosary_days: number
          mass_days: number
          total_prayer_minutes: number
          avg_prayer_minutes: number
          total_score: number
          last_activity_date: string | null
          current_streak: number
          rank: number
        }[]
      }
    }
    Enums: {}
    CompositeTypes: {}
  }
}

// Convenience types
export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']

export type DailyEntry = Database['public']['Tables']['daily_entries']['Row']
export type DailyEntryInsert = Database['public']['Tables']['daily_entries']['Insert']
export type DailyEntryUpdate = Database['public']['Tables']['daily_entries']['Update']

export type LeaderboardStats = Database['public']['Views']['leaderboard_stats']['Row']
