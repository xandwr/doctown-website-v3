export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          github_id: number;
          github_login: string;
          name: string | null;
          avatar_url: string | null;
          html_url: string | null;
          access_token: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          github_id: number;
          github_login: string;
          name?: string | null;
          avatar_url?: string | null;
          html_url?: string | null;
          access_token: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          github_id?: number;
          github_login?: string;
          name?: string | null;
          avatar_url?: string | null;
          html_url?: string | null;
          access_token?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      sessions: {
        Row: {
          id: string;
          user_id: string;
          session_token: string;
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_token: string;
          expires_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_token?: string;
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      jobs: {
        Row: {
          id: string;
          user_id: string;
          repo: string;
          git_ref: string;
          status: "pending" | "building" | "completed" | "failed";
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          repo: string;
          git_ref: string;
          status?: "pending" | "building" | "completed" | "failed";
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          repo?: string;
          git_ref?: string;
          status?: "pending" | "building" | "completed" | "failed";
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      docpacks: {
        Row: {
          id: string;
          job_id: string;
          name: string;
          full_name: string;
          description: string | null;
          file_url: string;
          public: boolean;
          repo_url: string;
          commit_hash: string | null;
          version: string | null;
          language: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          name: string;
          full_name: string;
          description?: string | null;
          file_url: string;
          public?: boolean;
          repo_url: string;
          commit_hash?: string | null;
          version?: string | null;
          language?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          name?: string;
          full_name?: string;
          description?: string | null;
          file_url?: string;
          public?: boolean;
          repo_url?: string;
          commit_hash?: string | null;
          version?: string | null;
          language?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      github_installations: {
        Row: {
          id: string;
          user_id: string;
          repo_full_name: string;
          installation_id: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          repo_full_name: string;
          installation_id: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          repo_full_name?: string;
          installation_id?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
