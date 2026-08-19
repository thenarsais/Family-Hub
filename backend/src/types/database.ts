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
      activity_log: {
        Row: {
          achievement_title: string | null
          action: string
          activity_type: string
          created_at: string | null
          id: string
          metadata: Json | null
          points_earned: number | null
          related_item_id: string | null
          related_item_type: string | null
          user_id: string
        }
        Insert: {
          achievement_title?: string | null
          action: string
          activity_type: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          points_earned?: number | null
          related_item_id?: string | null
          related_item_type?: string | null
          user_id: string
        }
        Update: {
          achievement_title?: string | null
          action?: string
          activity_type?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          points_earned?: number | null
          related_item_id?: string | null
          related_item_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_points: {
        Row: {
          activity_type: string
          created_at: string | null
          id: string
          points: number
          reason: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          id?: string
          points: number
          reason?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          id?: string
          points?: number
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_points_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      announcement_reads: {
        Row: {
          announcement_id: string
          id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          announcement_id: string
          id?: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          announcement_id?: string
          id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          announcement_type: string | null
          created_at: string | null
          created_by_id: string
          expires_at: string | null
          family_id: string | null
          id: string
          is_pinned: boolean | null
          message: string
          priority: string | null
          target_audience: string | null
          target_user_ids: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          announcement_type?: string | null
          created_at?: string | null
          created_by_id: string
          expires_at?: string | null
          family_id?: string | null
          id?: string
          is_pinned?: boolean | null
          message: string
          priority?: string | null
          target_audience?: string | null
          target_user_ids?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          announcement_type?: string | null
          created_at?: string | null
          created_by_id?: string
          expires_at?: string | null
          family_id?: string | null
          id?: string
          is_pinned?: boolean | null
          message?: string
          priority?: string | null
          target_audience?: string | null
          target_user_ids?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          icon_emoji: string | null
          id: string
          points_required: number | null
          tier: string
          title: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          icon_emoji?: string | null
          id?: string
          points_required?: number | null
          tier: string
          title: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          icon_emoji?: string | null
          id?: string
          points_required?: number | null
          tier?: string
          title?: string
        }
        Relationships: []
      }
      child_profiles: {
        Row: {
          avatar: string | null
          created_at: string | null
          current_streak: number | null
          date_of_birth: string | null
          display_name: string | null
          id: string
          parent_id: string
          points_total: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar?: string | null
          created_at?: string | null
          current_streak?: number | null
          date_of_birth?: string | null
          display_name?: string | null
          id?: string
          parent_id: string
          points_total?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar?: string | null
          created_at?: string | null
          current_streak?: number | null
          date_of_birth?: string | null
          display_name?: string | null
          id?: string
          parent_id?: string
          points_total?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "child_profiles_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "child_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chores: {
        Row: {
          child_id: string
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          is_recurring: boolean | null
          points_value: number | null
          priority: string
          status: string | null
          title: string
        }
        Insert: {
          child_id: string
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_recurring?: boolean | null
          points_value?: number | null
          priority: string
          status?: string | null
          title: string
        }
        Update: {
          child_id?: string
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_recurring?: boolean | null
          points_value?: number | null
          priority?: string
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "chores_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_quests: {
        Row: {
          child_id: string
          completed_at: string | null
          created_at: string | null
          description: string | null
          difficulty: string
          due_date: string
          id: string
          points_value: number | null
          quest_type: string
          status: string | null
          title: string
        }
        Insert: {
          child_id: string
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          difficulty: string
          due_date: string
          id?: string
          points_value?: number | null
          quest_type: string
          status?: string | null
          title: string
        }
        Update: {
          child_id?: string
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string
          due_date?: string
          id?: string
          points_value?: number | null
          quest_type?: string
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_quests_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      dismissed_events: {
        Row: {
          calendar_id: string | null
          created_at: string
          dismissed_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          calendar_id?: string | null
          created_at?: string
          dismissed_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          calendar_id?: string | null
          created_at?: string
          dismissed_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          created_at: string | null
          created_by_id: string
          end_time: string | null
          event_date: string
          event_description: string | null
          event_title: string
          event_type: string | null
          family_id: string
          id: string
          location: string | null
          start_time: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by_id: string
          end_time?: string | null
          event_date: string
          event_description?: string | null
          event_title: string
          event_type?: string | null
          family_id: string
          id?: string
          location?: string | null
          start_time?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by_id?: string
          end_time?: string | null
          event_date?: string
          event_description?: string | null
          event_title?: string
          event_type?: string | null
          family_id?: string
          id?: string
          location?: string | null
          start_time?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      device_control_history: {
        Row: {
          command: string
          command_args: Json | null
          controlled_by_id: string | null
          device_id: string
          executed_at: string | null
          id: string
          response: Json | null
          status: string | null
        }
        Insert: {
          command: string
          command_args?: Json | null
          controlled_by_id?: string | null
          device_id: string
          executed_at?: string | null
          id?: string
          response?: Json | null
          status?: string | null
        }
        Update: {
          command?: string
          command_args?: Json | null
          controlled_by_id?: string | null
          device_id?: string
          executed_at?: string | null
          id?: string
          response?: Json | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "device_control_history_controlled_by_id_fkey"
            columns: ["controlled_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      energy_goals: {
        Row: {
          achieved_at: string | null
          created_at: string | null
          created_by_id: string
          current_kwh: number | null
          end_date: string
          goal_type: string
          id: string
          points_reward: number | null
          start_date: string
          status: string | null
          target_kwh: number | null
        }
        Insert: {
          achieved_at?: string | null
          created_at?: string | null
          created_by_id: string
          current_kwh?: number | null
          end_date: string
          goal_type: string
          id?: string
          points_reward?: number | null
          start_date: string
          status?: string | null
          target_kwh?: number | null
        }
        Update: {
          achieved_at?: string | null
          created_at?: string | null
          created_by_id?: string
          current_kwh?: number | null
          end_date?: string
          goal_type?: string
          id?: string
          points_reward?: number | null
          start_date?: string
          status?: string | null
          target_kwh?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "energy_goals_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      energy_summary: {
        Row: {
          average_power_watts: number | null
          created_at: string | null
          device_count: number | null
          id: string
          peak_power_watts: number | null
          peak_time: string | null
          period: string
          period_end: string
          period_start: string
          total_kwh: number | null
        }
        Insert: {
          average_power_watts?: number | null
          created_at?: string | null
          device_count?: number | null
          id?: string
          peak_power_watts?: number | null
          peak_time?: string | null
          period: string
          period_end: string
          period_start: string
          total_kwh?: number | null
        }
        Update: {
          average_power_watts?: number | null
          created_at?: string | null
          device_count?: number | null
          id?: string
          peak_power_watts?: number | null
          peak_time?: string | null
          period?: string
          period_end?: string
          period_start?: string
          total_kwh?: number | null
        }
        Relationships: []
      }
      energy_usage: {
        Row: {
          device_id: string
          device_name: string | null
          device_type: string | null
          energy_kwh: number | null
          id: string
          power_watts: number | null
          recorded_at: string | null
          timestamp: string
        }
        Insert: {
          device_id: string
          device_name?: string | null
          device_type?: string | null
          energy_kwh?: number | null
          id?: string
          power_watts?: number | null
          recorded_at?: string | null
          timestamp: string
        }
        Update: {
          device_id?: string
          device_name?: string | null
          device_type?: string | null
          energy_kwh?: number | null
          id?: string
          power_watts?: number | null
          recorded_at?: string | null
          timestamp?: string
        }
        Relationships: []
      }
      families: {
        Row: {
          created_at: string | null
          created_by_id: string
          description: string | null
          id: string
          max_children: number | null
          max_parents: number | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by_id: string
          description?: string | null
          id?: string
          max_children?: number | null
          max_parents?: number | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by_id?: string
          description?: string | null
          id?: string
          max_children?: number | null
          max_parents?: number | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "families_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      family_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          expires_at: string
          family_id: string
          id: string
          invite_token: string
          invited_email: string
          inviting_parent_id: string
          role: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          expires_at: string
          family_id: string
          id?: string
          invite_token: string
          invited_email: string
          inviting_parent_id: string
          role: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          expires_at?: string
          family_id?: string
          id?: string
          invite_token?: string
          invited_email?: string
          inviting_parent_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_invitations_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_invitations_inviting_parent_id_fkey"
            columns: ["inviting_parent_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      family_members: {
        Row: {
          created_at: string | null
          family_id: string
          id: string
          invited_by_id: string | null
          is_active: boolean | null
          joined_at: string | null
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          family_id: string
          id?: string
          invited_by_id?: string | null
          is_active?: boolean | null
          joined_at?: string | null
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          family_id?: string
          id?: string
          invited_by_id?: string | null
          is_active?: boolean | null
          joined_at?: string | null
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_members_invited_by_id_fkey"
            columns: ["invited_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      family_settings: {
        Row: {
          allow_google_calendar_sync: boolean | null
          badges_system_enabled: boolean | null
          bedtime_enabled: boolean | null
          bedtime_end: string | null
          bedtime_start: string | null
          created_at: string | null
          email_digest_frequency: string | null
          enable_smart_home_control: boolean | null
          family_id: string
          id: string
          language: string | null
          leaderboard_enabled: boolean | null
          max_screen_time_minutes: number | null
          notifications_enabled: boolean | null
          parental_controls_enabled: boolean | null
          points_system_enabled: boolean | null
          privacy_mode: boolean | null
          require_age_verification: boolean | null
          sound_notifications: boolean | null
          theme: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          allow_google_calendar_sync?: boolean | null
          badges_system_enabled?: boolean | null
          bedtime_enabled?: boolean | null
          bedtime_end?: string | null
          bedtime_start?: string | null
          created_at?: string | null
          email_digest_frequency?: string | null
          enable_smart_home_control?: boolean | null
          family_id: string
          id?: string
          language?: string | null
          leaderboard_enabled?: boolean | null
          max_screen_time_minutes?: number | null
          notifications_enabled?: boolean | null
          parental_controls_enabled?: boolean | null
          points_system_enabled?: boolean | null
          privacy_mode?: boolean | null
          require_age_verification?: boolean | null
          sound_notifications?: boolean | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          allow_google_calendar_sync?: boolean | null
          badges_system_enabled?: boolean | null
          bedtime_enabled?: boolean | null
          bedtime_end?: string | null
          bedtime_start?: string | null
          created_at?: string | null
          email_digest_frequency?: string | null
          enable_smart_home_control?: boolean | null
          family_id?: string
          id?: string
          language?: string | null
          leaderboard_enabled?: boolean | null
          max_screen_time_minutes?: number | null
          notifications_enabled?: boolean | null
          parental_controls_enabled?: boolean | null
          points_system_enabled?: boolean | null
          privacy_mode?: boolean | null
          require_age_verification?: boolean | null
          sound_notifications?: boolean | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "family_settings_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: true
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      game_sessions: {
        Row: {
          child_id: string
          completed_at: string | null
          created_at: string | null
          duration_seconds: number | null
          game_type: string
          id: string
          score: number | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          child_id: string
          completed_at?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          game_type: string
          id?: string
          score?: number | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          child_id?: string
          completed_at?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          game_type?: string
          id?: string
          score?: number | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_sessions_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      gujarati_learning: {
        Row: {
          activity_type: string
          child_id: string
          completed_at: string | null
          content: string | null
          created_at: string | null
          difficulty: string
          id: string
          points_earned: number | null
          status: string | null
        }
        Insert: {
          activity_type: string
          child_id: string
          completed_at?: string | null
          content?: string | null
          created_at?: string | null
          difficulty: string
          id?: string
          points_earned?: number | null
          status?: string | null
        }
        Update: {
          activity_type?: string
          child_id?: string
          completed_at?: string | null
          content?: string | null
          created_at?: string | null
          difficulty?: string
          id?: string
          points_earned?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gujarati_learning_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_completions: {
        Row: {
          completed_at: string | null
          completed_date: string
          habit_id: string
          id: string
          points_earned: number | null
        }
        Insert: {
          completed_at?: string | null
          completed_date: string
          habit_id: string
          id?: string
          points_earned?: number | null
        }
        Update: {
          completed_at?: string | null
          completed_date?: string
          habit_id?: string
          id?: string
          points_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "habit_completions_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          category: string | null
          child_id: string
          created_at: string | null
          description: string | null
          frequency: string
          id: string
          is_active: boolean | null
          points_value: number | null
          title: string
        }
        Insert: {
          category?: string | null
          child_id: string
          created_at?: string | null
          description?: string | null
          frequency: string
          id?: string
          is_active?: boolean | null
          points_value?: number | null
          title: string
        }
        Update: {
          category?: string | null
          child_id?: string
          created_at?: string | null
          description?: string | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          points_value?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "habits_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      homework: {
        Row: {
          child_id: string
          created_at: string | null
          description: string | null
          due_date: string
          id: string
          priority: string | null
          status: string | null
          subject: string
          submitted_at: string | null
          title: string
        }
        Insert: {
          child_id: string
          created_at?: string | null
          description?: string | null
          due_date: string
          id?: string
          priority?: string | null
          status?: string | null
          subject: string
          submitted_at?: string | null
          title: string
        }
        Update: {
          child_id?: string
          created_at?: string | null
          description?: string | null
          due_date?: string
          id?: string
          priority?: string | null
          status?: string | null
          subject?: string
          submitted_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_courses: {
        Row: {
          color_code: string | null
          created_at: string | null
          description: string | null
          difficulty: string | null
          display_order: number | null
          estimated_duration_hours: number | null
          icon_emoji: string | null
          id: string
          is_active: boolean | null
          language: string | null
          subject: string
          title: string
          total_lessons: number | null
          updated_at: string | null
        }
        Insert: {
          color_code?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          display_order?: number | null
          estimated_duration_hours?: number | null
          icon_emoji?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          subject: string
          title: string
          total_lessons?: number | null
          updated_at?: string | null
        }
        Update: {
          color_code?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          display_order?: number | null
          estimated_duration_hours?: number | null
          icon_emoji?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          subject?: string
          title?: string
          total_lessons?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      learning_lessons: {
        Row: {
          content_type: string
          content_url: string | null
          course_id: string
          created_at: string | null
          description: string | null
          difficulty: string | null
          duration_minutes: number | null
          estimated_completion_time_minutes: number | null
          id: string
          is_prerequisite_required: boolean | null
          lesson_order: number
          points_value: number | null
          prerequisite_lesson_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content_type: string
          content_url?: string | null
          course_id: string
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          duration_minutes?: number | null
          estimated_completion_time_minutes?: number | null
          id?: string
          is_prerequisite_required?: boolean | null
          lesson_order: number
          points_value?: number | null
          prerequisite_lesson_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content_type?: string
          content_url?: string | null
          course_id?: string
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          duration_minutes?: number | null
          estimated_completion_time_minutes?: number | null
          id?: string
          is_prerequisite_required?: boolean | null
          lesson_order?: number
          points_value?: number | null
          prerequisite_lesson_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "learning_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_lessons_prerequisite_lesson_id_fkey"
            columns: ["prerequisite_lesson_id"]
            isOneToOne: false
            referencedRelation: "learning_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_progress: {
        Row: {
          completed_at: string | null
          completion_percentage: number | null
          course_id: string
          created_at: string | null
          current_lesson_id: string | null
          id: string
          last_accessed_at: string | null
          lessons_completed: number | null
          points_earned: number | null
          started_at: string | null
          status: string | null
          total_lessons: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completion_percentage?: number | null
          course_id: string
          created_at?: string | null
          current_lesson_id?: string | null
          id?: string
          last_accessed_at?: string | null
          lessons_completed?: number | null
          points_earned?: number | null
          started_at?: string | null
          status?: string | null
          total_lessons?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completion_percentage?: number | null
          course_id?: string
          created_at?: string | null
          current_lesson_id?: string | null
          id?: string
          last_accessed_at?: string | null
          lessons_completed?: number | null
          points_earned?: number | null
          started_at?: string | null
          status?: string | null
          total_lessons?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "learning_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_progress_current_lesson_id_fkey"
            columns: ["current_lesson_id"]
            isOneToOne: false
            referencedRelation: "learning_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_completions: {
        Row: {
          completed_at: string | null
          duration_seconds: number | null
          id: string
          lesson_id: string
          score: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          duration_seconds?: number | null
          id?: string
          lesson_id: string
          score?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          duration_seconds?: number | null
          id?: string
          lesson_id?: string
          score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_completions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "learning_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      linked_accounts: {
        Row: {
          child_id: string
          created_at: string | null
          id: string
          parent_id: string
        }
        Insert: {
          child_id: string
          created_at?: string | null
          id?: string
          parent_id: string
        }
        Update: {
          child_id?: string
          created_at?: string | null
          id?: string
          parent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "linked_accounts_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "linked_accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mood_entries: {
        Row: {
          child_id: string
          created_at: string | null
          emoji: string | null
          id: string
          mood: string
          notes: string | null
        }
        Insert: {
          child_id: string
          created_at?: string | null
          emoji?: string | null
          id?: string
          mood: string
          notes?: string | null
        }
        Update: {
          child_id?: string
          created_at?: string | null
          emoji?: string | null
          id?: string
          mood?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mood_entries_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_profiles: {
        Row: {
          avatar: string | null
          created_at: string | null
          email_digest: string | null
          id: string
          language: string | null
          notifications_enabled: boolean | null
          push_enabled: boolean | null
          sound_enabled: boolean | null
          timezone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar?: string | null
          created_at?: string | null
          email_digest?: string | null
          id?: string
          language?: string | null
          notifications_enabled?: boolean | null
          push_enabled?: boolean | null
          sound_enabled?: boolean | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar?: string | null
          created_at?: string | null
          email_digest?: string | null
          id?: string
          language?: string | null
          notifications_enabled?: boolean | null
          push_enabled?: boolean | null
          sound_enabled?: boolean | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      parental_controls: {
        Row: {
          app_restrictions: Json | null
          bedtime_enabled: boolean | null
          bedtime_end: string | null
          bedtime_start: string | null
          child_id: string
          content_filter_enabled: boolean | null
          created_at: string | null
          daily_limit_minutes: number | null
          family_id: string
          id: string
          location_tracking_enabled: boolean | null
          parent_id: string
          require_approval_for_sensitive_content: boolean | null
          screen_time_limit_enabled: boolean | null
          updated_at: string | null
        }
        Insert: {
          app_restrictions?: Json | null
          bedtime_enabled?: boolean | null
          bedtime_end?: string | null
          bedtime_start?: string | null
          child_id: string
          content_filter_enabled?: boolean | null
          created_at?: string | null
          daily_limit_minutes?: number | null
          family_id: string
          id?: string
          location_tracking_enabled?: boolean | null
          parent_id: string
          require_approval_for_sensitive_content?: boolean | null
          screen_time_limit_enabled?: boolean | null
          updated_at?: string | null
        }
        Update: {
          app_restrictions?: Json | null
          bedtime_enabled?: boolean | null
          bedtime_end?: string | null
          bedtime_start?: string | null
          child_id?: string
          content_filter_enabled?: boolean | null
          created_at?: string | null
          daily_limit_minutes?: number | null
          family_id?: string
          id?: string
          location_tracking_enabled?: boolean | null
          parent_id?: string
          require_approval_for_sensitive_content?: boolean | null
          screen_time_limit_enabled?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parental_controls_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parental_controls_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parental_controls_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      points: {
        Row: {
          activity_type: string | null
          created_at: string | null
          id: string
          points: number | null
          reason: string | null
          user_id: string | null
        }
        Insert: {
          activity_type?: string | null
          created_at?: string | null
          id?: string
          points?: number | null
          reason?: string | null
          user_id?: string | null
        }
        Update: {
          activity_type?: string | null
          created_at?: string | null
          id?: string
          points?: number | null
          reason?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "points_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reading: {
        Row: {
          author: string | null
          book_title: string
          child_id: string
          completed_at: string | null
          genre: string | null
          id: string
          pages_read: number | null
          points_earned: number | null
          started_at: string | null
          status: string | null
          total_pages: number | null
        }
        Insert: {
          author?: string | null
          book_title: string
          child_id: string
          completed_at?: string | null
          genre?: string | null
          id?: string
          pages_read?: number | null
          points_earned?: number | null
          started_at?: string | null
          status?: string | null
          total_pages?: number | null
        }
        Update: {
          author?: string | null
          book_title?: string
          child_id?: string
          completed_at?: string | null
          genre?: string | null
          id?: string
          pages_read?: number | null
          points_earned?: number | null
          started_at?: string | null
          status?: string | null
          total_pages?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reading_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          created_at: string | null
          description: string | null
          dismissed_at: string | null
          id: string
          is_dismissed: boolean | null
          notification_sent: boolean | null
          recurrence: string | null
          recurrence_end_date: string | null
          related_item_id: string | null
          related_item_type: string | null
          remind_before_minutes: number | null
          reminder_type: string
          scheduled_time: string
          sent_at: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          dismissed_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          notification_sent?: boolean | null
          recurrence?: string | null
          recurrence_end_date?: string | null
          related_item_id?: string | null
          related_item_type?: string | null
          remind_before_minutes?: number | null
          reminder_type: string
          scheduled_time: string
          sent_at?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          dismissed_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          notification_sent?: boolean | null
          recurrence?: string | null
          recurrence_end_date?: string | null
          related_item_id?: string | null
          related_item_type?: string | null
          remind_before_minutes?: number | null
          reminder_type?: string
          scheduled_time?: string
          sent_at?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_devices: {
        Row: {
          created_at: string | null
          device_id: string
          device_name: string
          device_status: string | null
          device_type: string
          family_id: string | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          metadata: Json | null
          power_consumption_watts: number | null
          room: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          device_id: string
          device_name: string
          device_status?: string | null
          device_type: string
          family_id?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          metadata?: Json | null
          power_consumption_watts?: number | null
          room?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          device_id?: string
          device_name?: string
          device_status?: string | null
          device_type?: string
          family_id?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          metadata?: Json | null
          power_consumption_watts?: number | null
          room?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "smart_devices_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_queue: {
        Row: {
          action: string
          created_at: string | null
          id: string
          payload: Json | null
          resource_id: string
          resource_type: string
          retry_count: number | null
          synced_at: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          payload?: Json | null
          resource_id: string
          resource_type: string
          retry_count?: number | null
          synced_at?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          payload?: Json | null
          resource_id?: string
          resource_type?: string
          retry_count?: number | null
          synced_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      trivia_attempts: {
        Row: {
          attempted_at: string | null
          child_id: string
          id: string
          is_correct: boolean | null
          points_earned: number | null
          question_id: string
          selected_answer: string | null
        }
        Insert: {
          attempted_at?: string | null
          child_id: string
          id?: string
          is_correct?: boolean | null
          points_earned?: number | null
          question_id: string
          selected_answer?: string | null
        }
        Update: {
          attempted_at?: string | null
          child_id?: string
          id?: string
          is_correct?: boolean | null
          points_earned?: number | null
          question_id?: string
          selected_answer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trivia_attempts_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trivia_attempts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "trivia_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      trivia_questions: {
        Row: {
          category: string
          correct_answer: string
          created_at: string | null
          difficulty: string
          explanation: string | null
          id: string
          incorrect_answers: string[]
          points_value: number | null
          question: string
        }
        Insert: {
          category: string
          correct_answer: string
          created_at?: string | null
          difficulty: string
          explanation?: string | null
          id?: string
          incorrect_answers: string[]
          points_value?: number | null
          question: string
        }
        Update: {
          category?: string
          correct_answer?: string
          created_at?: string | null
          difficulty?: string
          explanation?: string | null
          id?: string
          incorrect_answers?: string[]
          points_value?: number | null
          question?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          account_type: string
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          last_login: string | null
          name: string
          password_hash: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          account_type: string
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          name: string
          password_hash?: string | null
          role: string
          updated_at?: string | null
        }
        Update: {
          account_type?: string
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          name?: string
          password_hash?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_integrations: {
        Row: {
          access_token: string
          created_at: string
          id: string
          is_active: boolean
          metadata: Json | null
          provider: string
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          provider: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          provider?: string
          refresh_token?: string | null
          token_expires_at?: string | null
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
