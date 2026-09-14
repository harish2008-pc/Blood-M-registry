export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      contact_reveals: {
        Row: {
          created_at: string
          donor_id: string
          id: string
          revealed_by: string | null
        }
        Insert: {
          created_at?: string
          donor_id: string
          id?: string
          revealed_by?: string | null
        }
        Update: {
          created_at?: string
          donor_id?: string
          id?: string
          revealed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_reveals_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "donors"
            referencedColumns: ["id"]
          },
        ]
      }
      donor_reports: {
        Row: {
          admin_notes: string | null
          created_at: string
          details: string | null
          donor_id: string
          id: string
          reason: string
          reporter_id: string | null
          resolved: boolean
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["report_status"]
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          details?: string | null
          donor_id: string
          id?: string
          reason: string
          reporter_id?: string | null
          resolved?: boolean
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          details?: string | null
          donor_id?: string
          id?: string
          reason?: string
          reporter_id?: string | null
          resolved?: boolean
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "donor_reports_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "donors"
            referencedColumns: ["id"]
          },
        ]
      }
      donors: {
        Row: {
          active: boolean
          availability: Database["public"]["Enums"]["availability_status"]
          blood_group: Database["public"]["Enums"]["blood_group"]
          city: string
          consent_given: boolean
          contact_number: string
          created_at: string
          email: string | null
          emergency_contact_ok: boolean
          full_name: string
          id: string
          is_demo: boolean
          last_donation_date: string | null
          locality: string
          notes: string | null
          updated_at: string
          user_id: string | null
          verified: boolean
        }
        Insert: {
          active?: boolean
          availability?: Database["public"]["Enums"]["availability_status"]
          blood_group: Database["public"]["Enums"]["blood_group"]
          city: string
          consent_given?: boolean
          contact_number: string
          created_at?: string
          email?: string | null
          emergency_contact_ok?: boolean
          full_name: string
          id?: string
          is_demo?: boolean
          last_donation_date?: string | null
          locality: string
          notes?: string | null
          updated_at?: string
          user_id?: string | null
          verified?: boolean
        }
        Update: {
          active?: boolean
          availability?: Database["public"]["Enums"]["availability_status"]
          blood_group?: Database["public"]["Enums"]["blood_group"]
          city?: string
          consent_given?: boolean
          contact_number?: string
          created_at?: string
          email?: string | null
          emergency_contact_ok?: boolean
          full_name?: string
          id?: string
          is_demo?: boolean
          last_donation_date?: string | null
          locality?: string
          notes?: string | null
          updated_at?: string
          user_id?: string | null
          verified?: boolean
        }
        Relationships: []
      }
      report_events: {
        Row: {
          actor_id: string | null
          created_at: string
          from_status: Database["public"]["Enums"]["report_status"] | null
          id: string
          note: string | null
          report_id: string
          to_status: Database["public"]["Enums"]["report_status"]
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["report_status"] | null
          id?: string
          note?: string | null
          report_id: string
          to_status: Database["public"]["Enums"]["report_status"]
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["report_status"] | null
          id?: string
          note?: string | null
          report_id?: string
          to_status?: Database["public"]["Enums"]["report_status"]
        }
        Relationships: [
          {
            foreignKeyName: "report_events_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "donor_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bootstrap_admin: { Args: never; Returns: boolean }
      get_donor_public: {
        Args: { p_id: string }
        Returns: {
          availability: Database["public"]["Enums"]["availability_status"]
          blood_group: Database["public"]["Enums"]["blood_group"]
          city: string
          display_name: string
          emergency_contact_ok: boolean
          id: string
          is_demo: boolean
          last_donation_date: string
          locality: string
          verified: boolean
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      reveal_donor_contact: {
        Args: { p_donor_id: string }
        Returns: {
          contact_number: string
          email: string
          emergency_contact_ok: boolean
          full_name: string
        }[]
      }
      review_report: {
        Args: {
          p_note?: string
          p_report_id: string
          p_status: Database["public"]["Enums"]["report_status"]
        }
        Returns: undefined
      }
      search_donors: {
        Args: {
          p_availability?: string
          p_blood_group?: string
          p_city?: string
          p_locality?: string
        }
        Returns: {
          availability: Database["public"]["Enums"]["availability_status"]
          blood_group: Database["public"]["Enums"]["blood_group"]
          city: string
          display_name: string
          id: string
          is_demo: boolean
          last_donation_date: string
          locality: string
          verified: boolean
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "donor"
      availability_status: "available" | "unavailable"
      blood_group: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-"
      report_status: "open" | "in_review" | "action_taken" | "dismissed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "donor"],
      availability_status: ["available", "unavailable"],
      blood_group: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      report_status: ["open", "in_review", "action_taken", "dismissed"],
    },
  },
} as const
