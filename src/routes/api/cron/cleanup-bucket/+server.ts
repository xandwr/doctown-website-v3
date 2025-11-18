import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { env } from "$env/dynamic/private";

/**
 * Cron endpoint for automated bucket cleanup.
 * This endpoint should be called by Vercel Cron or similar service.
 *
 * To set up in Vercel:
 * 1. Add vercel.json with cron configuration
 * 2. Add CRON_SECRET to environment variables
 * 3. Configure to run daily/weekly
 *
 * Authentication: Uses CRON_SECRET or authorization header
 */
export const GET: RequestHandler = async ({ request, fetch }) => {
  try {
    // Check cron authentication
    const authHeader = request.headers.get("authorization");
    const cronSecret = env.CRON_SECRET || env.DOCTOWN_BUILDER_SHARED_SECRET;

    // Vercel cron sends Authorization header
    const expectedAuth = `Bearer ${cronSecret}`;

    if (!authHeader || authHeader !== expectedAuth) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Running automated bucket cleanup...");

    // Call the cleanup endpoint
    const cleanupUrl = new URL("/api/admin/cleanup-bucket", request.url);
    const response = await fetch(cleanupUrl, {
      method: "POST",
      headers: {
        Authorization: expectedAuth,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Cleanup failed:", error);
      return json(
        {
          success: false,
          error: "Cleanup failed",
          details: error,
        },
        { status: 500 },
      );
    }

    const result = await response.json();
    console.log("Cleanup completed:", result);

    return json({
      success: true,
      timestamp: new Date().toISOString(),
      result: result,
    });
  } catch (error) {
    console.error("Cron cleanup error:", error);
    return json(
      {
        success: false,
        error: "Cron job failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
};
