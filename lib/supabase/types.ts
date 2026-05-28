export type GuestStatus = 
  | "awaiting_approval" 
  | "pending" 
  | "confirmed" 
  | "declined" 
  | "expired" 
  | "cancelled"

export type CompanionStatus = "awaiting_approval" | "approved" | "rejected" | "cancelled"
export type GuestSource = "manual" | "public_request" | "public_invite"

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
          public_invite_token: string | null
          public_invite_enabled: boolean
          auto_approve_public_guests: boolean
          rsvp_deadline: string | null
          allow_companions: boolean
          max_companions: number
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
          public_invite_token?: string | null
          public_invite_enabled?: boolean
          auto_approve_public_guests?: boolean
          rsvp_deadline?: string | null
          allow_companions?: boolean
          max_companions?: number
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
          public_invite_token?: string | null
          public_invite_enabled?: boolean
          auto_approve_public_guests?: boolean
          rsvp_deadline?: string | null
          allow_companions?: boolean
          max_companions?: number
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
          status: GuestStatus
          contact_id: string | null
          token: string | null
          created_at: string
          updated_at: string
          // New fields for approval flow
          confirmation_token: string | null
          confirmation_deadline: string | null
          token_expires_at: string | null
          invite_sent_at: string | null
          sent_at: string | null
          responded_at: string | null
          notes: string | null
          dietary_restrictions: string | null
          accessibility_needs: string | null
          requested_companions_count: number
          approved_companions: string[] | null
          rejected_companions: string[] | null
          approval_message: string | null
          source: GuestSource
          requested_at: string | null
          approved_at: string | null
          approved_by: string | null
          rejected_at: string | null
          rejection_reason: string | null
          confirmed_at: string | null
          declined_at: string | null
        }
        Insert: {
          id?: string
          event_id: string
          name: string
          email: string
          phone: string
          status?: GuestStatus
          contact_id?: string | null
          token?: string | null
          created_at?: string
          updated_at?: string
          confirmation_token?: string | null
          confirmation_deadline?: string | null
          token_expires_at?: string | null
          invite_sent_at?: string | null
          sent_at?: string | null
          responded_at?: string | null
          notes?: string | null
          dietary_restrictions?: string | null
          accessibility_needs?: string | null
          requested_companions_count?: number
          approved_companions?: string[] | null
          rejected_companions?: string[] | null
          approval_message?: string | null
          source?: GuestSource
          requested_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          confirmed_at?: string | null
          declined_at?: string | null
        }
        Update: {
          id?: string
          event_id?: string
          name?: string
          email?: string
          phone?: string
          status?: GuestStatus
          contact_id?: string | null
          token?: string | null
          created_at?: string
          updated_at?: string
          confirmation_token?: string | null
          confirmation_deadline?: string | null
          token_expires_at?: string | null
          invite_sent_at?: string | null
          sent_at?: string | null
          responded_at?: string | null
          notes?: string | null
          dietary_restrictions?: string | null
          accessibility_needs?: string | null
          requested_companions_count?: number
          approved_companions?: string[] | null
          rejected_companions?: string[] | null
          approval_message?: string | null
          source?: GuestSource
          requested_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          confirmed_at?: string | null
          declined_at?: string | null
        }
      }
      guest_companions: {
        Row: {
          id: string
          guest_id: string
          name: string
          email: string | null
          phone: string | null
          notes: string | null
          status: CompanionStatus
          created_at: string
          updated_at: string
          approved_at: string | null
          approved_by: string | null
          rejected_at: string | null
          rejection_reason: string | null
        }
        Insert: {
          id?: string
          guest_id: string
          name: string
          email?: string | null
          phone?: string | null
          notes?: string | null
          status?: CompanionStatus
          created_at?: string
          updated_at?: string
          approved_at?: string | null
          approved_by?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
        }
        Update: {
          id?: string
          guest_id?: string
          name?: string
          email?: string | null
          phone?: string | null
          notes?: string | null
          status?: CompanionStatus
          created_at?: string
          updated_at?: string
          approved_at?: string | null
          approved_by?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
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
