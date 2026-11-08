export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      outings: {
        Row: {
          avalanche_level: Database["public"]["Enums"]["avalanche_level"]
          created_at: string
          id: string
          justification: string | null
          justification_source: Database["public"]["Enums"]["justification_source"]
          no_go_reason: string | null
          outcome: Database["public"]["Enums"]["outing_outcome"]
          route_above_treeline: boolean | null
          route_aspect: Database["public"]["Enums"]["aspect_octant"] | null
          route_difficulty:
            | Database["public"]["Enums"]["route_difficulty"]
            | null
          route_duration_minutes: number | null
          route_id: string | null
          route_max_slope_degrees: number | null
          route_name: string | null
          route_region: string | null
          route_requires_abc_gear: boolean | null
          user_id: string
          visibility: Database["public"]["Enums"]["visibility"]
          wind_direction: Database["public"]["Enums"]["wind_direction"]
        }
        Insert: {
          avalanche_level: Database["public"]["Enums"]["avalanche_level"]
          created_at?: string
          id?: string
          justification?: string | null
          justification_source?: Database["public"]["Enums"]["justification_source"]
          no_go_reason?: string | null
          outcome: Database["public"]["Enums"]["outing_outcome"]
          route_above_treeline?: boolean | null
          route_aspect?: Database["public"]["Enums"]["aspect_octant"] | null
          route_difficulty?:
            | Database["public"]["Enums"]["route_difficulty"]
            | null
          route_duration_minutes?: number | null
          route_id?: string | null
          route_max_slope_degrees?: number | null
          route_name?: string | null
          route_region?: string | null
          route_requires_abc_gear?: boolean | null
          user_id: string
          visibility: Database["public"]["Enums"]["visibility"]
          wind_direction: Database["public"]["Enums"]["wind_direction"]
        }
        Update: {
          avalanche_level?: Database["public"]["Enums"]["avalanche_level"]
          created_at?: string
          id?: string
          justification?: string | null
          justification_source?: Database["public"]["Enums"]["justification_source"]
          no_go_reason?: string | null
          outcome?: Database["public"]["Enums"]["outing_outcome"]
          route_above_treeline?: boolean | null
          route_aspect?: Database["public"]["Enums"]["aspect_octant"] | null
          route_difficulty?:
            | Database["public"]["Enums"]["route_difficulty"]
            | null
          route_duration_minutes?: number | null
          route_id?: string | null
          route_max_slope_degrees?: number | null
          route_name?: string | null
          route_region?: string | null
          route_requires_abc_gear?: boolean | null
          user_id?: string
          visibility?: Database["public"]["Enums"]["visibility"]
          wind_direction?: Database["public"]["Enums"]["wind_direction"]
        }
        Relationships: [
          {
            foreignKeyName: "outings_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      routes: {
        Row: {
          above_treeline: boolean
          aspect: Database["public"]["Enums"]["aspect_octant"]
          created_at: string
          difficulty: Database["public"]["Enums"]["route_difficulty"]
          duration_minutes: number
          id: string
          max_slope_degrees: number
          name: string
          region: string
          requires_abc_gear: boolean
          updated_at: string
        }
        Insert: {
          above_treeline: boolean
          aspect: Database["public"]["Enums"]["aspect_octant"]
          created_at?: string
          difficulty: Database["public"]["Enums"]["route_difficulty"]
          duration_minutes: number
          id?: string
          max_slope_degrees: number
          name: string
          region: string
          requires_abc_gear: boolean
          updated_at?: string
        }
        Update: {
          above_treeline?: boolean
          aspect?: Database["public"]["Enums"]["aspect_octant"]
          created_at?: string
          difficulty?: Database["public"]["Enums"]["route_difficulty"]
          duration_minutes?: number
          id?: string
          max_slope_degrees?: number
          name?: string
          region?: string
          requires_abc_gear?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      skier_profiles: {
        Row: {
          available_time_minutes: number
          avalanche_level: Database["public"]["Enums"]["avalanche_level"] | null
          created_at: string
          fitness_level: Database["public"]["Enums"]["experience_level"]
          has_abc_gear: boolean
          terrain_familiarity: Database["public"]["Enums"]["experience_level"]
          updated_at: string
          user_id: string
          visibility: Database["public"]["Enums"]["visibility"] | null
          wind_direction: Database["public"]["Enums"]["wind_direction"] | null
        }
        Insert: {
          available_time_minutes: number
          avalanche_level?:
            | Database["public"]["Enums"]["avalanche_level"]
            | null
          created_at?: string
          fitness_level: Database["public"]["Enums"]["experience_level"]
          has_abc_gear: boolean
          terrain_familiarity: Database["public"]["Enums"]["experience_level"]
          updated_at?: string
          user_id: string
          visibility?: Database["public"]["Enums"]["visibility"] | null
          wind_direction?: Database["public"]["Enums"]["wind_direction"] | null
        }
        Update: {
          available_time_minutes?: number
          avalanche_level?:
            | Database["public"]["Enums"]["avalanche_level"]
            | null
          created_at?: string
          fitness_level?: Database["public"]["Enums"]["experience_level"]
          has_abc_gear?: boolean
          terrain_familiarity?: Database["public"]["Enums"]["experience_level"]
          updated_at?: string
          user_id?: string
          visibility?: Database["public"]["Enums"]["visibility"] | null
          wind_direction?: Database["public"]["Enums"]["wind_direction"] | null
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
      aspect_octant: "none" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw"
      avalanche_level:
        | "low"
        | "moderate"
        | "considerable"
        | "high"
        | "very_high"
      experience_level: "beginner" | "intermediate" | "advanced"
      justification_source: "ai" | "fallback"
      outing_outcome: "recommended" | "no_go"
      route_difficulty: "easy" | "moderate" | "hard"
      visibility: "good" | "moderate" | "poor"
      wind_direction: "none" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      aspect_octant: ["none", "n", "ne", "e", "se", "s", "sw", "w", "nw"],
      avalanche_level: ["low", "moderate", "considerable", "high", "very_high"],
      experience_level: ["beginner", "intermediate", "advanced"],
      justification_source: ["ai", "fallback"],
      outing_outcome: ["recommended", "no_go"],
      route_difficulty: ["easy", "moderate", "hard"],
      visibility: ["good", "moderate", "poor"],
      wind_direction: ["none", "n", "ne", "e", "se", "s", "sw", "w", "nw"],
    },
  },
} as const

