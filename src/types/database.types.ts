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
      academic_years: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          updated_at: string
          year_string: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          year_string: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          year_string?: string
        }
        Relationships: []
      }
      admission_sequences: {
        Row: {
          academic_year_id: string
          current_sequence: number
          id: string
          program_id: string
          quota_type: string
        }
        Insert: {
          academic_year_id: string
          current_sequence?: number
          id?: string
          program_id: string
          quota_type: string
        }
        Update: {
          academic_year_id?: string
          current_sequence?: number
          id?: string
          program_id?: string
          quota_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admission_sequences_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admission_sequences_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admission_sequences_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "vw_program_progress"
            referencedColumns: ["program_id"]
          },
          {
            foreignKeyName: "admission_sequences_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "vw_quota_distribution"
            referencedColumns: ["program_id"]
          },
        ]
      }
      applicant_documents: {
        Row: {
          applicant_id: string
          document_master_id: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          applicant_id: string
          document_master_id: string
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          applicant_id?: string
          document_master_id?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applicant_documents_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "applicants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applicant_documents_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "vw_problem_areas"
            referencedColumns: ["applicant_id"]
          },
          {
            foreignKeyName: "applicant_documents_document_master_id_fkey"
            columns: ["document_master_id"]
            isOneToOne: false
            referencedRelation: "document_masters"
            referencedColumns: ["id"]
          },
        ]
      }
      applicant_fees: {
        Row: {
          amount: number
          applicant_id: string
          created_at: string
          id: string
          paid_at: string | null
          status: string
          transaction_ref: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          applicant_id: string
          created_at?: string
          id?: string
          paid_at?: string | null
          status?: string
          transaction_ref?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          applicant_id?: string
          created_at?: string
          id?: string
          paid_at?: string | null
          status?: string
          transaction_ref?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applicant_fees_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "applicants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applicant_fees_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "vw_problem_areas"
            referencedColumns: ["applicant_id"]
          },
        ]
      }
      applicants: {
        Row: {
          admission_number: string | null
          allotment_number: string | null
          application_no: string
          assigned_officer_id: string | null
          campus_id: string | null
          category: string
          course_level: string
          created_at: string
          dob: string
          email: string
          entry_type: string
          full_name: string
          gender: string
          govt_id: string
          id: string
          mobile: string
          percentage: number
          program_id: string
          qualifying_exam: string
          quota_type: string
          status: Database["public"]["Enums"]["applicant_status"]
          subject_combo: string
          updated_at: string
        }
        Insert: {
          admission_number?: string | null
          allotment_number?: string | null
          application_no: string
          assigned_officer_id?: string | null
          campus_id?: string | null
          category: string
          course_level: string
          created_at?: string
          dob: string
          email: string
          entry_type: string
          full_name: string
          gender: string
          govt_id: string
          id?: string
          mobile: string
          percentage: number
          program_id: string
          qualifying_exam: string
          quota_type: string
          status?: Database["public"]["Enums"]["applicant_status"]
          subject_combo: string
          updated_at?: string
        }
        Update: {
          admission_number?: string | null
          allotment_number?: string | null
          application_no?: string
          assigned_officer_id?: string | null
          campus_id?: string | null
          category?: string
          course_level?: string
          created_at?: string
          dob?: string
          email?: string
          entry_type?: string
          full_name?: string
          gender?: string
          govt_id?: string
          id?: string
          mobile?: string
          percentage?: number
          program_id?: string
          qualifying_exam?: string
          quota_type?: string
          status?: Database["public"]["Enums"]["applicant_status"]
          subject_combo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applicants_assigned_officer_id_fkey"
            columns: ["assigned_officer_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applicants_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applicants_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applicants_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "vw_program_progress"
            referencedColumns: ["program_id"]
          },
          {
            foreignKeyName: "applicants_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "vw_quota_distribution"
            referencedColumns: ["program_id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action_type: string
          applicant_id: string
          bottleneck_type: string | null
          created_at: string
          details: Json | null
          id: string
          officer_id: string
        }
        Insert: {
          action_type: string
          applicant_id: string
          bottleneck_type?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          officer_id: string
        }
        Update: {
          action_type?: string
          applicant_id?: string
          bottleneck_type?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          officer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "applicants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "vw_problem_areas"
            referencedColumns: ["applicant_id"]
          },
          {
            foreignKeyName: "audit_logs_officer_id_fkey"
            columns: ["officer_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      campuses: {
        Row: {
          code: string
          contact_email: string | null
          contact_number: string | null
          created_at: string
          id: string
          institution_id: string
          is_active: boolean
          logo_url: string | null
          name: string
          operational_tier: string | null
          physical_address: string | null
          updated_at: string
        }
        Insert: {
          code: string
          contact_email?: string | null
          contact_number?: string | null
          created_at?: string
          id?: string
          institution_id: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          operational_tier?: string | null
          physical_address?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          contact_email?: string | null
          contact_number?: string | null
          created_at?: string
          id?: string
          institution_id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          operational_tier?: string | null
          physical_address?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campuses_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_metric_snapshots: {
        Row: {
          created_at: string
          snapshot_date: string
          total_confirmed: number
          total_leads: number
          total_locked: number
        }
        Insert: {
          created_at?: string
          snapshot_date: string
          total_confirmed?: number
          total_leads?: number
          total_locked?: number
        }
        Update: {
          created_at?: string
          snapshot_date?: string
          total_confirmed?: number
          total_leads?: number
          total_locked?: number
        }
        Relationships: []
      }
      document_masters: {
        Row: {
          course_level_req: string
          created_at: string
          id: string
          is_active: boolean
          is_mandatory: boolean
          name: string
          quota_req: string
          updated_at: string
        }
        Insert: {
          course_level_req: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_mandatory?: boolean
          name: string
          quota_req: string
          updated_at?: string
        }
        Update: {
          course_level_req?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_mandatory?: boolean
          name?: string
          quota_req?: string
          updated_at?: string
        }
        Relationships: []
      }
      institutions: {
        Row: {
          affiliated_university: string | null
          code: string
          contact_email: string | null
          contact_number: string | null
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          operational_tier: string | null
          physical_address: string | null
          updated_at: string
        }
        Insert: {
          affiliated_university?: string | null
          code: string
          contact_email?: string | null
          contact_number?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          operational_tier?: string | null
          physical_address?: string | null
          updated_at?: string
        }
        Update: {
          affiliated_university?: string | null
          code?: string
          contact_email?: string | null
          contact_number?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          operational_tier?: string | null
          physical_address?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notification_reads: {
        Row: {
          notification_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          notification_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          notification_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_reads_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "system_notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_reads_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "vw_my_notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          campus_id: string
          code: string
          course_level: string
          created_at: string
          department_id: string
          entry_type: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          campus_id: string
          code: string
          course_level: string
          created_at?: string
          department_id: string
          entry_type: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          campus_id?: string
          code?: string
          course_level?: string
          created_at?: string
          department_id?: string
          entry_type?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "programs_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programs_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      seat_matrices: {
        Row: {
          academic_year_id: string
          comedk_locked: number
          comedk_quota: number
          created_at: string
          id: string
          kcet_locked: number
          kcet_quota: number
          management_locked: number
          management_quota: number
          program_id: string
          total_intake: number
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          comedk_locked?: number
          comedk_quota?: number
          created_at?: string
          id?: string
          kcet_locked?: number
          kcet_quota?: number
          management_locked?: number
          management_quota?: number
          program_id: string
          total_intake: number
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          comedk_locked?: number
          comedk_quota?: number
          created_at?: string
          id?: string
          kcet_locked?: number
          kcet_quota?: number
          management_locked?: number
          management_quota?: number
          program_id?: string
          total_intake?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seat_matrices_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seat_matrices_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seat_matrices_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "vw_program_progress"
            referencedColumns: ["program_id"]
          },
          {
            foreignKeyName: "seat_matrices_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "vw_quota_distribution"
            referencedColumns: ["program_id"]
          },
        ]
      }
      system_notifications: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          message: string
          target_roles: string[]
          title: string
          type: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          message: string
          target_roles: string[]
          title: string
          type: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          message?: string
          target_roles?: string[]
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          campus_id: string | null
          created_at: string
          dob: string | null
          email: string
          full_name: string
          id: string
          id_number: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
        }
        Insert: {
          campus_id?: string | null
          created_at?: string
          dob?: string | null
          email: string
          full_name: string
          id: string
          id_number?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Update: {
          campus_id?: string | null
          created_at?: string
          dob?: string | null
          email?: string
          full_name?: string
          id?: string
          id_number?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_profiles_campus"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      vw_ai_fee_aging: {
        Row: {
          overdue_0_7_days: number | null
          overdue_30_plus_days: number | null
          overdue_8_30_days: number | null
          total_pending: number | null
        }
        Relationships: []
      }
      vw_funnel_metrics: {
        Row: {
          status_group: string | null
          student_count: number | null
        }
        Relationships: []
      }
      vw_management_kpis: {
        Row: {
          clearance_ratio: number | null
          fee_collection_ratio: number | null
          total_admitted: number | null
          total_capacity: number | null
        }
        Relationships: []
      }
      vw_my_notifications: {
        Row: {
          actor_id: string | null
          created_at: string | null
          id: string | null
          is_read: boolean | null
          message: string | null
          target_roles: string[] | null
          title: string | null
          type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_problem_areas: {
        Row: {
          applicant_id: string | null
          application_no: string | null
          bottleneck_category: string | null
          days_pending: number | null
          full_name: string | null
          mobile: string | null
          program_name: string | null
          quota_type: string | null
          specific_bottleneck_text: string | null
        }
        Relationships: []
      }
      vw_program_progress: {
        Row: {
          academic_year_id: string | null
          campus_id: string | null
          confirmed_seats: number | null
          course_level: string | null
          program_id: string | null
          program_name: string | null
          reserved_seats: number | null
          total_seats: number | null
          vacant_seats: number | null
        }
        Relationships: [
          {
            foreignKeyName: "programs_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seat_matrices_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_quota_distribution: {
        Row: {
          academic_year_id: string | null
          campus_id: string | null
          comedk_filled: number | null
          comedk_quota: number | null
          course_level: string | null
          kcet_filled: number | null
          kcet_quota: number | null
          management_filled: number | null
          management_quota: number | null
          program_id: string | null
          program_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "programs_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seat_matrices_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      confirm_admission: { Args: { p_applicant_id: string }; Returns: Json }
      get_admission_velocity: {
        Args: { p_academic_year_id: string }
        Returns: {
          admission_date: string
          confirmed_count: number
        }[]
      }
      get_dashboard_metrics: {
        Args: {
          p_academic_year_id?: string
          p_campus_id?: string
          p_course_level?: string
        }
        Returns: Json
      }
      global_crm_search: {
        Args: { p_search_query: string }
        Returns: {
          result_id: string
          result_item_type: string
          result_route: string
          result_subtitle: string
          result_title: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_management: { Args: never; Returns: boolean }
      is_officer: { Args: never; Returns: boolean }
      log_officer_action: {
        Args: {
          p_action_type: string
          p_applicant_id: string
          p_bottleneck_type?: string
          p_details?: Json
        }
        Returns: undefined
      }
      mark_all_notifications_read: { Args: never; Returns: undefined }
      mark_notification_read: {
        Args: { p_notification_id: string }
        Returns: undefined
      }
    }
    Enums: {
      applicant_status:
        | "LEAD"
        | "SEAT_LOCKED"
        | "DOCUMENTS_VERIFIED"
        | "FEE_PAID"
        | "CONFIRMED"
        | "WITHDRAWN"
        | "CANCELLED"
      user_role: "ADMIN" | "MANAGEMENT" | "OFFICER"
      user_status: "ACTIVE" | "SUSPENDED"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      applicant_status: [
        "LEAD",
        "SEAT_LOCKED",
        "DOCUMENTS_VERIFIED",
        "FEE_PAID",
        "CONFIRMED",
        "WITHDRAWN",
        "CANCELLED",
      ],
      user_role: ["ADMIN", "MANAGEMENT", "OFFICER"],
      user_status: ["ACTIVE", "SUSPENDED"],
    },
  },
} as const
