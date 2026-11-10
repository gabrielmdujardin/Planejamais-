export type GuestStatus =
  | "awaiting_approval"
  | "pending"
  | "confirmed"
  | "declined"
  | "expired"
  | "cancelled"

export type CompanionStatus = "awaiting_approval" | "approved" | "rejected" | "cancelled"
export type GuestSource = "manual" | "public_request" | "public_invite"
export type ItemPaymentStatus = "pending" | "partial" | "paid" | "estimated" | "cancelled"
export type EventFinancialMode = "corporate_budget" | "collaborative_split"

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          phone: string | null
          location: string | null
          avatar: string | null
          calendar_feed_token: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          phone?: string | null
          location?: string | null
          avatar?: string | null
          calendar_feed_token?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          phone?: string | null
          location?: string | null
          avatar?: string | null
          calendar_feed_token?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
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
          status: string
          financial_mode: EventFinancialMode
          image: string | null
          start_date: string | null
          start_time: string | null
          end_date: string | null
          end_time: string | null
          address: string | null
          maps_url: string | null
          event_mode: string
          meeting_url: string | null
          capacity: number | null
          allow_guests: boolean
          confirmed_guests: number
          total_guests: number
          public_invite_token: string | null
          public_invite_enabled: boolean
          host_view_token: string | null
          host_view_enabled: boolean
          auto_approve_public_guests: boolean
          rsvp_deadline: string | null
          allow_companions: boolean
          max_companions: number
          companions_require_approval: boolean
          rsvp_enabled: boolean
          allow_response_edit: boolean
          invitation_message: string | null
          budget_estimated: number | null
          initial_estimated_cost: number | null
          currency: string
          financial_notes: string | null
          visibility: string
          metadata: Json
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
          description?: string
          status?: string
          financial_mode?: EventFinancialMode
          image?: string | null
          start_date?: string | null
          start_time?: string | null
          end_date?: string | null
          end_time?: string | null
          address?: string | null
          maps_url?: string | null
          event_mode?: string
          meeting_url?: string | null
          capacity?: number | null
          allow_guests?: boolean
          confirmed_guests?: number
          total_guests?: number
          public_invite_token?: string | null
          public_invite_enabled?: boolean
          host_view_token?: string | null
          host_view_enabled?: boolean
          auto_approve_public_guests?: boolean
          rsvp_deadline?: string | null
          allow_companions?: boolean
          max_companions?: number
          companions_require_approval?: boolean
          rsvp_enabled?: boolean
          allow_response_edit?: boolean
          invitation_message?: string | null
          budget_estimated?: number | null
          initial_estimated_cost?: number | null
          currency?: string
          financial_notes?: string | null
          visibility?: string
          metadata?: Json
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
          status?: string
          financial_mode?: EventFinancialMode
          image?: string | null
          start_date?: string | null
          start_time?: string | null
          end_date?: string | null
          end_time?: string | null
          address?: string | null
          maps_url?: string | null
          event_mode?: string
          meeting_url?: string | null
          capacity?: number | null
          allow_guests?: boolean
          confirmed_guests?: number
          total_guests?: number
          public_invite_token?: string | null
          public_invite_enabled?: boolean
          host_view_token?: string | null
          host_view_enabled?: boolean
          auto_approve_public_guests?: boolean
          rsvp_deadline?: string | null
          allow_companions?: boolean
          max_companions?: number
          companions_require_approval?: boolean
          rsvp_enabled?: boolean
          allow_response_edit?: boolean
          invitation_message?: string | null
          budget_estimated?: number | null
          initial_estimated_cost?: number | null
          currency?: string
          financial_notes?: string | null
          visibility?: string
          metadata?: Json
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
          metadata: Json
        }
        Insert: {
          id?: string
          event_id: string
          name: string
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
          metadata?: Json
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
          metadata?: Json
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
          metadata: Json
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
          metadata?: Json
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
          metadata?: Json
        }
      }
      items: {
        Row: {
          id: string
          event_id: string
          name: string
          category: string
          supplier: string | null
          price: number
          unit_price: number
          estimated_cost: number
          payment_status: ItemPaymentStatus
          due_date: string | null
          invoice_number: string | null
          description: string | null
          notes: string | null
          image: string | null
          assigned_to: Json | null
          quantity: number
          status: "pending" | "assigned" | "completed"
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          name: string
          category?: string
          supplier?: string | null
          price?: number
          unit_price?: number
          estimated_cost?: number
          payment_status?: ItemPaymentStatus
          due_date?: string | null
          invoice_number?: string | null
          description?: string | null
          notes?: string | null
          image?: string | null
          assigned_to?: Json | null
          quantity?: number
          status?: "pending" | "assigned" | "completed"
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          name?: string
          category?: string
          supplier?: string | null
          price?: number
          unit_price?: number
          estimated_cost?: number
          payment_status?: ItemPaymentStatus
          due_date?: string | null
          invoice_number?: string | null
          description?: string | null
          notes?: string | null
          image?: string | null
          assigned_to?: Json | null
          quantity?: number
          status?: "pending" | "assigned" | "completed"
          metadata?: Json
          created_at?: string
          updated_at?: string
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
          metadata: Json
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
          metadata?: Json
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
          metadata?: Json
        }
      }
      contacts: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string
          phone: string
          tags: string[]
          lists: string[]
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          email?: string
          phone?: string
          tags?: string[]
          lists?: string[]
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string
          phone?: string
          tags?: string[]
          lists?: string[]
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      contact_lists: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string
          color: string
          contacts: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string
          color?: string
          contacts?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string
          color?: string
          contacts?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      job_runs: {
        Row: {
          id: string
          job_name: string
          status: "running" | "completed" | "failed"
          started_at: string
          completed_at: string | null
          duration_ms: number | null
          error_message: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          job_name: string
          status?: "running" | "completed" | "failed"
          started_at?: string
          completed_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          job_name?: string
          status?: "running" | "completed" | "failed"
          started_at?: string
          completed_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          metadata?: Json
          created_at?: string
        }
      }
      job_logs: {
        Row: {
          id: string
          job_run_id: string | null
          level: "info" | "warn" | "error"
          message: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          job_run_id?: string | null
          level?: "info" | "warn" | "error"
          message: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          job_run_id?: string | null
          level?: "info" | "warn" | "error"
          message?: string
          metadata?: Json
          created_at?: string
        }
      }
      stg_event_costs: {
        Row: {
          id: string
          event_id: string | null
          total_cost: number | null
          items_count: number | null
          processed_at: string
        }
        Insert: {
          id?: string
          event_id?: string | null
          total_cost?: number | null
          items_count?: number | null
          processed_at?: string
        }
        Update: {
          id?: string
          event_id?: string | null
          total_cost?: number | null
          items_count?: number | null
          processed_at?: string
        }
      }
      stg_rsvp_stats: {
        Row: {
          id: string
          event_id: string | null
          confirmed_count: number | null
          pending_count: number | null
          declined_count: number | null
          processed_at: string
        }
        Insert: {
          id?: string
          event_id?: string | null
          confirmed_count?: number | null
          pending_count?: number | null
          declined_count?: number | null
          processed_at?: string
        }
        Update: {
          id?: string
          event_id?: string | null
          confirmed_count?: number | null
          pending_count?: number | null
          declined_count?: number | null
          processed_at?: string
        }
      }
      facts_daily_events: {
        Row: {
          date: string
          total_events: number
          total_guests: number
          total_cost: number
          created_at: string
        }
        Insert: {
          date: string
          total_events?: number
          total_guests?: number
          total_cost?: number
          created_at?: string
        }
        Update: {
          date?: string
          total_events?: number
          total_guests?: number
          total_cost?: number
          created_at?: string
        }
      }
    }
    Views: {
      mv_event_costs: {
        Row: {
          id: string
          title: string
          date: string
          total_cost: number
          items_count: number
        }
      }
      mv_rsvp_stats: {
        Row: {
          id: string
          title: string
          date: string
          confirmed_count: number
          pending_count: number
          declined_count: number
          total_guests: number
        }
      }
    }
    Functions: {
      refresh_materialized_view: {
        Args: { view_name: string }
        Returns: undefined
      }
    }
  }
}
