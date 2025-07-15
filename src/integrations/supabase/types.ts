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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      albums: {
        Row: {
          album_type: string | null
          cover_art_url: string | null
          created_at: string | null
          external_ids: Json | null
          id: string
          record_label: string | null
          release_date: string | null
          title: string
          total_tracks: number | null
          updated_at: string | null
        }
        Insert: {
          album_type?: string | null
          cover_art_url?: string | null
          created_at?: string | null
          external_ids?: Json | null
          id?: string
          record_label?: string | null
          release_date?: string | null
          title: string
          total_tracks?: number | null
          updated_at?: string | null
        }
        Update: {
          album_type?: string | null
          cover_art_url?: string | null
          created_at?: string | null
          external_ids?: Json | null
          id?: string
          record_label?: string | null
          release_date?: string | null
          title?: string
          total_tracks?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      artists: {
        Row: {
          bio: string | null
          birth_date: string | null
          country: string | null
          created_at: string | null
          death_date: string | null
          external_ids: Json | null
          genres: string[] | null
          id: string
          image_url: string | null
          name: string
          updated_at: string | null
          verified: boolean | null
        }
        Insert: {
          bio?: string | null
          birth_date?: string | null
          country?: string | null
          created_at?: string | null
          death_date?: string | null
          external_ids?: Json | null
          genres?: string[] | null
          id?: string
          image_url?: string | null
          name: string
          updated_at?: string | null
          verified?: boolean | null
        }
        Update: {
          bio?: string | null
          birth_date?: string | null
          country?: string | null
          created_at?: string | null
          death_date?: string | null
          external_ids?: Json | null
          genres?: string[] | null
          id?: string
          image_url?: string | null
          name?: string
          updated_at?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      cached_external_songs: {
        Row: {
          access_count: number | null
          album: string | null
          artist: string
          cached_at: string
          duration_ms: number | null
          external_id: string
          id: string
          last_accessed: string | null
          metadata: Json | null
          source: string
          title: string
        }
        Insert: {
          access_count?: number | null
          album?: string | null
          artist: string
          cached_at?: string
          duration_ms?: number | null
          external_id: string
          id?: string
          last_accessed?: string | null
          metadata?: Json | null
          source: string
          title: string
        }
        Update: {
          access_count?: number | null
          album?: string | null
          artist?: string
          cached_at?: string
          duration_ms?: number | null
          external_id?: string
          id?: string
          last_accessed?: string | null
          metadata?: Json | null
          source?: string
          title?: string
        }
        Relationships: []
      }
      genres: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          parent_genre_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          parent_genre_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          parent_genre_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "genres_parent_genre_id_fkey"
            columns: ["parent_genre_id"]
            isOneToOne: false
            referencedRelation: "genres"
            referencedColumns: ["id"]
          },
        ]
      }
      song_artists: {
        Row: {
          artist_id: string
          role: string
          song_id: string
        }
        Insert: {
          artist_id: string
          role?: string
          song_id: string
        }
        Update: {
          artist_id?: string
          role?: string
          song_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "song_artists_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "song_artists_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      song_genres: {
        Row: {
          genre_id: string
          is_primary: boolean | null
          song_id: string
        }
        Insert: {
          genre_id: string
          is_primary?: boolean | null
          song_id: string
        }
        Update: {
          genre_id?: string
          is_primary?: boolean | null
          song_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "song_genres_genre_id_fkey"
            columns: ["genre_id"]
            isOneToOne: false
            referencedRelation: "genres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "song_genres_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      songs: {
        Row: {
          album_id: string | null
          audio_fingerprint: string | null
          bpm: number | null
          created_at: string | null
          credits: Json | null
          danceability: number | null
          description: string | null
          disc_number: number | null
          duration_ms: number | null
          dynamic_range: number | null
          energy_level: Database["public"]["Enums"]["song_energy"] | null
          engineer: string | null
          explicit_content:
            | Database["public"]["Enums"]["explicit_content"]
            | null
          external_ids: Json | null
          id: string
          instruments: string[] | null
          isrc: string | null
          key_mode: Database["public"]["Enums"]["key_mode"] | null
          language: string | null
          loudness: number | null
          lyrics: string | null
          mastering_engineer: string | null
          mixing_engineer: string | null
          mood: Database["public"]["Enums"]["song_mood"] | null
          musicbrainz_id: string | null
          producer: string | null
          recording_date: string | null
          recording_studio: string | null
          release_date: string | null
          samples: Json | null
          similarity_vector: string | null
          song_key: Database["public"]["Enums"]["song_key"] | null
          story_behind_song: string | null
          themes: string[] | null
          time_signature: number | null
          title: string
          track_number: number | null
          upc: string | null
          updated_at: string | null
          valence: number | null
          verified: boolean | null
          vocals: string[] | null
        }
        Insert: {
          album_id?: string | null
          audio_fingerprint?: string | null
          bpm?: number | null
          created_at?: string | null
          credits?: Json | null
          danceability?: number | null
          description?: string | null
          disc_number?: number | null
          duration_ms?: number | null
          dynamic_range?: number | null
          energy_level?: Database["public"]["Enums"]["song_energy"] | null
          engineer?: string | null
          explicit_content?:
            | Database["public"]["Enums"]["explicit_content"]
            | null
          external_ids?: Json | null
          id?: string
          instruments?: string[] | null
          isrc?: string | null
          key_mode?: Database["public"]["Enums"]["key_mode"] | null
          language?: string | null
          loudness?: number | null
          lyrics?: string | null
          mastering_engineer?: string | null
          mixing_engineer?: string | null
          mood?: Database["public"]["Enums"]["song_mood"] | null
          musicbrainz_id?: string | null
          producer?: string | null
          recording_date?: string | null
          recording_studio?: string | null
          release_date?: string | null
          samples?: Json | null
          similarity_vector?: string | null
          song_key?: Database["public"]["Enums"]["song_key"] | null
          story_behind_song?: string | null
          themes?: string[] | null
          time_signature?: number | null
          title: string
          track_number?: number | null
          upc?: string | null
          updated_at?: string | null
          valence?: number | null
          verified?: boolean | null
          vocals?: string[] | null
        }
        Update: {
          album_id?: string | null
          audio_fingerprint?: string | null
          bpm?: number | null
          created_at?: string | null
          credits?: Json | null
          danceability?: number | null
          description?: string | null
          disc_number?: number | null
          duration_ms?: number | null
          dynamic_range?: number | null
          energy_level?: Database["public"]["Enums"]["song_energy"] | null
          engineer?: string | null
          explicit_content?:
            | Database["public"]["Enums"]["explicit_content"]
            | null
          external_ids?: Json | null
          id?: string
          instruments?: string[] | null
          isrc?: string | null
          key_mode?: Database["public"]["Enums"]["key_mode"] | null
          language?: string | null
          loudness?: number | null
          lyrics?: string | null
          mastering_engineer?: string | null
          mixing_engineer?: string | null
          mood?: Database["public"]["Enums"]["song_mood"] | null
          musicbrainz_id?: string | null
          producer?: string | null
          recording_date?: string | null
          recording_studio?: string | null
          release_date?: string | null
          samples?: Json | null
          similarity_vector?: string | null
          song_key?: Database["public"]["Enums"]["song_key"] | null
          story_behind_song?: string | null
          themes?: string[] | null
          time_signature?: number | null
          title?: string
          track_number?: number | null
          upc?: string | null
          updated_at?: string | null
          valence?: number | null
          verified?: boolean | null
          vocals?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "songs_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
        ]
      }
      user_listening_history: {
        Row: {
          completion_percentage: number | null
          device_type: string | null
          duration_listened_ms: number | null
          id: string
          listened_at: string | null
          listening_context: string | null
          mood_when_listened: string | null
          skip_reason: string | null
          song_id: string | null
          user_id: string | null
        }
        Insert: {
          completion_percentage?: number | null
          device_type?: string | null
          duration_listened_ms?: number | null
          id?: string
          listened_at?: string | null
          listening_context?: string | null
          mood_when_listened?: string | null
          skip_reason?: string | null
          song_id?: string | null
          user_id?: string | null
        }
        Update: {
          completion_percentage?: number | null
          device_type?: string | null
          duration_listened_ms?: number | null
          id?: string
          listened_at?: string | null
          listening_context?: string | null
          mood_when_listened?: string | null
          skip_reason?: string | null
          song_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_listening_history_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_listening_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_music_submissions: {
        Row: {
          admin_notes: string | null
          album_title: string | null
          artist_name: string
          audio_url: string | null
          bpm: number | null
          contact_email: string | null
          cover_art_url: string | null
          created_at: string
          description: string | null
          duration_ms: number | null
          energy_level: string | null
          genres: string[] | null
          id: string
          instruments: string[] | null
          key_mode: string | null
          lyrics: string | null
          mood: string | null
          music_video_url: string | null
          publishing_rights: string | null
          record_label: string | null
          release_date: string | null
          song_key: string | null
          submission_status: string | null
          themes: string[] | null
          title: string
          updated_at: string
          user_id: string | null
          verified_by: string | null
        }
        Insert: {
          admin_notes?: string | null
          album_title?: string | null
          artist_name: string
          audio_url?: string | null
          bpm?: number | null
          contact_email?: string | null
          cover_art_url?: string | null
          created_at?: string
          description?: string | null
          duration_ms?: number | null
          energy_level?: string | null
          genres?: string[] | null
          id?: string
          instruments?: string[] | null
          key_mode?: string | null
          lyrics?: string | null
          mood?: string | null
          music_video_url?: string | null
          publishing_rights?: string | null
          record_label?: string | null
          release_date?: string | null
          song_key?: string | null
          submission_status?: string | null
          themes?: string[] | null
          title: string
          updated_at?: string
          user_id?: string | null
          verified_by?: string | null
        }
        Update: {
          admin_notes?: string | null
          album_title?: string | null
          artist_name?: string
          audio_url?: string | null
          bpm?: number | null
          contact_email?: string | null
          cover_art_url?: string | null
          created_at?: string
          description?: string | null
          duration_ms?: number | null
          energy_level?: string | null
          genres?: string[] | null
          id?: string
          instruments?: string[] | null
          key_mode?: string | null
          lyrics?: string | null
          mood?: string | null
          music_video_url?: string | null
          publishing_rights?: string | null
          record_label?: string | null
          release_date?: string | null
          song_key?: string | null
          submission_status?: string | null
          themes?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          id: string
          listening_preferences: Json | null
          preferred_genres: string[] | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id: string
          listening_preferences?: Json | null
          preferred_genres?: string[] | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          listening_preferences?: Json | null
          preferred_genres?: string[] | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      user_reviews: {
        Row: {
          created_at: string | null
          helpful_votes: number | null
          id: string
          rating: number | null
          review_text: string | null
          song_id: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          helpful_votes?: number | null
          id?: string
          rating?: number | null
          review_text?: string | null
          song_id?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          helpful_votes?: number | null
          id?: string
          rating?: number | null
          review_text?: string | null
          song_id?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_reviews_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_search_history: {
        Row: {
          clicked_results: string[] | null
          id: string
          results_count: number | null
          search_query: string
          search_type: string | null
          searched_at: string | null
          user_id: string | null
        }
        Insert: {
          clicked_results?: string[] | null
          id?: string
          results_count?: number | null
          search_query: string
          search_type?: string | null
          searched_at?: string | null
          user_id?: string | null
        }
        Update: {
          clicked_results?: string[] | null
          id?: string
          results_count?: number | null
          search_query?: string
          search_type?: string | null
          searched_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_search_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      explicit_content: "clean" | "explicit" | "edited"
      key_mode: "major" | "minor"
      song_energy: "low" | "medium" | "high" | "very_high"
      song_key:
        | "C"
        | "C#"
        | "D"
        | "D#"
        | "E"
        | "F"
        | "F#"
        | "G"
        | "G#"
        | "A"
        | "A#"
        | "B"
      song_mood:
        | "energetic"
        | "melancholic"
        | "uplifting"
        | "aggressive"
        | "peaceful"
        | "nostalgic"
        | "romantic"
        | "mysterious"
        | "playful"
        | "dramatic"
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
      explicit_content: ["clean", "explicit", "edited"],
      key_mode: ["major", "minor"],
      song_energy: ["low", "medium", "high", "very_high"],
      song_key: [
        "C",
        "C#",
        "D",
        "D#",
        "E",
        "F",
        "F#",
        "G",
        "G#",
        "A",
        "A#",
        "B",
      ],
      song_mood: [
        "energetic",
        "melancholic",
        "uplifting",
        "aggressive",
        "peaceful",
        "nostalgic",
        "romantic",
        "mysterious",
        "playful",
        "dramatic",
      ],
    },
  },
} as const
