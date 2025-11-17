import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { supabase, updateJobStatus } from "$lib/supabase";

export const POST: RequestHandler = async ({ params, locals }) => {
  const jobId = params.id;

  // Check if user is authenticated
  if (!locals.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Verify the job belongs to this user
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, user_id, status")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return json({ error: "Job not found" }, { status: 404 });
    }

    // Type assertion to fix TypeScript inference
    const jobData = job as {
      id: string;
      user_id: string;
      status: "pending" | "building" | "completed" | "failed";
    };

    if (jobData.user_id !== locals.user.id) {
      return json({ error: "Unauthorized" }, { status: 403 });
    }

    // Only allow canceling jobs that are pending or building
    if (jobData.status !== "pending" && jobData.status !== "building") {
      return json({ error: "Job cannot be cancelled" }, { status: 400 });
    }

    // Update job status to failed with a cancellation message
    await updateJobStatus(jobId, "failed", "Cancelled by user");

    return json({ success: true, message: "Job cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling job:", error);
    return json({ error: "Failed to cancel job" }, { status: 500 });
  }
};
