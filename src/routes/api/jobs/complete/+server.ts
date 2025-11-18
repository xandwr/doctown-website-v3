import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import {
  updateJobStatus,
  createDocpack,
  supabase,
  type Job,
} from "$lib/supabase";
import { env } from "$env/dynamic/private";

export const POST: RequestHandler = async ({ request }) => {
  try {
    // Check authorization header
    const authHeader = request.headers.get("authorization");
    const expectedAuth = `Bearer ${env.DOCTOWN_BUILDER_SHARED_SECRET}`;

    // Debug logging
    console.log(
      "DEBUG: Received auth header:",
      authHeader
        ? `${authHeader.substring(0, 20)}...${authHeader.substring(authHeader.length - 4)}`
        : "NONE",
    );
    console.log(
      "DEBUG: Expected auth header:",
      expectedAuth
        ? `${expectedAuth.substring(0, 20)}...${expectedAuth.substring(expectedAuth.length - 4)}`
        : "NONE",
    );
    console.log("DEBUG: Auth match:", authHeader === expectedAuth);

    if (!authHeader || authHeader !== expectedAuth) {
      console.log("DEBUG: Authorization failed - returning 401");
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse JSON body (no longer multipart)
    const body = await request.json();
    const { job_id: jobId, file_url: fileUrl } = body;

    // Validate input
    if (!jobId || typeof jobId !== "string") {
      return json({ error: "Invalid or missing job_id" }, { status: 400 });
    }

    if (!fileUrl || typeof fileUrl !== "string") {
      return json({ error: "Invalid or missing file_url" }, { status: 400 });
    }

    // Verify job exists and is in 'building' status
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single<Job>();

    if (jobError || !job) {
      return json({ error: "Job not found" }, { status: 404 });
    }

    if (job.status !== "building") {
      return json(
        { error: `Job is in ${job.status} status, expected building` },
        { status: 400 },
      );
    }

    // Extract repo name from job.repo (e.g., "https://github.com/user/repo" -> "user/repo")
    const repoMatch = job.repo.match(/github\.com\/(.+?)(?:\.git)?$/);
    const fullName = repoMatch ? repoMatch[1] : job.repo;
    const name = fullName.split("/").pop() || "unknown";

    // Fetch GitHub repo description
    let description: string | null = null;
    try {
      // Get the user's access token from the job
      const { data: user } = await supabase
        .from("users")
        .select("access_token")
        .eq("id", job.user_id)
        .single<{ access_token: string | null }>();

      if (user?.access_token) {
        const repoApiUrl = `https://api.github.com/repos/${fullName}`;
        const repoResponse = await fetch(repoApiUrl, {
          headers: {
            Authorization: `Bearer ${user.access_token}`,
            Accept: "application/vnd.github.v3+json",
          },
        });

        if (repoResponse.ok) {
          const repoData = await repoResponse.json();
          description = repoData.description || null;
        }
      }
    } catch (error) {
      console.error("Failed to fetch GitHub repo description:", error);
      // Continue without description rather than failing
    }

    // Create docpack entry in database
    const docpack = await createDocpack({
      job_id: jobId,
      name,
      full_name: fullName,
      description,
      file_url: fileUrl,
      public: false, // Default to private
      repo_url: job.repo,
      commit_hash: null, // Will be populated later when we have manifest parsing
      version: null,
      language: null,
    });

    // Update job status to completed
    await updateJobStatus(jobId, "completed");

    return json(
      {
        success: true,
        docpack_id: docpack.id,
        file_url: fileUrl,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error completing job:", error);
    return json({ error: "Failed to complete job" }, { status: 500 });
  }
};
