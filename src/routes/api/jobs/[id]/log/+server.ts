import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { addJobLog } from "$lib/supabase";
import { DOCTOWN_BUILDER_SHARED_SECRET } from "$env/static/private";

export const POST: RequestHandler = async ({ request, params }) => {
  const jobId = params.id;

  if (!jobId) {
    return json({ error: "Missing job ID" }, { status: 400 });
  }

  try {
    // Verify the request is from RunPod worker using shared secret
    const authHeader = request.headers.get("authorization");
    const expectedAuth = `Bearer ${DOCTOWN_BUILDER_SHARED_SECRET}`;

    if (authHeader !== expectedAuth) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { level, message, timestamp } = body;

    if (!message) {
      return json({ error: "Missing message" }, { status: 400 });
    }

    // Convert timestamp from milliseconds to ISO string if needed
    let timestampISO: string;
    if (timestamp) {
      if (typeof timestamp === "number") {
        // Convert milliseconds to ISO string
        timestampISO = new Date(timestamp).toISOString();
      } else {
        timestampISO = timestamp;
      }
    } else {
      timestampISO = new Date().toISOString();
    }

    // Add log to database
    await addJobLog({
      job_id: jobId,
      level: level || "info",
      message,
      timestamp: timestampISO,
    });

    return json({ success: true });
  } catch (error) {
    console.error("Error adding job log:", error);
    return json({ error: "Failed to add log" }, { status: 500 });
  }
};
