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
export type JobLog = Database["public"]["Tables"]["job_logs"]["Row"];
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];

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
  email?: string | null;
}) {
  const { data: user, error } = await (supabase.from("users") as any)
    .upsert(
      {
        github_id: data.github_id,
        github_login: data.github_login,
        email: data.email ?? null,
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
 * Get pending/building jobs for a user (jobs without docpacks yet)
 */
export async function getUserPendingJobs(userId: string) {
  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("*, docpacks(id)")
    .eq("user_id", userId)
    .in("status", ["pending", "building"])
    .is("docpacks.id", null)
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
  tracked_branch?: string | null;
  frozen?: boolean;
  symbol_count?: number | null;
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
    .select("*, jobs!inner(user_id, status, repo, git_ref)")
    .eq("jobs.user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Transform the data to match the frontend Docpack type
  return (
    docpacks?.map((pack: any) => {
      // Extract R2 path from file_url if it's a full R2 URL
      // E.g., "https://...r2.cloudflarestorage.com/doctown-central/docpacks/uuid/file.docpack"
      // becomes "/api/docpacks/download?path=docpacks/uuid/file.docpack"
      let file_url = pack.file_url;
      if (file_url) {
        // Check if it's a direct R2 URL
        if (file_url.includes("r2.cloudflarestorage.com")) {
          // Extract path after bucket name (e.g., "docpacks/uuid/file.docpack")
          const pathMatch = file_url.match(/\/doctown-central\/(.+)$/);
          if (pathMatch) {
            // Convert to relative proxy URL for user's own docpacks
            file_url = `/api/docpacks/download?path=${encodeURIComponent(pathMatch[1])}`;
          }
        }
      }

      return {
        id: pack.id,
        name: pack.name,
        full_name: pack.full_name,
        description: pack.description,
        file_url: file_url,
        repo_url: pack.repo_url,
        commit_hash: pack.commit_hash,
        version: pack.version,
        language: pack.language,
        created_at: pack.created_at,
        updated_at: pack.updated_at,
        // Map job status to docpack status
        status: pack.public ? "public" : "valid",
        is_private: !pack.public,
        job_id: pack.job_id,
        symbol_count: pack.symbol_count,
      };
    }) || []
  );
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

  // Transform the data to match the frontend Docpack type
  return (
    docpacks?.map((pack: any) => {
      // Extract R2 path from file_url if it's a full R2 URL
      // E.g., "https://...r2.cloudflarestorage.com/doctown-central/docpacks/uuid/file.docpack"
      // becomes "https://www.doctown.dev/api/docpacks/download?path=docpacks/uuid/file.docpack"
      let file_url = pack.file_url;
      if (file_url) {
        // Check if it's a direct R2 URL
        if (file_url.includes("r2.cloudflarestorage.com")) {
          // Extract path after bucket name (e.g., "docpacks/uuid/file.docpack")
          const pathMatch = file_url.match(/\/doctown-central\/(.+)$/);
          if (pathMatch) {
            // Convert to proxy URL with full domain for CLI compatibility
            file_url = `https://www.doctown.dev/api/docpacks/download?path=${encodeURIComponent(pathMatch[1])}`;
          }
        }
      }

      return {
        id: pack.id,
        name: pack.name,
        full_name: pack.full_name,
        description: pack.description,
        file_url: file_url,
        repo_url: pack.repo_url,
        commit_hash: pack.commit_hash,
        version: pack.version,
        language: pack.language,
        created_at: pack.created_at,
        updated_at: pack.updated_at,
        // Public docpacks have status "public"
        status: "public",
        is_private: false,
        job_id: pack.job_id,
        symbol_count: pack.symbol_count,
      };
    }) || []
  );
}

/**
 * Add a log entry for a job
 */
export async function addJobLog(data: {
  job_id: string;
  level?: "info" | "warning" | "error" | "debug";
  message: string;
  timestamp?: string;
}) {
  const { data: log, error } = await (supabase.from("job_logs") as any)
    .insert({
      job_id: data.job_id,
      level: data.level || "info",
      message: data.message,
      timestamp: data.timestamp || new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return log;
}

/**
 * Get logs for a job
 */
export async function getJobLogs(jobId: string) {
  const { data: logs, error } = await supabase
    .from("job_logs")
    .select()
    .eq("job_id", jobId)
    .order("timestamp", { ascending: true });

  if (error) throw error;
  return logs;
}

/**
 * Subscribe to job logs in realtime
 */
export function subscribeToJobLogs(
  jobId: string,
  callback: (log: JobLog) => void,
) {
  const channel = supabase
    .channel(`job_logs:${jobId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "job_logs",
        filter: `job_id=eq.${jobId}`,
      },
      (payload) => {
        callback(payload.new as JobLog);
      },
    )
    .subscribe();

  return channel;
}

/**
 * Get user's subscription by user ID
 */
export async function getUserSubscription(
  userId: string,
): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw error;
  }

  return data;
}

/**
 * Check if user has an active subscription
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const subscription = await getUserSubscription(userId);

  if (!subscription) return false;

  // Check if subscription is active or trialing
  if (subscription.status !== "active" && subscription.status !== "trialing") {
    return false;
  }

  // Check if subscription period is still valid
  const now = new Date();
  const periodEnd = new Date(subscription.current_period_end);

  return periodEnd > now;
}

/**
 * Create or update a subscription
 */
export async function upsertSubscription(data: {
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  status: "active" | "canceled" | "past_due" | "incomplete" | "trialing";
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end?: boolean;
}) {
  const { data: subscription, error } = await (
    supabase.from("subscriptions") as any
  )
    .upsert(
      {
        user_id: data.user_id,
        stripe_customer_id: data.stripe_customer_id,
        stripe_subscription_id: data.stripe_subscription_id,
        status: data.status,
        current_period_start: data.current_period_start,
        current_period_end: data.current_period_end,
        cancel_at_period_end: data.cancel_at_period_end || false,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
        ignoreDuplicates: false,
      },
    )
    .select()
    .single();

  if (error) throw error;
  return subscription;
}

/**
 * Get subscription by Stripe subscription ID
 */
export async function getSubscriptionByStripeId(
  stripeSubscriptionId: string,
): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("stripe_subscription_id", stripeSubscriptionId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw error;
  }

  return data;
}

/**
 * Get subscription by Stripe customer ID
 */
export async function getSubscriptionByCustomerId(
  stripeCustomerId: string,
): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("stripe_customer_id", stripeCustomerId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw error;
  }

  return data;
}
