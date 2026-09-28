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
      agenda_presets: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          icon: string
          icon_image_url: string | null
          id: string
          label: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string
          icon_image_url?: string | null
          id?: string
          label: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string
          icon_image_url?: string | null
          id?: string
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json
          entity_id: string | null
          entity_type: string | null
          event_id: string | null
          id: string
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string | null
          event_id?: string | null
          id?: string
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string | null
          event_id?: string | null
          id?: string
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      event_customers: {
        Row: {
          created_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_customers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_line_items: {
        Row: {
          created_at: string
          description: string
          event_id: string
          id: string
          position: number
          quantity: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          event_id: string
          id?: string
          position?: number
          quantity?: number
          unit_price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          event_id?: string
          id?: string
          position?: number
          quantity?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_line_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          event_id: string
          id: string
          method: string | null
          note: string | null
          paid_at: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          event_id: string
          id?: string
          method?: string | null
          note?: string | null
          paid_at?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          event_id?: string
          id?: string
          method?: string | null
          note?: string | null
          paid_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_payments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          access_ends_at: string | null
          access_starts_at: string | null
          agenda_days: Json
          agenda_view_style: string
          apologies_message: string | null
          body_font: string | null
          bride_name: string | null
          ceremony_time: string | null
          contact_phone: string | null
          contacts: Json
          countdown_message: string | null
          cover_background_url: string | null
          cover_image_url: string | null
          cover_message: string | null
          cover_music_url: string | null
          created_at: string
          description: string | null
          dress_code: string | null
          event_date: string | null
          frame_type: string
          frame_url: string | null
          gallery_layout: string
          gallery_urls: string[] | null
          groom_name: string | null
          id: string
          internal_title: string | null
          invite_background_url: string | null
          letter_bg_color: string | null
          letter_bg_opacity: number | null
          map_embed: string | null
          map_image_url: string | null
          max_guests: number | null
          open_button_color: string | null
          owner_id: string | null
          paid_amount: number
          payment_status: string
          price_currency: string
          price_total: number
          qr_account_name: string | null
          qr_code_message: string | null
          qr_code_url: string | null
          reception_time: string | null
          section_visibility: Json
          share_preview_index: number | null
          slug: string
          template: string
          text_color_accent: string | null
          text_color_primary: string | null
          text_effect_config: Json
          text_shadow_enabled: boolean | null
          thank_you_message: string | null
          title: string
          updated_at: string
          venue: string | null
        }
        Insert: {
          access_ends_at?: string | null
          access_starts_at?: string | null
          agenda_days?: Json
          agenda_view_style?: string
          apologies_message?: string | null
          body_font?: string | null
          bride_name?: string | null
          ceremony_time?: string | null
          contact_phone?: string | null
          contacts?: Json
          countdown_message?: string | null
          cover_background_url?: string | null
          cover_image_url?: string | null
          cover_message?: string | null
          cover_music_url?: string | null
          created_at?: string
          description?: string | null
          dress_code?: string | null
          event_date?: string | null
          frame_type?: string
          frame_url?: string | null
          gallery_layout?: string
          gallery_urls?: string[] | null
          groom_name?: string | null
          id?: string
          internal_title?: string | null
          invite_background_url?: string | null
          letter_bg_color?: string | null
          letter_bg_opacity?: number | null
          map_embed?: string | null
          map_image_url?: string | null
          max_guests?: number | null
          open_button_color?: string | null
          owner_id?: string | null
          paid_amount?: number
          payment_status?: string
          price_currency?: string
          price_total?: number
          qr_account_name?: string | null
          qr_code_message?: string | null
          qr_code_url?: string | null
          reception_time?: string | null
          section_visibility?: Json
          share_preview_index?: number | null
          slug: string
          template?: string
          text_color_accent?: string | null
          text_color_primary?: string | null
          text_effect_config?: Json
          text_shadow_enabled?: boolean | null
          thank_you_message?: string | null
          title: string
          updated_at?: string
          venue?: string | null
        }
        Update: {
          access_ends_at?: string | null
          access_starts_at?: string | null
          agenda_days?: Json
          agenda_view_style?: string
          apologies_message?: string | null
          body_font?: string | null
          bride_name?: string | null
          ceremony_time?: string | null
          contact_phone?: string | null
          contacts?: Json
          countdown_message?: string | null
          cover_background_url?: string | null
          cover_image_url?: string | null
          cover_message?: string | null
          cover_music_url?: string | null
          created_at?: string
          description?: string | null
          dress_code?: string | null
          event_date?: string | null
          frame_type?: string
          frame_url?: string | null
          gallery_layout?: string
          gallery_urls?: string[] | null
          groom_name?: string | null
          id?: string
          internal_title?: string | null
          invite_background_url?: string | null
          letter_bg_color?: string | null
          letter_bg_opacity?: number | null
          map_embed?: string | null
          map_image_url?: string | null
          max_guests?: number | null
          open_button_color?: string | null
          owner_id?: string | null
          paid_amount?: number
          payment_status?: string
          price_currency?: string
          price_total?: number
          qr_account_name?: string | null
          qr_code_message?: string | null
          qr_code_url?: string | null
          reception_time?: string | null
          section_visibility?: Json
          share_preview_index?: number | null
          slug?: string
          template?: string
          text_color_accent?: string | null
          text_color_primary?: string | null
          text_effect_config?: Json
          text_shadow_enabled?: boolean | null
          thank_you_message?: string | null
          title?: string
          updated_at?: string
          venue?: string | null
        }
        Relationships: []
      }
      guests: {
        Row: {
          created_at: string
          event_id: string
          id: string
          invite_sent_at: string | null
          message: string | null
          name: string
          party_size: number
          responded_at: string | null
          rsvp_status: Database["public"]["Enums"]["rsvp_status"]
          token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          invite_sent_at?: string | null
          message?: string | null
          name: string
          party_size?: number
          responded_at?: string | null
          rsvp_status?: Database["public"]["Enums"]["rsvp_status"]
          token: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          invite_sent_at?: string | null
          message?: string | null
          name?: string
          party_size?: number
          responded_at?: string | null
          rsvp_status?: Database["public"]["Enums"]["rsvp_status"]
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_item_presets: {
        Row: {
          created_at: string
          default_currency: string
          default_quantity: number
          default_unit_price: number
          description: string | null
          id: string
          is_active: boolean
          label: string
          position: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_currency?: string
          default_quantity?: number
          default_unit_price?: number
          description?: string | null
          id?: string
          is_active?: boolean
          label: string
          position?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_currency?: string
          default_quantity?: number
          default_unit_price?: number
          description?: string | null
          id?: string
          is_active?: boolean
          label?: string
          position?: number
          updated_at?: string
        }
        Relationships: []
      }
      ornamental_frames: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          label: string
          media_type: string
          media_url: string
          position: number
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          label: string
          media_type?: string
          media_url: string
          position?: number
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          label?: string
          media_type?: string
          media_url?: string
          position?: number
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          created_at: string
          details: string | null
          id: string
          is_active: boolean
          label: string
          position: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          is_active?: boolean
          label: string
          position?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          is_active?: boolean
          label?: string
          position?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          facebook_url: string | null
          footer_text: string | null
          id: string
          instagram_url: string | null
          logo_url: string | null
          telegram_url: string | null
          tiktok_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          facebook_url?: string | null
          footer_text?: string | null
          id?: string
          instagram_url?: string | null
          logo_url?: string | null
          telegram_url?: string | null
          tiktok_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          facebook_url?: string | null
          footer_text?: string | null
          id?: string
          instagram_url?: string | null
          logo_url?: string | null
          telegram_url?: string | null
          tiktok_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      templates: {
        Row: {
          base_renderer: string
          config: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          label: string
          position: number
          slug: string
          updated_at: string
        }
        Insert: {
          base_renderer?: string
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          label: string
          position?: number
          slug: string
          updated_at?: string
        }
        Update: {
          base_renderer?: string
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          label?: string
          position?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
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
      get_event_public_by_slug: {
        Args: { _slug: string }
        Returns: {
          access_ends_at: string
          access_starts_at: string
          agenda_days: Json
          agenda_view_style: string
          apologies_message: string
          body_font: string
          bride_name: string
          ceremony_time: string
          contact_phone: string
          contacts: Json
          countdown_message: string
          cover_background_url: string
          cover_image_url: string
          cover_message: string
          cover_music_url: string
          created_at: string
          description: string
          dress_code: string
          event_date: string
          frame_type: string
          frame_url: string
          gallery_layout: string
          gallery_urls: string[]
          groom_name: string
          id: string
          invite_background_url: string
          letter_bg_color: string
          letter_bg_opacity: number
          map_embed: string
          map_image_url: string
          max_guests: number
          qr_account_name: string
          qr_code_message: string
          qr_code_url: string
          reception_time: string
          section_visibility: Json
          share_preview_index: number
          slug: string
          template: string
          text_color_accent: string
          text_color_primary: string
          thank_you_message: string
          title: string
          updated_at: string
          venue: string
        }[]
      }
      get_guest_by_token: {
        Args: { _event_slug: string; _token: string }
        Returns: {
          event_id: string
          id: string
          message: string
          name: string
          party_size: number
          responded_at: string
          rsvp_status: Database["public"]["Enums"]["rsvp_status"]
        }[]
      }
      get_user_email: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_super: { Args: { _user_id: string }; Returns: boolean }
      is_event_customer: {
        Args: { _event_id: string; _user_id: string }
        Returns: boolean
      }
      recalc_event_totals: { Args: { _event_id: string }; Returns: undefined }
      submit_rsvp: {
        Args: {
          _event_slug: string
          _message?: string
          _party_size?: number
          _status: Database["public"]["Enums"]["rsvp_status"]
          _token: string
        }
        Returns: {
          created_at: string
          event_id: string
          id: string
          invite_sent_at: string | null
          message: string | null
          name: string
          party_size: number
          responded_at: string | null
          rsvp_status: Database["public"]["Enums"]["rsvp_status"]
          token: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "guests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role: "admin" | "user" | "customer" | "superadmin"
      rsvp_status: "pending" | "yes" | "no"
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
      app_role: ["admin", "user", "customer", "superadmin"],
      rsvp_status: ["pending", "yes", "no"],
    },
  },
} as const
