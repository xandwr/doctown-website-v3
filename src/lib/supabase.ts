import { createClient } from "@supabase/supabase-js";
import {
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_SECRET_KEY,
} from "$env/static/private";
import type { Database } from "./database.types";

// Create Supabase client with service role key for server-side operations
export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_SECRET_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

// Helper types
export type User = Database["public"]["Tables"]["users"]["Row"];
export type Session = Database["public"]["Tables"]["sessions"]["Row"];
export type Job = Database["public"]["Tables"]["jobs"]["Row"];
export type Docpack = Database["public"]["Tables"]["docpacks"]["Row"];
export type GithubInstallation =
  Database["public"]["Tables"]["github_installations"]["Row"];

// Database helper functions

/**
 * Create or update a user in the database
 */
export async function upsertUser(data: {
  github_id: number;
  github_login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  access_token: string;
}) {
  const { data: user, error } = await (supabase.from("users") as any)
    .upsert(
      {
        github_id: data.github_id,
        github_login: data.github_login,
        name: data.name,
        avatar_url: data.avatar_url,
        html_url: data.html_url,
        access_token: data.access_token,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "github_id",
        ignoreDuplicates: false,
      },
    )
    .select()
    .single();

  if (error) throw error;
  return user;
}

/**
 * Create a new session for a user
 */
export async function createSession(userId: string, expiresInDays: number = 7) {
  const sessionToken = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  const { data: session, error } = await (supabase.from("sessions") as any)
    .insert({
      user_id: userId,
      session_token: sessionToken,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return session;
}

/**
 * Get a session by token
 */
export async function getSession(sessionToken: string) {
  const { data: session, error } = await supabase
    .from("sessions")
    .select("*, users(*)")
    .eq("session_token", sessionToken)
    .gte("expires_at", new Date().toISOString())
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw error;
  }

  return session;
}

/**
 * Delete a session
 */
export async function deleteSession(sessionToken: string) {
  const { error } = await supabase
    .from("sessions")
    .delete()
    .eq("session_token", sessionToken);

  if (error) throw error;
}

/**
 * Delete all expired sessions
 */
export async function cleanupExpiredSessions() {
  const { error } = await supabase
    .from("sessions")
    .delete()
    .lt("expires_at", new Date().toISOString());

  if (error) throw error;
}

/**
 * Get user by GitHub ID
 */
export async function getUserByGithubId(githubId: number) {
  const { data: user, error } = await supabase
    .from("users")
    .select()
    .eq("github_id", githubId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw error;
  }

  return user;
}

/**
 * Create a new job
 */
export async function createJob(data: {
  user_id: string;
  repo: string;
  git_ref: string;
}) {
  const { data: job, error } = await (supabase.from("jobs") as any)
    .insert({
      user_id: data.user_id,
      repo: data.repo,
      git_ref: data.git_ref,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw error;
  return job;
}

/**
 * Update job status
 */
export async function updateJobStatus(
  jobId: string,
  status: "pending" | "building" | "completed" | "failed",
  errorMessage?: string,
) {
  const { data: job, error } = await (supabase.from("jobs") as any)
    .update({
      status,
      error_message: errorMessage,
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId)
    .select()
    .single();

  if (error) throw error;
  return job;
}

/**
 * Get jobs for a user
 */
export async function getUserJobs(userId: string) {
  const { data: jobs, error } = await supabase
    .from("jobs")
    .select()
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return jobs;
}

/**
 * Create a docpack
 */
export async function createDocpack(data: {
  job_id: string;
  name: string;
  full_name: string;
  description?: string | null;
  file_url: string;
  public: boolean;
  repo_url: string;
  commit_hash?: string | null;
  version?: string | null;
  language?: string | null;
}) {
  const { data: docpack, error } = await (supabase.from("docpacks") as any)
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return docpack;
}

/**
 * Get docpacks for a user
 */
export async function getUserDocpacks(userId: string) {
  const { data: docpacks, error } = await supabase
    .from("docpacks")
    .select("*, jobs!inner(user_id)")
    .eq("jobs.user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return docpacks;
}

/**
 * Get public docpacks
 */
export async function getPublicDocpacks() {
  const { data: docpacks, error } = await supabase
    .from("docpacks")
    .select()
    .eq("public", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return docpacks;
}
