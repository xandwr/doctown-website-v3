import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "$env/static/private";

export const POST: RequestHandler = async ({ params, cookies }) => {
  const jobId = params.id;
  const sessionToken = cookies.get("session");

  if (!sessionToken) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

  // Verify session and get user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(sessionToken);
  if (authError || !user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify the job belongs to this user
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("id, user_id, status")
    .eq("id", jobId)
    .single();

  if (jobError || !job) {
    return json({ error: "Job not found" }, { status: 404 });
  }

  if (job.user_id !== user.id) {
    return json({ error: "Unauthorized" }, { status: 403 });
  }

  // Only allow canceling jobs that are pending or building
  if (job.status !== "pending" && job.status !== "building") {
    return json({ error: "Job cannot be cancelled" }, { status: 400 });
  }

  // Update job status to failed with a cancellation message
  const { error: updateError } = await supabase
    .from("jobs")
    .update({
      status: "failed",
      error_message: "Cancelled by user",
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  if (updateError) {
    console.error("Error cancelling job:", updateError);
    return json({ error: "Failed to cancel job" }, { status: 500 });
  }

  return json({ success: true, message: "Job cancelled successfully" });
};
