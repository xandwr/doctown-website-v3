import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getJobLogs } from "$lib/supabase";

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
    const logs = await getJobLogs(jobId);
    return json({ logs });
  } catch (error) {
    console.error("Error fetching job logs:", error);
    return json({ error: "Failed to fetch logs" }, { status: 500 });
  }
};
