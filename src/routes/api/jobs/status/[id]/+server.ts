import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { supabase, type Job } from "$lib/supabase";

export const GET: RequestHandler = async ({ params, locals }) => {
  // Check if user is authenticated
  if (!locals.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const jobId = params.id;

  try {
    // Get job from database
    const { data: job, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single<Job>();

    if (error) {
      if (error.code === "PGRST116") {
        return json({ error: "Job not found" }, { status: 404 });
      }
      throw error;
    }

    // Verify job belongs to authenticated user
    if (job.user_id !== locals.user.id) {
      return json({ error: "Forbidden" }, { status: 403 });
    }

    // Return job status
    return json({
      job_id: job.id,
      status: job.status,
      repo: job.repo,
      git_ref: job.git_ref,
      error_message: job.error_message,
      created_at: job.created_at,
      updated_at: job.updated_at,
    });
  } catch (error) {
    console.error("Error fetching job status:", error);
    return json({ error: "Failed to fetch job status" }, { status: 500 });
  }
};
