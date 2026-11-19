import { createLocalPgClient } from "./db/pg-client.ts"

export const supabase = createLocalPgClient({ role: "authenticated" })

export function createClient() {
  return createLocalPgClient({ role: "authenticated" })
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
