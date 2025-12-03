export type Database = {
  public: {
    Tables: {
      events: {
        Row: {
          id: string
          title: string
          type: string
          category: string | null
          date: string
          time: string
          full_date: string | null
          location: string
          description: string
          confirmed_guests: number
          total_guests: number
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          title: string
          type: string
          category?: string | null
          date: string
          time: string
          full_date?: string | null
          location: string
          description: string
          confirmed_guests?: number
          total_guests?: number
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          title?: string
          type?: string
          category?: string | null
          date?: string
          time?: string
          full_date?: string | null
          location?: string
          description?: string
          confirmed_guests?: number
          total_guests?: number
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
      guests: {
        Row: {
          id: string
          event_id: string
          name: string
          email: string
          phone: string
          status: "confirmed" | "pending" | "declined"
          contact_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          name: string
          email: string
          phone: string
          status?: "confirmed" | "pending" | "declined"
          contact_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          name?: string
          email?: string
          phone?: string
          status?: "confirmed" | "pending" | "declined"
          contact_id?: string | null
          created_at?: string
        }
      }
      items: {
        Row: {
          id: string
          event_id: string
          name: string
          price: number
          image: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          name: string
          price: number
          image?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          name?: string
          price?: number
          image?: string | null
          created_at?: string
        }
      }
      event_photos: {
        Row: {
          id: string
          event_id: string
          url: string
          filename: string
          uploaded_by: string
          uploaded_at: string
          description: string | null
          tags: string[] | null
        }
        Insert: {
          id?: string
          event_id: string
          url: string
          filename: string
          uploaded_by: string
          uploaded_at?: string
          description?: string | null
          tags?: string[] | null
        }
        Update: {
          id?: string
          event_id?: string
          url?: string
          filename?: string
          uploaded_by?: string
          uploaded_at?: string
          description?: string | null
          tags?: string[] | null
        }
      }
    }
  }
}
