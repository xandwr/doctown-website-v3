import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getJobLogs, supabase } from "$lib/supabase";

export const GET: RequestHandler = async ({ params, locals }) => {
  // Check if user is authenticated
  if (!locals.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const jobId = params.id;

  if (!jobId) {
    return json({ error: "Missing job ID" }, { status: 400 });
  }

  try {
    // Verify the job exists and belongs to this user
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, user_id")
      .eq("id", jobId)
      .single();

    if (jobError) {
      if (jobError.code === "PGRST116") {
        return json({ error: "Job not found" }, { status: 404 });
      }
      throw jobError;
    }

    // Type assertion to fix TypeScript inference
    const jobData = job as { id: string; user_id: string };

    if (jobData.user_id !== locals.user.id) {
      return json({ error: "Forbidden" }, { status: 403 });
    }

    const logs = await getJobLogs(jobId);
    return json({ logs });
  } catch (error) {
    console.error("Error fetching job logs:", error);
    return json({ error: "Failed to fetch logs" }, { status: 500 });
  }
};
