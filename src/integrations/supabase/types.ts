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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      blog_posts: {
        Row: {
          category: string | null
          content: string
          cover_photo_id: string | null
          created_at: string | null
          event_id: string
          hashtags: string[] | null
          id: string
          photographer_id: string
          tag_timi: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content: string
          cover_photo_id?: string | null
          created_at?: string | null
          event_id: string
          hashtags?: string[] | null
          id?: string
          photographer_id: string
          tag_timi?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string
          cover_photo_id?: string | null
          created_at?: string | null
          event_id?: string
          hashtags?: string[] | null
          id?: string
          photographer_id?: string
          tag_timi?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_cover_photo_id_fkey"
            columns: ["cover_photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_attendees: {
        Row: {
          attended_at: string | null
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          attended_at?: string | null
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          attended_at?: string | null
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          event_date: string
          hashtags: string[] | null
          id: string
          is_active: boolean | null
          location: string | null
          organizer_link: string | null
          organizer_name: string | null
          photographer_id: string
          qr_code_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          event_date: string
          hashtags?: string[] | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          organizer_link?: string | null
          organizer_name?: string | null
          photographer_id: string
          qr_code_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          event_date?: string
          hashtags?: string[] | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          organizer_link?: string | null
          organizer_name?: string | null
          photographer_id?: string
          qr_code_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      homepage_sections: {
        Row: {
          alt_text: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          link_url: string
          logo_url: string
          section_name: string
          updated_at: string
          use_background: boolean
        }
        Insert: {
          alt_text: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          link_url: string
          logo_url: string
          section_name: string
          updated_at?: string
          use_background?: boolean
        }
        Update: {
          alt_text?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          link_url?: string
          logo_url?: string
          section_name?: string
          updated_at?: string
          use_background?: boolean
        }
        Relationships: []
      }
      memes: {
        Row: {
          approved_by: string | null
          caption: string
          created_at: string | null
          event_id: string
          id: string
          image_url: string
          is_approved: boolean | null
          likes_count: number | null
          photo_id: string
          user_id: string
        }
        Insert: {
          approved_by?: string | null
          caption: string
          created_at?: string | null
          event_id: string
          id?: string
          image_url: string
          is_approved?: boolean | null
          likes_count?: number | null
          photo_id: string
          user_id: string
        }
        Update: {
          approved_by?: string | null
          caption?: string
          created_at?: string | null
          event_id?: string
          id?: string
          image_url?: string
          is_approved?: boolean | null
          likes_count?: number | null
          photo_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memes_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_reactions: {
        Row: {
          created_at: string | null
          id: string
          photo_id: string
          reaction_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          photo_id: string
          reaction_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          photo_id?: string
          reaction_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "photo_reactions_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_removal_requests: {
        Row: {
          created_at: string | null
          id: string
          photo_id: string
          reason: string | null
          requester_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          photo_id: string
          reason?: string | null
          requester_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          photo_id?: string
          reason?: string | null
          requester_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "photo_removal_requests_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_stars: {
        Row: {
          id: string
          photo_id: string
          starred_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          photo_id: string
          starred_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          photo_id?: string
          starred_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "photo_stars_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
        ]
      }
      photographer_communities: {
        Row: {
          community_name: string
          created_at: string
          id: string
          photographer_id: string
        }
        Insert: {
          community_name: string
          created_at?: string
          id?: string
          photographer_id: string
        }
        Update: {
          community_name?: string
          created_at?: string
          id?: string
          photographer_id?: string
        }
        Relationships: []
      }
      photographer_followers: {
        Row: {
          followed_at: string | null
          follower_id: string
          id: string
          photographer_id: string
        }
        Insert: {
          followed_at?: string | null
          follower_id: string
          id?: string
          photographer_id: string
        }
        Update: {
          followed_at?: string | null
          follower_id?: string
          id?: string
          photographer_id?: string
        }
        Relationships: []
      }
      photographer_reviews: {
        Row: {
          created_at: string | null
          id: string
          photographer_id: string
          rating: number
          review_text: string | null
          reviewer_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          photographer_id: string
          rating: number
          review_text?: string | null
          reviewer_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          photographer_id?: string
          rating?: number
          review_text?: string | null
          reviewer_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      photos: {
        Row: {
          caption: string | null
          created_at: string | null
          event_id: string
          file_url: string
          id: string
          photographer_id: string
          reactions_clap: number | null
          reactions_fire: number | null
          reactions_laugh: number | null
          stars_count: number | null
          thumbnail_url: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          event_id: string
          file_url: string
          id?: string
          photographer_id: string
          reactions_clap?: number | null
          reactions_fire?: number | null
          reactions_laugh?: number | null
          stars_count?: number | null
          thumbnail_url?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          event_id?: string
          file_url?: string
          id?: string
          photographer_id?: string
          reactions_clap?: number | null
          reactions_fire?: number | null
          reactions_laugh?: number | null
          stars_count?: number | null
          thumbnail_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "photos_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          behance_url: string | null
          bio: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          instagram_handle: string | null
          linkedin_url: string | null
          updated_at: string | null
          x_handle: string | null
        }
        Insert: {
          avatar_url?: string | null
          behance_url?: string | null
          bio?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          instagram_handle?: string | null
          linkedin_url?: string | null
          updated_at?: string | null
          x_handle?: string | null
        }
        Update: {
          avatar_url?: string | null
          behance_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          instagram_handle?: string | null
          linkedin_url?: string | null
          updated_at?: string | null
          x_handle?: string | null
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_name: string
          badge_type: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_name: string
          badge_type: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_name?: string
          badge_type?: string
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_superadmin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "superadmin" | "admin" | "user"
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
      app_role: ["superadmin", "admin", "user"],
    },
  },
} as const
