import { createClient as createSupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey)

export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}

export type Database = {
  public: {
    Tables: {
      events: {
        Row: {
          id: string
          title: string
          date: string
          time: string
          location: string
          description: string
          type: string
          status: "confirmed" | "pending" | "cancelled"
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          title: string
          date: string
          time: string
          location: string
          description: string
          type: string
          status?: "confirmed" | "pending" | "cancelled"
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          title?: string
          date?: string
          time?: string
          location?: string
          description?: string
          type?: string
          status?: "confirmed" | "pending" | "cancelled"
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
    }
  }
}
