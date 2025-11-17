import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { addJobLog } from "$lib/supabase";
import { RUNPOD_API_KEY } from "$env/static/private";

export const POST: RequestHandler = async ({ request, params }) => {
  const jobId = params.id;

  if (!jobId) {
    return json({ error: "Missing job ID" }, { status: 400 });
  }

  try {
    // Verify the request is from RunPod using API key
    const authHeader = request.headers.get("authorization");
    const expectedAuth = `Bearer ${RUNPOD_API_KEY}`;

    if (authHeader !== expectedAuth) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { level, message, timestamp } = body;

    if (!message) {
      return json({ error: "Missing message" }, { status: 400 });
    }

    // Add log to database
    await addJobLog({
      job_id: jobId,
      level: level || "info",
      message,
      timestamp: timestamp || new Date().toISOString(),
    });

    return json({ success: true });
  } catch (error) {
    console.error("Error adding job log:", error);
    return json({ error: "Failed to add log" }, { status: 500 });
  }
};
