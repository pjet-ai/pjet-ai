export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      aircraft: {
        Row: {
          base_location: string | null
          created_at: string
          id: string
          model: string
          registration: string
          serial_number: string | null
          updated_at: string
          user_id: string
          year_manufactured: number | null
        }
        Insert: {
          base_location?: string | null
          created_at?: string
          id?: string
          model: string
          registration: string
          serial_number?: string | null
          updated_at?: string
          user_id: string
          year_manufactured?: number | null
        }
        Update: {
          base_location?: string | null
          created_at?: string
          id?: string
          model?: string
          registration?: string
          serial_number?: string | null
          updated_at?: string
          user_id?: string
          year_manufactured?: number | null
        }
        Relationships: []
      }
      expense_attachments: {
        Row: {
          created_at: string
          expense_id: string
          id: string
          mime_type: string
          original_name: string
          size: number
          url: string
        }
        Insert: {
          created_at?: string
          expense_id: string
          id?: string
          mime_type: string
          original_name: string
          size: number
          url: string
        }
        Update: {
          created_at?: string
          expense_id?: string
          id?: string
          mime_type?: string
          original_name?: string
          size?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_attachments_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          aircraft: string | null
          category: string | null
          created_at: string
          currency: string
          date: string
          flight_no: string | null
          id: string
          invoice_number: string | null
          location: string | null
          notes: string | null
          payment_method: string | null
          status: string
          subtotal: number | null
          tax_total: number | null
          total: number
          updated_at: string
          user_id: string
          vendor: string
        }
        Insert: {
          aircraft?: string | null
          category?: string | null
          created_at?: string
          currency?: string
          date: string
          flight_no?: string | null
          id?: string
          invoice_number?: string | null
          location?: string | null
          notes?: string | null
          payment_method?: string | null
          status?: string
          subtotal?: number | null
          tax_total?: number | null
          total: number
          updated_at?: string
          user_id: string
          vendor: string
        }
        Update: {
          aircraft?: string | null
          category?: string | null
          created_at?: string
          currency?: string
          date?: string
          flight_no?: string | null
          id?: string
          invoice_number?: string | null
          location?: string | null
          notes?: string | null
          payment_method?: string | null
          status?: string
          subtotal?: number | null
          tax_total?: number | null
          total?: number
          updated_at?: string
          user_id?: string
          vendor?: string
        }
        Relationships: []
      }
      maintenance_attachments: {
        Row: {
          id: string
          maintenance_record_id: string
          url: string
          mime_type: string
          original_name: string
          file_size: number
          file_type: string
          uploaded_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          maintenance_record_id: string
          url: string
          mime_type: string
          original_name: string
          file_size: number
          file_type: string
          uploaded_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          maintenance_record_id?: string
          url?: string
          mime_type?: string
          original_name?: string
          file_size?: number
          file_type?: string
          uploaded_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_attachments_maintenance_record_id_fkey"
            columns: ["maintenance_record_id"]
            isOneToOne: false
            referencedRelation: "maintenance_records"
            referencedColumns: ["id"]
          }
        ]
      }
      maintenance_records: {
        Row: {
          id: string
          user_id: string
          aircraft_id: string | null
          invoice_date: string
          vendor_name: string
          vendor_tax_id: string | null
          vendor_address: string | null
          vendor_contact: string | null
          total_amount: number
          currency: string
          subtotal: number | null
          tax_amount: number | null
          tax_rate: number | null
          maintenance_type: string | null
          work_description: string | null
          work_order_number: string | null
          technician_name: string | null
          technician_license: string | null
          aircraft_hours_at_service: number | null
          aircraft_cycles_at_service: number | null
          next_inspection_hours: number | null
          next_inspection_date: string | null
          approved_by: string | null
          approval_date: string | null
          cost_center: string | null
          budget_code: string | null
          payment_method: string | null
          payment_reference: string | null
          payment_status: string
          service_location: string | null
          airport_code: string | null
          flight_number: string | null
          compliance_standard: string | null
          regulatory_reference: string | null
          warranty_period: number | null
          warranty_expiry_date: string | null
          notes: string | null
          internal_notes: string | null
          status: string
          created_at: string
          updated_at: string
          created_by: string | null
          last_modified_by: string | null
        }
        Insert: {
          id?: string
          user_id: string
          aircraft_id?: string | null
          invoice_date: string
          vendor_name: string
          vendor_tax_id?: string | null
          vendor_address?: string | null
          vendor_contact?: string | null
          total_amount: number
          currency: string
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          maintenance_type?: string | null
          work_description?: string | null
          work_order_number?: string | null
          technician_name?: string | null
          technician_license?: string | null
          aircraft_hours_at_service?: number | null
          aircraft_cycles_at_service?: number | null
          next_inspection_hours?: number | null
          next_inspection_date?: string | null
          approved_by?: string | null
          approval_date?: string | null
          cost_center?: string | null
          budget_code?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string
          service_location?: string | null
          airport_code?: string | null
          flight_number?: string | null
          compliance_standard?: string | null
          regulatory_reference?: string | null
          warranty_period?: number | null
          warranty_expiry_date?: string | null
          notes?: string | null
          internal_notes?: string | null
          status?: string
          created_at?: string
          updated_at?: string
          created_by?: string | null
          last_modified_by?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          aircraft_id?: string | null
          invoice_date?: string
          vendor_name?: string
          vendor_tax_id?: string | null
          vendor_address?: string | null
          vendor_contact?: string | null
          total_amount?: number
          currency?: string
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          maintenance_type?: string | null
          work_description?: string | null
          work_order_number?: string | null
          technician_name?: string | null
          technician_license?: string | null
          aircraft_hours_at_service?: number | null
          aircraft_cycles_at_service?: number | null
          next_inspection_hours?: number | null
          next_inspection_date?: string | null
          approved_by?: string | null
          approval_date?: string | null
          cost_center?: string | null
          budget_code?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string
          service_location?: string | null
          airport_code?: string | null
          flight_number?: string | null
          compliance_standard?: string | null
          regulatory_reference?: string | null
          warranty_period?: number | null
          warranty_expiry_date?: string | null
          notes?: string | null
          internal_notes?: string | null
          status?: string
          created_at?: string
          updated_at?: string
          created_by?: string | null
          last_modified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_records_aircraft_id_fkey"
            columns: ["aircraft_id"]
            isOneToOne: false
            referencedRelation: "aircraft"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          }
        ]
      }
      operations: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          operation_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          operation_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          operation_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          license_number: string | null
          license_type: string | null
          onboarding_completed: boolean
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          license_number?: string | null
          license_type?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          license_number?: string | null
          license_type?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
